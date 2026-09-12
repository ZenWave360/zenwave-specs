## Purpose

Define the ZenWave-specific language server requests an IDE client uses to turn a
model document into something it can show — a positioned flow diagram, or a set
of rendered representations — so that every client shows the same thing and none
of them has to reimplement what a model means.

## ADDED Requirements

### Requirement: A client can discover which ZenWave requests a server supports
The server SHALL declare, when a client initialises the connection, which
ZenWave-specific requests it supports. A client SHALL be able to tell that a
request is unsupported without issuing it.

#### Scenario: Connecting to a current server
- **GIVEN** a client connecting to a server that supports flow views and previews
- **WHEN** initialisation completes
- **THEN** the client knows both requests are available, without having tried
  either

#### Scenario: Connecting to an older server
- **GIVEN** a client connecting to a server released before flow views existed
- **WHEN** initialisation completes
- **THEN** the client knows the request is unavailable and can tell its user that
  the server is too old, rather than that the feature is broken

#### Scenario: A client newer than its server
- **GIVEN** a client that knows of a request the server does not declare
- **WHEN** the client needs that request
- **THEN** it does not issue it, and the connection remains usable for everything
  the server does support

**Rationale:** the three failure modes a user can hit — no server, an old server,
a bad document — need three different messages. Only the first two are knowable
before a request is made, and conflating them produces the worst kind of bug
report: "it doesn't work".

### Requirement: A client can request the EventFlow view models for a ZFL document
The server SHALL, for an open ZFL document, return the flow view model and the
service view model for that document, each already laid out — carrying the
positions and dimensions the renderer is to use — and each identifying the schema
it conforms to. Both SHALL be renderable without further interpretation by the
client.

#### Scenario: Asking for the views of a flow
- **GIVEN** a ZFL document describing a flow across two bounded contexts
- **WHEN** a client requests its EventFlow view models
- **THEN** it receives a flow view model and a service view model for that
  document

#### Scenario: The result is ready to draw
- **GIVEN** a returned flow view model
- **WHEN** a renderer draws it
- **THEN** every node carries the position and dimensions to draw it at, and the
  renderer does not compute a layout

#### Scenario: Nodes point back at the source
- **GIVEN** a returned view model
- **WHEN** a client wants to relate a node to the text it came from
- **THEN** each node carries a reference to its location in the source document

#### Scenario: A document that cannot be read
- **GIVEN** a ZFL document with a syntax error
- **WHEN** a client requests its view models
- **THEN** the server answers that the document could not be read, rather than
  returning an empty diagram that looks like a model with nothing in it

#### Scenario: A client older than its server
- **GIVEN** a server returning a node type introduced after the client was built
- **WHEN** the client forwards the view model to its renderer
- **THEN** nothing in the exchange requires the client to have understood that
  node type

**Rationale:** the last scenario is the reason layout belongs on the server.
Every client that computes its own positions is a client that draws the model
differently, and the difference shows up as two IDEs disagreeing about what the
same file means.

### Requirement: A client can request rendered representations of a model document
The server SHALL, for an open ZDL or ZFL document, return an ordered list of
representations of that document. Each SHALL carry a stable identifier, a title
fit to show the user, the content, and the format that content is in. The server
SHALL nominate which representation a client should show first.

#### Scenario: Previewing a flow with several outcomes
- **GIVEN** a ZFL document whose flow has three end outcomes
- **WHEN** a client requests its representations
- **THEN** it receives a flowchart representation and one per outcome, in the
  order the server intends them to be offered

#### Scenario: Knowing how to render
- **GIVEN** a returned representation
- **WHEN** a client renders it
- **THEN** the declared format tells it whether the content is Markdown, a
  Mermaid diagram, or HTML, without the client inspecting the content to guess

#### Scenario: Landing on the most useful representation
- **GIVEN** a document with several representations
- **WHEN** a client opens a preview of it
- **THEN** the representation the server nominated is the one shown first

#### Scenario: Naming what the user sees
- **GIVEN** a representation shown in a client's user interface
- **WHEN** the user reads its label
- **THEN** the label is the title the server supplied, and the client has not
  invented one

#### Scenario: A document that cannot be read
- **GIVEN** a model document with a syntax error
- **WHEN** a client requests its representations
- **THEN** the server answers that the document could not be read, rather than
  returning a representation whose content is an error message

**Rationale:** the title and the ordering belong to whoever knows what a
representation *is*. A client that names them is a client that will name them
differently from the other client.

### Requirement: What the editor is showing wins over what resolution would find
Where a document is open in the editor, the server SHALL use the editor's current
content for it — including unsaved changes — in preference to the same document
obtained through the manifest's content resolution, wherever that document
contributes to a result.

#### Scenario: Editing a flow that the manifest also publishes
- **GIVEN** a flow document that the manifest declares as an artefact of a
  repository, open in the editor with unsaved changes
- **WHEN** a client requests its diagram or its preview
- **THEN** the result reflects what the editor is showing, not the version the
  manifest's sources would supply

#### Scenario: Editing in a browser against published content
- **GIVEN** a single repository open in a browser-based IDE, where the manifest's
  reachable source for that repository is its published remote content
- **WHEN** the user edits a model in that repository
- **THEN** results follow the edits, rather than the published version

#### Scenario: A referenced model the user has open
- **GIVEN** a flow whose systems are declared in a model document the user also
  has open and has edited
- **WHEN** a client requests the flow's diagram
- **THEN** the edited declarations are the ones reflected

#### Scenario: Documents the user does not have open
- **GIVEN** a model referring to artefacts in repositories the user has not opened
- **WHEN** it is resolved
- **THEN** those come from the manifest's declared sources as usual

**Rationale:** without this rule a live preview stops being live exactly where it
matters most. A browser IDE opening one repository resolves that repository's own
artefacts remotely, so a user editing a flow would watch their diagram keep
showing the committed version. Every "the view tracks the document" requirement in
the IDE clients rests on this one.

### Requirement: A client can request the conceptual hierarchy of a document
The server SHALL, for a document it recognises, return the hierarchy of concepts
that document takes part in, as a tree. Each node SHALL carry a stable
identifier, a label, the kind of thing it is, the document and place it is
declared at, and any presentation hints the server wants to offer. A node MAY be
declared in a different document from the one asked about.

#### Scenario: A flow whose systems live elsewhere
- **GIVEN** a ZFL document referring to a system declared in a ZDL file it
  annotates
- **WHEN** a client requests that document's hierarchy
- **THEN** the system and its services appear in the result, each pointing at the
  document that declares it

#### Scenario: Elements the model implies rather than states
- **GIVEN** a ZFL document whose commands appear inside `when` blocks rather than
  under a service
- **WHEN** a client requests its hierarchy
- **THEN** each command appears under the service that handles it

#### Scenario: Asking about an architecture manifest
- **GIVEN** a workspace architecture manifest
- **WHEN** a client requests its hierarchy, in the same way it would for a model
  document
- **THEN** it receives the manifest's structure as a tree, without needing a
  different request

#### Scenario: Finding what to ask about
- **GIVEN** a client that wants to show the workspace's architecture
- **WHEN** it asks the server about the workspace
- **THEN** it learns where the architecture manifest is, without searching the
  file system itself

#### Scenario: A document the server has no hierarchy for
- **GIVEN** a document of a kind the server does not build hierarchies for
- **WHEN** a client requests its hierarchy
- **THEN** it receives an empty result rather than an error

### Requirement: A hierarchy can be asked for without the document being open
The server SHALL answer a request for a document's hierarchy whether or not that
document has been opened in the editor, reading it itself when it has not.

#### Scenario: Browsing an architecture before opening anything
- **GIVEN** a workspace whose architecture manifest the user has never opened
- **WHEN** a client asks for that manifest's hierarchy
- **THEN** it receives it

#### Scenario: A document the user then opens
- **GIVEN** a hierarchy already obtained for a document that was not open
- **WHEN** the user opens that document and edits it
- **THEN** subsequent answers reflect what the editor is showing

#### Scenario: A document that does not exist
- **GIVEN** a request naming a document the server cannot reach
- **WHEN** it answers
- **THEN** it says so, rather than returning an empty hierarchy that reads as a
  document with nothing in it

**Rationale:** a client cannot open a document merely to populate a view — it
would put an editor's worth of state into the session for something the user
never asked to edit, and in an architecture view it would mean opening the
manifest behind their back. The party that can read it without side effects is
the server.

### Requirement: A client can resolve a position to the concept declared there
The server SHALL, given a position in a document, identify the concept declared
at it in a form that can be used to ask further questions about that concept —
in particular to ask what it references and what references it.

#### Scenario: Asking about what is under the cursor
- **GIVEN** a user with the cursor on a declaration
- **WHEN** a client resolves that position and then asks what the concept
  references
- **THEN** the second question can be asked with what the first returned

#### Scenario: A position that declares nothing
- **GIVEN** a position in whitespace or a comment
- **WHEN** a client resolves it
- **THEN** it learns there is no concept there, and asks nothing further

**Rationale:** this is written down because the obvious composition does not work
today. The request that reports *architectural* concepts at a position returns
architecture identities, while the reference requests take document symbol
identities — so a client following the natural reading gets something it cannot
pass on. Whatever closes that gap, a client needs one path from a cursor to a
question about what is under it.

### Requirement: A node in a diagram and a node in a hierarchy can be matched
Where the same concept appears both in a document's conceptual hierarchy and in a
view model drawn from that document, a client SHALL be able to determine that
they are the same concept.

#### Scenario: Selecting in a tree and highlighting in a diagram
- **GIVEN** a client showing a document's hierarchy beside its diagram
- **WHEN** the user selects a command in the hierarchy
- **THEN** the client can tell the diagram which of its nodes that is

#### Scenario: Selecting in a diagram and revealing in a tree
- **GIVEN** the same client
- **WHEN** a node in the diagram is selected
- **THEN** the client can tell which hierarchy node it corresponds to

#### Scenario: A concept in only one of them
- **GIVEN** a hierarchy node with no counterpart in the diagram, or the reverse
- **WHEN** a client tries to match it
- **THEN** it learns there is no counterpart, rather than matching the wrong one

**Rationale:** the two are identified differently today — a hierarchy node by its
document and semantic path, a diagram node by a name scoped to its kind — and
nothing relates them. A client that assumes one identifier works in both places
silently highlights nothing. How they are related is upstream's decision; that a
client can relate them at all is the contract.

### Requirement: A hierarchy node's label is a usable default, not a mandate
Each hierarchy node SHALL carry a name that a client can show as it stands,
alongside its kind and any presentation hints. A client SHALL be free to present
that node differently — adapting the wording, choosing an icon, grouping it — and
SHALL still show a node whose kind it does not recognise, falling back to the
name it was given. The server SHALL NOT encode a particular IDE's presentation
into that name.

#### Scenario: A client that shows what it is given
- **GIVEN** a client with no opinion about how a kind should read
- **WHEN** it shows the node
- **THEN** the name it was given is usable as it stands

#### Scenario: A client that has an opinion
- **GIVEN** a client whose conventions call for a different wording or decoration
  for that kind
- **WHEN** it shows the node
- **THEN** it may present it its own way, from the kind and the hints

#### Scenario: A kind released after the client
- **GIVEN** a server returning a node of a kind a client was built before
- **WHEN** the client renders the tree
- **THEN** the node still appears under the name it was given, rather than being
  dropped

**Rationale:** an earlier wording said the server "shall not format display
strings" while every node was also required to carry a label — and the servers
already compose labels. Two clients reading those sentences would disagree about
whether the label is authoritative. It is a default: good enough to show,
never binding. What the server must not do is bake one IDE's conventions into it,
because the other IDE then inherits them.

This is still the opposite division from view models and preview representations,
where the server's titles *are* binding. A diagram must look the same in every
IDE; a tree is furniture of the host and should look like the host.

### Requirement: A running server notices when its configuration changes
Where the workspace configuration or the architecture manifest a server was
initialised with changes, the server SHALL take up the change without being
restarted.

#### Scenario: Editing the manifest
- **GIVEN** a running server initialised from an architecture manifest
- **WHEN** the user adds a domain to it and saves
- **THEN** subsequent answers reflect the change, without the user restarting
  anything

#### Scenario: Pointing at a different manifest
- **GIVEN** a running server
- **WHEN** the client tells it the resolved configuration has changed
- **THEN** it works against the new one

#### Scenario: A change that invalidates what was cached
- **GIVEN** results the server derived from the previous manifest
- **WHEN** the configuration changes
- **THEN** what it returns afterwards is not stale

**Rationale:** without this, a manifest edit leaves every architecture-backed
view — trees, previews, diagrams, resolution — showing the previous state until
the window is reloaded, and nothing tells the user that is what they are looking
at.

### Requirement: The server asks the client for a credential when it needs one
Where content resolution reaches a location that refuses it without
authentication, the server SHALL ask the client for a credential for that
location rather than holding one of its own, and SHALL apply what it is given to
that request. A client MAY decline, and the server SHALL then treat the content
as unreachable.

#### Scenario: Reaching private content
- **GIVEN** a manifest source that requires authentication
- **WHEN** the server resolves content from it
- **THEN** it asks the client for a credential for that location, and uses the
  answer for that request

#### Scenario: A client with nothing to give
- **GIVEN** a client that has no credential for the location and declines
- **WHEN** the server has asked
- **THEN** that source is treated as unable to produce the content, and
  resolution continues to the next candidate as any other failure would

#### Scenario: A credential that stops working
- **GIVEN** a credential that was accepted earlier in the session and is later
  rejected
- **WHEN** the server resolves the same content again
- **THEN** it asks the client again rather than reusing what it was given before

#### Scenario: Each request carries only what it needs
- **GIVEN** a manifest whose sources are on several hosts
- **WHEN** content is fetched from each
- **THEN** the credential obtained for one location is not sent to another

**Rationale:** the editor owns the user's identity — it can refresh a session,
prompt for consent, and store a secret where the platform keeps secrets. A server
holding long-lived credentials given to it at startup can do none of those, and
turns every crash log and every memory dump into a disclosure risk. Asking also
keeps the decision to release a credential with the side that knows what the user
authorised, which is what stops a manifest from naming an arbitrary host and
being handed a token for it.

### Requirement: Rendered content carries no code and no remote references
Content returned for display SHALL NOT contain script, and SHALL NOT reference
anything the client would have to fetch over the network in order to display it.
A client remains free to run its own renderer over that content.

#### Scenario: Rendering under a restrictive policy
- **GIVEN** a client that renders returned content with its own bundled
  renderer, under a policy allowing only what it ships
- **WHEN** the content is displayed
- **THEN** it renders as intended, with nothing in it needing to be fetched or
  executed on its own account

#### Scenario: Content that asks to run something
- **GIVEN** returned content containing script, or an element that would execute
  on display
- **WHEN** a client prepares it
- **THEN** it is not displayed as given — the content had no business carrying it

**Note:** an earlier wording required a webview that "executes no script", which
no client could satisfy: rendering a diagram means running a renderer. What
matters is that the **content** is inert — the risk being addressed is a server,
or a model, causing code to run in an IDE, not a client having a renderer.

#### Scenario: A model that stays private
- **GIVEN** a model describing a private domain
- **WHEN** its representations are rendered
- **THEN** nothing in the content causes the model, or any part of it, to be
  fetched from or sent to a remote service
