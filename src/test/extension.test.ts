// Note: This test is leveraging the Mocha test framework (https://mochajs.org/)

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

import * as myExtension from '../extension';

async function setText(editor: vscode.TextEditor, text: string) {
    return editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const doc = editor.document;
        const startPos = new vscode.Position(0, 0);
        const lastLine = doc.lineAt(doc.lineCount - 1);
        const endPos = lastLine.range.end;
        const entireRange = new vscode.Range(startPos, endPos);
        editBuilder.replace(entireRange, text);
    });
}

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

    function tempFilePath(extension: string) {
        return path.join(os.tmpdir(), "japanese-word-handler.test" + extension);
    }

    suiteSetup(async () => {
        const fileName = tempFilePath(".txt");
        fs.writeFileSync(fileName, "");
        const doc = await vscode.workspace.openTextDocument(fileName);
        await vscode.window.showTextDocument(doc);
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
        fs.unlinkSync(tempFilePath(".txt"));
    });

    test("cursorNextWordEndJa", async () => {
        const editor = vscode.window.activeTextEditor!;

        await setText(editor, "aB_ \tＣd＿ あいアイ相愛").then((success: boolean) => {
            editor.selections = [new vscode.Selection(0, 0, 0, 0)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 3);

            editor.selections = [new vscode.Selection(0, 3, 0, 3)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 8);

            editor.selections = [new vscode.Selection(0, 4, 0, 4)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 8);

            editor.selections = [new vscode.Selection(0, 8, 0, 8)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 11);

            editor.selections = [new vscode.Selection(0, 11, 0, 11)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 13);

            editor.selections = [new vscode.Selection(0, 13, 0, 13)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 15);

            editor.selections = [new vscode.Selection(0, 15, 0, 15)];
            myExtension.cursorNextWordEndJa(editor, "");
            assert.equal(editor.selection.active.character, 15);
        });
    });

    test("cursorPrevWordStartJa", async () => {
        const editor = vscode.window.activeTextEditor!;

        await setText(editor, "aB_ \tＣd＿ あいアイ相愛").then((success: boolean) => {
            editor.selections = [new vscode.Selection(0, 0, 0, 0)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new vscode.Selection(0, 4, 0, 4)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new vscode.Selection(0, 5, 0, 5)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new vscode.Selection(0, 6, 0, 6)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 5);

            editor.selections = [new vscode.Selection(0, 9, 0, 9)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 5);

            editor.selections = [new vscode.Selection(0, 10, 0, 10)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 9);

            editor.selections = [new vscode.Selection(0, 12, 0, 12)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 11);

            editor.selections = [new vscode.Selection(0, 15, 0, 15)];
            myExtension.cursorPrevWordStartJa(editor, "");
            assert.equal(editor.selection.active.character, 13);
        });
    });
});
