# Change Log

All notable changes to the "japanese-word-handler" extension will be
documented in this file.

The format is based on
[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) this project adheres
to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Multi-cursor support
- New command `japaneseWordHandler.deleteWordRight` with keyboard shortcut <kbd>Ctrl+Delete</kbd>
- New command `japaneseWordHandler.deleteWordLeft` with keyboard shortcut <kbd>Ctrl+Backspace</kbd>

### Changed
- Rename command naming convension such as `extension.cursorNextWordEndJa` to
  `japaneseWordHandler.cursorWordEndRight`

## [1.0.0] - 2018-05-21
### Added
- Now respects VSCode's `editor.wordSeparators` configuration
  ([PR #2](https://github.com/sgryjp/japanese-word-handler/pull/2), contribution
  by [@tekezo](https://github.com/tekezo))

### Fixed
- Moving cursor with Ctrl+Left over whitespaces at start of a document fails
  ([Issue #3](https://github.com/sgryjp/japanese-word-handler/issues/3))

## [0.5.1] - 2018-04-19
### Fixed
- Doesn't work on macOS because of incorrect keybinding settings

## [0.5.0] - 2017-05-01
- Initial release
