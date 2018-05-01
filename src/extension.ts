'use strict';

import * as vscode from 'vscode';
import { Position, Range, Selection, TextDocument, TextEditor } from 'vscode';

//-----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext) {
    let command;

    function getWordSeparator(editor: TextEditor) {
        return vscode.workspace
            .getConfiguration("editor", editor.document.uri)
            .get("wordSeparators") as string;
    }

    command = vscode.commands.registerCommand(
        'extension.cursorNextWordEndJa',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            cursorNextWordEndJa(editor, wordSeparators);
        });
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand(
        'extension.cursorNextWordEndSelectJa',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            cursorNextWordEndSelectJa(editor, wordSeparators);
        });
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand(
        'extension.cursorPrevWordStartJa',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            cursorPrevWordStartJa(editor, wordSeparators);
        });
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand(
        'extension.cursorPrevWordStartSelectJa',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            cursorPrevWordStartSelectJa(editor, wordSeparators);
        });
    context.subscriptions.push(command);
}

//-----------------------------------------------------------------------------
export function cursorNextWordEndJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const pos = positionOfNextWordEnd(
        editor.document,
        editor.selection.active,
        wordSeparators);
    editor.selections = [new Selection(pos, pos)];
}

export function cursorNextWordEndSelectJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const anchorPos = editor.selection.anchor;
    const pos = positionOfNextWordEnd(
        editor.document,
        editor.selection.active,
        wordSeparators);
    editor.selections = [new Selection(anchorPos, pos)];
}

export function cursorPrevWordStartJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const pos = positionOfPrevWordStart(
        editor.document,
        editor.selection.active,
        wordSeparators);
    editor.selections = [new Selection(pos, pos)];
}

export function cursorPrevWordStartSelectJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const anchorPos = editor.selection.anchor;
    const pos = positionOfPrevWordStart(
        editor.document,
        editor.selection.active,
        wordSeparators);
    editor.selections = [new Selection(anchorPos, pos)];
}

//-----------------------------------------------------------------------------
enum CharClass {
    Alnum,
    Whitespace,
    Punctuation,
    Hiragana,
    Katakana,
    Other,
    Separator,
    Invalid
}

function positionOfNextWordEnd(
    doc: TextDocument,
    caretPos: Position,
    wordSeparators: string
) {
    // Create a character classifier function
    const classify = makeClassifier(wordSeparators);

    // Firstly skip a series of whitespaces, or a series of EOL codes. 
    let pos = caretPos;
    let klass = classify(doc, pos);
    if (klass === CharClass.Whitespace) {
        do {
            // Intentionally avoiding to use doc.positionAt(doc.offsetAt())
            // so that the seek stops at the EOL.
            pos = new Position(pos.line, pos.character + 1);
        }
        while (classify(doc, pos) === CharClass.Whitespace);
    }
    else if (klass === CharClass.Invalid) {
        if (pos.line + 1 < doc.lineCount) {
            return new Position(pos.line + 1, 0); // Beginning of the next line. 
        }
        else {
            return pos; // Already at the EOF.
        }
    }

    // Then, seek until the character type changes.
    const initKlass = classify(doc, pos);
    let nextPos = doc.positionAt(doc.offsetAt(pos) + 1);
    while (nextPos.isAfter(pos)) {
        if (initKlass !== classify(doc, pos)) {
            break;
        }

        pos = nextPos;
        nextPos = doc.positionAt(doc.offsetAt(pos) + 1);
    }

    return pos;
}

function positionOfPrevWordStart(
    doc: TextDocument,
    caretPos: Position,
    wordSeparators: string
) {
    // Create a character classifier function
    const classify = makeClassifier(wordSeparators);

    // Firstly skip whitespaces, excluding EOL codes. 
    function prevCharIsWhitespace() {
        let prevPos = doc.positionAt(doc.offsetAt(pos) - 1);
        return (classify(doc, prevPos) === CharClass.Whitespace);
    }
    let pos = caretPos;
    while (prevCharIsWhitespace()) {
        // Intentionally avoiding to use doc.positionAt(doc.offsetAt())
        // so that the seek stops at the EOL.
        pos = new Position(pos.line, pos.character - 1);
    }

    // Then, seek until the character type changes.
    pos = doc.positionAt(doc.offsetAt(pos) - 1);
    const initKlass = classify(doc, pos);
    let prevPos = doc.positionAt(doc.offsetAt(pos) - 1);
    while (prevPos.isBefore(pos)) {
        if (initKlass !== classify(doc, prevPos)) {
            break;
        }

        pos = prevPos;
        prevPos = doc.positionAt(doc.offsetAt(pos) - 1);
    }

    return pos;
}

function makeClassifier(wordSeparators: string) {
    return function classifyChar(
        doc: TextDocument,
        position: Position
    ) {
        const range = new Range(
            position.line, position.character,
            position.line, position.character + 1
        );
        const text = doc.getText(range);
        if (text.length === 0) {
            return CharClass.Invalid;           // beyond an end-of-line / an end-of-document.
        }
        const ch = text.charCodeAt(0);

        if (wordSeparators.indexOf(text) !== -1) {
            return CharClass.Separator;
        }

        if ((0x09 <= ch && ch <= 0x0d) || ch === 0x20 || ch === 0x3000) {
            return CharClass.Whitespace;
        }

        if ((0x30 <= ch && ch <= 0x39)          // halfwidth digit
            || (0xff10 <= ch && ch <= 0xff19)   // fullwidth digit
            || (0x41 <= ch && ch <= 0x5a)       // halfwidth alphabet, upper case
            || ch === 0x5f                      // underscore
            || (0x61 <= ch && ch <= 0x7a)       // halfwidth alphabet, lower case
            || (0xc0 <= ch && ch <= 0xff        // latin character 
                && ch !== 0xd7 && ch !== 0xf7)  // (excluding multiplication/division sign)
            || (0xff21 <= ch && ch <= 0xff3a)   // fullwidth alphabet, upper case
            || ch === 0xff3f                    // fullwidth underscore
            || (0xff41 <= ch && ch <= 0xff5a)) {// fullwidth alphabet, lower case
            return CharClass.Alnum;
        }

        if ((0x21 <= ch && ch <= 0x2f)
            || (0x3a <= ch && ch <= 0x40)
            || (0x5b <= ch && ch <= 0x60)
            || (0x7b <= ch && ch <= 0x7f)
            || (0x3001 <= ch && ch <= 0x303f
                && ch !== 0x3005)               // CJK punctuation marks except Ideographic iteration mark
            || ch === 0x30fb                    // Katakana middle dot
            || (0xff01 <= ch && ch <= 0xff0f)   // "Full width" forms (1)
            || (0xff1a <= ch && ch <= 0xff20)   // "Full width" forms (2)
            || (0xff3b <= ch && ch <= 0xff40)   // "Full width" forms (3)
            || (0xff5b <= ch && ch <= 0xff65)   // "Full width" forms (4)
            || (0xffe0 <= ch && ch <= 0xffee)) {// "Full width" forms (5)
            return CharClass.Punctuation;
        }

        if ((0x30a0 <= ch && ch <= 0x30ff)      // fullwidth katakana
            && ch !== 0x30fb) {                 // excluding katakana middle dot
            return CharClass.Katakana;
        }

        if (0x3041 <= ch && ch <= 0x309f) {     // fullwidth hiragana
            return CharClass.Hiragana;
        }

        if (0xff66 <= ch && ch <= 0xff9d) {     // halfwidth katakana
            return CharClass.Katakana;
        }

        return CharClass.Other;
    };
}
