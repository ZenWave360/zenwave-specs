# ZFL Mermaid Preview and EventFlow controls — design brief

> **Superseded 2026-10-29.** Split into [flows/zfl-mermaid-preview](../flows/zfl-mermaid-preview.md) and [flows/eventflow](../flows/eventflow.md). Kept as the original brief; do not edit.

## Status

**Exploration and design.** This is the working document for agreeing on the
feature before creating OpenSpec changes or implementation tasks. It describes
intent and verified current behaviour; it is not yet a delivery commitment.

## Goal

Make the diagrams already produced by the ZenWave language tooling easy to use
inside VS Code:

1. Give a ZFL document a read-only Mermaid preview that can be opened beside
   its text or in the text editor's place.
2. Let the user choose how ZFL sequence variants are rendered and which
   available diagram to see.
3. Put EventFlow's diagram controls in the shared EventFlow webview application
   so the VS Code and IntelliJ integrations use the same visual application.

The aim is not to teach the VS Code extension what a ZFL model means. It hosts
representations produced by upstream tooling and presents user controls for
choosing between them.

## Product vocabulary

| Term | Meaning |
| --- | --- |
| **ZFL preview** | A read-only visual editor for one ZFL document, rendering Mermaid representations returned by the language server. |
| **Preview to the side** | Open that same preview editor in an adjacent VS Code editor group while leaving the text editor open. |
| **Preview here** | Open that same preview editor in the current editor group, replacing the text tab when VS Code can safely do so. |
| **Render mode** | The method used by upstream to render sequence variants: `Alt blocks` or `Separate variants`. |
| **Diagram** | One representation returned by the language server: the flowchart or a sequence diagram for an outcome. |
| **EventFlow** | The separate, interactive React/React Flow visualization supplied by `@zenwave360/vistas-eventflow-webview`. It is not the Mermaid preview. |

## Verified current foundations

### Language server

`zenwave-lsp` already implements `zenwave/preview`.

- For **ZDL**, it returns a single Mermaid `classDiagram` representation.
- For **ZFL**, it returns an ordered list:
  1. `flowchart`
  2. one `sequence:<outcome>:<index>` Mermaid representation per end outcome
- It accepts `sequenceRenderMode` values `ALT_BLOCKS`, `SEPARATE_VARIANTS`, and
  `AUTO`. Omitting it currently uses `ALT_BLOCKS`.
- It sets `defaultRepresentationId` to the first sequence representation when
  one exists, otherwise to the flowchart. The existing fixture identifies this
  first sequence as `sequence:completed:0`.

The diagrams are generated upstream using `dsl-kotlin`'s `dsl-views` package.
This is important: no Mermaid source should be generated, interpreted, or
reimplemented in the VS Code extension.

### VS Code extension

The extension already has:

- a typed `requests.preview(uri, sequenceRenderMode?)` LSP wrapper;
- a ZFL EventFlow custom editor that is document-bound, refreshes when its
  document changes, and can open beside or replace text;
- the common active-document logic needed for commands invoked from a text or
  custom editor;
- an EventFlow bundle copied from the architectural-vistas package and pinned
  through a versioned webview protocol.

It does **not** yet have a model/Mermaid preview custom editor or a bundled
Mermaid renderer.

### EventFlow visualizer

The upstream EventFlow React components already use React Flow controls,
including normal pan, zoom, and fit-view interaction. The currently bundled
webview receives its initial view mode from its host, but does not provide the
agreed shared application toolbar for switching `Flow` and `Systems` itself.

## Agreed ZFL preview behaviour

### One preview, two placements

The feature is one custom preview editor, bound permanently to the ZFL document
for which it was opened.

- **Preview to the side** and **Preview here** show the same UI and state.
- The only difference is placement in VS Code's editor groups.
- A preview never follows the active editor or silently changes to another ZFL
  document.
- The preview stays read-only; editing remains in the ZFL text editor.

### Minimal viable user interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Render mode  [Alt blocks ▾]       Diagram  [Sequence: … ▾]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    Rendered Mermaid SVG                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The header holds two selectors:

1. **Render mode**
   - `Alt blocks`
   - `Separate variants`
2. **Diagram**
   - every representation supplied by the language server, in server order;
   - normally a `Flowchart` followed by one `Sequence: …` option per outcome.

The header should remain compact. A selector that has no meaningful choice
(for example, one available diagram) may be hidden, but the server remains the
source of the list, labels, ordering, and default selection.

### Initial selection

The preview opens on the language server's `defaultRepresentationId`.

For current ZFL answers this is the first sequence/happy-path diagram, not the
flowchart. This fulfills the product decision that the first happy-path diagram
is the initial view while retaining the flowchart as a selectable diagram.

### Selection after an edit or mode change

- Editing a document refreshes the preview after a short debounce and keeps the
  last good diagram visible while a new representation set is requested.
- Switching **Render mode** makes a new `zenwave/preview` request using the
  chosen mode.
- When the new response arrives, the preview keeps the selected diagram if it
  is still available.
- It first tries the exact representation id. If the mode has changed IDs but
  still supplies the same outcome, it may retain the matching outcome without
  inferring any model meaning beyond the server's representation identifiers.
- If no matching diagram exists, it selects the server's
  `defaultRepresentationId` (currently the happy-path sequence).

The same fallback rule applies after editing removes the selected outcome.

## Rendering and safety principles

- Mermaid renders locally from assets included in the extension; no remote
  rendering service, Java process, network request, or extra VS Code extension
  is required.
- The preview follows VS Code's light/dark theme and supports ordinary text
  selection and copy.
- Server content is treated as data. Mermaid is rendered in the preview
  webview under a restrictive content-security policy. Future Markdown or HTML
  representations require sanitisation and must not execute scripts or load
  remote resources.
- A malformed Mermaid representation reports an understandable rendering error
  without blanking unrelated UI.
- Absence of a language server, an unsupported preview request, and a document
  that cannot be read are distinct explained states, not empty output.

## EventFlow application direction

### Ownership

The EventFlow application and its controls belong in
`zenwave-architectural-vistas`, specifically the shared EventFlow webview app.
They must not be recreated as a VS Code-only DOM wrapper.

The VS Code extension is responsible for:

- opening and hosting the versioned webview bundle;
- obtaining and forwarding opaque EventFlow view models from the language
  server;
- displaying host-level failures (for example, unavailable language server or
  incompatible webview protocol).

`zenwave-architectural-vistas` is responsible for:

- the in-app toolbar and interactive visualization behaviour;
- visual consistency across IntelliJ and VS Code;
- any new versioned message protocol required for host-driven controls.

### Intended shared toolbar

The EventFlow application should expose its controls inside the diagram page,
not only as VS Code editor-title commands. The minimum intended experience is:

```
┌─────────────────────────────────────────────────────────────────┐
│ View  [Flow] [Systems]                 [−] [+] [Fit] [Focus…]  │
├─────────────────────────────────────────────────────────────────┤
│                    Interactive EventFlow canvas                 │
└─────────────────────────────────────────────────────────────────┘
```

- **View:** `Flow` / `Systems`.
- **Zoom and Fit:** use the visualization's native React Flow behaviour.
- **Focus:** needs a precise user-facing definition before it is specified. It
  may mean fitting the full diagram, centering the current selection, or
  focusing a node/group supplied by the host. These are different contracts.

The existing VS Code title-bar commands for Flow/Services may remain as
compatibility accelerators during migration, but the shared in-app toolbar is
the desired primary control surface.

## Repository and contract boundaries

| Concern | Owner | Notes |
| --- | --- | --- |
| Mermaid diagram content, outcome ordering, default representation | `dsl-kotlin` / `zenwave-lsp` | Already available through `zenwave/preview`. |
| ZFL preview custom editor, placement commands, lifecycle, local Mermaid rendering | `zenwave-platform-vscode` | Local VS Code feature. |
| EventFlow renderer and toolbar | `zenwave-architectural-vistas` | Shared visual app, not an IDE-specific copy. |
| Additional EventFlow webview messages | shared `zenwave-specs` contract, then `zenwave-architectural-vistas` | Needed only when controls require host ↔ page communication beyond today. |

## Open questions for the next design pass

1. **Focus semantics for EventFlow:** what should `Focus` do exactly?
   - fit the complete diagram;
   - center the selected node/group;
   - focus a semantic item selected in the VS Code explorer; or
   - another behaviour.
2. **EventFlow state persistence:** should its selected view and viewport be
   restored per document, per editor tab, or reset on opening the diagram?
3. **Preview header controls:** should ZDL use the same header shell when it has
   only one class diagram, or should that header disappear completely?
4. **Representation matching:** the existing IDs encode outcome plus index.
   Confirm whether matching the exact id, then the outcome portion, is stable
   enough across `ALT_BLOCKS` and `SEPARATE_VARIANTS`, or whether the LSP should
   expose a dedicated stable representation identity.
5. **Scope of the first delivery:** should the first implementation include only
   ZFL Mermaid representations, or also ship the already-supported ZDL class
   diagram in the same preview editor?

## Proposed path from this brief to implementation

1. Iterate on this document until the remaining UX choices are explicit.
2. Create local OpenSpec deltas for the VS Code preview behaviour.
3. If EventFlow needs new host/page messages, create a shared-store contract
   proposal, then an architectural-vistas change implementing the shared UI.
4. Implement in small slices:
   - preview editor shell and lifecycle;
   - local Mermaid rendering and error states;
   - render-mode and diagram-selection behaviour;
   - EventFlow toolbar/protocol work upstream, followed by the pinned bundle
     update in this extension.
5. Verify in both desktop VS Code and the browser host.
