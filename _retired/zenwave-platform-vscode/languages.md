# Languages

<a id="languages"></a>

**Status:** accepted (archived in OpenSpec). Migrated from OpenSpec specs/languages on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Making VS Code recognise ZDL and ZFL as languages of their own: file
association, highlighting that needs no server or network, and editor behaviour
that matches how the languages are actually written.

## Rules

<a id="l-r1"></a>
### L-R1. ZDL and ZFL files are recognised by extension

The extension SHALL register a `zdl` language for `.zdl` and `.zw` files, and a
`zfl` language for `.zfl` files, each with a distinguishing file icon.

**Examples**

- *Opening a ZDL file.* Given a file named `customer.zdl`, when the user opens it, then the editor reports the language as ZDL, and the file shows the ZenWave icon in the explorer.
- *Opening a ZFL file.* Given a file named `place-order.zfl`, when the user opens it, then the editor reports the language as ZFL.

<a id="l-r2"></a>
### L-R2. ZDL and ZFL are syntax highlighted without any external dependency

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
### L-R3. Editors behave idiomatically for both languages

The extension SHALL configure comment toggling, bracket matching, auto-closing
pairs, surrounding pairs and indentation rules for ZDL and ZFL.

**Examples**

- *Toggling a comment.* Given the cursor on a line in a ZDL file, when the user invokes Toggle Line Comment, then the line is commented using the ZDL line-comment syntax.
- *Typing an opening brace.* Given the cursor in a ZFL file, when the user types an opening brace, then the matching closing brace is inserted automatically.
- *Folding a block.* Given a ZDL file containing a multi-line entity declaration, when the user folds at the declaration line, then the body collapses to a single line.

