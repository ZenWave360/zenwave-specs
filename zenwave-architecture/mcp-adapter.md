# MCP adapter

<a id="mcp-adapter"></a>

How an agent reaches the architecture. ZenWave MCP exposes the
[Workspace Query API](workspace-model.md#wmodel-12) as tools, so an agent works from
the same architecture a person sees, without reconstructing it from raw files.

**Status:** 2026-10-30.

<a id="mcp-t1"></a>
**MCP-T1 (exists). The tool mapping.** `workspace-mcp`
(`WorkspaceMcpTools.kt`, JVM and JS) defines the seven tools below, validates
arguments and projects results to JSON. Checked by reading the module and its test.

<a id="mcp-t2"></a>
**MCP-T2 (proposed). There is no MCP server.** Nothing registers those tools on an MCP
transport. The class comment says "transports register tools and delegate calls", and
no transport exists; `workspace-cli` only has `validate`. Shipping ZenWave MCP means
building that server, its packaging and a way to tell it which manifest to open. Who
owns it and how it ships are [open](#mcp-q1).

## Tools

The adapter adds protocol mapping, argument validation, result bounds and
readable summaries. Nothing else.

| Tool | Purpose |
|---|---|
| `zenwave_workspace` | Bounded Workspace overview. First call in an unknown architecture. |
| `zenwave_resolve` | Deterministic ID resolution. Follows aliases. No fuzzy fallback. |
| `zenwave_search` | Human-query discovery. Ambiguity returns candidates. |
| `zenwave_browse` | Direct children of a node. Orientation, not analysis. |
| `zenwave_related` | Bounded traversal with confidence and origin filters. |
| `zenwave_sources` | Provenance and source locations. Handoff to code tools. |
| `zenwave_diagnostics` | Architecture problems, scoped by ID and severity. |

`zenwave_related` replaces separate tools for dependencies, dependents, impact
and references.

Raw artifact reading is not a primary architectural operation. A bounded
`zenwave_read` may be added later as an escape hatch. It must not duplicate
filesystem access that coding agents already have.

### 14.1 Result convention

Structured semantic IDs are the contract. Prose is convenience.

```json
{
  "summary": "Order Service publishes two events.",
  "elements": [
    { "id": "zw:sales/ordering/order-service/event/OrderPlaced", "kind": "event", "name": "OrderPlaced" }
  ]
}
```

An agent must be able to chain a call without extracting identifiers from a
sentence.

## Why MCP comes before other surfaces

An agent consumer forces the Query API to become a real architecture contract instead
of whatever one screen needed. See the [build order](workspace-model.md#wmodel-18) and
the [success criterion](workspace-model.md#wmodel-19).

The boundary with code tools is in the [world model §6.5](../architecture/world-model.md#wm-6-5).

## Open questions

<a id="mcp-q1"></a>
**MCP-Q1. Where does the server live and how is it started?** A new module in
`zenwave-architecture`, or inside the language server? Stdio over JVM, Node or both?

<a id="mcp-q2"></a>
**MCP-Q2. One graph or several?** Does a shared workspace daemon serve MCP and the
language server from one graph, or does each build its own? (Raised in
[workspace model §22](workspace-model.md#wmodel-22).)
