# LSP Visualization Requests

<a id="lsp-visualization-requests"></a>

**Status:** proposed (change 001-ide-client-contracts, never archived; see work/001-ide-client-contracts/tasks.md for what is done). Migrated from OpenSpec change 001-ide-client-contracts on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Define the ZenWave-specific language server requests an IDE client uses to turn a
model document into something it can show — a positioned flow diagram, or a set
of rendered representations — so that every client shows the same thing and none
of them has to reimplement what a model means.

## Rules

<a id="lvr-r1"></a>
### LVR-R1. A client can discover which ZenWave requests a server supports

The server SHALL declare, when a client initialises the connection, which
ZenWave-specific requests it supports. A client SHALL be able to tell that a
request is unsupported without issuing it.

**Examples**

- *Connecting to a current server.* Given a client connecting to a server that supports flow views and previews, when initialisation completes, then the client knows both requests are available, without having tried either.
- *Connecting to an older server.* Given a client connecting to a server released before flow views existed, when initialisation completes, then the client knows the request is unavailable and can tell its user that the server is too old, rather than that the feature is broken.
- *A client newer than its server.* Given a client that knows of a request the server does not declare, when the client needs that request, then it does not issue it, and the connection remains usable for everything the server does support.

**Rationale:** the three failure modes a user can hit — no server, an old server,
a bad document — need three different messages. Only the first two are knowable
before a request is made, and conflating them produces the worst kind of bug
report: "it doesn't work".

<a id="lvr-r2"></a>
### LVR-R2. A client can request the EventFlow view models for a ZFL document

The server SHALL, for an open ZFL document, return the flow view model and the
service view model for that document, each already laid out — carrying the
positions and dimensions the renderer is to use — and each identifying the schema
it conforms to. Both SHALL be renderable without further interpretation by the
client.

**Examples**

- *Asking for the views of a flow.* Given a ZFL document describing a flow across two bounded contexts, when a client requests its EventFlow view models, then it receives a flow view model and a service view model for that document.
- *The result is ready to draw.* Given a returned flow view model, when a renderer draws it, then every node carries the position and dimensions to draw it at, and the renderer does not compute a layout.
- *Nodes point back at the source.* Given a returned view model, when a client wants to relate a node to the text it came from, then each node carries a reference to its location in the source document.
- *A document that cannot be read.* Given a ZFL document with a syntax error, when a client requests its view models, then the server answers that the document could not be read, rather than returning an empty diagram that looks like a model with nothing in it.
- *A client older than its server.* Given a server returning a node type introduced after the client was built, when the client forwards the view model to its renderer, then nothing in the exchange requires the client to have understood that node type.

**Rationale:** the last scenario is the reason layout belongs on the server.
Every client that computes its own positions is a client that draws the model
differently, and the difference shows up as two IDEs disagreeing about what the
same file means.

<a id="lvr-r3"></a>
### LVR-R3. A client can request rendered representations of a model document

The server SHALL, for an open ZDL or ZFL document, return an ordered list of
representations of that document. Each SHALL carry a stable identifier, a title
fit to show the user, the content, and the format that content is in. The server
SHALL nominate which representation a client should show first.

**Examples**

- *Previewing a flow with several outcomes.* Given a ZFL document whose flow has three end outcomes, when a client requests its representations, then it receives a flowchart representation and one per outcome, in the order the server intends them to be offered.
- *Knowing how to render.* Given a returned representation, when a client renders it, then the declared format tells it whether the content is Markdown, a Mermaid diagram, or HTML, without the client inspecting the content to guess.
- *Landing on the most useful representation.* Given a document with several representations, when a client opens a preview of it, then the representation the server nominated is the one shown first.
- *Naming what the user sees.* Given a representation shown in a client's user interface, when the user reads its label, then the label is the title the server supplied, and the client has not invented one.
- *A document that cannot be read.* Given a model document with a syntax error, when a client requests its representations, then the server answers that the document could not be read, rather than returning a representation whose content is an error message.

**Rationale:** the title and the ordering belong to whoever knows what a
representation *is*. A client that names them is a client that will name them
differently from the other client.

<a id="lvr-r4"></a>
### LVR-R4. What the editor is showing wins over what resolution would find

Where a document is open in the editor, the server SHALL use the editor's current
content for it — including unsaved changes — in preference to the same document
obtained through the manifest's content resolution, wherever that document
contributes to a result.

**Examples**

- *Editing a flow that the manifest also publishes.* Given a flow document that the manifest declares as an artefact of a repository, open in the editor with unsaved changes, when a client requests its diagram or its preview, then the result reflects what the editor is showing, not the version the manifest's sources would supply.
- *Editing in a browser against published content.* Given a single repository open in a browser-based IDE, where the manifest's reachable source for that repository is its published remote content, when the user edits a model in that repository, then results follow the edits, rather than the published version.
- *A referenced model the user has open.* Given a flow whose systems are declared in a model document the user also has open and has edited, when a client requests the flow's diagram, then the edited declarations are the ones reflected.
- *Documents the user does not have open.* Given a model referring to artefacts in repositories the user has not opened, when it is resolved, then those come from the manifest's declared sources as usual.

**Rationale:** without this rule a live preview stops being live exactly where it
matters most. A browser IDE opening one repository resolves that repository's own
artefacts remotely, so a user editing a flow would watch their diagram keep
showing the committed version. Every "the view tracks the document" requirement in
the IDE clients rests on this one.

<a id="lvr-r5"></a>
### LVR-R5. A client can request the conceptual hierarchy of a document

The server SHALL, for a document it recognises, return the hierarchy of concepts
that document takes part in, as a tree. Each node SHALL carry a stable
identifier, a label, the kind of thing it is, the document and place it is
declared at, and any presentation hints the server wants to offer. A node MAY be
declared in a different document from the one asked about.

**Examples**

- *A flow whose systems live elsewhere.* Given a ZFL document referring to a system declared in a ZDL file it annotates, when a client requests that document's hierarchy, then the system and its services appear in the result, each pointing at the document that declares it.
- *Elements the model implies rather than states.* Given a ZFL document whose commands appear inside `when` blocks rather than under a service, when a client requests its hierarchy, then each command appears under the service that handles it.
- *Asking about an architecture manifest.* Given a workspace architecture manifest, when a client requests its hierarchy, in the same way it would for a model document, then it receives the manifest's structure as a tree, without needing a different request.
- *Finding what to ask about.* Given a client that wants to show the workspace's architecture, when it asks the server about the workspace, then it learns where the architecture manifest is, without searching the file system itself.
- *A document the server has no hierarchy for.* Given a document of a kind the server does not build hierarchies for, when a client requests its hierarchy, then it receives an empty result rather than an error.

<a id="lvr-r6"></a>
### LVR-R6. A hierarchy can be asked for without the document being open

The server SHALL answer a request for a document's hierarchy whether or not that
document has been opened in the editor, reading it itself when it has not.

**Examples**

- *Browsing an architecture before opening anything.* Given a workspace whose architecture manifest the user has never opened, when a client asks for that manifest's hierarchy, then it receives it.
- *A document the user then opens.* Given a hierarchy already obtained for a document that was not open, when the user opens that document and edits it, then subsequent answers reflect what the editor is showing.
- *A document that does not exist.* Given a request naming a document the server cannot reach, when it answers, then it says so, rather than returning an empty hierarchy that reads as a document with nothing in it.

**Rationale:** a client cannot open a document merely to populate a view — it
would put an editor's worth of state into the session for something the user
never asked to edit, and in an architecture view it would mean opening the
manifest behind their back. The party that can read it without side effects is
the server.

<a id="lvr-r7"></a>
### LVR-R7. A client can resolve a position to the concept declared there

The server SHALL, given a position in a document, identify the concept declared
at it in a form that can be used to ask further questions about that concept —
in particular to ask what it references and what references it.

**Examples**

- *Asking about what is under the cursor.* Given a user with the cursor on a declaration, when a client resolves that position and then asks what the concept references, then the second question can be asked with what the first returned.
- *A position that declares nothing.* Given a position in whitespace or a comment, when a client resolves it, then it learns there is no concept there, and asks nothing further.

**Rationale:** this is written down because the obvious composition does not work
today. The request that reports *architectural* concepts at a position returns
architecture identities, while the reference requests take document symbol
identities — so a client following the natural reading gets something it cannot
pass on. Whatever closes that gap, a client needs one path from a cursor to a
question about what is under it.

<a id="lvr-r8"></a>
### LVR-R8. A client can ask which architectural concepts a position belongs to

The server SHALL, given a position in a document, report the architectural
concepts that position belongs to, each named as the architecture names it. Where
there are more than it reports, it SHALL say the list is incomplete. It SHALL
distinguish a position that belongs to no concept from a workspace for which no
architecture is resolved.

**Examples**

- *Locating a position in an architecture.* Given a workspace whose architecture manifest is resolved, and a position inside a service declaration of a model it covers, when a client asks which concepts that position belongs to, then it receives the concepts covering it, each with the name and kind the architecture gives it.
- *A position that belongs to nothing.* Given a position the server can associate with no architectural concept, when a client asks, then it receives an empty answer, not a failure.
- *No architecture.* Given a workspace for which no architecture manifest is resolved, when a client asks which concepts a position belongs to, then it learns that no architecture is resolved, distinguishably from a position that belongs to nothing.

**Rationale:** this question is different from resolving a position to the symbol
declared there, and a client must not be tempted to answer it by combining other
answers. It is advertised like every other ZenWave request, so a client offers it
only where a server answers it.

<a id="lvr-r9"></a>
### LVR-R9. Reference requests answer in both directions, and say where

Given a concept a client resolved from a position, the server SHALL answer what that
concept references and what references it, including references from and to other
documents it knows of, and each result SHALL carry the place in its document the
result stands for, where that place is known.

**Examples**

- *What uses a declaration, from another document.* Given a ZDL model declaring an entity, a service or a command, and a ZFL flow using it through its `@zdl` annotation, when a client resolves a position on that declaration and asks what references it, then the uses in the flow are among the results.
- *Following a reference to its declaration.* Given a command in a ZFL flow that a ZDL model declares, when a client asks what the command references, then the result names the place in the ZDL where the command is declared, not only the ZDL document.
- *A declaration resolved by its name.* Given the cursor on the name of a ZDL entity declaration, when a client resolves that position, then it receives that entity, which the reference requests then accept.

**Rationale:** the requests exist and are advertised, so a client presents their
answer as complete. An answer that is always empty in one direction, or that names
a document but not the place in it, reads to the user as "nothing uses this" or
"here is the file, find it yourself".

<a id="lvr-r10"></a>
### LVR-R10. A node in a diagram and a node in a hierarchy can be matched

Where the same concept appears both in a document's conceptual hierarchy and in a
view model drawn from that document, a client SHALL be able to determine that
they are the same concept.

**Examples**

- *Selecting in a tree and highlighting in a diagram.* Given a client showing a document's hierarchy beside its diagram, when the user selects a command in the hierarchy, then the client can tell the diagram which of its nodes that is.
- *Selecting in a diagram and revealing in a tree.* Given the same client, when a node in the diagram is selected, then the client can tell which hierarchy node it corresponds to.
- *A concept in only one of them.* Given a hierarchy node with no counterpart in the diagram, or the reverse, when a client tries to match it, then it learns there is no counterpart, rather than matching the wrong one.

**Rationale:** the two are identified differently today — a hierarchy node by its
document and semantic path, a diagram node by a name scoped to its kind — and
nothing relates them. A client that assumes one identifier works in both places
silently highlights nothing. How they are related is upstream's decision; that a
client can relate them at all is the contract.

<a id="lvr-r11"></a>
### LVR-R11. A hierarchy node's label is a usable default, not a mandate

Each hierarchy node SHALL carry a name that a client can show as it stands,
alongside its kind and any presentation hints. A client SHALL be free to present
that node differently — adapting the wording, choosing an icon, grouping it — and
SHALL still show a node whose kind it does not recognise, falling back to the
name it was given. The server SHALL NOT encode a particular IDE's presentation
into that name.

**Examples**

- *A client that shows what it is given.* Given a client with no opinion about how a kind should read, when it shows the node, then the name it was given is usable as it stands.
- *A client that has an opinion.* Given a client whose conventions call for a different wording or decoration for that kind, when it shows the node, then it may present it its own way, from the kind and the hints.
- *A kind released after the client.* Given a server returning a node of a kind a client was built before, when the client renders the tree, then the node still appears under the name it was given, rather than being dropped.

**Rationale:** an earlier wording said the server "shall not format display
strings" while every node was also required to carry a label — and the servers
already compose labels. Two clients reading those sentences would disagree about
whether the label is authoritative. It is a default: good enough to show,
never binding. What the server must not do is bake one IDE's conventions into it,
because the other IDE then inherits them.

This is still the opposite division from view models and preview representations,
where the server's titles *are* binding. A diagram must look the same in every
IDE; a tree is furniture of the host and should look like the host.

<a id="lvr-r12"></a>
### LVR-R12. A running server notices when its configuration changes

Where the workspace configuration or the architecture manifest a server was
initialised with changes, the server SHALL take up the change without being
restarted.

**Examples**

- *Editing the manifest.* Given a running server initialised from an architecture manifest, when the user adds a domain to it and saves, then subsequent answers reflect the change, without the user restarting anything.
- *Pointing at a different manifest.* Given a running server, when the client tells it the resolved configuration has changed, then it works against the new one.
- *A change that invalidates what was cached.* Given results the server derived from the previous manifest, when the configuration changes, then what it returns afterwards is not stale.

**Rationale:** without this, a manifest edit leaves every architecture-backed
view — trees, previews, diagrams, resolution — showing the previous state until
the window is reloaded, and nothing tells the user that is what they are looking
at.

<a id="lvr-r13"></a>
### LVR-R13. The server asks the client for a credential when it needs one

Where content resolution reaches a location that refuses it without
authentication, the server SHALL ask the client for a credential for that
location rather than holding one of its own, and SHALL apply what it is given to
that request. A client MAY decline, and the server SHALL then treat the content
as unreachable.

**Examples**

- *Reaching private content.* Given a manifest source that requires authentication, when the server resolves content from it, then it asks the client for a credential for that location, and uses the answer for that request.
- *A client with nothing to give.* Given a client that has no credential for the location and declines, when the server has asked, then that source is treated as unable to produce the content, and resolution continues to the next candidate as any other failure would.
- *A credential that stops working.* Given a credential that was accepted earlier in the session and is later rejected, when the server resolves the same content again, then it asks the client again rather than reusing what it was given before.
- *Each request carries only what it needs.* Given a manifest whose sources are on several hosts, when content is fetched from each, then the credential obtained for one location is not sent to another.

**Rationale:** the editor owns the user's identity — it can refresh a session,
prompt for consent, and store a secret where the platform keeps secrets. A server
holding long-lived credentials given to it at startup can do none of those, and
turns every crash log and every memory dump into a disclosure risk. Asking also
keeps the decision to release a credential with the side that knows what the user
authorised, which is what stops a manifest from naming an arbitrary host and
being handed a token for it.

<a id="lvr-r14"></a>
### LVR-R14. Rendered content carries no code and no remote references

Content returned for display SHALL NOT contain script, and SHALL NOT reference
anything the client would have to fetch over the network in order to display it.
A client remains free to run its own renderer over that content.

**Examples**

- *Rendering under a restrictive policy.* Given a client that renders returned content with its own bundled renderer, under a policy allowing only what it ships, when the content is displayed, then it renders as intended, with nothing in it needing to be fetched or executed on its own account.
- *Content that asks to run something.* Given returned content containing script, or an element that would execute on display, when a client prepares it, then it is not displayed as given — the content had no business carrying it.
- *A model that stays private.* Given a model describing a private domain, when its representations are rendered, then nothing in the content causes the model, or any part of it, to be fetched from or sent to a remote service.

**Note:** an earlier wording required a webview that "executes no script", which
no client could satisfy: rendering a diagram means running a renderer. What
matters is that the **content** is inert — the risk being addressed is a server,
or a model, causing code to run in an IDE, not a client having a renderer.

<a id="lvr-r15"></a>
### LVR-R15. One document a server cannot process does not stop it serving the others

Where a server cannot finish processing a document it has been sent — its parse,
its diagnostics or a request about it — the server SHALL keep answering for every
other document, and SHALL answer for that document within a bounded time, with a
failure where it has no result.

**Examples**

- *A specification document that defeats the parser.* Given a running server with a model document open and answering, when a client opens a specification document the server cannot finish processing, then requests about the model document are still answered, and requests about the specification document fail rather than never completing.
- *Recovering without a restart.* Given a document that could not be processed, when the user edits it into a form the server can process, then the server serves it, without the client having to restart the server.

**Rationale:** a client has one connection per workspace. A document that stops the
server stops every view and every language feature in every document, and to the
user it reads as the editor being broken rather than one file being unreadable.

<a id="lvr-r16"></a>
### LVR-R16. A client can restrict content resolution to one declared source

A client SHALL be able to tell the server, when it initialises the connection and
when the choice changes, to resolve content from one of the sources the manifest
declares instead of the manifest's declared order, and whether falling back to the
other declared sources is allowed. A source the manifest does not declare SHALL be
reported to the client as not active for that manifest, rather than resolving to
nothing.

**Examples**

- *Pinning a declared source.* Given a manifest declaring a workspace source and a remote source, when the client asks for the remote source only, then content resolves from the remote source and the workspace is not read.
- *Pinning a source the manifest does not declare.* Given a manifest declaring only a workspace source, when the client asks for a remote source, then the client is told that source is not active for this manifest.
- *No choice made.* Given a client that asks for no particular source, when content is resolved, then the manifest's declared order is used.

**Rationale:** `ManifestLoadOptions.preferredSource` / `allowFallback` already carry
this choice inside zenwave-architecture, but no request or initialization option
reaches it, so an IDE client offering the choice has nothing to send.

