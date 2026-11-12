# Architecture resources

<a id="architecture-resources"></a>

**Status:** proposed, 2026-11-10. Nothing is built. The owner confirmed the decisions behind it in a design session on
2026-11-10; they are recorded in [decision 0027](../decisions/0027-the-server-serves-the-zenwave-scheme.md).

## Purpose

How a document that an architecture manifest declares, an OpenAPI file, a ZDL model, a Markdown page, is opened in an IDE
when it is not on the local disk. The server resolves it through the manifest's `contentResolution`. The client exposes the
result to the editor as a read-only virtual document, under the `zenwave:` scheme. This document fixes the address of such a
document, what may be asked for, the two requests that serve it, and what an error says.

## Scope

In: the `zenwave:` address, `zenwave/readResource` and `zenwave/statResource`, which addresses are served, errors,
credentials, caching and what the server does with the address itself.

Out: how content is found and in what order sources are tried
([source resolution](../zenwave-architecture/source-resolution-specification.md)); the tree that lists the entries
([ME-R2](../zenwave-platform-vscode/model-explorer.md#me-r2)); what the VS Code provider does with the answers
([LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)); how a credential is obtained
([decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md)). Folder and glob entries and the remote
listing file are phase 2, reserved in [rule AR-R12](#ar-r12) and in [resource discovery](../roadmap/resource-discovery.md).

## Who owns what

| Repository | Owns |
| --- | --- |
| `zenwave-architecture` | Finding the content of a declared entry, and the ordered sources ([SR](../zenwave-architecture/source-resolution-specification.md)). |
| `zenwave-lsp` | The two requests, the address, the declared-only check, the cache, reading `zenwave:` addresses for itself. Reaches the library only through `lsp-js` ([AR-R9](#ar-r9)). |
| `zenwave-platform-vscode` | A read-only `FileSystemProvider` that calls the two requests and has no resolution logic of its own ([LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)). |

## How it works today

Nothing in this document exists yet. What it builds on, from the design session of 2026-11-10 (its author checked the code;
this document's author checked the specs):

- The extension has no `FileSystemProvider`, content provider or custom scheme.
- The library resolves an artifact or document through `contentResolution` and `contentUrlExpression`, including
  `${version}` ([SR](../zenwave-architecture/source-resolution-specification.md)). It has no cache, no globs and no folder
  listing, and it has no `@JsExport`, so JavaScript reaches it only through `@zenwave360/lsp-js`.
- The server's document reader reads `file:` (JVM and Node) and `http(s)`, and nothing else. In a browser `file:` is not
  available.
- `zenwave/credential`, server to client, exists on the client and no server sends it
  ([LVR-R13](lsp-visualization-requests.md#lvr-r13), [LC-R8](../zenwave-platform-vscode/lsp-client.md#lc-r8)).

## Rules

<a id="ar-r1"></a>
### AR-R1 (proposed). A declared resource has one `zenwave:` address

An address SHALL be `zenwave:/<owner.id>/<version>/<content.path>`, with no authority. `owner.id` is the resolved id of the
service, subdomain or domain that declares the entry ([source resolution §1](../zenwave-architecture/source-resolution-specification.md#source-resolution)).
`content.path` is the artifact's `path`, or the value of the docs key, exactly as the manifest writes it, so the original file
name and extension survive. Each segment is percent-encoded as a URI path segment, and the path keeps its own `/` separators.
`version` is:

- for an artifact, the artifact's own `version`, which never inherits;
- for a document, the version it inherits from service, then subdomain, then domain: the same value `${version}` has for a
  document load;
- `-` when neither the entry nor any node above it declares a version ([AR-Q3](#ar-q3)).

**Examples**

- *An API of a service.* Given service `catalog.inventory-management.catalog-inventory` declaring an artifact `openapi.yml` at version `0.1.0`, then its address is `zenwave:/catalog.inventory-management.catalog-inventory/0.1.0/openapi.yml`.
- *A document inherits.* Given a service with no `version` of its own, in a subdomain at `1.2.0`, and a docs entry `changelog: CHANGELOG.md`, then its address is `zenwave:/<service id>/1.2.0/CHANGELOG.md`.
- *The same name in two places.* Given two services that both declare `openapi.yml`, then the two addresses differ in the first segment, and an editor that tells tabs apart by path shows which is which.

**Why:** keeping the path and extension is what lets the editor pick the language and lets installed OpenAPI, AsyncAPI and
Markdown tooling recognise the file. Putting the owner and the version in the address makes it a name for one thing, whichever
source later produces the bytes. The version is part of the name, not necessarily part of the URL the bytes come from: the
Arcadia manifest reads `raw/main/<path>` and its expression never mentions `${version}`. The bytes are always fetched with
the manifest's expression: when the expression does not use `${version}`, that is how the resource is resolved, and the
version in the address only names it (owner decision, 2026-11-10).

<a id="ar-r2"></a>
### AR-R2 (proposed). Only what the manifest declares is served

The server SHALL serve an address only when its `owner.id` and `version` form a pair the manifest declares, and its path is
a declared artifact path or docs value of that owner, or a reference allowed by [AR-R3](#ar-r3). It SHALL refuse every other
address with the error `resourceNotDeclared`, without making a network request.

**Examples**

- *A version that is not in the manifest.* Given a service declared at `0.1.0`, when a client asks for `zenwave:/<id>/9.9.9/openapi.yml`, then the server refuses it, and fetches nothing.
- *An arbitrary path.* Given a declared owner and version, when a client asks for `zenwave:/<id>/0.1.0/internal/secrets.yml` and nothing declared refers to it, then the server refuses it.
- *Path tricks.* Given any address, when its path contains `..`, an empty segment that changes its meaning, or an encoded separator, then it is refused as `resourceNotDeclared` before it is joined to anything.

**Why:** a manifest is a file in a repository, and the server holds credentials on the user's behalf for the origins the user
authorised. A scheme that served any path of a repository would turn the server into a reader of whatever those credentials
can reach.

<a id="ar-r3"></a>
### AR-R3 (proposed). A relative reference inside a declared artifact stays with its owner and version

A relative reference found inside the content of a declared artifact, such as an OpenAPI `$ref` or a ZDL import, SHALL
resolve against the artifact's own address, giving an address with the same owner, the same version and the normalised
joined path: `schemas/common.yml` referred to from `zenwave:/o/0.1.0/openapi.yml` is `zenwave:/o/0.1.0/schemas/common.yml`.
The server SHALL serve it, so that a client can open it and navigate to it, and SHALL NOT list it as an entry of the
manifest. It reads the content through the library's load of a path next to a declared artifact
([SR-R5](../zenwave-architecture/source-resolution-specification.md#sr-r5)); the check that the reference is allowed is the server's. A reference that, once normalised, leaves the owner's content (`../../other/x.yml` above the root) SHALL be refused
as `resourceNotDeclared`. Only content already read through a declared artifact opens this door: the same path asked for
from nowhere is refused ([AR-R2](#ar-r2)).

**Examples**

- *Following a `$ref`.* Given a declared OpenAPI file that refers to `schemas/common.yml`, when the user follows the reference, then `zenwave:/o/0.1.0/schemas/common.yml` opens, and the tree does not show it.
- *Going above the root.* Given the same file referring to `../../other-service/api.yml`, when the user follows it, then it is refused.

**Why:** an artifact is rarely one file, and an API that cannot reach its own schemas cannot be read. The reference is
resolved against content the manifest vouches for, which is why it may not wander to another owner or another version.

<a id="ar-r4"></a>
### AR-R4 (proposed). `zenwave/statResource` says what an address resolves to

The server SHALL answer `zenwave/statResource` for an address that [AR-R2](#ar-r2) and [AR-R3](#ar-r3) allow, with its kind
(always a file), its size and whether it is read-only (always), and **where it came from**: the source that produced it, and,
when that source is the `workspace` source, the `file:` URI of the file. A client SHALL open an address whose answer carries
a `file:` URI as that plain file, not through the scheme.

**Examples**

- *A service checked out beside the manifest.* Given a local manifest whose service repository is a sibling folder, when the user opens one of its artifacts in the tree, then the answer carries the sibling file's `file:` URI and the file opens as an ordinary, editable file.
- *A service that is not checked out.* Given the same manifest and a service the user does not have, when the user opens it, then the answer names the `git` source, carries no `file:` URI, and the document opens under `zenwave:`, read-only.
- *Asking twice.* Given an address stat'ed and then read, when both complete, then the content was fetched once ([AR-R10](#ar-r10)).

**Why:** a local file the user can edit must stay a local file, with its own history and its own tooling. The server is the
one that knows which source produced it ([LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)), so the client learns it
from the answer and never decides it.

*Decided (owner, 2026-11-12):* a local `file:` manifest location is percent-decoded once before its directory is taken, and the URI the client sent stays its identity for every comparison ([source resolution §5.1](../zenwave-architecture/source-resolution-specification.md#51-workspace)). A manifest that fails to open says why: the redacted reason is logged and repeated in the error of every request that needs it.

<a id="ar-r5"></a>
### AR-R5 (proposed). `zenwave/readResource` returns the content

The server SHALL answer `zenwave/readResource` with the content of an allowed address, as text when it is text and as base64
otherwise (a Markdown page may refer to an image). It SHALL read through the manifest's `contentResolution` in its declared
order, trying the next source when one cannot produce the content ([source resolution §4](../zenwave-architecture/source-resolution-specification.md)).
Nothing writes: there is no request that creates, changes or deletes a resource, and a client SHALL register its provider
read-only.

**Examples**

- *A remote file.* Given an address whose declared `git` source answers, when a client reads it, then it receives the text.
- *A source that does not have it.* Given a first source that answers not found and a second that has the file, when a client reads it, then it receives the second's content, as it would have for the library on its own.
- *Saving.* Given a user who edits an open `zenwave:` document and saves, then the editor refuses, because the provider is read-only.

<a id="ar-r6"></a>
### AR-R6 (proposed). A failure names the candidates that were tried

When no source can produce the content, the server SHALL fail with `-32803` and `data.kind: "resourceUnresolved"`, and `data`
SHALL list, in the order tried, each candidate's source and its URL with credentials removed, and what happened to it (status
or error text). A refused address fails with `data.kind: "resourceNotDeclared"`. A server SHALL NOT put a credential, a
header or a query secret in a message or in `data`.

**Examples**

- *Nothing has it.* Given an artifact missing from every source, when a client reads it, then the error carries the URLs tried, in order, and the editor can show them.
- *A declined credential.* Given a private repository whose origin the user did not authorise, when a client reads it, then the candidate is listed as refused, and the content is reported unreachable, not as a broken model ([LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)).

**Why:** "it did not open" is the worst message there is for a remote file. The URLs are what the user needs to open the
address in a browser, or to find the typo in the manifest. This follows the library's own terminal error, which lists
redacted candidates in attempted order ([source resolution §4](../zenwave-architecture/source-resolution-specification.md)).

<a id="ar-r7"></a>
### AR-R7 (proposed). Credentials are asked for through `zenwave/credential`, and only then

When a source refuses a fetch, the server SHALL ask the client with `zenwave/credential` as
[decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md) and
[LVR-R13](lsp-visualization-requests.md#lvr-r13) describe, for the origin of that one request, and SHALL apply the answer to
that request only. This is the first time a server sends that request. An address, a response and a cache entry SHALL NOT
contain the credential, and a cached resource SHALL NOT be returned to a different user's session. A `null` answer makes the
candidate fail and resolution continues.

**Examples**

- *A private repository.* Given a remote source that answers 401 and an origin the user authorised, when a client reads an address from it, then the server asks once, retries once with the answer, and the content is returned.
- *An origin nobody authorised.* Given a manifest naming a host the user never authorised, when a client reads an address from it, then no credential leaves the client, the candidate is listed as refused ([AR-R6](#ar-r6)), and the refusal is recorded in the output channel ([LC-R9](../zenwave-platform-vscode/lsp-client.md#lc-r9)).

<a id="ar-r8"></a>
### AR-R8 (proposed). Only `zdl`, `zfl` and `zw` documents under the scheme go to the language features

A `zenwave:` document whose language is `zdl`, `zfl` or `zw` is a model document, and the client SHALL treat it as one:
sent to the server, previewed and shown in the outline. OpenAPI, AsyncAPI and Markdown documents under the scheme SHALL
NOT be sent to the server ([LVR-R15](lsp-visualization-requests.md#lvr-r15): an OpenAPI file once stalled `lsp-js`). The
client's selector for the scheme SHALL NOT be widened to `*.yml`, `*.yaml` or `*.md`. Those documents open with the right
language id so that installed extensions handle them.

**Examples**

- *A remote ZDL.* Given a service whose `domain-model.zdl` is only remote, when the user opens it, then it has syntax colouring, diagnostics, hover and the Model Docs preview, as a local one has.
- *A remote OpenAPI file.* Given a declared `openapi.yml`, when the user opens it, then it opens as OpenAPI, the server is not sent it, and the Model tree is its outline from whatever extension provides symbols ([ME-R3](../zenwave-platform-vscode/model-explorer.md#me-r3)).

<a id="ar-r9"></a>
### AR-R9 (proposed). The server reads `zenwave:` addresses itself

The server SHALL accept a `zenwave:` address wherever it reads a document, for example when a remote ZDL or ZFL file imports
another that no editor has open, and SHALL resolve it by the same path as `zenwave/readResource`, including
[AR-R2](#ar-r2), [AR-R3](#ar-r3), [AR-R7](#ar-r7) and the cache ([AR-R10](#ar-r10)), without asking the client. An import
that resolves to a file in the workspace is read from that file.

The request is therefore the server's own reading operation shown to the client. The client does not become a source of
content for the server, and no TypeScript code implements resolution; the library is reached through `lsp-js` only.

**Examples**

- *An import between remote files.* Given a remote ZFL file importing a remote ZDL file, when the user opens the flow, then its diagnostics and previews include the ZDL, and no message was exchanged with the client to read it.
- *A relative `$ref` from a ZDL.* Given a remote ZDL with an `@oas` reference to `schemas/common.yml`, then the server reads `zenwave:/o/<same version>/schemas/common.yml`.

**Why:** the server is the source of truth for the scheme. A client round trip per import would put the extension host, which
a web worker and a closed window may not have, on the path of every parse.

<a id="ar-r10"></a>
### AR-R10 (proposed). Content is fetched when asked for, and kept for the session

Building the tree SHALL require the manifest only. The server SHALL NOT fetch, probe or check the existence of any
artifact or document until a client asks for it. Content it has fetched SHALL be kept in memory for the life of the session,
keyed by address, so that a stat followed by a read, and a reopened tab, cost one fetch. A failure SHALL NOT be cached.
The client's *Refresh* ([ME-R2](../zenwave-platform-vscode/model-explorer.md#me-r2)) SHALL empty the cache and re-read the
manifest, and nothing else empties it. A conditional request (ETag) is a later improvement, not part of this rule.

**Examples**

- *Opening the tree.* Given a manifest declaring forty artifacts, when the tree is shown, then no artifact was requested from any source.
- *Reopening.* Given a remote file opened, closed and opened again, then the second open makes no request.
- *The file changed upstream.* Given a cached file that changed in the repository, when the user presses Refresh and opens it, then the new content is shown.

<a id="ar-r11"></a>
### AR-R11 (proposed). A remote manifest does not use the `workspace` source

When the manifest is an `http(s)` address, the server SHALL pass it to the library as such, and the library skips the
`workspace` source and falls through to the later sources in `contentResolution`
([SR-R4](../zenwave-architecture/source-resolution-specification.md#sr-r4)). The manifest itself is
served under the scheme and is read-only. A remote manifest is read again only on *Refresh*.

**Examples**

- *A manifest from the web.* Given `zenwave.workspace.manifest` set to `https://example.org/zenwave-architecture.yml` and `contentResolution: [workspace, git]`, when an artifact is opened, then the `git` source is tried, and no local path is built from the URL.

<a id="ar-r12"></a>
*Decided (owner, 2026-11-12), the browser:* in a browser only a remote (`http(s)`) manifest is supported; `workspace` does not apply and only `git` is used. A manifest that is neither `file:` nor `http(s)` is reported as not supported instead of failing silently. `git` from a browser depends on CORS ([AR-Q5](#ar-q5), not yet verified): `github.com/.../raw` sends no CORS headers, so a browser needs `raw.githubusercontent.com`.

### AR-R12 (proposed). Folder entries and the remote listing file are reserved for phase 2

Phase 1 serves single files only. A docs entry or artifact path that ends in `/` or contains a glob character is a **folder
entry**: it has no address in phase 1, and a client shows it disabled and marked "pending (phase 2)".

Phase 2 is reserved, and not specified here: a folder in a remote repository has no listing over http, so the repository
provides a file named `manifest.yml` inside the folder, listing the files it holds, fetched the first time the folder is
expanded. Its name and place are `<folder>/manifest.yml`, relative to the folder entry, and its contract is reserved as the
document `flows/architecture-folder-listing.md`, not yet written. That `manifest.yml` is not an architecture manifest, and
the two are never confused: the architecture manifest is `zenwave-architecture.yml`.

**Examples**

- *`adrs/` in the Arcadia manifest.* Given `docs: { adrs: "adrs/" }`, when the user looks at the tree, then the `adrs` node is there, disabled, and says "pending (phase 2)".

## Wire reference

The names the rules above deliberately don't fix ([decision 0007](../decisions/0007-contracts-are-behaviour-with-recorded-wire-names.md)).
Both are advertised in `capabilities.experimental.customRequests` ([decision 0002](../decisions/0002-server-advertises-its-requests.md)).
These shapes are proposed and may change before the first implementation.

| Method | Params | Result |
| --- | --- | --- |
| `zenwave/statResource` | `{ uri }` | `{ uri, type: "file", size, readonly: true, source: { kind, fileUri? } }` |
| `zenwave/readResource` | `{ uri }` | `{ uri, encoding: "utf8" \| "base64", content }` |

`source.kind` is the name of the source in `contentResolution` that produced the content (`workspace`, `git`, `artifactory`).
`fileUri` is present only for `workspace`.

**Errors.** As [LVR](lsp-visualization-requests.md#wire-reference): `-32602` for malformed params, `-32803` with `data.kind`,
`-32601` only for a server too old. New kinds: `resourceNotDeclared`, and `resourceUnresolved` with
`data.candidates: [{ source, url, status?, message? }]`, in the order tried. `documentNotFound` is not reused, because it
already means a document the client sent.

## Open questions

<a id="ar-q1"></a>
**AR-Q1. What is the address of a remote manifest?** It has no owner and no version, so [AR-R1](#ar-r1) does not name it, and
[LC-R3](../zenwave-platform-vscode/lsp-client.md#lc-r3) selects the manifest by scheme and exact path. A reserved first
segment that no owner id can have (a leading dot such as `.manifest`) is one candidate. Whether an owner id can start with a
dot has not been checked.
*Decided (owner, 2026-11-11):* the remote manifest is the file `.zenwave-manifest.yml` at the root of the remote repository,
its name configurable in the extension (one setting, no more). Its address is `zenwave:/.zenwave-manifest.yml`: the
leading dot is the reserved segment, which no owner id has.

<a id="ar-q2"></a>
**AR-Q2. How does *Refresh* reach the server?** The server ignores configuration changes
([LVR-R12](lsp-visualization-requests.md#lvr-r12)), so today the only way to re-read the manifest is a restart, which closes
the open documents' state. A new notification would avoid that. Decide when the first task is built.
*Owner, 2026-11-10:* Refresh is wanted, at low priority; phase 1 may ship with a restart.

<a id="ar-q3"></a>
**AR-Q3. A document with no version has no address.** In the Arcadia manifest the `architecture` domain declares
`docs: { content: README.md, adrs: "adrs/" }` and no `version`, and a document's version inherits only from its owner and
the nodes above it ([source resolution §1](../zenwave-architecture/source-resolution-specification.md#source-resolution)).
[AR-R1](#ar-r1) then cannot form its address. Options: the manifest declares a version (the manifest's own fix), or a
reserved segment stands for "unversioned". Until decided, such an entry is shown with a warning, not hidden.
*Decided in part (owner, 2026-11-10):* docs inherit the version of their service, as [AR-R1](#ar-r1) says. Still open: a doc
declared on a domain or subdomain that has no version anywhere above it, as the Arcadia `architecture` domain.
*Decided (owner, 2026-11-11):* the reserved segment `-` stands for "unversioned", as in `zenwave:/architecture/-/README.md`,
and the tree shows no version for it. The bytes are fetched with the manifest's expression as for any other entry.

<a id="ar-q4"></a>
**AR-Q4. What is the address of an entry written as an absolute URI?** A docs value may be a supported absolute URI, which
bypasses `contentResolution` ([source resolution §4](../zenwave-architecture/source-resolution-specification.md#source-resolution)).
`<content.path>` would then be a URL. Not designed; the Arcadia manifest has none.
*Decided (owner, 2026-11-11):* such an entry is flagged in the tree, and fetched only when its host is one of the allowed
domains, a list the extension lets the user configure. Any other host is refused and reported, never fetched.

<a id="ar-q5"></a>
**AR-Q5. Does a git fetch from a browser work?** `https://github.com/<org>/<repo>/raw/...` redirects to
`raw.githubusercontent.com`, and the `github.com` side sends no CORS headers
([decision 0008, Open](../decisions/0008-credentials-are-handed-over-per-request.md#open)). To verify, from the web worker
and on `vscode.dev`, with the Arcadia manifest (`raw/main/${content.path}`): the first public file, a private one with a
credential, and the redirect. If it fails, record the expression form that works (for instance
`raw.githubusercontent.com`, or `api.github.com/repos/.../contents`). Not checked.
Also open: the loaders follow HTTP redirects, and the server does not check the target again. A same-origin `$ref` of a
remote manifest that redirects to another origin is read (review of AN/2, 2026-11-11). Whether a redirect is re-checked
against the allowed domains ([AR-Q4](#ar-q4)) is decided with this question, since `github.com` itself redirects.
*Decided (owner, 2026-11-12), for absolute-URI entries:* a URL that is not allowed is never contacted. The server follows
redirects by hand, at most 5 hops, checks each hop against the allowed domains, and refuses `https` to `http`. A browser
cannot show the hops, so in the web extension an absolute entry that redirects is refused, and the entry must name its
final URL (for instance `raw.githubusercontent.com`). Each fetch is bounded to 30 s and 10 MiB. Still open: manifest
loading and declared repository sources use the loaders' own HTTP, which follows redirects unchecked (backlog AN/4.6).
A literal `%` in a declared path is not served yet: the entry is marked, because the sources and loaders do not agree on
decoding it.

<a id="ar-q6"></a>
**AR-Q6. Which third-party extensions open a `zenwave:` document?** Some OpenAPI, AsyncAPI and Markdown tools may accept only
`file:`. This is accepted as a known limitation, not a requirement. Record the ones tried and the result, per host, in this
document: the built-in Markdown preview (relative links, relative images), Mermaid in it, and one OpenAPI and one AsyncAPI
extension. Not checked.

<a id="ar-q7"></a>
**AR-Q7. Do two tabs with the same file name read well?** `openapi.yml` of two services differ only by the segments
`<owner.id>/<version>` of the path, which VS Code shows when it has to tell tabs apart. A label that does not need the
user to hover is a later improvement. To check by looking at it; not checked.

## Sources

The design brief of the 2026-11-10 session is kept outside this repository, in `.handoff/architecture-navigator/brief.md` of the workspace.
[Source resolution](../zenwave-architecture/source-resolution-specification.md), [LSP visualization requests](lsp-visualization-requests.md),
[decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md), [decision 0027](../decisions/0027-the-server-serves-the-zenwave-scheme.md).
The Arcadia Editions manifest, `arcadia-editions-architecture/zenwave-architecture.yml`, read 2026-11-10.
