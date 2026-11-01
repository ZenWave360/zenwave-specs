# 0023. Pre-releases pin `next`, and Kotlin moves on Git snapshots

**Status:** direction from the owner, 2026-11-01; pipelines built on a branch, never run. **Used by:** [R-R7](../zenwave-platform-vscode/release.md#r-r7), [R-R8](../zenwave-platform-vscode/release.md#r-r8), [R-R9](../zenwave-platform-vscode/release.md#r-r9), [R-R11](../zenwave-platform-vscode/release.md#r-r11)

## Decision

Day-to-day work does not use Maven Central releases. Kotlin projects publish `-SNAPSHOT` versions to the Git-hosted `zenwave360/maven-snapshots` on every push to `develop`. `zenwave-lsp` builds from those and publishes an immutable `@zenwave360/lsp-js` on npm `next`.

The VS Code extension sees only npm. A merge to its `develop` publishes a Marketplace pre-release that pins exact `next` versions. A stable extension is a separate build from a version tag, and needs stable versions of every `@zenwave360/*` package.

## Why

The owner can publish about eight Maven Central versions a month, and these projects move faster than that. The Git snapshot path already exists and its runs succeed in `dsl-kotlin`, `json-schema-ref-parser-kmp`, `zenwave-architecture` and `zenwave-lsp`.

A `-SNAPSHOT` changes under its consumers, so a build from one cannot be reproduced on its own. An npm `next` version never changes, so an exact pin keeps one commit of the extension tied to one server, whatever Kotlin snapshots do later. That is why the pin is exact rather than the `next` tag.

## Consequences

- An `@zenwave360/lsp-js` version on `next` does not record which Kotlin snapshot it was built from. Its source commit is known; the snapshot's is not.
- The caller workflows point to `release-workflows` at the branch `feature/git-snapshots`, which is not merged to `main`. A pilot branch must not carry the whole platform's publishing for long.
- `@zenwave360/dsl` on `next` is published only by a manual run, because that job requires `publish-snapshots`, which pushes leave off. The extension does not need it today.
- A first stable extension needs stable upstream versions, which do use Central ([R-Q1](../zenwave-platform-vscode/release.md#r-q1)).
