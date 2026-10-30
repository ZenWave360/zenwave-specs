# Glossary

<a id="glossary"></a>

The words this manual uses, in one place. Each entry points at the document that
defines the term properly.

## The architecture

| Term | Meaning | Defined in |
| --- | --- | --- |
| **Concept** | An architectural thing that exists independently of how it is written down: a domain, a service, a command, an event | [world model §3.1](world-model.md#wm-3-1) |
| **Representation** | A concrete expression of a concept in a formalism: a ZDL event, an AsyncAPI message | [world model §3.2](world-model.md#wm-3-2) |
| **Location** | Where a representation physically lives. Never a node, always provenance | [world model §3.3](world-model.md#wm-3-3) |
| **Semantic ID** | The identity of a concept, such as `zw:sales/ordering/order-service/event/OrderPlaced`. Readable, hierarchical, independent of files | [workspace model §8](../zenwave-architecture/workspace-model.md#wmodel-8) |
| **Alias** | An old ID that keeps resolving after a semantic move. Append-only | [world model §4.4](world-model.md#wm-4-4) |
| **Provenance** | Why the platform believes a fact, not only where it was read | [world model §5.2](world-model.md#wm-5-2) |
| **Confidence** | How a relationship is known: `DECLARED`, `RESOLVED`, `INFERRED_EXACT`, `INFERRED_HEURISTIC` | [world model §5.3](world-model.md#wm-5-3) |
| **Manifest** | `zenwave-architecture.yml`: the hand-written entry point declaring domains, services and artifacts | [source resolution](../zenwave-architecture/source-resolution-specification.md) |
| **Workspace** | What one manifest anchors. It can span repositories and remote sources. Not a folder and not a Git repository | [workspace model §7](../zenwave-architecture/workspace-model.md#wmodel-7) |
| **Workspace configuration** | `.zenwave/config.yml`, a local file naming the manifest from a developer's checkout | [LSP client](../zenwave-platform-vscode/lsp-client.md#lc-r5) |
| **Architecture graph** | Nodes and relationships derived from the sources. Rebuildable, never the source of truth | [workspace model](../zenwave-architecture/workspace-model.md) |
| **Workspace Query API** | The one contract adapters use to read the graph | [workspace model §12](../zenwave-architecture/workspace-model.md#wmodel-12) |
| **Adapter** | A surface over the Query API that adds no semantics: MCP, the LSP architecture plane, the Web Explorer | [world model §6.2](world-model.md#wm-6-2) |
| **Binding** | The validated link from a logical operation to the API or channel that transports it | [operation bindings](../zenwave-architecture/architecture-operation-bindings.md) |

## The languages

| Term | Meaning | Defined in |
| --- | --- | --- |
| **ZDL** | ZenWave Domain Language: aggregates, entities, commands, events and services inside a bounded context | [parser contracts](../dsl-kotlin/parser-architecture-and-contracts.md) |
| **ZFL** | ZenWave Flow Language: business flows across bounded contexts, as policies connecting commands and events | [parser contracts](../dsl-kotlin/parser-architecture-and-contracts.md) |
| **Outcome** | A named, mutually exclusive branch of a ZFL command | [outcome spec](../dsl-kotlin/outcome-spec.md) |
| **Plugin declaration** | A `config { plugins { ... } }` entry in a ZDL file: one configured SDK run | [SDK runner](../zenwave-platform-vscode/sdk-runner.md) |
| **Plugin catalogue** | What the SDK reports about its own plugins and their options | [plugin catalogue](../flows/sdk-plugin-catalogue.md) |

## The language server

| Term | Meaning | Defined in |
| --- | --- | --- |
| **Document plane** | Features that need only a file and what it directly references | [LSP adapter §3.1](../zenwave-lsp/lsp-adapter.md#lsp-3-1) |
| **Architecture plane** | Features answered from the graph | [LSP adapter §3.2](../zenwave-lsp/lsp-adapter.md#lsp-3-2) |
| **DocumentSymbolRef** | A URI plus a path inside the document. A location, never an identity. Written `uri#<path>` on the wire | [LSP adapter §2.2](../zenwave-lsp/lsp-adapter.md#lsp-2-2) |
| **Language module** | The extension point implementing one language inside the server | [server architecture](../zenwave-lsp/server-architecture.md) |
| **Hierarchy** | The tree of concepts a document takes part in | [visualization requests](../flows/lsp-visualization-requests.md#lvr-r5) |
| **Representation (preview)** | One rendered view of a model returned by `zenwave/preview`. Unrelated to a representation of a concept; the context always tells them apart | [visualization requests](../flows/lsp-visualization-requests.md#lvr-r3) |

## Visualisation

| Term | Meaning | Defined in |
| --- | --- | --- |
| **Vista** | A projection of the graph as a diagram. Layout and grouping stay out of the graph | [world model §6.3](world-model.md#wm-6-3) |
| **EventFlow** | The interactive React Flow diagram of a ZFL flow, with its Service Map | [EventFlow](../flows/eventflow.md) |
| **View model** | The already positioned data a renderer draws: `FlowViewModel`, `ServiceViewModel` | [decision 0001](../decisions/0001-layout-stays-on-the-server.md) |
| **Preview** | The read-only Mermaid or Markdown rendering of a model. Not EventFlow | [model preview](../zenwave-platform-vscode/model-preview.md) |
| **Page** | The built webview that hosts EventFlow, embedded by IDEs | [webview protocol](../flows/eventflow-webview-protocol.md) |

## Clients

| Term | Meaning | Defined in |
| --- | --- | --- |
| **Host** | The runtime a client finds itself in: VS Code desktop, VS Code web, IntelliJ | [the stack](stack.md#where-each-thing-runs) |
| **Host capability** | What a host can actually do: spawn a process, reach a disk, run a language server | [host capabilities](../zenwave-platform-vscode/host-capabilities.md) |
| **Thin client** | Launches the server, renders results, handles deep links. Never parses, resolves or remembers | [LSP adapter §10](../zenwave-lsp/lsp-adapter.md#lsp-10) |
| **Workspace trust** | VS Code's Restricted Mode. Separate from a host capability | [LSP client](../zenwave-platform-vscode/lsp-client.md#lc-r10) |

## This manual

| Term | Meaning |
| --- | --- |
| **exists** | True in the code today |
| **partial** | Some of it is true; the rule says what is missing |
| **proposed** | Wanted, not built |
| **superseded** | Replaced; the rule says by what |
| **Arcadia Editions** | The fictional publisher used as the reference example throughout |
