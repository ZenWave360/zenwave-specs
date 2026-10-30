# 0005. IDE clients live in their own repositories

**Status:** recorded 2026-10-30 from what was built; owner review pending. **Replaces:** the plan in [LSP adapter §10](../zenwave-lsp/lsp-adapter.md#lsp-10).

## Decision

The VS Code client is `zenwave-platform-vscode` and the IntelliJ plugin is
`ZenWaveDomainModelEditor`. `zenwave-lsp` holds the server and its transports only.

## Why

The original plan put both clients in `zenwave-lsp` so protocol, server and client changes could be
reviewed together. What was built went the other way: each client has its own release, its own
marketplace and its own host problems. The price is that a change crossing the wire is now two
commits, which is what the [flows](../README.md#part-iv-flows-across-repositories) and
[decision 0002](0002-server-advertises-its-requests.md) exist to make safe.

## Consequences

The rules on what a thin client may do are unchanged. A client still never parses, resolves or
remembers.
