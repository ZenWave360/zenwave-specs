# 0024. Pre-releases follow the last release, and notes are files

**Status:** decided by the owner, 2026-11-01; not built. **Used by:** [R-R8](../zenwave-platform-vscode/release.md#r-r8), [R-R10](../zenwave-platform-vscode/release.md#r-r10), [R-R11](../zenwave-platform-vscode/release.md#r-r11)

## Decision

A pre-release takes the `major.minor` of the last stable release and the workflow's run number as its patch: `0.0.57` before `0.1.0`, `0.1.58` after it. The version is raised only for a stable release, on `main`, and `develop` gets it by merging `main` back.

There is no odd and even minor. Release notes are files, `release-notes/next.md` and `release-notes/release-notes.vX.Y.Z.md`, as in `zenwave-sdk`, and `CHANGELOG.md` is generated from them when packaging.

## Why

The owner does not want a version bump on `develop` tied to the channel. The Marketplace allows only `major.minor.patch` and a version number cannot be reused, so a pre-release cannot be named after the coming version and still let that version be published. Following the last release leaves the coming number free, and a stable release is higher than every pre-release before it, so users on pre-releases receive it. Odd and even is the Marketplace's recommendation, not a requirement.

The `zenwave-sdk` changelog is an index kept by hand, and it has fallen behind its notes. Generating the file with the full text avoids that, and the listing shows the notes rather than links.

## Consequences

- The owner asked for a patch written `0057`, leaving `1057` for a hotfix. `vsce` refuses a leading zero, so the patch is `57`. A hotfix uses a low free patch, `v0.1.1`, not a higher range: VS Code installs the highest version, so `0.1.1057` would sit above every later pre-release of that minor.
- A pre-release number does not say which release it leads to. Its notes do.
- `develop` fails until `main` is merged back after a stable release. That is intended: otherwise pre-releases would be below stable.
