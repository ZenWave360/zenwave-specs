# Model Preview

<a id="model-preview"></a>

A read-only preview of a ZDL or ZFL document inside VS Code, rendered from the
representations the language server returns, so that the picture a VS Code user sees is
the picture an IntelliJ user sees. No Mermaid source is generated, interpreted or
reimplemented in the client.

**Status:** proposed, 2026-10-30. **Nothing here is built in the client.** The server side
exists ([LVR-R3](../flows/lsp-visualization-requests.md#lvr-r3)). This document merges the
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
**MP-T3. VS Code.** A typed `requests.preview(uri, sequenceRenderMode?)` wrapper exists.
There is no preview editor and no bundled Mermaid renderer.

## Rules

### One preview, bound to its document

<a id="mp-r1"></a>
**MP-R1 (proposed). A model file can be previewed beside its text.** The extension offers a
preview action for ZDL and ZFL documents, from the editor and the palette, through
`zenwave.preview.openToSide` and `zenwave.preview.open`, and opens it beside the editor
without taking focus from the text. Invoking it again for a document with a preview reveals
that preview rather than opening a second one. It is not offered for other files.

<a id="mp-r2"></a>
**MP-R2 (proposed). The preview can take the place of the text, and give it back.** The
preview can be shown in the same editor, in the same tab position, and there is an obvious
way back to the text at the position it was left. Opening a model file continues to show its
text by default, and a preview open when the window reloads is restored.

<a id="mp-r3"></a>
**MP-R3 (proposed). A preview belongs to one document.** It shows the document it was opened
for and no other, names it, never follows the active editor and is never re-pointed. Previews
for `orders.zdl` and `customers.zdl` each keep their own. The extension does not move or
re-position editors the user has arranged, so a preview dragged into another group stays
there across re-renders. *Why:* the built-in Markdown preview offers both behaviours and
needs a locking command to reconcile them; binding from the start avoids inventing that.

<a id="mp-r9"></a>
**MP-R9 (proposed). Read-only.** Editing stays in the text editor.

### Controls

<a id="mp-r4"></a>
**MP-R4 (proposed). The preview shows what the server provides.** Representations appear in
the order given, under the server's titles, and the first shown is
`defaultRepresentationId`: for ZFL the first happy-path sequence, with the flowchart one
selection away. The extension does not invent, reorder or omit any. Only `format` is
inspected, never an id.

<a id="mp-r10"></a>
**MP-R10 (proposed). Two selectors in a compact header, inside the page.** *Render mode* and
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
**MP-R5 (proposed). The preview keeps step with the document.** It re-renders as the document
changes, after a short pause, without saving, and from disk changes such as a branch switch.
The last good content stays visible while the new set is requested, so typing never blanks it.

<a id="mp-r11"></a>
**MP-R11 (proposed). Changing render mode asks the server again** with the chosen mode.

<a id="mp-r12"></a>
**MP-R12 (proposed). The selection survives where it can.** When a response arrives, keep the
selected diagram if its exact id is present. If the id changed with the mode but the same
outcome is still offered, keep that outcome, reading only the identifiers the server gave.
Otherwise fall back to `defaultRepresentationId`. The same rule applies when an edit removes
the selected outcome. Selection and scroll last as long as the editor; reopening starts on
the server's default.

### Rendering and safety

<a id="mp-r6"></a>
**MP-R6 (proposed). Diagrams render locally.** From assets shipped in the extension: no
network, no Java, no remote renderer, no other extension. Server content is data: it runs
under a restrictive content security policy, nothing in it is executed or fetched, and future
Markdown or HTML is sanitised first. A malformed diagram reports itself and leaves the rest
readable. See [decision 0009](../decisions/0009-mermaid-not-plantuml.md).

<a id="mp-r7"></a>
**MP-R7 (proposed). The preview reads as part of the editor.** It follows the colour theme,
including a change while open, and allows ordinary text selection and copy.

<a id="mp-r8"></a>
**MP-R8 (proposed). The preview explains why it has nothing to show.** No language server, a
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
**MP-Q2. First delivery scope.** ZFL only, or the ZDL class diagram in the same editor? The
server already supports both.

<a id="mp-q3"></a>
**MP-Q3. What are preview and EventFlow each for?** A ZFL file has two diagram surfaces and
nothing says which to open. Left to emerge from use; when the answer is known it belongs in
the naming and grouping, not in a new feature.

<a id="mp-q4"></a>
**MP-Q4. What happens for an untitled buffer, a model open in a diff, or a document open
twice?** A custom editor sees these where a panel would not. Task 005/3.5 in the
[backlog](../work/backlog.md).

## Sources

`zenwave-lsp` `zenwave/preview`; the original spec, its design and the 2026-10-29 brief, in git history.
