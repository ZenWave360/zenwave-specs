# The stack

<a id="stack"></a>

Which repository does what, how they depend on one another, and where the code runs.
Read it after [what the platform is](zenwave-platform.md) and the
[world model](world-model.md).

**Status:** 2026-10-30. Checked against the build files and packages of the checked-out
repositories. What is finished and what is not is in [status](status.md).

## The rule behind the layering

If a question is about what a model **means**, the answer is in Kotlin Multiplatform,
once. If it is about how a diagram is **drawn**, the answer is in the vistas. An IDE
client decides how that meaning is **presented and driven** in its host. A client that
starts to have an opinion about the first two is the signal to push the work down.

## Layers

```
 People and agents
   │
   ├── VS Code client           IntelliJ plugin           MCP agents
   │   zenwave-platform-vscode  ZenWaveDomainModelEditor  (no server yet)
   │        │ LSP, JS server         │ in process              │
   │        ▼                        ▼                         │
   │   zenwave-lsp   lsp-js · lsp-jvm · lsp-core               │
   │        │                                                  │
   │        ▼                                                  ▼
   │   zenwave-architecture   workspace-runtime → architecture-graph → architecture-manifest
   │        │                                  workspace-mcp · workspace-cli
   │        ▼
   │   dsl-kotlin   dsl-kotlin (ZDL, ZFL parsers) · dsl-views · dsl-docs
   │        │
   │        ▼
   │   json-schema-ref-parser-kmp
   │
   └── zenwave-architectural-vistas   renderers and the embedded webview page
         receives positioned view models; depends on nothing above
```

Dependencies point one way. Nothing in `zenwave-architecture` knows about LSP
([world model §6.4](world-model.md#wm-6-4)), and no visualization package depends on an
IDE ([vistas scope](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md)).

## Repositories

| Repository | Owns | Published as | Documents |
| --- | --- | --- | --- |
| `json-schema-ref-parser-kmp` | JSON and YAML parsing, `$ref` resolution, loaders. Also used outside the platform | Maven, npm | not yet in this manual |
| `dsl-kotlin` | ZDL and ZFL grammar and parsers, view models, ELK layout, Mermaid generation, Markdown documentation. Also used outside the platform | `@zenwave360/dsl`, Maven | [dsl-kotlin/](../dsl-kotlin/parser-architecture-and-contracts.md) |
| `zenwave-architecture` | Manifest, content resolution, graph, Query API, MCP tools, `validate` CLI: all architectural semantics | `io.zenwave360.architecture:*` | [zenwave-architecture/](../zenwave-architecture/workspace-model.md) |
| `zenwave-lsp` | The language server: language modules, session, cross-references, JVM and JS transports | `@zenwave360/lsp-js`, Maven | [zenwave-lsp/](../zenwave-lsp/server-architecture.md) |
| `zenwave-architectural-vistas` | EventFlow and Service Map renderers, EventCatalog components, the webview page | `@zenwave360/vistas-*` | [scope](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) |
| `zenwave-platform-vscode` | The VS Code client, desktop and web | Marketplace and Open VSX, `ZenWave360.zenwave-platform` (not yet published) | [zenwave-platform-vscode/](../zenwave-platform-vscode/architecture.md) |
| `zenwave-sdk` | Code generation from ZDL, OpenAPI and AsyncAPI. JVM only, through JBang | Maven | not described here; [flows](../flows/sdk-plugin-catalogue.md) mention it where they reach it |
| `ZenWaveDomainModelEditor` | The IntelliJ plugin | JetBrains Marketplace | not described here |

Except for `dsl-kotlin` and `json-schema-ref-parser-kmp`, everything here exists to
serve the platform, so all its documentation lives in this one manual.

## Where each thing runs

| Host | Parsers and semantics | Language server | SDK generation | Diagrams |
| --- | --- | --- | --- | --- |
| VS Code desktop | Kotlin/JS | `lsp-js`, Node child process over IPC | Yes, a terminal task | Webview |
| VS Code web | Kotlin/JS | `lsp-js`, Web Worker | Never: hidden, not broken | Webview |
| IntelliJ | Kotlin/JVM | `lsp-jvm`, **in process, no wire** | Yes, a terminal | JCEF |

Two consequences come up all the time.

**VS Code is the only client that crosses a wire.** IntelliJ calls the server as a
function, so protocol problems only show up in VS Code, and the two routes can drift.
See [decision 0006](../decisions/0006-one-javascript-server-in-the-extension.md).

**The browser is a first-class target.** Every published JS artifact has to load in a
browser and a Web Worker with no Node, verified where it is built. See
[KMP browser runtime](../flows/kmp-browser-runtime.md).

## How a model reaches a screen

Following a `.zfl` file through VS Code:

1. The client resolves one [manifest for the workspace](../zenwave-platform-vscode/lsp-client.md#lc-r5)
   and starts the server with it.
2. The editor sends the document with `textDocument/didOpen`.
3. A feature asks through the supervisor, which answers `ok`, `no-server`, `unsupported`
   or `failed`, never a thrown error.
4. `zenwave/eventFlowViews` parses the flow and returns
   [positioned view models](../decisions/0001-layout-stays-on-the-server.md).
5. The client forwards them untouched to the page
   ([panel](../zenwave-platform-vscode/eventflow-panel.md#ep-r5)), and the page draws them.

The end-to-end version, with who owns each seam, is [EventFlow](../flows/eventflow.md).

## What crosses repositories

| Contract | Between | Document |
| --- | --- | --- |
| What the parsers return | `dsl-kotlin` and its consumers | [DSL parser output](../flows/dsl-parser-output.md) |
| The `zenwave/*` requests | `zenwave-lsp` and IDE clients | [visualization requests](../flows/lsp-visualization-requests.md) |
| The webview messages | vistas and IDE hosts | [webview protocol](../flows/eventflow-webview-protocol.md) |
| The SDK's plugin description | `zenwave-sdk` and IDE clients | [plugin catalogue](../flows/sdk-plugin-catalogue.md) |
| What libraries owe a browser | every KMP library | [KMP browser runtime](../flows/kmp-browser-runtime.md) |
| Transitions without an id | `dsl-kotlin`, `zenwave-sdk` | [transitions without id](../flows/transitions-without-id.md) |

## Sources

Read on 2026-10-30: `settings.gradle.kts` and `build.gradle.kts` of the Kotlin
repositories; `packages/extension/package.json` and `src/host/capabilities.ts` of the
VS Code client; `lsp-js/README.md`; `apps/` and `packages/` of the vistas. The IntelliJ
row comes from the earlier verified notes in the VS Code design and was not re-read.
