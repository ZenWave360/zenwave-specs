# Web Explorer

<a id="web-explorer"></a>

The read-only way to browse an architecture in a browser, over the same
[Query API](../zenwave-architecture/workspace-model.md#wmodel-12) as MCP and the language server. It is
the VS Code extension in web mode, not a separate site
([decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md)).

**Status:** decided 2026-10-30. The extension runs in the web host today
([host capabilities](../zenwave-platform-vscode/host-capabilities.md)). How close that is to the behaviour
below has not been measured. Moved from section 20 of the original workspace specification.

## What it is

Read-only in v1. Editing goes through Git.

Focus: find, browse, inspect, navigate relationships, inspect provenance, inspect diagnostics.

Deep-linkable URLs mirror semantic IDs. Selecting a node in a Vista selects it in the tree and updates
the URL. That single behaviour is what makes it one tool rather than two views.

## Rules

<a id="we-r1"></a>
**WE-R1 (exists, as a choice). No separate explorer or portal.** Nothing EventCatalog-like is built on
the side. A need that seems to call for one is first a gap in web mode.

<a id="we-r2"></a>
**WE-R2 (partial). The extension stays compatible with web mode as far as possible.** A desktop-only
capability needs a reason, such as running processes, and the web host says it is unavailable rather than
failing. Missing: an inventory of what each feature does in web mode, which is
[WE-Q3](#we-q3).

<a id="we-r3"></a>
**WE-R3. It adds no semantics** ([world model §6.2](../architecture/world-model.md#wm-6-2)).

<a id="we-r4"></a>
**WE-R4. A Vista is a projection.** Layout does not flow back into the graph
([world model §6.3](../architecture/world-model.md#wm-6-3)).

<a id="we-r5"></a>
**WE-R5. The Query API exposes projections, not screens**
([world model §6.1](../architecture/world-model.md#wm-6-1)).

## Open questions

<a id="we-q1"></a>
**WE-Q1. Does it still come next?** Answered 2026-10-30: there is no separate explorer to schedule. See
[decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md). The
[resource discovery brief](resource-discovery.md) already described this direction.

<a id="we-q2"></a>
**WE-Q2. Can web mode give deep links?** The behaviour above asks for URLs that mirror semantic IDs. Whether
hosts such as vscode.dev or github.dev let an extension read and update such a URL has not been tried. Without
it, this behaviour needs restating.

<a id="we-q3"></a>
**WE-Q3. What is missing in web mode, per host?** Compare the extension's features on github.dev, vscode.dev
and a self-hosted distribution. [Resource discovery](resource-discovery.md) warns that each host must be
validated rather than assumed. Known so far: `lsp-js` lacks the architecture requests
([ST-Q1](../architecture/status.md#st-q1)), and browser access to private content is limited by CORS
([decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md#open)).
