# Japanese Word Handler

[![Build status](https://ci.appveyor.com/api/projects/status/eqclfgbaefm5npt8/branch/master?svg=true)](https://ci.appveyor.com/project/sgryjp/japanese-word-handler/branch/master)

An [VS Code](https://code.visualstudio.com) extension providing cursor movement logic which is specifically
designed for Japanese text.

## How to activate the logic?

Just install the extension. Doing so changes the action for the keybindings
below:

* `Ctrl+Right` (or `Option+Right` on OSX)
* `Ctrl+Left` (or `Option+Left` on OSX)
* `Ctrl+Shift+Right` (or `Option+Shift+Right` on OSX)
* `Ctrl+Shift+Left` (or `Option+Shift+Left` on OSX)

This extension does not add any command to the command platte.

## What's the difference from the original?

With the original logic, pressing `Ctrl+Right` while the cursor is at the
beginning of a chunk of Japanese characters will move the cursor to the end of
it.

    ‸吾輩は猫である。
          ↓
    吾輩は猫である。‸

With this extension, on the other hand, the cursor will stop at each place where the Japanese character type (Hiragana, Katakana, ...) changes.

    ‸吾輩は猫である。
          ↓
    吾輩‸は猫である。
          ↓
    吾輩は‸猫である。
          ↓
    吾輩は猫‸である。
          ↓
    吾輩は猫である‸。
          ↓
    吾輩は猫である。‸

## Known limitations

As of VSCode 0.10.10, extension cannot override word related actions below:

* Word selection on double click
* Automatic highlight of a word at where the cursor is
* 'Match Whole Word' option of text search

## Issue report

Please visit the [project's GitHub page](https://github.com/sgryjp/japanese-word-handler) and .


**Enjoy!**
