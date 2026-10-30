# EventFlow

<a id="eventflow"></a>

How a ZFL flow becomes an interactive diagram in an IDE, and how the user gets
from a node in that diagram back to the code that defines it.

One document covers the whole chain on purpose: the visual app, the language
server and the IDE host each own a piece, and the interesting rules are the ones
that cross the seams.

**Status:** draft, 2026-10-29, checked again 2026-10-30: the page still has no toolbar and no outbound node messages. Rules marked *exists* describe verified current
behaviour. Rules marked *proposed* are what we want and have not agreed or built.

## 1. Scope

In scope: viewing a ZFL flow and a service map; the controls on the page; the
actions a user can take on a node (select, open its code, show it elsewhere); the
messages between page and host; the data the language server supplies.

Out of scope: how a flow is *laid out* (the server does it, see
[decision 0001](../decisions/0001-layout-stays-on-the-server.md)); how Mermaid
previews work (see [model preview](../zenwave-platform-vscode/model-preview.md)); editing a model
from the diagram (a round trip into ZFL is its own contract and not wanted yet);
the Event Storming whiteboard.

## 2. Who owns what

| Piece | Repository | Owns |
| --- | --- | --- |
| View models and layout | `dsl-kotlin` | `FlowViewModel`, `ServiceViewModel`, positions, node ids, source references |
| Requests and destinations | `zenwave-lsp` | `zenwave/eventFlowViews`, hierarchy, `zenwave/symbolAt`, resolving *where a node's code is* |
| Renderer | `zenwave-architectural-vistas`, `packages/eventflow` | React Flow drawing, node components, the context menu, the toolbar |
| Page | `zenwave-architectural-vistas`, `apps/eventflow-webview` and `packages/eventflow-webview` | The built page, its message protocol, its version |
| VS Code host | `zenwave-platform-vscode`, `src/eventflow/` | Hosting the page, forwarding view models, performing the actions the page asks for |
| IntelliJ host | `ZenWaveDomainModelEditor` | Same role, over JCEF |

The page never learns what a flow *means* and never decides where code lives. The
host never learns how a flow is drawn. The server is the only party that knows the
model, so it is the only one that can say what a node points at.

## 3. How it works today (verified 2026-10-29)

<a id="ef-t1"></a>
**Data path.** (Request details in [lsp-visualization-requests](lsp-visualization-requests.md).) The server answers `zenwave/eventFlowViews` for an open ZFL
document with `{ flowGraph, serviceGraph }`, already laid out. The host forwards
both unchanged in a `renderBundle` message.

<a id="ef-t2"></a>
**Messages.** (Full wording in [eventflow-webview-protocol](eventflow-webview-protocol.md).) Page to host: `webviewReady` with the protocol name and version.
Host to page: `renderBundle`, `setViewMode`, `setDisplaySettings`, `highlightNode`,
and a legacy `renderGraph`. Unknown messages are ignored. Messages sent before the
renderer starts are queued. Full table in the package README of
`@zenwave360/vistas-eventflow-webview`.

<a id="ef-t3"></a>
**Source references.** Each flow node carries `sourceRef` with `file`, `line` and
`column`. That is a *point*, not a range. Whether `file` is a path or a URI the IDE
can open directly has not been checked.

<a id="ef-t4"></a>
**Matching with the tree.** Hierarchy nodes carry `viewNodeIds`, the ids of the
diagram nodes standing for the same concept. Ids look like `command:<name>`,
`event:<name>`, `policy:<triggers>:<command>`, `group:<System>><Service>`. This is
how a selection in the Model tree becomes a `highlightNode`.

<a id="ef-t5"></a>
**Hierarchy nodes point at the declaring document.** A system, service or command
whose flow annotates a ZDL carries that ZDL's `sourceUri` and `sourceRange`. So
the ZDL destination already exists for the tree; it does not yet exist for the
diagram's nodes.

<a id="ef-t6"></a>
**What the page cannot do.** The React component takes an `onNodeClick(nodeId,
sourceRef)` callback, but the built page registers nothing and sends nothing to
the host on a click. The `editable` flag defaults to true, so nodes can be dragged
today; what happens to a moved position is undefined (see EF-Q7).

## 4. Rules

### Reading the diagram

<a id="ef-r1"></a>
**EF-R1 (exists). The host sends a model; the page draws it.** The page renders
what it is given, accepts messages before it is ready, switches view without the
model being resent, and shows a waiting state, never an empty diagram, when a view
has no model.

<a id="ef-r2"></a>
**EF-R2 (exists). The page is self-contained and versioned.** It loads under a
strict content security policy with no remote resources, states its protocol
version in a place a host can read without running it and in `webviewReady`, and
ignores messages it does not know. The version changes only for changes a host
cannot ignore. See [decision 0003](../decisions/0003-protocol-version-is-separate-from-package-version.md).

<a id="ef-r3"></a>
**EF-R3 (proposed). The page owns its controls.** View (Flow, Systems), zoom,
fit and focus live in a toolbar inside the page, so IntelliJ and VS Code show the
same thing. A host may still send `setViewMode` for its own commands; both routes
end in the same state.

### Acting on a node

<a id="ef-r4"></a>
**EF-R4 (proposed). The page does not know where code is.** It receives, per node,
the list of actions that are available, and offers exactly those. A node with no
destination for "open ZDL" does not show "open ZDL". An action that cannot work is
absent, not greyed out and not failing. See
[decision 0004](../decisions/0004-node-actions-are-declared-by-the-host.md).

<a id="ef-r5"></a>
**EF-R5 (proposed). The page reports intent, the host acts.** Clicking, double
clicking or choosing a menu entry sends the host the node id and the action id.
Opening a file, moving the cursor and revealing in a tree are the host's work,
done the way that IDE does them.

<a id="ef-r6"></a>
**EF-R6 (proposed). Well-known actions.** These ids mean the same in every host.

| Action | Meaning | Available when |
| --- | --- | --- |
| `open-zfl` | Open the ZFL text at the node's definition | the node has a source reference |
| `open-zdl` | Open the ZDL declaration the node refers to | the server resolves a ZDL location for it |
| `open-asyncapi` | Open the AsyncAPI definition of an event or command | the server resolves one (see EF-Q3) |
| `reveal-in-model` | Select the matching node in the host's Model tree | the node has a hierarchy counterpart |
| `focus` | Centre the diagram on the node and highlight it | always |

A host may add its own actions with ids it namespaces. A page that meets an action
id it does not know still shows the entry under the label it was given.

<a id="ef-r7"></a>
**EF-R7 (proposed). The default action.** Double click on a node runs the first
available of `open-zfl`, nothing otherwise. Single click selects and tells the host
about the selection, so the host can sync its tree.

<a id="ef-r8"></a>
**EF-R8 (proposed). Labels come from the host.** The page needs no strings for
actions it has never heard of, and the host knows its own vocabulary ("Go to
Definition", "Reveal in Explorer").

<a id="ef-r9"></a>
**EF-R9 (proposed). A failed action says so.** If the host cannot open what was
asked (the file is gone, the server is down), the user is told by the host. The
page does not retry and does not assume success.

<a id="ef-r10"></a>
**EF-R10 (proposed). Additions keep the protocol version.** New message types and
new optional fields do not change `protocolVersion`. A host that has not been
updated simply never sends the new messages, and the page behaves as today.

## 5. Proposed messages (draft)

Names are provisional. They follow the existing conventions: a `type` string and a
`payload` object.

Page to host:

```json
{ "type": "nodeSelected", "payload": { "nodeId": "command:ReserveCopy" } }
{ "type": "nodeAction",   "payload": { "nodeId": "command:ReserveCopy", "actionId": "open-zdl" } }
```

Host to page:

```json
{ "type": "setNodeActions", "payload": { "actions": {
    "command:ReserveCopy": [
      { "id": "open-zfl", "label": "Go to ZFL" },
      { "id": "open-zdl", "label": "Go to ZDL" }
    ]
} } }
```

`setNodeActions` can be sent whenever the answer changes, for example after the
server resolves destinations that were still loading. Nodes missing from the map
have no actions.

The example only shows the shape. Whether one map for the whole model is the right
size, or actions are fetched when a menu opens, is EF-Q5.

## 6. Where the data comes from

For a node to offer an action, someone has to have resolved its target:

| Action | Source today | Gap |
| --- | --- | --- |
| `open-zfl` | `sourceRef` on the node | confirm it is openable and whether a point is enough (EF-Q4) |
| `open-zdl` | hierarchy node `sourceUri` / `sourceRange` | join hierarchy and diagram through `viewNodeIds`; diagram nodes have no ZDL location of their own |
| `open-asyncapi` | none found | needs an owner (EF-Q3) |
| `reveal-in-model` | `viewNodeIds` | none |
| `focus` | page only | none |

The host does the join. For each diagram node it looks at the hierarchy counterpart
and builds the action list from what the server gave it. If the server learns to
return destinations directly, the host's join gets smaller; the page does not
change.

## 7. Per host

**VS Code.** The EventFlow custom editor already exists, is bound to its
document, and relays `eventFlowViews` verbatim. It would additionally: build
`setNodeActions` from the server's answers, handle `nodeAction` by opening
locations through the existing navigation code, and tell the user when something
cannot be opened. Capabilities decide which actions exist: no language server, no
destinations. The browser host has no `zenwave-sdk`, but this feature does not
need it.

**IntelliJ.** Same contract over JCEF. It talks to the model in process rather
than over LSP, so the join in section 6 happens against its own APIs. The page
must not need to know which.

## 8. Open questions

<a id="ef-q1"></a>
**EF-Q1. What does Focus do?** Fit the whole diagram, centre the selection, or
focus the node the host's tree has selected? These are different contracts. The
`focus` action in EF-R6 assumes the second.

<a id="ef-q2"></a>
**EF-Q2. What survives closing and reopening?** Selected view and viewport: per
document, per tab, or reset?

<a id="ef-q3"></a>
**EF-Q3. Where does the AsyncAPI destination come from?** Nothing in the view
model or the hierarchy refers to an AsyncAPI file. Options: the manifest knows
which AsyncAPI an event belongs to and the server resolves it; or a ZDL/ZFL
annotation names it. Needs an owner in `zenwave-architecture` or `dsl-kotlin`.

<a id="ef-q4"></a>
**EF-Q4. Is a point enough?** `sourceRef` gives line and column. Opening a file at
a position works; selecting the whole declaration would need a range.

<a id="ef-q5"></a>
**EF-Q5. One map or on demand?** Sending actions for every node up front is simple
and may be large for a big model. The alternative is the page asking the host when
a menu opens, which needs a request-and-reply on the message channel.

<a id="ef-q6"></a>
**EF-Q6. Native or page-rendered context menu?** A page-rendered menu works the
same in both IDEs. VS Code's native menu (`data-vscode-context`, `webview/context`)
looks right there and nowhere else. The draft assumes page-rendered.

<a id="ef-q7"></a>
**EF-Q7. Moving and resizing.** The server owns layout. If a user drags a node,
the new position is presentation only: kept for the session, lost on refresh, or
saved somewhere? Decide before anyone promises "move things around".

<a id="ef-q8"></a>
**EF-Q8. Are node ids stable across edits?** Ids like `command:<name>` change when
a name changes. For selection and `highlightNode` that is fine; for any stored
state (EF-Q2, EF-Q7) it is not.

## 9. Sources

Facts in section 3 come from reading, on 2026-10-29:

- `zenwave-architectural-vistas/packages/eventflow-webview/README.md`
- `zenwave-architectural-vistas/packages/eventflow/src/EventFlowVisualizer.tsx`
  and `types/FlowViewModel.ts`
- [visualization requests](lsp-visualization-requests.md#wire-reference) (requests, hierarchy and `viewNodeIds`) and the [webview protocol](eventflow-webview-protocol.md)
- [VS Code client architecture](../zenwave-platform-vscode/architecture.md)
