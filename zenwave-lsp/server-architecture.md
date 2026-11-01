# Language server architecture

<a id="server-architecture"></a>

What the ZenWave language server is, what is inside it, and what its clients can rely on.
It serves ZDL, ZFL, the architecture manifest, OpenAPI, AsyncAPI and Avro from one shared
Kotlin Multiplatform core. The line between its document and architecture sides is the
[LSP adapter](lsp-adapter.md), and the requests specific to ZenWave are
[visualization requests](../flows/lsp-visualization-requests.md).

**Status:** 2026-10-30. Rewritten from the earlier architecture notes, core spec and coding
plans, which described several generations of the server at once. Everything marked *exists*
was checked in the checked-out repository.

## Scope

The server owns turning a document into a semantic model, normalising parser problems into
diagnostics, mapping a cursor position to a semantic location, and answering editor queries
from that.

It does not own grammar or parsing (`dsl-kotlin`), architectural semantics
(`zenwave-architecture`), IDE rendering or presentation, how a flow is drawn
(`zenwave-architectural-vistas`) or code generation (`zenwave-sdk`).

## Modules

```
lsp-core (Kotlin Multiplatform)
├── contracts/       DTOs and LanguageModule, the one extension point
├── platform/        ZenwaveLanguageServer facade, session store, cache, document reader
├── zdl/ zfl/        language modules over dsl-kotlin
├── manifest/        language module over zenwave-architecture's manifest
├── spec/openapi/ spec/asyncapi/ avro/    language modules over json-schema-ref-parser-kmp
├── jsonpath/        the ZenWave semantic pointer evaluator
├── xref/            CrossReferenceIndex
├── architecture/    WorkspaceArchitecturePlane, the facade over WorkspaceQueryApi
├── visualization/   view models and preview representations
└── config/          .zenwave/config.yml parsing

lsp-jvm   LSP4J transport. Used in process by IntelliJ
lsp-js    vscode-languageserver transport. Two self-contained bundles, Node IPC and Web Worker
```

## Facts

<a id="ls-t1"></a>
**LS-T1 (exists). Language modules.** Each implements `LanguageModule`, and the facade routes to
it. Completion is not implemented by any of them, and neither transport advertises it.

| Module | Files | Hover | Definition | Diagnostics | Hierarchy | References | Format |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ZDL | `.zdl` | yes | yes | yes | yes | yes | yes |
| ZFL | `.zfl` | yes | yes | yes | yes | yes | yes |
| Manifest | `.yml` `.yaml` `.json` | yes | yes | yes | yes | no | no |
| OpenAPI | `.yml` `.yaml` `.json` | yes | yes | yes | yes | yes | no |
| AsyncAPI | `.yml` `.yaml` `.json` | yes | yes | yes | yes | yes | no |
| Avro | `.avsc` | yes | yes | yes | yes | yes | no |

These flags say a module implements a feature, not how complete it is. See
[navigation](navigation-spec.md) for what crossing documents actually does.

<a id="ls-t2"></a>
**LS-T2 (exists). Activation.** `.zdl`, `.zfl` and `.avsc` activate by extension; `.yml`, `.yaml`
and `.json` by lightweight content inspection. A client should still send only the documents it
means to, because of [LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15).

<a id="ls-t3"></a>
**LS-T3 (exists). Identity inside a document.** A `DocumentSymbolRef` is a URI, a semantic path and
optionally a range, written `uri#<path>` where the reference requests want one. Root is `$`; dot
notation for simple names, bracket notation for anything ambiguous; a name is preferred over an
index whenever one exists. It is a location, never an identity: see
[LSP adapter §2](lsp-adapter.md#lsp-2). OpenAPI, AsyncAPI and Avro paths look like
`file:///workspace/openapi.yml#$['paths']['/orders/{id}']['get']`.

<a id="ls-t4"></a>
**LS-T4 (exists). Documents.** `DocumentSessionStore` holds open snapshots, and a parsed cache in
`ZenwaveLanguageServer` is invalidated on change and close, so one document version is parsed once
across hover, diagnostics and hierarchy. An unopened document is read by the hierarchy request
through json-schema-ref-parser-kmp's platform loaders: files on the JVM and Node, `http(s)`
everywhere. A browser-hosted server has no filesystem and cannot read editor schemes such as
`vscode-vfs:`, so those answer `documentNotFound`.

<a id="ls-t5"></a>
**LS-T5 (exists). Startup.** The client passes resolved configuration in
`initializationOptions`:

```json
{ "zenwave": { "configUri": "file:///workspace/.zenwave/config.yml",
               "projectManifestUri": "file:///workspace/architecture/zenwave-architecture.yml",
               "clientCapabilities": { "credentialRequest": true } } }
```

The server does not guess where the manifest is when the client can say. `.zenwave/config.yml`
holds `project-manifest: <path>`, relative to the workspace root, not to `.zenwave`.

<a id="ls-t6"></a>
**LS-T6 (exists). Capabilities.** `initialize` returns the standard capabilities the modules
support, plus `capabilities.experimental`: `moduleSelectors`, `customRequests` and `customNotifications`. See
[decision 0002](../decisions/0002-server-advertises-its-requests.md). A client branches on this,
not on a version.

<a id="ls-t7"></a>
**LS-T7 (exists). The transports differ today.** `lsp-jvm` adds `zenwave/conceptAt` and
`zenwave/workspaceStatus`, which `lsp-js` does not answer. Flow geometry also differs, because the
JVM and JS `ElkFlowLayoutEngine` actuals use different node dimensions. Everything else was compared
equal over a wire on 2026-09-16.

<a id="ls-t8"></a>
**LS-T8 (exists). The parser is a library.** ZDL and ZFL are parsed by an in-process `dsl-kotlin`
call behind a thin adapter, and the spec formats by `json-schema-ref-parser-kmp`. Nothing is called
over RPC or a shell.

## Rules

<a id="ls-r1"></a>
**LS-R1 (exists). All semantics are in the core.** Transports delegate to the facade and contain no
language logic. A new language is a new `LanguageModule`.

<a id="ls-r2"></a>
**LS-R2 (exists). Diagnostics come from the parser.** The server normalises them and adds no second
validation of its own. Workspace diagnostics keep their graph code and severity, as
[LSP adapter §6](lsp-adapter.md#lsp-6) requires.

<a id="ls-r3"></a>
**LS-R3 (exists). OpenAPI, AsyncAPI and Avro are first-class.** A standalone spec file gets full
support without a ZenWave project around it, and cross-language enrichment is additive.

<a id="ls-r4"></a>
**LS-R4 (exists). Additive by default.** Clients ignore unknown fields and treat optional ones as
optional. A request whose parameters change incompatibly gets a new method name.

## Open questions

<a id="ls-q1"></a>
**LS-Q1. Should the transports' surfaces be one list?** See LS-T7. The fix is `conceptAt` and
`workspaceStatus` in `lsp-js`, or a decision that they differ.

<a id="ls-q2"></a>
**LS-Q2. Which performance guardrails are still needed?** The parsed cache from the old refactoring
plan exists. The rest of that plan (module binding cache, cross-reference secondary index, background
compute, workspace-scale metrics) was not checked. It is in git history.

<a id="ls-q3"></a>
**LS-Q3. How is a relative resource path resolved in every case?** Inherited from the original notes:
`ResourceReferenceResolver` and `StrictVariableInterpolator` exist in `config/`, and their relation to
the manifest's own [source resolution](../zenwave-architecture/source-resolution-specification.md) was
not checked.

## Superseded ideas worth knowing

Earlier documents described a "Language Domain Server Protocol" with `ldsp/*` methods, `{{root}}` variable
expansion, `maven.repositories` and `specs` in the manifest, and a `zenwave://maven/...` scheme with a
dedicated `MavenResourceLoader`. None of it exists. Content is resolved by the manifest's
`contentResolution`, including its [Maven source](../zenwave-architecture/source-resolution-specification.md#sr-maven),
with `${...}` expressions. Don't confuse them when reading old material.

## Sources

`lsp-core/src/commonMain`, `lsp-jvm/.../ZenwaveLspServer.kt`,
`lsp-js/.../ZenwaveJsLanguageServer.kt`, `lsp-js/README.md`, read on 2026-10-30. The wire comparison is
from `ZenwaveLspWireTest`, `nodeIpcTest` and `WorkerWireTest`, as recorded in change 001. Originals in git history.
