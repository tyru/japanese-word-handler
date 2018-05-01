// Note: This test is leveraging the Mocha test framework (https://mochajs.org/)

import * as assert from 'assert';
import { unlink as fs_unlink, writeFile as fs_writeFile } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'bluebird';

import * as vscode from 'vscode';
import { Position, Range, Selection, TextEditor, TextEditorEdit } from 'vscode';

import * as myExtension from '../extension';


suite("japanese-word-handler", () => {
    // Prepare utility functions and constants
    const standardWordSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
    const unlink = promisify(fs_unlink);
    const writeFile = promisify<void, string, any>(fs_writeFile);
    const tempFilePath = function (extension: string) {
        return join(tmpdir(), "japanese-word-handler.test" + extension);
    };
    const setText = async function (editor: TextEditor, text: string) {
        return editor.edit((editBuilder: TextEditorEdit) => {
            const doc = editor.document;
            const startPos = new Position(0, 0);
            const lastLine = doc.lineAt(doc.lineCount - 1);
            const endPos = lastLine.range.end;
            const entireRange = new Range(startPos, endPos);
            editBuilder.replace(entireRange, text);
        });
    };

    suiteSetup(async () => {
        const fileName = tempFilePath(".txt");
        await writeFile(fileName, "");
        const doc = await vscode.workspace.openTextDocument(fileName);
        await vscode.window.showTextDocument(doc);
    });

    suiteTeardown(async () => {
        const commandName = "workbench.action.closeAllEditors";
        await vscode.commands.executeCommand(commandName);
        await unlink(tempFilePath(".txt"));
    });

    suite("cursorNextWordEndJa", () => {

        test("basic", async () => {
            const editor = vscode.window.activeTextEditor!;
            const separators = standardWordSeparators;
            let success = await setText(editor, "aB_ \tＣd＿ あいアイ相愛");
            assert.ok(success);

            editor.selections = [new Selection(0, 0, 0, 0)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 3);

            editor.selections = [new Selection(0, 3, 0, 3)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 8);

            editor.selections = [new Selection(0, 4, 0, 4)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 8);

            editor.selections = [new Selection(0, 8, 0, 8)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 11);

            editor.selections = [new Selection(0, 11, 0, 11)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 13);

            editor.selections = [new Selection(0, 13, 0, 13)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 15);

            editor.selections = [new Selection(0, 15, 0, 15)];
            myExtension.cursorNextWordEndJa(editor, separators);
            assert.equal(editor.selection.active.character, 15);
        });
    });

    suite("cursorPrevWordStartJa", () => {

        test("basic", async () => {
            const editor = vscode.window.activeTextEditor!;
            const separators = standardWordSeparators;
            let success = await setText(editor, "aB_ \tＣd＿ あいアイ相愛");
            assert.ok(success);

            editor.selections = [new Selection(0, 0, 0, 0)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new Selection(0, 4, 0, 4)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new Selection(0, 5, 0, 5)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 0);

            editor.selections = [new Selection(0, 6, 0, 6)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 5);

            editor.selections = [new Selection(0, 9, 0, 9)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 5);

            editor.selections = [new Selection(0, 10, 0, 10)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 9);

            editor.selections = [new Selection(0, 12, 0, 12)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 11);

            editor.selections = [new Selection(0, 15, 0, 15)];
            myExtension.cursorPrevWordStartJa(editor, separators);
            assert.equal(editor.selection.active.character, 13);
        });
    });
});
