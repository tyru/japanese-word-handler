// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';

function setText(editor:vscode.TextEditor, text:string) {
    return editor.edit((editBuilder: vscode.TextEditorEdit)=>{
        const doc = editor.document;
        const startPos = new vscode.Position(0, 0);
        const lastLine = doc.lineAt( doc.lineCount - 1 );
        const endPos = lastLine.range.end;
        const entireRange = new vscode.Range(startPos, endPos);
        editBuilder.replace(entireRange, text);
    });
}

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

    test("cursorNextWordEndJa", () => {
        const editor = vscode.window.activeTextEditor;

        setText(editor, "aB_ \tＣd＿ あいアイ相愛").then((success:boolean) => {
            editor.selections = [new vscode.Selection(0, 0, 0, 0)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(3, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 3, 0, 3)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(8, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 4, 0, 4)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(8, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 8, 0, 8)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(11, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 11, 0, 11)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(13, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 13, 0, 13)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(15, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 15, 0, 15)];
            myExtension.cursorNextWordEndJa(editor);
            assert.equal(15, editor.selection.active.character);
        });
    });

    test("cursorPrevWordStartJa", () => {
        const editor = vscode.window.activeTextEditor;

        setText(editor, "aB_ \tＣd＿ あいアイ相愛").then((success:boolean) => {
            editor.selections = [new vscode.Selection(0, 0, 0, 0)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(0, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 4, 0, 4)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(0, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 5, 0, 5)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(0, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 6, 0, 6)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(5, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 9, 0, 9)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(5, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 10, 0, 10)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(9, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 12, 0, 12)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(11, editor.selection.active.character);

            editor.selections = [new vscode.Selection(0, 15, 0, 15)];
            myExtension.cursorPrevWordStartJa(editor);
            assert.equal(13, editor.selection.active.character);
        });
    });
});
