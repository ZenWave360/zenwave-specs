# 0006. One JavaScript language server, shipped in the VS Code extension

**Status:** accepted by agent 2026-09-17; confirmed by owner 2026-10-30. **Origin:** VS Code change 003, design and task 1.2. **Used by:** [LSP client](../zenwave-platform-vscode/lsp-client.md#lc-r1)

## Decision

VS Code runs `@zenwave360/lsp-js` in both hosts: a Node child process over IPC on the desktop, a Web
Worker in the browser, from JavaScript shipped in the VSIX. One extension version ships exactly one
server version, pinned exactly. `zenwave.lsp.serverPath` exists for contributors, not as the way
users get a server.

## Why

Kotlin/JVM is faster at the CPU-bound work here. Against that:

- **Startup.** Node starts in tens of milliseconds, a JVM in hundreds, and through JBang the first
  run spends seconds on dependencies. A slow language server reads as a broken editor.
- **Prerequisites.** Editing a model stops requiring a JDK.
- **One implementation.** Two servers are two implementations, and the one used less is the one that
  breaks quietly.

## What would change this

A measurement that does not exist yet: incremental reparse latency on the largest real model. Above
roughly a tenth of a second the trade is worth revisiting, and the answer is probably to move work
off the critical path rather than to ship a second server.

## Consequences

- Each bundle is about 6 MB uncompressed and both always ship, because one VSIX serves both hosts.
- The bundles embed third-party code, including elkjs under EPL-2.0, and carry no notices today.
  Raised, not decided.
- IntelliJ stays in process on the JVM, so two routes to the same server exist and can drift.
  Converting it is a separate change.
- The extension pins a version and copies the bundles at build time. Now the package is on npm, the pin should become an exact-version `devDependencies` entry. See the [backlog](../work/backlog.md).
