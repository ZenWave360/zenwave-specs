# 001 — Design

## Context

Both contracts already exist as running code. Neither exists as an agreement.

**The view model and the representations** are produced in `dsl-kotlin` and
consumed in-process by the IntelliJ plugin:

```
GenerateFlowViewFromZfl().execute(text)      → FlowViewModel
GenerateServiceViewFromZfl().execute(text)   → ServiceViewModel
GenerateMermaidFromZfl().execute(text, mode) → MermaidDiagramsView
ZdlToMarkdownPlugin.generatePlantUML(text)   → PlantUML
```

`ZflDiagramModelProvider` serialises the first two into
`{"flowGraph": …, "serviceGraph": …}` and posts that JSON into the webview.
`ZdlPreviewEditor` and `ZflPreviewEditor` wrap the others into
`MarkdownPreviewRepresentation(id, title, content, format)`.

The language server already carries six custom requests — `zenwave/hierarchy`,
`zenwave/forwardReferences`, `zenwave/reverseReferences`,
`zenwave/organizeZflServices`, `zenwave/conceptAt`, `zenwave/workspaceStatus` —
and lists them in its initialize result. So there is an established place for
these to go, and an established way to advertise them.

**The webview protocol** is defined by the bundle's own `index.html` and
`main.tsx`: four inbound message types, a pending-message queue for messages that
arrive before React mounts, and one outbound `webviewReady`.

The spec deltas describe what these do, in the vocabulary of the people using
them, and deliberately do not name methods, fields or JSON shapes. That is not
vagueness — it is where the boundary between this store and the implementing
repositories falls. See below.

## Goals / Non-Goals

**Goals:**

- Make the existing behaviour something a second client can be built against.
- Name the three failure modes — absent, too old, bad document — and require them
  to stay distinguishable, because that is what users actually experience.
- Fix the two things that stop the EventFlow bundle from working in VS Code.

**Non-Goals:**

- **Migrating IntelliJ onto these requests.** Its in-process route stays valid.
  Duplication between "called as a function" and "called over a wire" is real
  debt, but converting IntelliJ is a separate change with its own risk.
- **Editing a model from a diagram.** The renderer accepts `editable`, and a
  round trip back into ZFL is a contract of its own.
- **Node-to-source navigation from the webview.** The view model already carries
  source references, so the data is there — but the page has no outbound message
  for a selection, and adding one is a design question about what a host does
  with it. Worth doing next; not smuggled in here.
- **Pinning exact JSON field names.** See the decision below.

## Decisions

### These are contracts of behaviour, not schemas

The spec says a node "carries the position and dimensions to draw it at". It does
not say `position: {x, y}`.

That is deliberate, and it is the same rule the product repos follow: a spec owns
what a neighbouring system can *notice*, and the implementation owns how it is
expressed. A client notices that it did not have to compute a layout. It does not
notice whether the field is called `position` or `at`.

The practical benefit is that the schema can evolve — the view models already
carry a `schema` field for exactly that — without every evolution being a spec
change and therefore a lie waiting to happen. The cost is that this store cannot
be used to generate types. That is the right trade for contracts between repos
that are all still moving: the generated-type version of this document would be
stale within a month, and a stale schema is worse than none.

Where a wire name genuinely is the contract — a request method, a message type —
the implementing repository owns it and the client follows the server's
advertisement.

### Capability advertisement is a requirement, not an implementation detail

It is tempting to leave "what if the server is old" to error handling. But a
client that discovers unsupportedness by issuing a request and catching a failure
cannot distinguish that failure from a broken document, and the user gets the
wrong message.

So: advertised at initialise, checkable before asking. The server already lists
its custom requests in the initialize result, so this is formalising something
that exists rather than inventing a mechanism.

### Layout stays on the server

The flow view model is returned already positioned. The alternative — each client
running its own layout — is how two IDEs end up drawing the same file differently,
and the difference is invisible until someone puts two screenshots side by side.

It also keeps the layout engine (ELK, in `dsl-kotlin`) in one place, where it is
already multiplatform.

### The readiness signal changes; the queue stays

The page's pending-message queue means a host can send a view model immediately
after loading and have it applied on mount. That is good design and the spec
preserves it — it is why "send before ready" is a scenario rather than a bug.

What changes is only the outbound signal: prefer the host-provided channel,
fall back to the parent frame. JCEF keeps working unchanged; VS Code starts
working. A few lines in `index.html`.

### The host serves the assets

The built page references `./assets/index-*.js`. Rather than asking the bundle to
accommodate every host's URI scheme, the host serves the files and rewrites the
references. The contract asks only that the page *tolerate* being served that way
— no absolute paths, no assumptions about origin, nothing loaded remotely.

This keeps host-specific knowledge in the hosts, which is where it can be fixed
without a release of the visualization package.

### Decision (task 1.1): the two requests' shape, and advertisement through `experimental.customRequests`

Decided by agent on 2026-09-16, pending review

This is the agent's assessment in place of a review with `zenwave-lsp`. The wire
names and fields below are what `zenwave-lsp` implements; they are recorded here
so the implementing agent does not have to choose them. They are **not** spec
requirements: the rule above that behaviour is the contract still holds.

**Is the initialize result enough for discovery?** Yes, with no new mechanism.
`ZenwaveLspServer.buildCapabilities()` (`lsp-jvm/.../ZenwaveLspServer.kt:253-268`)
already returns `capabilities.experimental.customRequests: string[]`, and the
VS Code client already reads exactly that (`advertisedRequests` in
`packages/extension/src/lsp/supervisor.ts`). The IntelliJ plugin calls the
server in-process and never reads the list, so adding names to it cannot affect
it. That covers the spec's three scenarios (current, older and newer server)
with a presence check. Per-request versioning is not needed now, because the
payloads carry a `schema` string (`zfl.eventflow.view@1`,
`zfl.mermaid.view@1`). If a request's parameters ever change incompatibly, it
gets a new method name rather than a version field.

Required of `zenwave-lsp` (tasks 2.3 and 4.3 in 002): every custom request the
server answers is listed in `customRequests`, and nothing it does not answer
is. The list is built from the same place that registers the handlers, so the
two cannot drift, and `lsp-js` returns the same list as `lsp-jvm`.

**Request 1, the EventFlow view models** (task 2.1), method
`zenwave/eventFlowViews`:

- params: `{ textDocument: { uri: string } }`
- result: `{ flowGraph: FlowViewModel, serviceGraph: ServiceViewModel }`. This is
  the JSON `ZflDiagramModelProvider` builds today and the webview's
  `renderBundle` payload takes, serialised as `dsl-kotlin`'s
  `GenerateFlowViewFromZfl` / `GenerateServiceViewFromZfl` output (each carrying
  its own `schema`). The host copies these two fields into `renderBundle`
  without changing them.

**Request 2, the preview representations** (task 2.2), method `zenwave/preview`
(the name `zenwave-platform-vscode` already uses in `docs/architecture.md` and
its supervisor tests):

- params: `{ textDocument: { uri: string }, sequenceRenderMode?:
  "SEPARATE_VARIANTS" | "ALT_BLOCKS" | "AUTO" }`. Only ZFL uses the mode; when it
  is absent the server uses `ALT_BLOCKS`, like
  `GenerateMermaidFromZfl.execute(text)`.
- result: `{ representations: [{ id: string, title: string, format: "MARKDOWN" |
  "MERMAID" | "HTML", content: string }], defaultRepresentationId: string }`. The
  format names match IntelliJ's `PreviewContentFormat` enum, so the in-process
  and wire routes use the same words. A client that meets an unknown `format`
  shows that representation as unavailable and does not guess.

**Errors, for both requests** (task 2.4; spec "a document that cannot be
read"):

- unparseable document: JSON-RPC error `-32803` (LSP `RequestFailed`) with
  `data: { kind: "documentUnreadable", diagnostics: Diagnostic[] }`;
- document neither open nor readable by the server: `-32803` with
  `data: { kind: "documentNotFound" }`;
- a document kind the request does not cover (such as a ZDL passed to
  `zenwave/eventFlowViews`): `-32803` with `data: { kind: "unsupportedDocument" }`;
- `-32601 MethodNotFound` only ever means that the server is too old. Clients
  must not reach it anyway, because they check `customRequests` first.

An empty model is a successful result with empty graphs or an empty list.
Errors are never encoded as results.

### Decision (task 1.2): both webview changes are acceptable, and JCEF is unaffected

Decided by agent on 2026-09-16, pending review

This is the agent's assessment in place of a review with
`zenwave-architectural-vistas`.

**JCEF impact: none.** `ZflJcefDiagramHost` (IntelliJ) never listens for
`webviewReady`. It treats the page as ready on CEF `onLoadEnd` for the main
frame and then calls `executeJavaScript("window.postMessage({type:
"renderBundle", …})")`. In JCEF the page is the top frame, so today's
`window.parent.postMessage` posts to the page itself and the page ignores it
(no handler for `webviewReady`). Changing how readiness is sent therefore
cannot change anything IntelliJ sees. Loading assets through the local request
handler (`JBCefLocalRequestHandler("http", "zfl-toolwindow")`) already requires
relative paths, which is the second change.

**Readiness signal (task 5.1): recommended shape** in
`apps/eventflow-webview`, sent once on `window` `load`:

```js
const msg = { type: "webviewReady" };
const host = window.__zenwaveHost;                          // 1. host-injected channel
if (host && typeof host.postMessage === "function") host.postMessage(msg);
else if (typeof acquireVsCodeApi === "function") {          // 2. VS Code webview
  window.__zenwaveVsCodeApi ??= acquireVsCodeApi();         //    acquired once, cached
  window.__zenwaveVsCodeApi.postMessage(msg);
} else if (window.parent && window.parent !== window) {      // 3. iframe parent
  window.parent.postMessage(msg, "*");
}                                                           // 4. top frame (JCEF): nothing to address
```

`acquireVsCodeApi` may only be called once per webview, so the page caches the
handle on `window.__zenwaveVsCodeApi`. A host script that needs the API reads
that global instead of calling `acquireVsCodeApi` again. The page listens for
inbound messages exactly as it does now (`window` `message` events, which is how
VS Code delivers them), so the inbound protocol, the pending-message queue and
the four message types stay the same.

**CSP (task 5.2): recommended shape.** The page has two CSP obstacles today:
the inline `<script>` bootstrap in `index.html` (the message listener, the
pending queue and the readiness signal) and the inline `<style>`. Move the
bootstrap into the built entry, as the first import in `main.tsx` or as a
separate `bootstrap.ts` emitted to `./assets/`, so that the only scripts left are
`<script type="module" src="./assets/…">`. A host can then allow them by source
or nonce, with no `'unsafe-inline'`. The listener must still be registered
before React mounts, so it goes in the first module evaluated. Move the inline
`<style>` into the CSS bundle. The font stack is already system fonts only;
5.2 confirms no `@font-face`/`url(http…)` remains in the built CSS. None of this
changes JCEF, which applies no CSP and serves the same files.

### Decision (task 1.4): credentials are handed over per request through a server-to-client `zenwave/credential` request; the browser-hosted server fetches with them itself

Decided by agent on 2026-09-16, pending review

**Chosen option:** the server asks the client for a credential when it needs
one, over the same LSP connection, on both transports (Node IPC and Web
Worker). The client owns identity, matches the origin and releases the
credential. The server applies it to that one fetch and keeps nothing. This is
the option the spec requirement ("The server asks the client for a credential
when it needs one") and `zenwave-platform-vscode` 003's design already assume.
Handing credentials over at initialise, or through `initializationOptions`, was
rejected because tokens expire mid-session and the server would hold secrets.

**Wire shape** (server → client request; `zenwave-lsp` implements the sender,
`zenwave-platform-vscode` the handler):

- method `zenwave/credential`
- params: `{ uri: string, origin: string, attempt: "initial" | "rejected",
  status?: number }`
  - `uri` is the full request URL with userinfo and fragment removed. The
    client uses it only for display and logging.
  - `origin` is `scheme://host[:port]`, computed by the server with the same
    normalisation the client uses, and it is what the client matches against.
  - `attempt: "rejected"` means a credential previously released for this origin
    was just refused (`status` 401/403). The client must not answer from a
    cached value it knows was refused, and should refresh the session
    (`vscode.authentication.getSession(…, { forceNewSession })` or equivalent)
    or decline.
- result: `{ type: "HEADER" | "QUERY", key: string, value: string } | null`.
  `null` means declined. The type names match `AuthenticationType`.
- The client advertises support at initialise as
  `initializationOptions.zenwave.clientCapabilities.credentialRequest: true`.
  The server sends `zenwave/credential` only when that flag is present (IntelliJ,
  in-process, does not set it and keeps its current behaviour).

**Server behaviour** (tasks 2.12, 2.13):

1. Fetch without credentials first.
2. On HTTP 401 or 403, or on 404 from a source configured under
   `config.sources.git` (GitHub and GitLab answer 404 for private content), and
   only if the client supports the request, send
   `zenwave/credential { attempt: "initial" }`.
3. With a non-null answer, retry once with
   `defaultLoaders(listOf(AuthenticationValue(key, value, type,
   urlMatcher = { url -> originOf(url) == origin })))` (the `FetchLoader` /
   `HttpLoader` it contains). This is an exact origin comparison, not the
   default `urlPatterns = listOf(".*")` and not a regex built from the host
   name. That loader list is created for this fetch only.
4. If the retry is 401/403, ask once more with `attempt: "rejected"`, and after
   that treat the candidate as failed. A `null` answer counts as a failed
   candidate, and resolution moves on to the next one (spec: "a client with
   nothing to give").
5. The credential is never cached, logged, put in an exception message (the
   existing `redactUri` / `redactErrorMessage` apply to query credentials), or
   sent to another origin. For redirects: the JVM `HttpLoader` already follows
   redirects by hand and re-evaluates `AuthenticationValue.matches(currentUri)`
   on each hop, so the origin matcher above stops a header crossing origins.
   `FetchLoader` depends on `fetch`, which removes `Authorization` on a
   cross-origin redirect in browsers and in Node's undici. Headers other than
   `Authorization` (for example `PRIVATE-TOKEN`) are not removed, so when a
   credential is present on Node, `FetchLoader` uses `redirect: "manual"` and
   repeats the match on each hop, as `HttpLoader` does. In a browser, a manual
   redirect's `Location` cannot be read (the response is `opaqueredirect`), so it
   uses `redirect: "error"` instead, and a redirected credentialed fetch fails as
   an unreachable candidate rather than forwarding the header. Query-type credentials are applied
   only to the initial URL today (see the comments in both loaders), which is the
   safe direction.

The client caches sessions itself (VS Code authentication sessions are cheap to
read silently), so asking on every fetch does not mean prompting on every fetch.

**Browser-hosted server specifics.** The Web Worker server fetches with
`FetchLoader` directly. The credential is not routed through the extension host,
which in vscode.dev is also a browser worker under the same CORS rules and gains
nothing. What a browser cannot get around is CORS: the default GitHub provider
expression `${server}/${domain.id}/${service.id}/raw/v${version}/${content.path}`
points at `github.com/…/raw/…`, which sends no CORS headers, so that content is
unreachable from a browser with or without a credential. That is a
content-resolution question for `zenwave-architecture`, raised as a spec question in
the step handoff, not something this decision can settle. Until it is settled, a
browser-hosted server reaches private GitHub content only through a manifest
whose `contentUrlExpression` targets a CORS-enabled endpoint, such as
`https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref=…` with
`Accept: application/vnd.github.raw`.

**Additive:** yes. It is a new request, sent only to clients that opt in.

### Decision (task 1.5): ZDL class diagrams become Mermaid upstream, in `dsl-kotlin`, alongside PlantUML rather than instead of it

Decided by agent on 2026-09-16, pending review

**Chosen option:** yes. ZDL gets a Mermaid class diagram generator in
**`dsl-kotlin` commonMain**, and `zenwave-lsp`'s `zenwave/preview` returns it for
ZDL documents. `ZdlToMarkdownPlugin.generatePlantUML` and the IntelliJ ZDL
preview are left as they are.

**Reason.** The generator has to live where the server can run it on every host.
`ZdlToMarkdownPlugin` is JVM-only (zenwave-sdk, Handlebars `.plantuml.hbs`
templates), so `lsp-js` could never call it. `dsl-kotlin` is already
multiplatform, already parses ZDL, and already holds the ZFL counterpart
(`GenerateMermaidFromZfl`). Keeping PlantUML where it is avoids disturbing
IntelliJ and the SDK's Markdown output. Moving IntelliJ onto Mermaid is a later,
separate choice, which 005's design anticipates.

**What is implemented:**

- `dsl-kotlin`: `io.zenwave360.language.zdl.application.GenerateMermaidFromZdl`
  with `fun execute(zdlContent: String): String`, returning a Mermaid
  `classDiagram` document. It covers the content of the PlantUML templates:
  aggregates, entities (with fields and types), enums (with values), services
  (with commands), and relationships with their cardinality. It must not return
  script, `click`/`callback` directives, links or remote references (spec: rendered
  content is inert). Tests use a ZDL fixture that the PlantUML generator also
  covers, so the two can be compared by hand.
- `zenwave-lsp`: for a ZDL document, `zenwave/preview` returns one
  representation `{ id: "class-diagram", title: "Class diagram", format:
  "MERMAID", content }`, which is also `defaultRepresentationId`. It never
  returns PlantUML, because no client that reads the wire can render it.
- IntelliJ (`ZdlPreviewEditor`), zenwave-sdk (`ZdlToMarkdownPlugin`): no change.

Implementation note by agent on 2026-09-16, pending review: implemented in
`dsl-kotlin` 835a75f (task 4.8). Choices the decision left open: (a) one
whole-document `classDiagram`, not the SDK's per-service/per-aggregate diagrams, since
`zenwave/preview` returns a single ZDL representation; (b) not carried over from the
PlantUML templates: javadoc, method annotations, lifecycle state machines and the
inputs/outputs/events namespaces (those types appear as classes with `<<input>>`,
`<<output>>`, `<<event>>` and a service `..>` dependency); (c) relationships come from the
top-level ZDL `relationships` with cardinality on both ends, and field references to
declared types are `*--` for embedded types and `-->` otherwise; (d) names are reduced to
`[A-Za-z0-9_]` identifiers, Mermaid keywords get a `_` suffix, and a renamed class keeps its
original name as a label; (e) a document with no declared types returns `classDiagram`
with `note "No types declared"`, because a class diagram without statements is not valid
Mermaid; (f) it is also exported to JS as `generateMermaidFromZdl(input)`.

**Additive:** yes. It is a new class in `dsl-kotlin` and a new result from a new
request. Accepted consequence: until IntelliJ moves over, the two IDEs show ZDL
diagrams in different notations. 6.4's comparison should record that as known,
not as a bug.

### Decision (task 2.10): the server keeps composing hierarchy labels, as plain IDE-neutral names

Decided by agent on 2026-09-16, pending review

**Chosen option:** keep the label composed by the server, with no change in
behaviour. `HierarchyNode.label` stays a required `String`.

**Reason.** It is the least disruptive option and it already meets the
requirement. The builders emit plain names (`ZflHierarchyBuilder`: `system.name`,
`service.name`, `command.name`, `"systems"`, `"flows"`, triggers joined with
`" and "`), and IntelliJ already decorates them on its own side
(`ZflHierarchyPresentationFormatter`: `"service …"`, `"start …"`). Dropping or
emptying the label would break the requirement's "a kind released after the
client" scenario and IntelliJ's formatter.

**Rule for `zenwave-lsp` to keep:** a label is the concept's name as written in
the model, or a short structural noun for grouping nodes. It never carries IDE
decoration: no keyword prefixes like `service `/`start `, no icons or emoji,
no counts, no markup. When a builder is touched, check that none of these
appear, and remove any that do (this is the requirement's "SHALL NOT encode a
particular IDE's presentation", not a new rule). Presentation input a client may
need goes in `kind` and `uiHints`.

### Decision (task 3.3): `documentationUrl` is always reported; `null` means nowhere to link, and a missing key means an SDK too old to say

Decided by agent on 2026-09-16, pending review

**Chosen option:** a three-state field, where "no documentation" and
"undeclared" merge into one state.

- zenwave-sdk: add `String documentationUrl() default ""` to
  `io.zenwave360.sdk.doc.@DocumentedPlugin`. `Help.buildHelpModel` puts a
  top-level key `documentationUrl` in every plugin's model, next to
  `configClassName`, so it appears in each entry of `plugins` in the catalogue
  and in single-plugin `-h json`. The value is the absolute `http(s)` URL when
  the annotation declares one, and **JSON `null`** otherwise. The key is always
  written. Every plugin in the catalogue already carries `@DocumentedPlugin`,
  because `buildHelpModel` reads `pluginDocumentation.hiddenOptions()`
  unconditionally.
- Consumers read it as follows:
  - **string**: link to it;
  - **`null`**: this plugin has nowhere to link to (spec: "a plugin with nowhere
    to send anyone"); show no link;
  - **key absent**: the SDK predates the field. Show no link, and do not work out
    an address from the plugin's name (spec: "not one the editor worked out").

**Reason.** A consumer does the same thing whether a plugin explicitly has no
documentation or simply never declared any: it shows no link. An annotation
cannot tell "left at the default" from "set to empty" without a sentinel value,
and a sentinel would only be spelled wrong by third-party plugin authors. The
distinction a consumer does act on is between a plugin with no documentation
and an SDK that cannot report it, and key presence gives that.

**Additive:** yes. It is a new key, and existing readers ignore unknown keys
(spec: "an answer from a newer SDK").

### Decision (task 4.6): JS exports return integers as plain JS numbers; negative numeric literals are parsed with their sign; the common model is unchanged

Decided by agent on 2026-09-16, pending review

**Chosen option:** fix both defects in `dsl-kotlin`, and change only what JS
consumers see.

1. **Integer representation, JS only.** In `src/jsMain/kotlin/NodeJsExports.kt`,
   `convertToPlain` (used by the exported `parseZdl` and `parseZfl`) gains a
   branch `is Long ->`. It returns a JS `number` (`value.toDouble()`) when
   `value` is within ±(2^53 − 1), and the decimal string `value.toString()`
   otherwise. The Kotlin model (`ZdlParser`/`ZflParser` output: `Long` for `INT`,
   `String` for `NUMBER`) is **unchanged**, so JVM consumers (IntelliJ plugin,
   zenwave-sdk, zdl-jvm users) see exactly what they see today.
2. **Sign.** `Zdl.g4` and `Zfl.g4` both define `INT: DIGIT+` and
   `NUMBER: DIGIT+ ([.] DIGIT+)?` with no minus token, so `neg -2` lexes as an
   unrecognised `-` followed by `2`. Change both grammars to
   `INT: '-'? DIGIT+ ;` and `NUMBER: '-'? DIGIT+ ([.] DIGIT+)? ;`.
   `getValueText` already calls `text.toLong()` / keeps the text, so `-2` becomes
   `Long(-2)` on the JVM, `-2` in JS, and `"-2.5"` for a decimal. The `'--'` CLI
   option token and `POLICY_ID` (which may contain `-`) are unaffected: `--` is
   longer than any `INT` match, and `POLICY_ID` must start with a letter. Spans
   (task 4.1) cover the sign.

**Who sees what:**

- JS consumers of `@zenwave360/dsl` (`zenwave-platform-vscode`'s
  `packages/extension/src/sdk/model.ts`, `zdl-vscode`'s parser and preview):
  integers change from a Kotlin `Long` object (`{"h2_1":3,"i2_1":0}`) to `3`.
  This is **not additive**, but the previous shape used compiler-mangled field
  names that change between Kotlin versions and was never usable as a value.
  Both known consumers already handle it: `model.ts` accepts
  `typeof value === 'number'`, and `String(value)` gives `"3"` for both shapes,
  and `zdl-vscode`'s renderer already has a `typeof value === 'number'` branch.
  The VS Code `String(value)` stopgap can stay or be removed.
- Every consumer (JVM and JS): a negative literal that used to be mis-parsed
  (sign dropped, with a token-recognition error) now parses to the negative
  value. This is a bug fix, and it only changes documents that were already
  wrong.
- Not changed: decimals stay strings everywhere. Changing them would change the
  JVM model, and the comment in `ZdlListenerUtils` records why they are strings.
  This is raised as a spec question because the `dsl-parser-output` wording
  says "numbers as numbers".

Implemented by agent on 2026-09-16 in `dsl-kotlin` 835a75f (task 4.7) as decided,
with no deviation: the grammar change adds no token types, and every .zdl/.zfl/.jdl file
under the workspace (383) lexes to an identical token stream before and after. Only text
with a `-` directly before a digit lexes differently (for example `1-2` is now `1`, `-2`
instead of `1`, an error token, `2`); none of those forms was valid ZDL or ZFL.

**Release note for `dsl-kotlin`:** a rebuilt JS package is needed (see 4.5), and
the change is flagged in its README as "integers in parseZdl/parseZfl output are
now JS numbers".

### Decision (tasks 2.5–2.8): unopened reads, declaring documents, `viewNodeIds` and `zenwave/symbolAt`

Decided by agent on 2026-09-16, pending review

These are the wire shapes `zenwave-lsp` d7156e7 implements, in lsp-jvm and lsp-js alike (samples from both
servers compare equal). All changes to existing shapes are additive.

**`zenwave/hierarchy` for a document that is not open** (task 2.6). Params unchanged (`{uri}`). An open
document is answered from the editor's content; otherwise the server reads it with the same platform loaders
the manifest's content resolution uses (files on the JVM and Node, `http(s)` everywhere). Failures:
- not open and unreadable → `-32803` with `data: {kind: "documentNotFound"}` (the 1.1 error vocabulary);
- a document no language module builds hierarchies for (by extension) → `[]`, without reading it;
- missing `uri` → `-32602`.
A browser-hosted server has no file system and no reader for editor schemes such as `vscode-vfs:`, so those
answer `documentNotFound`.

**Nodes that point at the declaring document** (task 2.5). No new field: `sourceUri`/`sourceRange` of a ZFL
`system` node point at the ZDL named by its `@zdl` (start of the document, since a ZDL has no system
declaration of its own), and those of `service` and `command` nodes at the ZDL's `service` / service method
when the ZDL declares them. The ZDL is the editor's content when open, otherwise read; if it cannot be reached
the nodes stay in the flow. Each relocated node gains a related resource `{targetKind: "reference",
relationType: "referenced-by", category: "zfl", uri: <flow>, range: <where the flow names it>}`. `id`,
`label`, `kind` and `language` are unchanged. `textDocument/documentSymbol` is not affected: it stays within
the document.

**Matching hierarchy and view-model nodes** (task 2.8). Hierarchy nodes gain `viewNodeIds: string[]` (always
present, possibly empty): the ids, in the same document's `zenwave/eventFlowViews` result, of the flow nodes,
service nodes and service groups that stand for the node's concept. Only ids that the document's view models
actually contain are listed, so an empty list means "no counterpart". For ZFL: `command` → `command:<name>`;
`start` → `event:<name>`; `event` → `event:<name>` and, under a `when` with a service,
`event:<name>@<System>><Service>`; `policy` → `policy:<triggers joined by ",">:<command>`; `service` →
`group:<System>><Service>`; `system` → `group:<System>` when present. Other kinds and other languages carry
`[]`. The same view-model id may be listed by several hierarchy nodes (an event appears under its `when` and
under an outcome); they are the same concept.

**Position to symbol** (task 2.7). New request `zenwave/symbolAt`, advertised in `customRequests`:
- params: `{textDocument: {uri}, position: {line, character}}` (LSP `TextDocumentPositionParams`);
- result: `{uri, semanticId, range?}` (`uri` and `semanticId` are exactly the params of
  `zenwave/forwardReferences` / `zenwave/reverseReferences`), or `null` when nothing is declared or referenced
  at the position;
- errors: document not open → `-32803` `documentNotFound`; missing `textDocument.uri` or `position` → `-32602`.
The server uses the language module's symbol at the position unless the cross-reference index records a
narrower symbol there, so the id is one the reference requests know. It is not `conceptAt`: architecture
identities do not exist in committed `zenwave-lsp` code.

### Decision (task 5.5): the page carries a protocol version; hosts pin the package and check the version

Decided by agent on 2026-09-17, pending review

`zenwave-platform-vscode` 004 task 1.5 asks how the bundle version is pinned so a
protocol change cannot break the diagram silently. The page had no version a host
could see: IntelliJ syncs a directory, and the ready message was `{type:"webviewReady"}`.

- **Distribution:** the built page is published as its own package,
  `@zenwave360/vistas-eventflow-webview` (`zenwave-architectural-vistas/packages/eventflow-webview`),
  with the page under `webview/` and no runtime dependencies. A host pins an exact
  version in its lockfile. IntelliJ keeps `pnpm sync:intellij`.
- **Protocol version:** an integer, `1` today, separate from the package version.
  It is stated in `webview/protocol.json`, in `<meta name="zenwave-webview-protocol-version">`
  in `index.html`, as `EVENTFLOW_WEBVIEW_PROTOCOL_VERSION` exported by the package,
  and at run time in the ready message, which gains an additive payload:
  `{type:"webviewReady", payload:{protocol:"zenwave.eventflow.webview", protocolVersion:1}}`.
  A host that ignores `payload` is unaffected.
- **When it changes:** only for a change a host cannot ignore (a message removed or
  renamed, or a payload field changing meaning), together with a major package bump.
  New optional fields and new message types keep it, since the page and hosts ignore
  what they do not know.
- **Host obligation:** check the version at build time and on `webviewReady`, and show
  an error state naming the mismatch rather than a blank diagram. A ready message
  without `payload` comes from a page that predates versioning.

Rejected: using the npm package version as the protocol version (every renderer fix
would look like a protocol change), and a version query message (a page too old to
answer it would be indistinguishable from one still loading).

## Risks / Trade-offs

- **A behavioural contract cannot be mechanically verified.** Nothing fails a
  build when a server stops returning positions. The mitigation is that each
  requirement has scenarios a test can be written from, in each repository — but
  those tests have to be written there, and this store cannot make anyone write
  them.
- **Two producers of the same thing, for now.** IntelliJ in-process, the server
  over the wire. They can drift, and the contract is what makes the drift a
  reportable bug rather than a puzzle. Converting IntelliJ closes it properly.
- **ZDL previews are PlantUML today**, and the VS Code client renders Mermaid.
  This contract does not settle which formats a server may return — it says the
  format is declared. That is enough for a client to refuse gracefully, but the
  underlying question, whether ZDL diagrams become Mermaid upstream, is a real
  decision waiting in `zenwave-lsp` / `dsl-kotlin`.
- **The bundle is distributed by a sync script**, and a synced directory has no
  version. Writing down the protocol makes a skew diagnosable; it does not make
  it detectable. Publishing the bundle as a versioned package would, and is worth
  doing separately.
