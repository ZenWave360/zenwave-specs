# Retired

Originals of everything integrated into the manual on 2026-10-30, at their previous paths. Nothing here is
current. It exists so the integration could be done without deleting anything, and so it can be reviewed against
what it replaced.

**To finish:** review the manual, then delete this folder. Every OpenSpec change, task list and original `docs/` file here is
byte-for-byte in the last commit of its repository (checked by hash on 2026-10-30). **26 files are not in any commit**, and
deleting this folder loses them for good: they are listed in `.not-in-git.txt`. They are the documents the previous session
wrote or edited while migrating, plus three that were never committed (the whiteboard brief in Spanish, the architecture explorer
brief and the ZFL preview brief). Their content is in the manual. If you want them recoverable, commit `zenwave-specs` once with
this folder in it, then delete it in the next commit.

| What was here | Where it went |
| --- | --- |
| `zenwave-architecture/mcp-spec.md` Part I | [architecture/world-model.md](../architecture/world-model.md), unchanged |
| `zenwave-architecture/mcp-spec.md` Part II | [workspace model](../zenwave-architecture/workspace-model.md), [MCP adapter](../zenwave-architecture/mcp-adapter.md), [Web Explorer](../roadmap/web-explorer.md) |
| `zenwave-architecture/lsp-spec.md` | [LSP adapter](../zenwave-lsp/lsp-adapter.md) |
| `zenwave-lsp/lsp-architecture-and-contracts.md`, `lsp-core-spec.md` | [server architecture](../zenwave-lsp/server-architecture.md). The old hierarchy and related-resource proposals are superseded by [visualization requests](../flows/lsp-visualization-requests.md) |
| `zenwave-lsp/parser-architecture-and-contracts.md` | A copy of the one in [dsl-kotlin](../dsl-kotlin/parser-architecture-and-contracts.md) with an extra status note |
| `zenwave-lsp/agentic-coding-plan.md`, `dsl-lsp-agentic-coding-plan.md`, `spec/01`, `spec/02` | Finished implementation plans. Their lasting rules are in server architecture |
| `zenwave-lsp/performance-refactoring-plan.md` | Partly done; [LS-Q2](../zenwave-lsp/server-architecture.md#ls-q2) and the backlog point here. **Read before deleting** |
| `zenwave-lsp/resource-loader-spec.md` | Never built. Replaced by the Maven source in [source resolution](../zenwave-architecture/source-resolution-specification.md#sr-maven) |
| `zenwave-platform-vscode/project.md`, the first `architecture.md` | [VS Code client architecture](../zenwave-platform-vscode/architecture.md) |
| `zenwave-platform-vscode/zfl-preview-and-eventflow-design.md`, `flows/zfl-mermaid-preview.md`, the first `model-preview.md` | [Model preview](../zenwave-platform-vscode/model-preview.md) and [EventFlow](../flows/eventflow.md) |
| `zenwave-platform-vscode/zenwave-platform-architecture-explorer-brief.md` | [Resource discovery](../roadmap/resource-discovery.md) |
| `zenwave-platform-vscode/eventstroming-whiteboard/brief.md` | [Whiteboard](../roadmap/event-storming-whiteboard.md), translated from Spanish |
| `flows/zdl-validation.md`, `sdk-listener-generation.md`, `sdk-service-transitions.md` | [Transitions without an id](../flows/transitions-without-id.md) |
| `work/` and `zenwave-platform-vscode/work/` (proposals, designs, tasks, archive) | Open tasks: [backlog](../work/backlog.md). Decisions: [decisions/](../decisions/README.md). Design notes: the "Design notes" of each capability. The rest is history |

Other files here are the state of a document before it was edited in place.

Rewritten text that changed ids: `flows/zfl-mermaid-preview.md` and the old `model-preview.md` both used `mp-r*`, with different
meanings. In the merged document MP-R1 to R8 are the old `model-preview` rules, and the brief's rules are merged into them or are
MP-R9 to R12. Nothing cited them.
