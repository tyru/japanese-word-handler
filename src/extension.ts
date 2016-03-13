'use strict';
import * as vscode from 'vscode';

//-------------------------------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext) {
    let command;

    command = vscode.commands.registerCommand('extension.cursorNextWordEndJa', () => {
        cursorNextWordEndJa(vscode.window.activeTextEditor);
    });
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand('extension.cursorPrevWordStartJa', () => {
        cursorPrevWordStartJa(vscode.window.activeTextEditor);
    });
    context.subscriptions.push(command);
}

//-------------------------------------------------------------------------------------------------
export function cursorNextWordEndJa(editor: vscode.TextEditor) {
    let pos = positionOfNextWordEnd(editor.document, caretPositionOf(editor));
    editor.selections = [new vscode.Selection(pos, pos)];
}

export function cursorPrevWordStartJa(editor: vscode.TextEditor) {
    let pos = positionOfPrevWordStart(editor.document, caretPositionOf(editor));
    editor.selections = [new vscode.Selection(pos, pos)];
}

//-------------------------------------------------------------------------------------------------
enum CharClass {
    Alnum,
    Whitespace,
    Punctuation,
    Hiragana,
    Katakana,
    Other,
    Invalid
}

function isPrevCharIsSpace(doc: vscode.TextDocument, position: vscode.Position) {
    let prevPos = doc.positionAt( doc.offsetAt(position) - 1 );
    return (classifyChar(doc, prevPos) == CharClass.Whitespace);
}

function caretPositionOf(editor: vscode.TextEditor) {
    return editor.selection.isReversed ? editor.selection.start
                                       : editor.selection.end;
}

function positionOfNextWordEnd(doc: vscode.TextDocument, caretPos: vscode.Position) {
    // Firstly skip a series of whitespaces, or a series of EOL codes. 
    let pos = caretPos;
    let klass = classifyChar(doc, pos);
    if( klass == CharClass.Whitespace )
    {
        do {
            // Intentionally avoiding to use doc.positionAt(doc.offsetAt())
            // so that the seek stops at the EOL.
            pos = new vscode.Position( pos.line, pos.character + 1 );
        }
        while( classifyChar(doc, pos) == CharClass.Whitespace );
    }
    else if( klass == CharClass.Invalid )
    {
        if(pos.line + 1 < doc.lineCount) {
            return new vscode.Position(pos.line + 1, 0); // Beginning of the next line. 
        }
        else {
            return pos; // Already at the EOF.
        }
    }

    // Then, seek until the character type changes.
    const initKlass = classifyChar(doc, pos);
    let nextPos = doc.positionAt(doc.offsetAt(pos) + 1);
    while( nextPos.isAfter(pos) ) {
        if( initKlass != classifyChar(doc, pos) ) {
            break;
        }

        pos = nextPos;
        nextPos = doc.positionAt(doc.offsetAt(pos) + 1);
    }

    return pos;
}

function positionOfPrevWordStart(doc: vscode.TextDocument, caretPos: vscode.Position) {
    // Firstly skip whitespaces, excluding EOL codes. 
    let pos = caretPos;
    while( isPrevCharIsSpace(doc, pos) ) {
        // Intentionally avoiding to use doc.positionAt(doc.offsetAt())
        // so that the seek stops at the EOL.
        pos = new vscode.Position( pos.line, pos.character - 1 );
    }

    // Then, seek until the character type changes.
    pos = doc.positionAt(doc.offsetAt(pos) - 1);
    const initKlass = classifyChar(doc, pos);
    let prevPos = doc.positionAt(doc.offsetAt(pos) - 1);
    while( prevPos.isBefore(pos) ) {
        if( initKlass != classifyChar(doc, prevPos) ) {
            break;
        }

        pos = prevPos;
        prevPos = doc.positionAt(doc.offsetAt(pos) - 1);
    }

    return pos;
}

function classifyChar(doc: vscode.TextDocument, position: vscode.Position) {
    let range = new vscode.Range(position.line, position.character,
                            position.line, position.character + 1);
    let text = doc.getText(range);
    if( text.length == 0 )
        return CharClass.Invalid;           // beyond an end-of-line / an end-of-document.
    let ch = text.charCodeAt(0);

    if( (0x09 <= ch && ch <= 0x0d) || ch == 0x20 || ch == 0x3000 )
        return CharClass.Whitespace;

    if( (0x30 <= ch && ch <= 0x39)          // halfwidth digit
        || (0xff10 <= ch && ch <= 0xff19)   // fullwidth digit
        || (0x41 <= ch && ch <= 0x5a)       // halfwidth alphabet, upper case
        || ch == 0x5f                       // underscore
        || (0x61 <= ch && ch <= 0x7a)       // halfwidth alphabet, lower case
        || (0xc0 <= ch && ch <= 0xff        // latin character 
            && ch != 0xd7 && ch != 0xf7)    // (excluding multiplication/division sign)
        || (0xff21 <= ch && ch <= 0xff3a)   // fullwidth alphabet, upper case
        || ch == 0xff3f                     // fullwidth underscore
        || (0xff41 <= ch && ch <= 0xff5a) ) // fullwidth alphabet, lower case
        return CharClass.Alnum;


    if( (0x30a0 <= ch && ch <= 0x30ff)      // fullwidth katakana
        && ch != 0x30fb )                   // excluding katakana middle dot
        return CharClass.Katakana;

    if( 0x3041 <= ch && ch <= 0x309f )      // fullwidth hiragana
        return CharClass.Hiragana;

    if( 0xff66 <= ch && ch <= 0xff9d )      // halfwidth katakana
        return CharClass.Katakana;

    return CharClass.Other;
}
