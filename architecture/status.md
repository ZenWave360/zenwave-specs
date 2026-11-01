# Status

<a id="status"></a>

What is built, what is not, and where the documents and the code still disagree. Use it to decide
what to believe before reading further, and as the start of any plan. Open items are in the
[backlog](../work/backlog.md).

**Status:** taken on 2026-10-30, reading the checked-out code of each repository and the old task
lists. Nothing was built or run for this, so "works" below means *implemented and recorded as tested
at the time*, not re-tested today. Treat it as a dated snapshot.

## By capability

| Capability | State | What's missing | Read |
| --- | --- | --- | --- |
| ZDL and ZFL parsers, formatter, view models, layout, Mermaid | **Works**, JVM and JS | Decimals stay strings in the JS output | [parser contracts](../dsl-kotlin/parser-architecture-and-contracts.md) |
| Manifest and content resolution | **Works**, all five sources | Whether the browser can reach private GitHub ([decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md)) | [source resolution](../zenwave-architecture/source-resolution-specification.md) |
| Architecture graph and Query API | **Works** as a library | Rename and API-only scenarios not confirmed here | [workspace model](../zenwave-architecture/workspace-model.md) |
| `validate` CLI | **Works** (`workspace-cli`) | | [workspace model §13](../zenwave-architecture/workspace-model.md#wmodel-13) |
| **ZenWave MCP** | **Tools only** | No server: nothing an agent can connect to | [MCP adapter](../zenwave-architecture/mcp-adapter.md) |
| Web Explorer | **VS Code web mode**, no separate site ([decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md)) | Inventory per host, deep links, architecture requests in `lsp-js` | [roadmap](../roadmap/web-explorer.md) |
| Language server, document plane | **Works**, JVM and JS, except completion | Completion. A document can stall `lsp-js` ([LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15)) | [server architecture](../zenwave-lsp/server-architecture.md) |
| Language server, architecture plane | **Started** | `conceptAt`, `workspaceStatus` on JVM only; `zenwave/*` pass-through, staleness and deep links not built | [LSP adapter](../zenwave-lsp/lsp-adapter.md) |
| Live configuration, open-document overlay | **Not built** | Server ignores changes; editing a remote-resolved file shows the committed version | [LVR-R4](../flows/lsp-visualization-requests.md#lvr-r4), [LVR-R12](../flows/lsp-visualization-requests.md#lvr-r12) |
| Credentials | **Client built, server not** | The server never asks | [decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md) |
| Cross-document references | **Partial** | Reverse references always empty; results have no target range | [LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9) |
| EventFlow page and renderer | **Works** | Node actions ([EF-R4 to EF-R9](../flows/eventflow.md#ef-r4)). The view selector ([EF-R3](../flows/eventflow.md#ef-r3)) is on a branch, not reviewed, and VS Code gets it only when the page is published | [EventFlow](../flows/eventflow.md) |
| VS Code: SDK runner, trees, diagram, connection | **Works**, desktop and web | Manual checks; see below | [client architecture](../zenwave-platform-vscode/architecture.md) |
| VS Code: model preview | **Partial** | ZFL, ZDL and `.zw` built on branches across `dsl-kotlin`, `zenwave-lsp` and the client, not published. Markdown, `.zw` and the catalogue are not reviewed. Modes, ZDL Diagrams and page changes are agreed and not built (backlog PX) | [model preview](../zenwave-platform-vscode/model-preview.md) |
| VS Code: publishing | **Pipeline built** | Marketplace accounts, tokens, a first release; the extension still pins snapshot versions of packages now on npm | [release](../zenwave-platform-vscode/release.md) |
| Transitions without id (SDK, ZDL) | **Works** | Optional AsyncAPI adapter case | [flow](../flows/transitions-without-id.md) |
| Resource discovery, Event Storming whiteboard | **Designed** | Everything | [roadmap](../README.md#part-vi-what-comes-next) |

## Where documents and code disagreed

Each was found while integrating this manual. They are recorded here because the disagreement itself
is the useful fact.

**Settled by reading the code, and fixed in the document:**

| Claim | Reality |
| --- | --- |
| Both IDE clients live in `zenwave-lsp` | They have their own repositories ([decision 0005](../decisions/0005-ide-clients-live-in-their-own-repositories.md)) |
| ZFL is written with `command` and `event` in `when` blocks | `when X do y { service ...; emits Z }`, `do y { response Z }`, `call`, `on` |
| Diagnostic codes look like `ZW1042` | Kebab-case strings, [the catalogue](../zenwave-architecture/diagnostics.md) |
| `lsp-js` is a stub, and web LSP needs porting | Two working bundles, Node IPC and Web Worker |
| `@zenwave360/dsl` and friends are not on npm | They are: `dsl` `1.10.0`, the vistas `0.1.0`, `lsp-js` pre-releases only |
| Variables use `{{root}}`, Maven resources use `zenwave://maven/` | `${...}` expressions and the `maven` source. Neither older form exists |
| A manifest has a `workspace:` block | `config` and `domains` |
| A preview renderer in Handlebars comes first | The server is the provider. `packages/preview-renderer` is removed on the preview branch |
| `.zw` and `.zdl` share one VS Code language id | Same language, but `.zw` has had its own language id and icon since the brand change |
| Reverse provenance is an open question | `WorkspaceQueryApi.at` exists |

**Not settled: these need a decision or work.**

<a id="st-q1"></a>
**ST-Q1. The two servers have different surfaces.** `lsp-jvm` answers `zenwave/conceptAt` and
`zenwave/workspaceStatus`, and `lsp-js` does not, against
[decision 0002](../decisions/0002-server-advertises-its-requests.md). The VS Code client, the only one
on a wire, therefore cannot offer concepts at a position and resolves the manifest itself.
[Decision 0006](../decisions/0006-one-javascript-server-in-the-extension.md) and
[decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md) make `lsp-js` the server that
matters here, so the gap is work on `lsp-js` ([backlog](../work/backlog.md), 001/2.18 and 001/2.22). What
stays open is how `lsp-jvm` and `lsp-js` are kept from drifting again.

<a id="st-q2"></a>
**ST-Q2. Is the Web Explorer still planned?** Answered 2026-10-30: VS Code in web mode is the Web Explorer
and the portal. See [decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md).

<a id="st-q3"></a>
**ST-Q3. Is the whiteboard part of the platform?** Answered 2026-10-30: yes, as an app in the vistas that
reuses the read-only view. See [decision 0019](../decisions/0019-event-storming-board-is-a-vistas-app.md).

## What "not re-tested" hides

- **Manual verification is largely undone.** Most VS Code features passed smoke tests in both hosts and
  await a person's checks: reload, offline, a clean profile, Restricted Mode, comparison with IntelliJ.
  They're itemised in the [backlog](../work/backlog.md).
- **The IDEs have never been compared** on the same fixture.
- **Evidence ages.** The task lists cite commits from September 2026. Worktree branches were merged and
  the code renamed since; where a rule's state depends on an old finding, the note says so.
- **Not read at all:** `zenwave-sdk` beyond the listener classifier, the IntelliJ plugin, and
  `json-schema-ref-parser-kmp` internals.
