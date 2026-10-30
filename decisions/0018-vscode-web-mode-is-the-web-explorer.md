# 0018. VS Code in web mode is the Web Explorer and the portal

**Status:** accepted by owner, 2026-10-30. **Used by:** [Web Explorer](../roadmap/web-explorer.md), [resource discovery](../roadmap/resource-discovery.md)

## Decision

The browser experience of the platform is the VS Code extension running in web mode. The extension stays
compatible with web mode as far as a browser allows. No separate Web Explorer, and no independent portal in
the style of EventCatalog, is built: both needs are covered by this one.

## Why

The extension already runs in the Web Worker host, with a language server in a worker and the same diagrams.
A separate site would repeat the tree, the previews and the navigation, and would be a second client to keep
in step.

## Consequences

- A capability that works only on the desktop is a gap to justify, not a default. Process execution and
  terminal tasks are the known case ([host capabilities](../zenwave-platform-vscode/host-capabilities.md)).
- `lsp-js` becomes the server the browser experience depends on, so the missing architecture requests
  ([ST-Q1](../architecture/status.md#st-q1)) matter more.
- Reaching private content from a browser depends on CORS, still open in
  [decision 0008](0008-credentials-are-handed-over-per-request.md).
- `packages/eventcatalog-components` is unaffected. It serves people who already run EventCatalog, and is not
  a portal of ours.
- The world model's "Web Explorer" adapter now means this surface. Its rules still apply: it adds no semantics.
