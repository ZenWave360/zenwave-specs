# Languages

<a id="languages"></a>

**Status:** exists, 2026-10-30. Checked against `packages/extension/package.json`.

## Purpose

Making VS Code recognise ZDL and ZFL as languages of their own: file
association, highlighting that needs no server or network, and editor behaviour
that matches how the languages are actually written.

## Rules

<a id="l-r1"></a>
### L-R1 (exists). ZDL, ZFL and ZenWave SDK files are recognised by extension

The extension SHALL register a `zdl` language for `.zdl` files, a `zw` language for `.zw`
ZenWave SDK files, and a `zfl` language for `.zfl` files. Each has its designated ZenWave file
icon, and `.zw` files keep ZDL syntax and SDK authoring support.

`.zw` and `.zdl` are the same language. A `.zw` file is generally used to configure plugins in the
`config` block, while a `.zdl` may hold that and everything else. The separate language id gives
it its icon, its name and [its own preview](model-preview.md#mp-r14).

**Examples**

- *Opening a ZDL file.* Given a file named `customer.zdl`, when the user opens it, then the editor reports the language as ZDL, and the file shows the orange-and-teal ZDL icon in the explorer.
- *Opening a ZenWave SDK file.* Given a file named `generate.zw`, when the user opens it, then the editor reports the language as ZenWave SDK, shows the blue SDK icon, and provides ZDL syntax and SDK authoring support.
- *Opening a ZFL file.* Given a file named `place-order.zfl`, when the user opens it, then the editor reports the language as ZFL and shows the ZenWave Platform icon.

<a id="l-r2"></a>
### L-R2 (exists). ZDL and ZFL are syntax highlighted without any external dependency

The extension SHALL provide TextMate grammars for ZDL and ZFL that highlight
keywords, types, annotations, string and numeric literals, comments and
documentation comments. Highlighting SHALL NOT depend on a language server, a
network connection, an installed JVM, or a grammar contributed by another
extension.

**Examples**

- *Highlighting in the web host with no server available.* Given a ZDL file open in a browser-based VS Code, when the file is displayed, then it is syntax highlighted.
- *Documentation comments are distinguishable.* Given a ZDL or ZFL file containing both a `//` line comment and a `/** */` documentation comment, when the file is displayed, then each is highlighted as a comment, and the documentation comment is distinguishable from the ordinary one.
- *Nested blocks do not end their parent early.* Given a `config { plugins { … } }` section declaring several plugins, each with its own braced body, when the file is displayed, then every plugin is highlighted, not only the first — each plugin name reads as a named declaration and each of its options reads as a field.
- *Comment text does not leak into the rest of the file.* Given a comment containing an apostrophe, a quote or a brace — for example `the processor's response`, when the file is displayed, then the comment is highlighted as a comment, and the code after it is highlighted normally rather than being absorbed into a string or block.

**Note:** these grammars are the *fallback* highlighting layer. When the language
server provides semantic tokens, those take precedence; the grammars remain so
that a file is never left unhighlighted.

<a id="l-r3"></a>
### L-R3 (exists). Editors behave idiomatically for both languages

The extension SHALL configure comment toggling, bracket matching, auto-closing
pairs, surrounding pairs and indentation rules for ZDL and ZFL.

**Examples**

- *Toggling a comment.* Given the cursor on a line in a ZDL file, when the user invokes Toggle Line Comment, then the line is commented using the ZDL line-comment syntax.
- *Typing an opening brace.* Given the cursor in a ZFL file, when the user types an opening brace, then the matching closing brace is inserted automatically.
- *Folding a block.* Given a ZDL file containing a multi-line entity declaration, when the user folds at the declaration line, then the body collapses to a single line.

