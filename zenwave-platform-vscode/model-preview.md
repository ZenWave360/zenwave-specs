# Model Preview

<a id="model-preview"></a>

A read-only preview of a ZDL or ZFL document inside VS Code, rendered from the
representations the language server returns, so that the picture a VS Code user sees is
the picture an IntelliJ user sees. No Mermaid source is generated, interpreted or
reimplemented in the client.

**Status:** 2026-10-30: the first delivery, ZDL and ZFL with what the server returns today, is built on the
zenwave-platform-vscode branch `feature/preview-eventflow-storming`, not yet reviewed. Markdown and `.zw` are not. The server
side exists ([LVR-R3](../flows/lsp-visualization-requests.md#lvr-r3)). This document merges the
original preview spec with the later brief that agreed its controls; where they differed,
the later brief wins and the rule says so. EventFlow is a different thing: interactive,
not Mermaid. See [EventFlow](../flows/eventflow.md).

## Vocabulary

| Term | Meaning |
| --- | --- |
| **Preview** | A read-only editor for one model document, rendering what the server returned |
| **Preview to the side** | The same preview in an adjacent editor group, text left open |
| **Preview here** | The same preview in the current group, replacing the text tab |
| **Render mode** | How the server renders ZFL sequence variants: `Alt blocks` or `Separate variants` |
| **Diagram** | One representation: the flowchart, or a sequence for one outcome |

## What exists (verified 2026-10-29)

<a id="mp-t1"></a>
**MP-T1. Server.** `zenwave/preview` is implemented in `zenwave-lsp`. For ZFL it returns an
ordered list: a `flowchart`, then one `sequence:<outcome>:<index>` per end outcome. It
accepts `sequenceRenderMode` of `ALT_BLOCKS`, `SEPARATE_VARIANTS` or `AUTO`; the default is
`ALT_BLOCKS`. `defaultRepresentationId` is the first sequence when one exists, otherwise the
flowchart. For ZDL it returns one Mermaid `classDiagram`. The content comes from
`dsl-kotlin`'s `dsl-views`.

<a id="mp-t2"></a>
**MP-T2. Representation shape.** `{ id, title, format: "MARKDOWN" | "MERMAID" | "HTML",
content }`, with `defaultRepresentationId` beside the list. Titles and order belong to the
server. See [decision 0002](../decisions/0002-server-advertises-its-requests.md).

<a id="mp-t3"></a>
**MP-T3. VS Code.** A read-only custom editor, `zenwave.preview`, renders what
`requests.preview(uri, sequenceRenderMode?)` returns, with Mermaid 12.2.0 bundled. It adds 1.6 MB to the VSIX, from 2.86 MB to 4.39 MB.
Markdown and HTML representations show a message saying they aren't rendered yet.

<a id="mp-t4"></a>
**MP-T4. The Commit button's menu is not open to us.** Checked 2026-10-30 in the VS Code 1.144.0
installed here. The green Commit button in a `COMMIT_EDITMSG` editor is contributed to the
`editor/content` menu by the built-in Git extension, which declares the proposed API
`contribEditorContentMenu`. An extension outside the allowlist in VS Code's `product.json` can only use
a proposed API in extension development mode or with `--enable-proposed-api`, so ordinary users would
not get the button. The allowlist has `ms-python.python`, `GitHub.vscode-pull-request-github`,
`GitHub.copilot-chat` and `ms-vscode.vscode-chat-customizations-evaluations`, and not ZenWave. Our
extension declares no proposed APIs today. Whether a Marketplace publish would also refuse it was not tried.

<a id="mp-t5"></a>
**MP-T5. The server does not seem to know `.zw`.** Read in `zenwave-lsp` on 2026-10-30, not run. The ZDL
module declares only `.zdl`, the client sends the language id `zw`, and `zenwave/preview` answers only
`zdl` and `zfl`, rejecting anything else as unsupported. So a `.zw` document would get no preview today.

<a id="mp-t6"></a>
**MP-T6. What a `.zw` preview would be built from.** The parser reads the `config` block and the plugins.
The rules that combine them, inheritance and `(inherit false)`, are applied in the VS Code client when
it builds a command ([sdk-runner](sdk-runner.md)). Plugin titles and option descriptions are in the
[catalogue](../flows/sdk-plugin-catalogue.md) shipped with the extension
([decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md)). The server has neither. The catalogue
is 116 KB for 19 plugins. The extension never asks the installed SDK for it, so a workspace's own plugins
are not in it ([task 002/11.7](../work/backlog.md)). `dsl-docs` has no page for configuration or plugins.

## Rules

### One preview, bound to its document

<a id="mp-r1"></a>
**MP-R1 (exists). A model file can be previewed beside its text.** The extension offers a
preview action for ZDL and ZFL documents, from the editor's title bar and the palette, through
`zenwave.preview.openToSide` and `zenwave.preview.open`, and opens it beside the editor
without taking focus from the text. Invoking it again for a document with a preview reveals
that preview rather than opening a second one. It is not offered for other files.

<a id="mp-r2"></a>
**MP-R2 (partial: restoring on window reload is not checked). The preview can take the place of the text, and give it back.** The
preview can be shown in the same editor, in the same tab position, and there is an obvious
way back to the text at the position it was left. Opening a model file continues to show its
text by default, and a preview open when the window reloads is restored.

<a id="mp-r3"></a>
**MP-R3 (partial: a preview dragged to another group is not checked). A preview belongs to one document.** It shows the document it was opened
for and no other, names it, never follows the active editor and is never re-pointed. Previews
for `orders.zdl` and `customers.zdl` each keep their own. The extension does not move or
re-position editors the user has arranged, so a preview dragged into another group stays
there across re-renders. *Why:* the built-in Markdown preview offers both behaviours and
needs a locking command to reconcile them; binding from the start avoids inventing that.

<a id="mp-r9"></a>
**MP-R9 (exists). Read-only.** Editing stays in the text editor.

<a id="mp-r13"></a>
**MP-R13 (proposed; an idea to review later, not to implement now). The text editor of a model shows a
button for its view.** ZDL and ZFL text editors would show a labelled button inside the editor, at the
bottom right, the way a `COMMIT_EDITMSG` editor shows Commit. For example, with `orders.zfl` open as text
the button is there without opening a menu, and it is gone in a diagram, a preview or any other language.
*Why it is worth keeping:* the title bar's controls are small, and someone who doesn't already know about
them may not find them. *Why not now:* the menu is closed to us ([MP-T4](#mp-t4)). Review it if VS Code
finalises `contribEditorContentMenu`. Until then the route is the title bar
([EP-R1](eventflow-panel.md#ep-r1)).

<a id="mp-r14"></a>
**MP-R14 (proposed). A `.zw` file has its own preview, in Markdown.** `.zw` and `.zdl` are the same
language, but a `.zw` file is generally used to configure plugins, so its preview is different. A ZDL preview shows
classes, aggregates, commands and events. A `.zw` preview shows the global configuration, with a
description of it, and for each plugin what it is going to do, its own configuration and the resolved sum
of its properties. For example, a plugin that sets `targetFolder` under a `config` block setting
`basePackage` lists both, and one declared `(inherit false)` lists only its own. Resolution follows the
same rules the [SDK runner](sdk-runner.md) uses to build a command, implemented in the Kotlin libraries.
The result can still differ from a run, which uses the SDK the user has installed; that is accepted. It is
sent as a `MARKDOWN` representation ([MP-T2](#mp-t2)), written by `dsl-docs`
([decision 0020](../decisions/0020-previews-come-from-dsl-docs-through-the-server.md)). What is missing is
[MP-T5](#mp-t5) and [MP-T6](#mp-t6).

<a id="mp-r15"></a>
**MP-R15 (proposed). A ZDL preview is a Markdown page from `dsl-docs`.** It holds the class diagram, a
glossary, commands and events, as the `dsl-docs` domain page does, and replaces the lone class diagram of
[MP-T1](#mp-t1). `dsl-docs` has a separate method for previews, so `generate` keeps returning a documentation
folder. A ZFL preview stays as the list of Mermaid diagrams already agreed in [MP-R4](#mp-r4).

<a id="mp-r16"></a>
**MP-R16 (proposed). The server has its own catalogue, and a client can replace it.** The server ships its own copy
of the catalogue. The client sends its copy at initialisation, and can send a newer one at any moment
while the server runs. The server uses the last one it received, or its own if it has received none. So
today's shipped JSON works from the start, and when the extension can get a current catalogue from the
installed SDK ([task 002/11.7](../work/backlog.md)) it hands it over with no change to the server. The
next preview uses the new catalogue. `dsl-docs` receives the chosen catalogue as an input. A plugin that isn't in it,
such as a team's own, still shows its name and resolved configuration, without a description.

### Controls

<a id="mp-r4"></a>
**MP-R4 (exists). The preview shows what the server provides.** Representations appear in
the order given, under the server's titles, and the first shown is
`defaultRepresentationId`: for ZFL the first happy-path sequence, with the flowchart one
selection away. The extension does not invent, reorder or omit any. Only `format` is
inspected, never an id.

<a id="mp-r10"></a>
**MP-R10 (partial: the quick pick is not driven by a test). Two selectors in a compact header, inside the page.** *Render mode* and
*Diagram*. A selector with no real choice is hidden, so a ZDL preview with one class diagram
shows no selector. VS Code's title bar cannot show a dropdown with its current value, so this
is HTML in the webview; a palette command with a quick pick is the keyboard route.

```
┌─────────────────────────────────────────────────────────────────┐
│ Render mode  [Alt blocks ▾]       Diagram  [Sequence: … ▾]      │
├─────────────────────────────────────────────────────────────────┤
│                    Rendered Mermaid SVG                         │
└─────────────────────────────────────────────────────────────────┘
```

### After a change

<a id="mp-r5"></a>
**MP-R5 (exists). The preview keeps step with the document.** It re-renders as the document
changes, after a short pause, without saving, and from disk changes such as a branch switch.
The last good content stays visible while the new set is requested, so typing never blanks it.

<a id="mp-r11"></a>
**MP-R11 (exists). Changing render mode asks the server again** with the chosen mode.

<a id="mp-r12"></a>
**MP-R12 (exists). The selection survives where it can.** When a response arrives, keep the
selected diagram if its exact id is present. If the id changed with the mode but the same
outcome is still offered, keep that outcome, reading only the identifiers the server gave.
Otherwise fall back to `defaultRepresentationId`. The same rule applies when an edit removes
the selected outcome. Selection and scroll last as long as the editor; reopening starts on
the server's default.

### Rendering and safety

<a id="mp-r6"></a>
**MP-R6 (exists). Diagrams render locally.** From assets shipped in the extension: no
network, no Java, no remote renderer, no other extension. Server content is data: it runs
under a restrictive content security policy, nothing in it is executed or fetched, and future
Markdown or HTML is sanitised first. A malformed diagram reports itself and leaves the rest
readable. See [decision 0009](../decisions/0009-mermaid-not-plantuml.md). This page allows `style-src 'unsafe-inline'`: Mermaid has no
nonce option and measures text with styles it inserts, so without it the layouts change. Scripts stay under a nonce, and
`default-src 'none'` keeps CSS from fetching anything.

<a id="mp-r7"></a>
**MP-R7 (partial: following a theme change is checked on desktop only). The preview reads as part of the editor.** It follows the colour theme,
including a change while open, and allows ordinary text selection and copy.

<a id="mp-r8"></a>
**MP-R8 (exists). The preview explains why it has nothing to show.** No language server, a
server that does not support previews, and an unreadable document are three different
messages, with the detail in the output channel.

## Not in scope

Scroll sync with the text, exporting to PNG or SVG, previewing an unopened file from the
explorer, and imitating IntelliJ's single tab with two halves. VS Code has no API to compose
two editors in one tab, and side by side is honestly two tabs.

## Open questions

<a id="mp-q1"></a>
**MP-Q1. Is the id match stable?** Ids encode outcome plus index. Is "exact id, then outcome
part" reliable across `ALT_BLOCKS` and `SEPARATE_VARIANTS`, or should the server expose a
dedicated stable identity?

<a id="mp-q2"></a>
**MP-Q2. First delivery scope.** Answered 2026-10-30 by the owner: ZFL and ZDL in the first delivery. `.zw`
follows with [MP-R14](#mp-r14).

<a id="mp-q3"></a>
**MP-Q3. What are preview and EventFlow each for?** A ZFL file has two diagram surfaces and
nothing says which to open. Left to emerge from use; when the answer is known it belongs in
the naming and grouping, not in a new feature.

<a id="mp-q4"></a>
**MP-Q4. What happens for an untitled buffer, a model open in a diff, or a document open
twice?** Answered 2026-10-30. An untitled buffer has no extension to match and is not offered a preview, and the
palette command says to save it first. A diff editor is not offered one either: the title bar entry is hidden
there, as the two sides are two documents. A document open in two groups is one document with one preview, so
invoking the command reveals it ([MP-R1](#mp-r1)).

<a id="mp-q5"></a>
**MP-Q5. Where does the button go while `editor/content` is closed to us?** Answered 2026-10-30: nowhere.
A CodeLens at the top adds little, as the title bar is right there, so the title bar's preview buttons
stay the route and the button remains an idea ([MP-R13](#mp-r13)).

<a id="mp-q6"></a>
**MP-Q6. What does the button open?** Left for when [MP-R13](#mp-r13) is reviewed. A ZFL document can open
the EventFlow diagram today, and the preview once it exists, which is [MP-Q3](#mp-q3) again. A ZDL or `.zw`
document has only the preview.

<a id="mp-q7"></a>
**MP-Q7. Who writes the `.zw` Markdown?** Answered 2026-10-30: `dsl-docs`, served by the language server. See
[decision 0020](../decisions/0020-previews-come-from-dsl-docs-through-the-server.md).

<a id="mp-q8"></a>
**MP-Q8. How do plugin descriptions reach the server?** Answered 2026-10-30 by the owner: the server has its own copy
and takes whichever the client last sent. See [MP-R16](#mp-r16). Still to define when it is built: the wire names, which
is `initializationOptions` plus one notification, and how the server's copy is generated from a named SDK build.
Whether IntelliJ sends a catalogue was not checked; if it doesn't, it gets the server's copy.

## Sources

`zenwave-lsp` `zenwave/preview`; the original spec, its design and the 2026-10-29 brief, in git history.
