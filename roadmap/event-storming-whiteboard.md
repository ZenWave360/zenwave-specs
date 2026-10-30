# Event Storming whiteboard

<a id="event-storming-whiteboard"></a>

An app in `zenwave-architectural-vistas` for a facilitator to draw one process's Event Storming with two
or three people and export it to ZFL with one button. It closes the first stage of the
[lifecycle](../architecture/zenwave-platform.md#zp-lifecycle): today the gap between the workshop and
the first model that compiles is slow and loses information on the way.

**Status:** brief, 2026-10-18; nothing built. Translated from the original Spanish on 2026-10-30, kept
in git history. Note the
architecture diagram it embedded was not in the file. Its place in the platform was changed by
[decision 0019](../decisions/0019-event-storming-board-is-a-vistas-app.md) on 2026-10-30, and the sections
on architecture, web mode and technology were adjusted to match; the rest is still the brief. The mapping
to ZFL is provisional and should be defined against the
[real grammar](../dsl-kotlin/parser-architecture-and-contracts.md).

## Scope

**In v1**

- A single-user board with typed notes and arrows.
- A palette on the right and a detail panel per note.
- Saved to a JSON file in the repository.
- Export to ZFL, with diagnostics.
- Works in desktop and web VS Code.

**Out of v1**

- Real-time multi-user editing. For two or three people, a driver and a shared screen are enough.
- Big picture. v1 is process level.
- Importing ZFL back into the board.
- Licensing. This version is not meant to be licensed. A later, advanced version might be.

## Design principles

The board is the source of truth during the workshop, and ZFL is an export, not a sync. The reason is
practical: a workshop's state is messy, with unsorted notes, half-finished branches and hot spots, and
valid ZFL does not tolerate that.

1. **Board first, ZFL after.** The export does not come back. Whoever edits the ZFL by hand afterwards
   is working elsewhere.
2. **Export with diagnostics.** The button generates what it can and warns about what is missing. An
   export that fails outright is discouraging.
3. **Open formats.** Documented JSON and ZFL. Any client can take their data and close the program.
4. **Local first.** A file in the repository, no server.
5. **The driver rules.** Input speed matters more than the diagram's beauty.

## Architecture

The board is a page built by an app in `zenwave-architectural-vistas`, beside `apps/eventflow-webview`.
There is no extension of its own: an IDE host embeds the page, as it does the EventFlow page. In VS Code
that is the ZenWave extension, with a custom editor over a JSON file
([decision 0010](../decisions/0010-rendered-views-are-custom-editors.md)) and a pure export engine.

The page only shows and edits. Each change travels by message to the extension host, which applies
it as a document edit. That way undo, save, git and external changes work with no extra effort, and the
page is rebuilt from the document when needed.

## Reusing the read-only view

The board reuses the view that `packages/eventflow` already provides. What that gives and what it does not,
checked in the code on 2026-10-30:

- **It has** React Flow, plus node components for events, commands and policies, and groups for systems and
  services.
- **It lacks** components for actors, aggregates, read models, external systems and hot spots.
- **It cannot** create nodes or arrows: `nodesConnectable` is false. It can move them, because `editable` is
  on in the page. Read-only there means nothing goes back to the host.
- **It expects** a positioned `FlowViewModel`, while the board's data is its own JSON.

So the palette, the arrows, inline editing and the detail panel are new. How to share the rest is
[ES-Q7](#es-q7).

## Canvas and palette

The canvas is React Flow in the page, with the palette fixed on the right. Each palette item has its
legend colour and is dragged onto the canvas.

**Note types in v1:** event (orange), command (blue), actor, policy (lilac), aggregate (yellow), read model
(green), external system (pink) and hot spot (red). The colour legend is fixed and always visible. Without
it the export cannot be parsed.

**Arrows and groups.** The timeline runs left to right, but an explicit arrow carries the exact flow. It is
created by dragging from a note's edge and may carry a short label such as "if it fails" or "retry". A group
is a container for a system or context, and notes inside inherit which system they belong to.

**Driver shortcuts**

- Enter or double click edits the selected note's name.
- Tab creates the next note connected to the right and leaves the cursor in it.
- Lasso for multiple selection. Undo and redo are VS Code's.
- An "Arrange" button runs automatic layout with ELK. It does not run on its own, so as not to move what the
  driver placed.

## Editing: inline and in the detail panel

The name is edited inline on the note and everything else in a detail panel on the right. The name gets
touched a hundred times in a workshop and can't cost an extra click, but a description is long text and
fields have types.

When a note is selected, the panel appears under the palette. A required field left empty is marked red with
the same message that later appears in the Problems panel.

| Type | Detail panel fields |
| --- | --- |
| Event | Name (past tense), description, system (inherited from group), free-text payload |
| Command | Name (imperative), actor, description, system |
| Policy | Name, **required description**, triggering events and issued commands (both derived from arrows) |
| Aggregate | Name, description, system |
| Read model | Name, description, who queries it |
| External system | Name, description |
| Actor | Name, role |
| Hot spot | Question, state (open or resolved), notes |

A policy's description goes to the JavaDoc of the ZFL block, which is why it is required, written in light
Markdown. It is optional elsewhere.

## Data model

The file is documented JSON, with nodes, edges and groups in maps keyed by id. That shape gives clean git diffs
and leaves the door open to Yjs, where each map becomes a `Y.Map` with no redesign.

```json
{
  "version": 1,
  "title": "Limited edition checkout",
  "groups": {
    "g_storefront": { "name": "Storefront", "x": 0, "y": 0, "w": 900, "h": 400 }
  },
  "nodes": {
    "n_01": { "type": "event", "name": "Cart Submitted", "group": "g_storefront", "x": 120, "y": 80 },
    "n_02": { "type": "policy", "name": "Reserve copy on submit", "description": "When the cart is submitted, a numbered copy is reserved.", "x": 320, "y": 80 }
  },
  "edges": {
    "e_01": { "from": "n_01", "to": "n_02", "label": "" }
  }
}
```

- Ids are stable and short. An array index is never an identity.
- Keys are always written in the same order, so a git diff reads well.
- `version` allows migrating old files.
- Positions go in the same file because the board is the source. If they dirty the diffs, they can move to a
  separate file without changing the model.
- If there is ever a live view, note order will use fractional indexes, not position.

## Export to ZFL with diagnostics

The button exports what it can and publishes what is missing in VS Code's Problems panel. A command,
`ZenWave: Export board to ZFL`, writes the `.zfl` next to the board file.

**Provisional mapping**, to be tested with two or three Arcadia processes before building anything else:

| Board | ZFL |
| --- | --- |
| Policy | `when` block with its input events |
| Command issued by a policy | A call (`call`, or `async call` if asynchronous) |
| Resulting event | `emits`, grouped with `@outcome` when there are branches |
| Policy description | The block's JavaDoc |
| Failure branch with compensation | `@compensates` and `compensatedBy` |

**Diagnostics** use VS Code's diagnostic collection. Each message points at a note, and the webview outlines it.

- Error: a command with no actor, a policy with no input event, a policy with no description.
- Warning: an event with no system, an unconnected note, an open hot spot.
- What cannot be resolved appears in the ZFL as a `TODO` comment. Nothing is silently left out.

**Implementation.** A pure Kotlin Multiplatform function: board JSON in, ZFL text and a list of diagnostics out.
Tested with reference files, without opening VS Code. Export is one way.

## Web mode and constraints

The ZenWave extension already runs on desktop and web ([host capabilities](../zenwave-platform-vscode/host-capabilities.md)).
The board must keep that true by depending on nothing desktop-only
([decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md)).

- **No Node.** The host side runs in a web worker, with no `fs` or child processes.
- **Files through `vscode.workspace.fs`**, so it works on repositories open in vscode.dev or github.dev.
- **The export needs no CLI.** It can't call ZenWave's JBang CLI, so the logic is Kotlin Multiplatform
  compiled to JS.
- **Page.** React and React Flow built by the vistas app, served the same on both.
- **Layout.** `elkjs`, in its web worker variant. [Decision 0001](../decisions/0001-layout-stays-on-the-server.md)
  puts the layout of a model on the server; a board is not a model and has no server.
- **Tests.** Normal desktop tests plus `@vscode/test-web`.

## Technology

| Layer | Choice | Why, and what's rejected |
| --- | --- | --- |
| Editor | VS Code Custom Text Editor over a JSON file | Undo, save, git and external changes work with VS Code. A binary editor of its own is rejected |
| Canvas | React Flow, the library `packages/eventflow` already uses | Own nodes with fields, edges, dragging from a palette. Excalidraw and tldraw lean to free drawing, without typed notes |
| Automatic layout | elkjs | What EventCatalog uses, and it runs in a web worker |
| Detail panel | React with CSS over VS Code theme variables | Inherits light and dark with no extra library |
| Export logic | Kotlin Multiplatform compiled to JS | Same stack as the rest of ZenWave, testable without VS Code |
| Packaging | A Vite app in the vistas, like `apps/eventflow-webview` | The ZenWave extension embeds the built page, with no packaging of its own |
| Shared state (later) | Yjs | Only if real sessions ask for simultaneous editing. Out of v1 |

## Milestones

Milestones 1 to 4 are in the order of a few focused weeks, an unmeasured estimate. Milestone 4 decides whether the
rest is worth it.

1. **Skeleton.** The vistas app, embedded in a custom editor of the ZenWave extension, with JSON save. Exit: create two notes, connect, save, close and
   reopen losing nothing.
2. **Palette and types.** Eight note types, the legend, groups. Exit: draw a complete Arcadia process.
3. **Detail panel and shortcuts.** Inline editing, typed fields, Tab to chain notes. Exit: a driver writes the process
   touching the mouse no more than needed.
4. **Export to ZFL with diagnostics.** Mapping against the real grammar, Problems panel. Exit: an Arcadia process comes
   out as ZFL that compiles.
5. **Web mode.** Tried on vscode.dev.
6. **Real sessions.** Three sessions, with the metric below.

**Later, only if sessions ask for it:** a read-only live view for other participants over a websocket; multi-user editing
with Yjs; importing ZFL; big picture; the same renderer for Domain Storytelling, with a different grammar.

## Metric, risks

**Metric:** hours between the end of a session and the first ZFL that compiles. If it falls to a few hours, there is a
commercial argument that doesn't depend on the board.

- **The note-to-ZFL mapping loses information or forces a style.** Test with two or three Arcadia processes before polishing
  the canvas.
- **A keyboard is slower than paper in a workshop.** Try with a real facilitator before adding features.
- **Webview state is lost when hidden.** The document is the source and the webview is rebuilt from it.
- **The moat is thinner than it seems.** A board can be copied. The value is in the method, the processes already modelled and
  the integrated chain through to the SDK.

## Open questions

<a id="es-q1"></a>**ES-Q1.** Does the detail panel stack under the palette, or use tabs?

<a id="es-q2"></a>**ES-Q2.** Are a policy's triggers and actions derived from arrows, or explicit fields?

<a id="es-q3"></a>**ES-Q3.** What happens to hot spots on export: comments in the ZFL, or only a report?

<a id="es-q4"></a>**ES-Q4.** One file per process, or per bounded context?

<a id="es-q5"></a>**ES-Q5.** What file extension, for example `.esboard.json`?

<a id="es-q6"></a>**ES-Q6.** Is the whiteboard part of the platform, or a separate tool? Answered 2026-10-30: part of the platform,
as an app in the vistas, and not licensed at first. See [decision 0019](../decisions/0019-event-storming-board-is-a-vistas-app.md).

<a id="es-q7"></a>**ES-Q7.** What exactly does the board share with the read-only view: the node components and styles only, or the
visualizer itself with an editing mode? This also decides whether a shared package is extracted, and whether the EventFlow
page has to change.

<a id="es-q8"></a>**ES-Q8.** Where does the export engine live? The vistas [do not own language semantics](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md),
which points at `dsl-kotlin`.

<a id="es-q9"></a>**ES-Q9.** Is IntelliJ a host in v1? The EventFlow page runs there too, but the brief only considers VS Code.
