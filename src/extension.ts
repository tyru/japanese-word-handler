'use strict';

import * as vscode from 'vscode';
import { Position, Range, Selection, TextDocument, TextEditor, TextEditorSelectionChangeEvent, Hover } from 'vscode';

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

    command = vscode.commands.registerCommand(
        'extension.deleteWordRight',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            deleteWordRight(editor, wordSeparators);
        });
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand(
        'extension.deleteWordLeft',
        () => {
            let editor = vscode.window.activeTextEditor!;
            let wordSeparators = getWordSeparator(editor);
            deleteWordLeft(editor, wordSeparators);
        });
    context.subscriptions.push(command);

    let prevHoveredPosition: Position | null = null;
    vscode.languages.registerHoverProvider({ pattern: '*' }, {
        provideHover(document, position, token) {
            prevHoveredPosition = position;
            return null;
        }
    });
    vscode.window.onDidChangeTextEditorSelection(async (e: TextEditorSelectionChangeEvent) => {
        const editor = e.textEditor;
        if (e.kind != vscode.TextEditorSelectionChangeKind.Mouse || !prevHoveredPosition ||
            editor.selections.length !== 1 || editor.selection.isEmpty) {
            return;
        }
        const document = editor.document;
        const wordSeparators = getWordSeparator(editor);
        editor.selection = new Selection(
            atClassBoundary(document, prevHoveredPosition, wordSeparators) ?
                prevHoveredPosition :
                positionOfPrevWordStart(document, prevHoveredPosition, wordSeparators),
            positionOfNextWordEnd(document, prevHoveredPosition, wordSeparators)
        );
    });
}

function atClassBoundary(
    doc: TextDocument,
    pos: Position,
    wordSeparators: string
) {
    if (pos.character === 0) return false;
    const classify = makeClassifier(wordSeparators);
    const prevPos = new Position(pos.line, pos.character - 1);
    return classify(doc, pos) !== classify(doc, prevPos);
}

//-----------------------------------------------------------------------------
export function cursorNextWordEndJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const document = editor.document;
    editor.selections = editor.selections
        .map(s => positionOfNextWordEnd(document, s.active, wordSeparators))
        .map(p => new Selection(p, p));
    if (editor.selections.length === 1) {
        editor.revealRange(editor.selection);
    }
}

export function cursorNextWordEndSelectJa(
    editor: TextEditor,
    wordSeparators: string
) {
    editor.selections = editor.selections
        .map(s => new Selection(
            s.anchor,
            positionOfNextWordEnd(editor.document, s.active, wordSeparators))
        );
    if (editor.selections.length === 1) {
        editor.revealRange(editor.selection);
    }
}

export function cursorPrevWordStartJa(
    editor: TextEditor,
    wordSeparators: string
) {
    const document = editor.document;
    editor.selections = editor.selections
        .map(s => positionOfPrevWordStart(document, s.active, wordSeparators))
        .map(p => new Selection(p, p));
    if (editor.selections.length === 1) {
        editor.revealRange(editor.selection);
    }
}

export function cursorPrevWordStartSelectJa(
    editor: TextEditor,
    wordSeparators: string
) {
    editor.selections = editor.selections
        .map(s => new Selection(
            s.anchor,
            positionOfPrevWordStart(editor.document, s.active, wordSeparators)
        ));
    if (editor.selections.length === 1) {
        editor.revealRange(editor.selection);
    }
}

export function deleteWordRight(
    editor: TextEditor,
    wordSeparators: string
) {
    return editor.edit(e => {
        const document = editor.document;
        let selections = editor.selections.map(
            s => new Selection(
                s.anchor,
                positionOfNextWordEnd(document, s.active, wordSeparators)
            ));
        for (let selection of selections) {
            e.delete(selection);
        }
    }).then(() => {
        if (editor.selections.length === 1) {
            editor.revealRange(editor.selection);
        }
    });
}

export function deleteWordLeft(
    editor: TextEditor,
    wordSeparators: string
) {
    return editor.edit(e => {
        const document = editor.document;
        let selections = editor.selections.map(
            s => new Selection(
                s.anchor,
                positionOfPrevWordStart(document, s.active, wordSeparators)
            ));
        for (let selection of selections) {
            e.delete(selection);
        }
    }).then(() => {
        if (editor.selections.length === 1) {
            editor.revealRange(editor.selection);
        }
    });
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

/**
 * Gets position of the end of a word after specified position.
 */
function positionOfNextWordEnd(
    doc: TextDocument,
    caretPos: Position,
    wordSeparators: string
): Position {
    // Brief spec of this function:
    // - Firstly gets a character where the cursor is pointing at.
    // - If no more character is in the line:
    //   - (at EOL) seeks to the beginning the next line.
    //   - (at EOD) does not move cursor.
    // - If it's a WSP, skips a sequence of WSPs beginning with it.
    //   - If skipped WSP(s) and reached EOL/EOD, stop seeking.
    // - Secondly, seeks forward until character type changes.

    const classify = makeClassifier(wordSeparators);

    // Check if it's already at end-of-line or end-of-document
    let klass = classify(doc, caretPos);
    if (klass === CharClass.Invalid) {
        const nextLine = caretPos.line + 1;
        return (nextLine < doc.lineCount)
            ? new Position(nextLine, 0) // end-of-line
            : caretPos;                 // end-of-document
    }

    // Skip a series of whitespaces
    let pos = caretPos;
    if (klass === CharClass.Whitespace) {
        do {
            pos = new Position(pos.line, pos.character + 1);
        }
        while (classify(doc, pos) === CharClass.Whitespace);
    }

    // Seek until character type changes, unless already reached EOL/EOD
    klass = classify(doc, pos);
    if (classify(doc, pos) !== CharClass.Invalid) {
        do {
            pos = new Position(pos.line, pos.character + 1);
        }
        while (klass === classify(doc, pos));
    }

    return pos;
}

/**
 * Gets position of the word before specified position.
 */
function positionOfPrevWordStart(
    doc: TextDocument,
    caretPos: Position,
    wordSeparators: string
) {
    // Brief spec of this function:
    // - Firstly, skips a sequence of WSPs, if there is.
    //   - If reached start of a line, quit there.
    // - Secondly, seek backward until:
    //   1. character type changes, or
    //   2. reaches start of a line.

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
        if (pos.character <= 0) {
            return doc.positionAt(doc.offsetAt(pos) - 1);
        }
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

/**
 * Compose a character classifier function.
 * @param wordSeparators A string containing characters to separate words
 *                       (mostly used in English-like language context.)
 */
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
            return CharClass.Invalid;  // end-of-line or end-of-document
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
