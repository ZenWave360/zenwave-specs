# Model Explorer

<a id="model-explorer"></a>

**Status:** 2026-10-30: 7 exists, 1 partial. Each rule says which. Amended 2026-11-10 (the architecture navigator, [phase 1](../work/backlog.md#architecture-navigator)): [ME-R2](#me-r2) grows and [ME-R3](#me-r3) and [ME-R9](#me-r9) widen; the new parts are marked *proposed* inside them. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Give the workspace's architecture and the model in front of the user a navigable
shape — two trees in their own place in the sidebar, built from what the language
server knows rather than from what a single file happens to say.

## Rules

<a id="me-r1"></a>
### ME-R1 (exists). ZenWave has its own place in the sidebar

The extension SHALL contribute a ZenWave container to the activity bar, holding
an `Architecture` tree and a `Model` tree, reachable whether or not a model
document is open.

**Examples**

- *Finding the trees.* Given a workspace with ZenWave models, when the user looks at the activity bar, then there is a ZenWave entry, and opening it shows the architecture and model trees.
- *A workspace with nothing ZenWave in it.* Given a workspace containing no models and no architecture manifest, when the user opens the ZenWave container, then each tree explains what is missing rather than showing an empty box.

<a id="me-r2"></a>
### ME-R2 (partial). The workspace architecture is browsable without opening a file

*State: The domain and subdomain tree works. In the browser it needs the manifest opened once, and a saved edit needs a restart ([LVR-R12](../flows/lsp-visualization-requests.md#lvr-r12)). The paragraphs marked proposed below (services, the three groups, lazy loading, Refresh, Open Architecture Manifest…, a manifest that is a URL) are the architecture navigator of 2026-11-10 and are not built.*

The architecture tree SHALL present the workspace's architecture manifest as a
hierarchy, and SHALL populate as soon as the user opens it, without requiring
them to open a document first.

**Examples**

- *Exploring an architecture before opening anything.* Given a workspace whose architecture manifest declares domains and subdomains, when the user opens the ZenWave container with no editor open, then the architecture tree shows those domains and their subdomains.
- *An architecture spread across repositories.* Given a workspace whose architecture manifest lives in one repository and whose models live in others, opened as separate folders, when the user opens the architecture tree, then it shows that workspace's one architecture, regardless of which folder the user last had open.
- *A workspace with no manifest.* Given a workspace with model files but no architecture manifest, when the user looks at the architecture tree, then it says no architecture manifest was found and points at how to configure one, rather than appearing broken.
- *The manifest is edited.* Given the architecture tree showing a manifest's contents, when the user adds a domain to that manifest and saves it, then the tree reflects the new domain.

**Proposed, 2026-11-10 (architecture navigator, phase 1).** The tree is the one view `zenwave.architecture`; no new view is created.

*The hierarchy.* The tree SHALL go from domains to subdomains to services. Each service, and each domain or subdomain that declares them directly, SHALL have three groups as children, each shown only when it has something to show:

- **Artifacts**: one node per artifact, with an icon by its `type` (`zdl`, `zfl`, `asyncapi`, `asyncapi-client`, `openapi`; any other type gets a neutral icon, [ME-R6](#me-r6)). The label is the artifact's path and the description its version, as `openapi.yml · 0.1.0`.
- **Docs**: one node per `docs` key, labelled by the key (`changelog`, `summary`).
- **Consumers** (preliminary): one node per entry of `consumers`, shown as the manifest writes it (`catalog.orders.order-service#asyncapi`) and not interpreted. Selecting one does nothing in phase 1; going to the service or artifact it names is later work.

*Opening.* Selecting an artifact or a document SHALL open it: as the plain local file when the server resolved it to a file in the workspace, and otherwise as a read-only `zenwave:` document ([AR-R4](../flows/architecture-resources.md#ar-r4), [LC-R6](lsp-client.md#lc-r6)). An entry that is a folder or contains a glob SHALL be shown disabled, marked "pending (phase 2)", and not hidden ([AR-R12](../flows/architecture-resources.md#ar-r12)).

*Lazy.* Building the tree SHALL fetch the manifest and nothing else: no artifact or document is fetched or checked for existence until the user opens it ([AR-R10](../flows/architecture-resources.md#ar-r10)). When an open fails in every source, the error SHALL list the candidate URLs that were tried ([AR-R6](../flows/architecture-resources.md#ar-r6)), and the node SHALL carry a warning icon until the next Refresh.

*Refresh.* The view title SHALL offer **Refresh**, which clears what was fetched during the session and reads the manifest again. A remote manifest is read-only, and Refresh is the only way to pick up its changes. Fetched content is otherwise kept in memory for the session.

*Choosing the manifest.* The view title and the no-manifest welcome content SHALL offer **Choose Architecture Manifest…**, which asks for *Local file…* or *URL…*. With a workspace folder open, the choice is written to `zenwave.workspace.manifest` at workspace scope, which already outranks `.zenwave/config.yml` ([LC-R5](lsp-client.md#lc-r5)), and the server restarts with the new manifest. With no folder, the choice is kept for the session in `workspaceState`. See [ME-Q1](#me-q1) for the name.

*Hosts.* The same behaviour SHALL work on the desktop and in web mode ([WE-R2](../roadmap/web-explorer.md#we-r2), [decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md)). In web mode the server reaches only `http(s)`, and whether the Arcadia manifest's content URLs allow it is [AR-Q5](../flows/architecture-resources.md#ar-q5).

**Examples (proposed)**

- *Browsing a service.* Given a manifest with service `catalog-products` declaring a ZDL, an AsyncAPI file, a `changelog` document and one consumer, when the user expands it, then Artifacts shows `domain-model.zdl · 0.0.0` and `asyncapi.yml · 0.0.0` with their type icons, Docs shows `changelog`, and Consumers shows the consumer string.
- *Opening costs one fetch.* Given a freshly shown tree, when the user opens `asyncapi.yml` of a service that is not checked out, then exactly that file is requested, and it opens read-only.
- *A file that cannot be reached.* Given an artifact no source can produce, when the user opens it, then the error lists the URLs tried, the node shows a warning, and it keeps showing it until the user presses Refresh.
- *A folder entry.* Given `docs: { adrs: "adrs/" }`, then the tree shows `adrs` disabled, saying "pending (phase 2)".
- *A manifest from the web.* Given an empty window, when the user chooses Open Architecture Manifest…, then URL…, and enters an `https` address, then the tree shows that manifest, and nothing was written to any settings file.
- *A manifest in a folder workspace.* Given an open folder, when the user chooses a local file, then `zenwave.workspace.manifest` is set at workspace scope, and the tree shows the new manifest after the restart.

<a id="me-r3"></a>
### ME-R3 (exists). The model tree follows the document the user is looking at

*Proposed, 2026-11-10: the tree becomes a general outline, see the paragraph after the examples and [ME-R9](#me-r9). The rule above it is unchanged for model documents.*

The model tree SHALL show the conceptual hierarchy of the model document the user
is currently working on, SHALL name that document, and SHALL keep following the
user when they move to another model document — including when the document is
being shown as a preview or as a diagram rather than as text. It SHALL NOT change
what it is showing when the user moves to a document that is already part of the
hierarchy on screen.

**Examples**

- *Opening a flow.* Given a `.zfl` file the user opens, when the model tree is visible, then it shows that flow's hierarchy, and names the document it is showing.
- *Moving to another model.* Given the model tree showing `place-order.zfl`, when the user focuses an editor holding `cancel-order.zfl`, then the tree shows `cancel-order.zfl`.
- *Looking at a diagram instead of text.* Given a flow being shown as a diagram, with no text editor focused, when the model tree is visible, then it shows that flow's hierarchy, exactly as it would for the text.
- *Working on something that is not a model.* Given the model tree showing a flow, when the user focuses an editor holding a Java file, then the tree keeps showing the last model, rather than emptying.
- *Drilling into the hierarchy.* Given the model tree showing a flow, whose systems are declared in a ZDL document the flow annotates, when the user selects one of those systems and the ZDL document opens, then the tree still shows the flow, with that system in it.
- *Deliberately moving to another model.* Given the model tree showing a flow, when the user opens a model document that is not part of that hierarchy, then the tree shows the newly opened document.
- *A model that cannot be read.* Given a model document with a syntax error and nothing shown yet, when the model tree is visible, then it says the document could not be read.

**Proposed, 2026-11-10 (architecture navigator, phase 1).** The Model tree SHALL follow any document the user is looking at, a text editor or a ZenWave preview, not only model documents. For a `zdl`, `zfl` or `.zw` document it behaves as above. For an OpenAPI, AsyncAPI or Markdown document, including a `zenwave:` one, it shows the symbols that `vscode.executeDocumentSymbolProvider` returns for it, from whichever installed extension provides them, and names the document. Those documents are never sent to the ZenWave server for this ([LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15), [AR-R8](../flows/architecture-resources.md#ar-r8)). Moving to a document with no symbol provider SHALL show that nothing provides an outline for it, not an empty tree. The "Working on something that is not a model" example keeps its meaning for files that are none of the above (a Java file).

- *An OpenAPI file.* Given a declared `openapi.yml` open as text with an OpenAPI extension that provides symbols, when the Model tree is visible, then it shows those symbols, and selecting one moves the cursor there.
- *Markdown.* Given a Markdown page, then the tree shows its headings.
- *No provider.* Given an AsyncAPI file and no extension providing symbols, then the tree says so.

**Why:** this is the scenario that rules out the standard Outline view.
With previews and diagrams as editors, the user is frequently not in a text
editor — and that is precisely when they are most likely to want the tree.

**Why:** the hierarchy spans documents by design — a flow's systems are
declared in the ZDL files it annotates. Navigating into one of those is drilling
into what the tree is showing, not leaving it, so retargeting there would make
the tree destroy its own context every time it was used. What counts as a change
of context is arriving somewhere the tree was not already describing.

<a id="me-r4"></a>
### ME-R4 (exists). The hierarchy reaches beyond the open document

The model tree SHALL present the hierarchy the language server derives, including
elements that are declared in other documents or inferred across the model, and
SHALL NOT be limited to what is written in the document being shown.

**Examples**

- *Systems declared elsewhere.* Given a ZFL flow that refers to a system whose services are declared in a ZDL file it annotates, when the model tree shows that flow, then the system and its services appear, even though they are not written in the flow document.
- *Commands derived across flows.* Given a ZFL document whose commands appear inside `when` blocks rather than under their service, when the model tree shows it, then each command appears under the service that handles it.

<a id="me-r5"></a>
### ME-R5 (exists). Selecting a node goes to what it stands for

Selecting a node SHALL reveal the source it comes from, in the right document and
at the right place. Where a node points at further resources, those SHALL be
reachable from it.

**Examples**

- *Navigating to a declaration.* Given the model tree showing a service, when the user selects it, then the document that declares it is opened, scrolled to the declaration.
- *Navigating to another file.* Given a node whose declaration lives in a different document from the one the tree is showing, when the user selects it, then that other document is opened at the declaration.
- *Reaching a related resource.* Given a node the server associates with other resources, such as the ZDL model a system is defined by, when the user asks for them on that node, then those resources are offered and can be opened.
- *Following the cursor.* Given the model tree open beside a model document, when the user moves the cursor into a declaration in the text, then the corresponding node is revealed in the tree.

<a id="me-r6"></a>
### ME-R6 (exists). The trees present what the server describes, in this client's vocabulary

The trees SHALL show a node under the name the server gives it, unless this
client has a better way to present that kind, SHALL choose icons and grouping
from the kind and the presentation hints, and SHALL show a node of a kind it does
not recognise rather than dropping it.

**Examples**

- *A node kind the client has icons for.* Given hierarchy nodes of several kinds — systems, services, commands, events, when the trees show them, then each kind is visually distinguishable.
- *A node kind released after the extension.* Given a server returning a node of a kind this extension does not know, when the tree shows it, then the node still appears, under the name the server gave it and with a neutral icon, rather than being dropped.
- *A kind this client presents its own way.* Given a kind for which this editor's conventions call for different wording from the name the server supplied, when the tree shows it, then it reads the way a VS Code tree reads, rather than the way the server wrote it.

**Why:** this is the opposite division from the view model in `004`, where
the server's titles bind. Here the name is a **usable default** — good enough to
show, never binding. An earlier wording said the client derives the label from
the kind, which contradicted every node carrying one and would have left an
unknown kind with nothing to show.

<a id="me-r7"></a>
### ME-R7 (exists). A tree selection is reflected in an open diagram

Where a diagram is open for the same document, selecting a node in the model tree
SHALL highlight the corresponding node in that diagram.

**Examples**

- *Locating a command in the diagram.* Given a flow open as a diagram, with the model tree beside it, when the user selects a command in the tree, then the matching node is highlighted in the diagram.
- *Clearing the selection.* Given a highlighted node in a diagram, when the user clears the selection in the tree, then the highlight is removed.
- *No diagram open.* Given the model tree with no diagram open for its document, when the user selects a node, then the navigation still happens, and nothing reports an error.

<a id="me-r8"></a>
### ME-R8 (exists). The trees explain themselves when they have nothing to show

Where a tree is empty, it SHALL say which of these is the case: no language
server available, the server does not support hierarchies, no manifest found, no
model document open, or the document could not be read. Where the user can act on
it, the tree SHALL offer the action.

**Examples**

- *No language server.* Given a host with no language server, when the user opens either tree, then it states that the trees need the ZenWave language server.
- *Nothing open yet.* Given a workspace with no model document open, when the user looks at the model tree, then it invites them to open a model file.
- *Diagnosing an empty tree.* Given a tree that is unexpectedly empty, when the user opens the ZenWave output channel, then the reason is recorded there.

<a id="me-r9"></a>
### ME-R9 (proposed). The model tree is the outline of a document or a preview, and its items can navigate

The built-in Outline follows the active text editor and offers no buttons per item, so it shows nothing while a preview or a diagram has focus. The model tree already follows those ([ME-R3](#me-r3)), and SHALL be
the view to use for them. Each of its items that stands for a declaration SHALL offer inline buttons for *Go to Definition* and *Go to References*, with the same results as those commands in a text editor. A button the server cannot answer SHALL be absent.

**Examples**

- *A preview in focus.* Given `orders.zdl` shown as Model Docs, when the user looks at the model tree, then it lists the document's concepts and each can open its definition without returning to the text first.
- *Nothing to reference.* Given a server that does not advertise references, when the user looks at an item, then it has no *Go to References* button.

**Proposed, 2026-11-10 (architecture navigator, phase 1).** The Model tree SHALL be the general outline: for the active document, or the ZenWave preview in focus, as [ME-R3](#me-r3) says. Its two sources are:

- **`zdl`, `zfl`, `.zw`:** the symbols and hierarchy come from the ZenWave server, and the tree and the ZenWave preview follow each other in both directions: scrolling or focusing in the preview selects the matching node, and selecting a node scrolls the preview to it, or moves the cursor when the text editor is the active one. The preview side of this is [MP-R35](model-preview.md#mp-r35).
- **OpenAPI, AsyncAPI, Markdown:** the symbols come from `vscode.executeDocumentSymbolProvider`, and the tree follows the text editor only. These documents have no ZenWave preview in phase 1.

The tree has no sibling view: a third outline view is not added.

**Examples (proposed)**

- *Scrolling the preview.* Given `orders.zdl` shown as Model Docs, when the user scrolls the preview to the section of an entity, then the entity is selected in the tree.
- *Choosing in the tree.* Given the same preview, when the user selects a service in the tree, then the preview scrolls to it.
- *The text editor.* Given `orders.zdl` as text, when the user selects a node, then the cursor moves to its declaration.
- *Not for OpenAPI.* Given an OpenAPI file, then selecting a symbol moves the cursor and nothing happens in a preview, because there is none.

## Design notes

**Why the tree does not simply follow the focused file.** A flow's tree contains systems declared in the
ZDL files it annotates. Selecting one opens that ZDL, so a tree that followed the focused file would throw away
what you were navigating. So the tree retargets only when the focused model document is not already part of the
hierarchy it is showing ([ME-R3](#me-r3)). The cost is one case: opening a ZDL that belongs to the current flow,
wanting its own hierarchy. An explicit pin is the escalation if this proves too clever.

**Why it is not the Outline.** `documentSymbol` is built from the same hierarchy, so the Outline shows much of this
for an open document. The Model tree earns its place with locations in other documents, related resources, diagram
highlighting and keeping its document while a webview has focus. Revisit if `documentSymbol` gains cross-document
locations.

**Empty states are `viewsWelcome`, not fake nodes.** `zenwave.architectureTreeState` and `zenwave.modelTreeState`
hold the reason: `no-server`, `unsupported`, `no-manifest`, `no-model`, `not-found`, `unreadable`, `empty`,
`failed`, `loading`, `ready`.

**A browser-hosted server cannot read the manifest.** It answers `documentNotFound` for an unopened `vscode-vfs:`
manifest. The tree says so once, with an *Open Architecture Manifest* action. It does not retry and does not open the
manifest itself.

**A document with syntax errors** gets a partial hierarchy, not `documentUnreadable`. The tree shows what it got and
says the document has errors.

**Selection into the diagram** sends a node's first `viewNodeIds` entry, or `null`, to every panel open for the tree's
document. The reverse, diagram to tree, needs the page to send a selection: [EF-R5](../flows/eventflow.md#ef-r5).

## Open questions

<a id="me-q1"></a>
**ME-Q1. Two actions named "Open Architecture Manifest".** `zenwave.explorer.openManifest` already exists and opens the
manifest document the client resolved (it is offered when the server could not read it, see *A browser-hosted server cannot
read the manifest* above). [ME-R2](#me-r2) asks for an action of the same name that lets the user choose a manifest. They do
different things. Proposal: keep the existing one as it is and give the new command another id and a palette title such as
*Choose Architecture Manifest…*, keeping "Open Architecture Manifest…" for the welcome link and the title bar if the owner
prefers. *Decided (owner, 2026-11-10):* the new action is **Choose Architecture Manifest…** everywhere; `zenwave.explorer.openManifest` keeps its name and behaviour.

<a id="me-q2"></a>
**ME-Q2. A tree node for an entry with no address.** [AR-Q3](../flows/architecture-resources.md#ar-q3): a document with no
inherited version cannot be addressed. The tree shows such an entry with a warning in phase 1. Whether that is right is for the
owner.

<a id="me-q3"></a>
**ME-Q3. An outline for OpenAPI and AsyncAPI without an extension.** An OpenAPI file shown with no extension registering a
symbol provider gives no outline. Whether the ZenWave server should ever offer one is not in phase 1, and
[LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15) says why it cannot be the first thing tried.
