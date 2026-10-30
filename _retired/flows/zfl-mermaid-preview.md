# ZFL Mermaid preview

<a id="zfl-mermaid-preview"></a>

A read-only preview of a ZFL document, rendered from the Mermaid representations
the language server returns. Moved here from
`zenwave-platform-vscode/docs/zfl-preview-and-eventflow-design.md`; the EventFlow
half of that brief is now [eventflow](eventflow.md).

**Status:** draft, 2026-10-29. The language server side exists. The VS Code preview
editor and the Mermaid renderer do not.

## 1. Goal

Show the diagrams the ZenWave tooling already produces, inside the IDE, without the
IDE learning what a ZFL model means.

1. A ZFL document has a read-only preview that opens beside its text or in the
   text's place.
2. The user chooses how sequence variants are rendered and which diagram to see.

The IDE hosts representations produced upstream and gives the user controls for
choosing between them. No Mermaid source is generated, interpreted or reimplemented
in the IDE.

## 2. Vocabulary

| Term | Meaning |
| --- | --- |
| **Preview** | A read-only editor for one ZFL document, rendering Mermaid representations returned by the server |
| **Preview to the side** | The same preview in an adjacent editor group, text editor left open |
| **Preview here** | The same preview in the current editor group, replacing the text tab where the IDE can do so safely |
| **Render mode** | How the server renders sequence variants: `Alt blocks` or `Separate variants` |
| **Diagram** | One representation returned by the server: the flowchart, or a sequence for one outcome |

EventFlow is a different thing: interactive, React Flow, not Mermaid.

## 3. What exists (verified 2026-10-29)

<a id="mp-t1"></a>
**Server.** `zenwave/preview` is implemented in `zenwave-lsp`. For ZFL it returns an
ordered list: a `flowchart`, then one `sequence:<outcome>:<index>` per end outcome.
It accepts `sequenceRenderMode` of `ALT_BLOCKS`, `SEPARATE_VARIANTS` or `AUTO`; the
default is `ALT_BLOCKS`. `defaultRepresentationId` is the first sequence when one
exists, otherwise the flowchart; the existing fixture names it
`sequence:completed:0`. For ZDL it returns one Mermaid `classDiagram`. The content
comes from `dsl-kotlin`'s `dsl-views`.

<a id="mp-t2"></a>
**Representation shape.** `{ id, title, format: "MARKDOWN" | "MERMAID" | "HTML",
content }`, with `defaultRepresentationId` beside the list. Titles and order belong
to the server. See [decision 0002](../decisions/0002-server-advertises-its-requests.md)
for how a client learns the request exists and for the error vocabulary.

<a id="mp-t3"></a>
**VS Code.** A typed `requests.preview(uri, sequenceRenderMode?)` wrapper exists.
There is no preview editor and no bundled Mermaid renderer.

## 4. Rules

### One preview, two placements

<a id="mp-r1"></a>
**MP-R1. One editor, bound to its document.** Preview to the side and preview here
show the same UI and state; only the editor group differs. A preview never follows
the active editor and never silently changes document.

<a id="mp-r2"></a>
**MP-R2. Read-only.** Editing stays in the ZFL text editor.

### Controls

<a id="mp-r3"></a>
**MP-R3. Two selectors in a compact header.** *Render mode* with `Alt blocks` and
`Separate variants`; *Diagram* listing every representation the server returned, in
the server's order, with the server's titles. A selector with no real choice may be
hidden.

```
┌─────────────────────────────────────────────────────────────────┐
│ Render mode  [Alt blocks ▾]       Diagram  [Sequence: … ▾]      │
├─────────────────────────────────────────────────────────────────┤
│                    Rendered Mermaid SVG                         │
└─────────────────────────────────────────────────────────────────┘
```

<a id="mp-r4"></a>
**MP-R4. Opens on the server's default.** The first view is
`defaultRepresentationId`. For ZFL that is the first happy-path sequence, with the
flowchart one selection away.

### After a change

<a id="mp-r5"></a>
**MP-R5. Editing refreshes after a short pause and keeps the last good diagram
visible** while the new set is requested.

<a id="mp-r6"></a>
**MP-R6. Changing render mode asks the server again** with the chosen mode.

<a id="mp-r7"></a>
**MP-R7. The selection survives where it can.** When a response arrives, keep the
selected diagram if its exact id is still present. If the id changed with the mode
but the same outcome is still offered, keep that outcome, reading only the
identifiers the server gave and inferring nothing about the model. Otherwise fall
back to `defaultRepresentationId`. The same rule applies when an edit removes the
selected outcome.

### Rendering and safety

<a id="mp-r8"></a>
**MP-R8. Local rendering only.** Mermaid renders from assets shipped in the
extension. No remote renderer, no Java process, no network request, no extra
extension.

<a id="mp-r9"></a>
**MP-R9. Server content is data.** The preview runs under a restrictive content
security policy. Representations carry no script and no remote references. Future
Markdown or HTML representations are sanitised first.

<a id="mp-r10"></a>
**MP-R10. Follows the IDE theme** and allows ordinary text selection and copy.

<a id="mp-r11"></a>
**MP-R11. Failures are explained, not blank.** A malformed Mermaid representation
reports a rendering error without blanking the rest. No language server, an
unsupported request and an unreadable document are three different messages.

## 5. Open questions

<a id="mp-q1"></a>
**MP-Q1. Does ZDL use the same shell?** With one class diagram, the header has
nothing to choose. Same shell with controls hidden, or no header?

<a id="mp-q2"></a>
**MP-Q2. Is the id match stable?** Ids encode outcome plus index. Is "exact id, then
outcome part" reliable across `ALT_BLOCKS` and `SEPARATE_VARIANTS`, or should the
server expose a dedicated stable identity?

<a id="mp-q3"></a>
**MP-Q3. First delivery scope.** ZFL only, or ship the ZDL class diagram in the same
editor? The server already supports both.

## 6. Sources

- `zenwave-platform-vscode/docs/zfl-preview-and-eventflow-design.md`
- `zenwave-specs/openspec/changes/001-ide-client-contracts/design.md`
  (decision 1.1 and the ZDL Mermaid decision)
