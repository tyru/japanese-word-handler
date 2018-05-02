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

        const testSingleCursorMotion = async function (
            editor: TextEditor,
            wordSeparators: string,
            content: string
        ) {
            await setText(editor, content);
            const initPos = new Position(0, 0);
            editor.selections = [new Selection(initPos, initPos)];
            myExtension.cursorNextWordEndJa(editor, wordSeparators);
            return editor.selection.active;
        };

        test("motion: starting from end-of-document",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: starting from end-of-line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "\n");
                assert.equal(cursorPos.line, 1);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should skip a WSP at cursor",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", " Foo");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 4);
            });

        test("motion: should skip multiple WSPs at cursor",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", " \t Foo");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 6);
            });

        test("motion: should stop at end-of-document after skipping WSPs",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", " ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 1);
            });

        test("motion: should stop at beginning of a line just after an EOL",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "\norange");
                assert.equal(cursorPos.line, 1);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should skip only the first EOL in a series of EOLs",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "\n\norange");
                assert.equal(cursorPos.line, 1);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should stop on char-class change (alnum -> punctuation)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "HbA1c。");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 5);
            });

        test("motion: should stop on char-class change (alnum -> hiragana)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "HbA1cかな");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 5);
            });

        test("motion: should stop on char-class change (hiragana -> katakana)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "かなカナ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop on char-class change (katakana -> other)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "カナ漢字");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop on char-class change (other -> WSP)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "漢字\t ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop at end-of-line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "apple\norange");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 5);
            });

        test("motion: should stop at end-of-document",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "apple");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 5);
            });
    });

    suite("cursorPrevWordStartJa", () => {

        const testSingleCursorMotion = async function (
            editor: TextEditor,
            wordSeparators: string,
            content: string
        ) {
            await setText(editor, content);
            const initPos = editor.document.positionAt(
                content.length * 2); // LFs may become CRLFs
            editor.selections = [new Selection(initPos, initPos)];
            myExtension.cursorPrevWordStartJa(editor, wordSeparators);
            return editor.selection.active;
        };

        test("motion: starting from start-of-document",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: starting from start-of-line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "\n");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should skips a WSP",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "Foo ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should skip multiple WSPs",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", "Foo \t");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should stop at start-of-document after skipping WSPs",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor,
                    "", " ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should not go over an EOL if not from start of the line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "\nFoo");
                assert.equal(cursorPos.line, 1);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should go over an EOL from start of the line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "Foo\n");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 3);
            });

        test("motion: should stop on char-class change (alnum -> punctuation)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "!HbA1c");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 1);
            });

        test("motion: should stop on char-class change (alnum -> hiragana)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "かなHbA1c");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop on char-class change (hiragana -> katakana)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "カナかな");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop on char-class change (katakana -> other)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "漢字カナ");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop on char-class change (other -> WSP)",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "\t 漢字");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 2);
            });

        test("motion: should stop at start-of-line",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "Foo\nBar");
                assert.equal(cursorPos.line, 1);
                assert.equal(cursorPos.character, 0);
            });

        test("motion: should stop at start-of-document",
            async () => {
                const editor = vscode.window.activeTextEditor!;
                const cursorPos = await testSingleCursorMotion(editor, "",
                    "Foo");
                assert.equal(cursorPos.line, 0);
                assert.equal(cursorPos.character, 0);
            });
    });
});
