# LSP Client

<a id="lsp-client"></a>

**Status:** proposed (change 003-lsp-client, never archived; see work/003-lsp-client/tasks.md for what is done). Migrated from OpenSpec change 003-lsp-client on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Connect VS Code to the ZenWave language server — picking a transport the current
host can actually use, surviving its absence gracefully, and giving the rest of
the extension one place to ask the server questions.

## Rules

<a id="lc-r1"></a>
### LC-R1. The extension connects to a language server when the host can run one

The extension SHALL start a language client for `zdl` and `zfl` documents when
the current host has a usable transport, and SHALL continue to function without
one when it does not.

**Examples**

- *Opening a model on the desktop.* Given desktop VS Code with the extension installed and nothing else installed by the user, when the user opens a `.zdl` file, then the language server that ships with the extension is started, and the document is served by it.
- *Opening a model with no server available.* Given a host where no language server can be started, when the user opens a `.zdl` file, then the file is still syntax highlighted and editable, and nothing in the editor reports an error.
- *The server fails to start.* Given a host where starting the server fails, when the user opens a model file, then the editor keeps working without server-backed features, and the reason for the failure is recorded in the ZenWave output channel.
- *The server crashes while editing.* Given a running server that terminates unexpectedly, when the user continues editing, then the extension reports that the server stopped and lets the user restart it, without the editor becoming unresponsive.

<a id="lc-r2"></a>
### LC-R2. The extension comes alive for a workspace that has an architecture

The extension SHALL start when the workspace has a ZenWave architecture, without
the user first opening a model document, and SHALL start when the user opens the
architecture manifest itself.

**Examples**

- *Opening a configured workspace.* Given a workspace carrying ZenWave configuration, when the user opens it and goes to the ZenWave views without opening any model file, then the extension is running and the views have content.
- *Opening the manifest.* Given a user who opens the architecture manifest as their first ZenWave file, when the document is displayed, then the extension is running and treats it as a ZenWave document.
- *A workspace with nothing ZenWave in it.* Given a workspace with no ZenWave configuration and no model files, when the user works in it, then the extension does not start.

<a id="lc-r3"></a>
### LC-R3. The architecture manifest is a document the server serves

The extension SHALL include the resolved architecture manifest among the
documents it asks the language server about, so that whatever the server offers
for it reaches the editor.

**Examples**

- *Working on the manifest.* Given a connected server and the architecture manifest open, when the user hovers a declaration in it, or navigates from one, then they get whatever the server provides for that document, as they would in a model file.
- *A mistake in the manifest.* Given a manifest referring to something that cannot be resolved, when the server reports it, then the problem appears in the editor on the manifest.
- *Other files of the same kind.* Given a workspace full of unrelated YAML, when the user opens one of those files, then it is not treated as a ZenWave document.

**Rationale:** the server already has a language module for the manifest, with
hover, navigation, diagnostics and a hierarchy. A client whose document selector
covers only `zdl` and `zfl` leaves all of that unreachable — and the manifest is
the document a user is most likely to be editing when they get it wrong.

<a id="lc-r4"></a>
### LC-R4. Server-backed language features come from the server

Where the server advertises a language feature, the extension SHALL surface it
rather than providing its own. Features the server does not advertise SHALL
simply be absent.

**Examples**

- *Diagnostics on an invalid model.* Given a connected server and a `.zdl` file with an unknown field type, when the user edits the file, then the problem is reported in the editor at the offending location.
- *Navigating to a definition.* Given a connected server and a ZDL entity referenced from a service, when the user invokes Go to Definition on the reference, then the editor navigates to the entity declaration.
- *A feature the server does not offer.* Given a server that advertises no formatting support, when the user invokes Format Document on a model file, then nothing is reformatted and no error is raised.

<a id="lc-r5"></a>
### LC-R5. One architecture manifest is resolved per workspace

The extension SHALL resolve at most one ZenWave architecture manifest for the
whole workspace, SHALL prefer a location the user has configured over any it
finds by itself, and SHALL pass the manifest it resolved to the server when the
connection is initialised. The server SHALL be told when the resolved
configuration changes.

**Examples**

- *One folder holding several repositories.* Given a workspace that is a single folder containing several checked-out repositories side by side — one holding the architecture and its flows, the others holding the models that belong to it, when the language server starts, then it is initialised with the one manifest for that workspace, and models in any of those repositories are understood as part of it.
- *A single repository opened on its own.* Given a workspace that is one repository, containing an architecture manifest, when the language server starts, then it is initialised with that manifest, without anything outside the repository having to be present.
- *Configuring where the manifest is.* Given a workspace where the user has set `zenwave.workspace.manifest` to a path, when the language server starts, then that manifest is the one used, and nothing is searched for.
- *A workspace that carries its own ZenWave configuration.* Given a workspace folder containing a ZenWave configuration file that names a project manifest, and no manifest setting, when the language server starts, then the manifest that configuration names is the one used.
- *A model with no workspace configuration at all.* Given a `.zdl` file opened outside any configured workspace, when the language server starts, then it starts without a manifest, and single-file features still work.
- *The configuration is edited.* Given a running server initialised from a resolved manifest, when the user edits the configuration that resolved it, or the manifest itself, then the server is made aware of the change without the user restarting VS Code.
- *Finding out which manifest was chosen.* Given a user whose models are not being understood as part of their architecture, when they open the ZenWave output channel, then it states which manifest was resolved, and how.

**Rationale:** a manifest describes an organisation's architecture, and a
workspace holds one. The shape it is written for is a folder holding several
checked-out repositories side by side, where the architecture is one of them —
so resolution is a property of the workspace, not something rediscovered from
whichever file happens to be open.

<a id="lc-r6"></a>
### LC-R6. Model content is resolved by the server, not fetched by the extension

The extension SHALL NOT resolve, download or read model content on the manifest's
behalf, and SHALL NOT decide which source that content comes from. Where content
lives, and in what order candidates are tried, SHALL follow what the manifest
declares.

**Examples**

- *Service repositories checked out locally.* Given a manifest whose declared order prefers workspace content, with its service repositories present alongside it, when models are resolved, then they are read from the workspace, and nothing is requested over the network.
- *A service repository that is not checked out.* Given a manifest whose declared order allows a remote source, and a service repository the user does not have, when models are resolved, then the remote source is tried, because that is the order the manifest declares — not because the extension asked for it.
- *Reviewing an architecture in the browser.* Given a user who opens only the architecture repository in a browser-based VS Code, where no other repository is present to read from, when they open a flow that refers to models in those repositories, then the declared order falls through to whatever remote source it names, without the extension having to ask for remote resolution.
- *Content that cannot be reached.* Given an artefact that none of the manifest's declared sources can reach, when a model referring to it is opened, then it is reported as unresolved, rather than as a broken model.

**Rationale:** the manifest already declares an ordered list of sources and
advances past one that cannot produce the content. That is what makes the browser
work without a special case: the workspace source simply finds nothing and the
next source is tried. An extension that forced a source would be second-guessing
a specification that already covers it.

<a id="lc-r7"></a>
### LC-R7. The user can pin which source content comes from

The extension SHALL let the user restrict resolution to one of the sources the
manifest declares, and SHALL default to the manifest's own declared order.

**Examples**

- *Working against published content deliberately.* Given a user with service repositories checked out, who wants to see what the published versions say, when they pin resolution to the manifest's remote source, then content comes from there, and their local checkouts are not consulted.
- *Pinning a source the manifest does not declare.* Given a manifest that declares only a workspace source, when the user pins a source the manifest does not declare, then they are told that source is not active for this manifest, rather than models silently failing to resolve.
- *The ordinary case.* Given a user who has pinned nothing, when models are resolved, then the manifest's declared order is used.

<a id="lc-r8"></a>
### LC-R8. The extension supplies credentials when the server asks for them

Where the server needs a credential to reach content, the extension SHALL obtain
it on request — from the editor's own authentication providers where the host is
one they cover, and otherwise from credentials the user has given the extension
to keep. The extension SHALL NOT require the user to record a secret in settings
that are shared through the repository.

**Examples**

- *A private repository on the desktop.* Given a manifest whose remote source is a private GitHub repository, when the server needs that content and asks for a credential, then the user is asked to sign in if they have not already, and the content resolves.
- *Already signed in, in the browser.* Given a user working in a browser-based VS Code where they are already signed in to the host serving the content, when the server asks for a credential, then the existing session is used, without asking them to paste a token.
- *A source the editor has no provider for.* Given a manifest whose source is a private artefact repository the editor has no sign-in for, when the server asks for a credential, then the credential the user has stored with the extension is supplied, and the user has a way to record and to replace it.
- *A credential that has expired.* Given content that resolved earlier in the session with a credential that has since expired, when the server asks again, then a current credential is obtained without the user restarting the server or the window.
- *No credential to give.* Given content behind a credential the user has not provided and declines to provide, when the server asks, then it is told no credential is available, that content resolves as unreachable, and the editor keeps working.
- *Keeping secrets out of the repository.* Given a user setting up access to a private source, when they follow what the extension offers, then nothing they are asked to do puts the secret in a file that is committed with the project.

<a id="lc-r9"></a>
### LC-R9. A credential is only released to the host it was meant for

The extension SHALL release a credential only where the request's **origin** —
its scheme, host and port taken together — is one the user authorised for that
credential, compared as a whole rather than as text appearing somewhere in the
address. It SHALL NOT send a credential held for one origin to another, SHALL
treat a redirect to a different origin as a different origin, and SHALL refuse
and record anything that does not match.

**Examples**

- *A manifest pointing somewhere unexpected.* Given an opened repository whose manifest declares a source on a host the user has never authorised, when the server asks for a credential for that host, then no credential is released, and the refusal is recorded in the output channel.
- *Two sources, two credentials.* Given a workspace with credentials for two different hosts, when content is fetched from each, then each request carries only the credential belonging to that host.
- *A lookalike host.* Given a credential authorised for a host, and a request to a different host whose address contains that host's name, when the credential is asked for, then it is refused.
- *Redirected elsewhere.* Given a request to an authorised origin that is redirected to another, when the redirected request is made, then the credential does not travel with it unless that origin is authorised too.

**Rationale:** a manifest is a file in a repository, and opening a repository is
not a decision to trust it. Without this, a manifest could name a source on any
host and be handed a token for it — the content-resolution path would become a
way to exfiltrate a credential from anyone who opened the project.

<a id="lc-r10"></a>
### LC-R10. Language features respect workspace trust

The extension SHALL NOT start a language server, resolve content, or release a
credential in a workspace the user has not trusted, and SHALL say plainly what is
unavailable for that reason.

**Examples**

- *Opening an untrusted repository.* Given a repository opened in Restricted Mode, when the user opens a model file in it, then no language server is started and nothing in the workspace is fetched, while highlighting and editing work as usual.
- *Being asked for a secret in an untrusted workspace.* Given a workspace the user has not trusted, when something would otherwise ask for a credential, then nothing is asked and nothing is released.
- *Granting trust.* Given an untrusted workspace the user then trusts, when trust is granted, then language features become available without reloading the window.
- *Knowing what is held back.* Given a user in Restricted Mode wondering why nothing works, when they look, then they are told that trusting the workspace is what enables it.

**Rationale:** the platform does not do this for us. Restricted Mode blocks
tasks, which covers running a plugin, and blocks neither a spawned process nor
the authentication API — so a repository nobody has trusted could otherwise start
a server, fetch from addresses its own manifest names, and prompt for a GitHub
sign-in. The extension's manifest currently promises only that code generation is
limited; that promise has to grow with this change.

<a id="lc-r11"></a>
### LC-R11. A workspace with no manifest still works as far as it can

Where no architecture manifest is resolved, the extension SHALL still offer
everything that does not depend on one, and SHALL NOT present manifest-backed
features as broken.

**Examples**

- *A service repository opened on its own.* Given a browser-based VS Code with a single service repository open, and no manifest in it, when the user opens a `.zdl` file, then the file is highlighted, and single-document language features work, with no architecture context offered.
- *Absolute references still resolve.* Given a model with no manifest whose document refers to another document by an absolute location, when the model is loaded, then that reference is followed, because the document asked for it directly rather than through the manifest.
- *Features that need an architecture.* Given a workspace with no manifest, when the user looks for architecture-backed views, then they say no architecture manifest is configured, and how to configure one.

<a id="lc-r12"></a>
### LC-R12. ZenWave-specific requests are available to feature code

The extension SHALL provide one way for feature code to issue ZenWave's
server-specific requests, and SHALL answer with an explicit "unavailable" —
rather than hanging or throwing — when there is no server, when the server does
not support the request, or when the request fails.

**Examples**

- *A panel asking the server for a view.* Given a connected server that supports a ZenWave-specific request, when feature code issues that request for an open document, then it receives the server's result.
- *Asking with no server connected.* Given a host with no language server, when feature code issues a ZenWave-specific request, then it is told the server is unavailable, promptly, and can show its own empty state.
- *Asking for something this server version does not support.* Given a connected server that does not advertise the requested capability, when feature code issues that request, then it is told the request is unsupported, distinguishably from the server being absent, and the fact is recorded in the output channel.

**Rationale:** the panels in `004` and `005` are the callers. Each must be able to
tell "no server here" from "server too old" from "that document is broken",
because those are three different things to tell the user.

<a id="lc-r13"></a>
### LC-R13. Server state is visible and controllable

The extension SHALL show, in the editor itself, whether ZenWave's language
features are available and why not when they are not. It SHALL publish whether a
language server is connected as a context key usable in `when` clauses, SHALL
record the chosen transport and the server's lifecycle in its output channel, and
SHALL offer a command to restart the server.

**Examples**

- *Working with no server.* Given a model file open in a host where no server is running, when the user is editing, then the editor itself indicates that ZenWave language features are unavailable, without them having to open the output channel to discover it.
- *Reaching the detail.* Given that indication, when the user acts on it, then they arrive at the reason, and at whatever they can do about it.
- *A reduced host.* Given a browser-based VS Code, where code generation can never work, when the user is editing a model, then it is evident that this host offers less than the desktop one, rather than the missing features being silently absent.
- *Reading what happened at activation.* Given the extension has activated, when the user opens the ZenWave output channel, then it states which transport was chosen and whether the server started.
- *Restarting after a failure.* Given a server that failed to start, or that the user has pointed at a different build, when the user invokes the ZenWave restart command, then the extension attempts to start the server again without reloading the window.
- *Hiding a control that needs the server.* Given a feature that only works with a connected server, when no server is connected, then that feature's controls are not offered.

**Rationale:** almost every failure in this extension is expressed by something
not being offered — no lens, no command, an empty tree. That is the right
behaviour and it leaves a user unable to tell a reduced environment from a broken
one. One visible indication of state is what makes the silence legible.

<a id="lc-r14"></a>
### LC-R14. The server connection is configurable

The extension SHALL let the user override how the server is launched and how much
protocol traffic is logged, through `zenwave.lsp.enabled`,
`zenwave.lsp.serverPath` and `zenwave.lsp.trace.server`, overridable per
workspace.

**Examples**

- *Pointing at a locally built server.* Given a contributor who has built the language server locally and sets `zenwave.lsp.serverPath` to it, when the extension starts the server, then it launches the one the user specified rather than the one it ships with.
- *Diagnosing a protocol problem.* Given a user asked to provide a trace for a bug report, when they raise `zenwave.lsp.trace.server` and reproduce the problem, then the protocol exchange appears in the output channel.
- *Turning the server off.* Given a user who sets `zenwave.lsp.enabled` to off, when they open a model file, then no server is started, and the editor behaves as it does on a host with no server available.

