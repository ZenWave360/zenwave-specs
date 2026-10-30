# Model Explorer

<a id="model-explorer"></a>

**Status:** 2026-10-30: 7 exists, 1 partial. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

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

*State: The tree works. In the browser it needs the manifest opened once, and a saved edit needs a restart ([LVR-R12](../flows/lsp-visualization-requests.md#lvr-r12)).*

The architecture tree SHALL present the workspace's architecture manifest as a
hierarchy, and SHALL populate as soon as the user opens it, without requiring
them to open a document first.

**Examples**

- *Exploring an architecture before opening anything.* Given a workspace whose architecture manifest declares domains and subdomains, when the user opens the ZenWave container with no editor open, then the architecture tree shows those domains and their subdomains.
- *An architecture spread across repositories.* Given a workspace whose architecture manifest lives in one repository and whose models live in others, opened as separate folders, when the user opens the architecture tree, then it shows that workspace's one architecture, regardless of which folder the user last had open.
- *A workspace with no manifest.* Given a workspace with model files but no architecture manifest, when the user looks at the architecture tree, then it says no architecture manifest was found and points at how to configure one, rather than appearing broken.
- *The manifest is edited.* Given the architecture tree showing a manifest's contents, when the user adds a domain to that manifest and saves it, then the tree reflects the new domain.

<a id="me-r3"></a>
### ME-R3 (exists). The model tree follows the document the user is looking at

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
