# 0014. One manifest per workspace, and the client never second-guesses resolution

**Status:** accepted; details by agent 2026-09-17, owner review pending. **Origin:** VS Code change 003. **Used by:** [LC-R5](../zenwave-platform-vscode/lsp-client.md#lc-r5), [LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)

## Decision

The client resolves at most one manifest for the workspace and passes it at initialise:

1. the `zenwave.workspace.manifest` setting, authoritative, nothing searched;
2. otherwise no manifest, and single-file behaviour.

With several folders, the first folder in workspace order whose setting names a manifest wins. Every offer not used is written to the output channel. A changed resolution restarts the server;
a changed file is forwarded as `workspace/didChangeWatchedFiles`.

The client does not fetch content, join paths for the manifest or choose a source.

**Amended 2026-11-10** ([decision 0027](0027-the-server-serves-the-zenwave-scheme.md)): the manifest in step 1 or 2 may be an `http(s)` address, and a command, *Open Architecture Manifest…*, can write the setting at workspace scope, or, with no folder, hold a session override in `workspaceState` that takes the setting's place. One manifest per workspace stays.

**Amended 2026-11-20** ([D18](../work/owner-decisions-2026-11-12.md), backlog DEC/2): `.zenwave/config.yml` is dropped. The manifest comes only from the setting, usually in `.vscode/settings.json`, or from *Open Architecture Manifest…*; otherwise there is none. The former step 2 (a config file at a folder root naming `project-manifest`) and its rank across folders are removed above, so "step 1 or 2" in the amendment of 2026-11-10 now means step 1. The client has no activation event or watcher for the file, and ignores one left behind. The IntelliJ plugin still reads it until [IJ-D4](../roadmap/intellij-update.md#ij-d4) replaces it.

## Why

A manifest describes an organisation's architecture, and a workspace holds one. The intended shape is **one folder
holding several checked-out repositories**, with the web host being the same picture with one repository.

Content needs no help: the manifest declares an ordered list of sources, and a not-found advances to the next. So
sibling repositories resolve locally, a missing one falls through to `git`, and in a browser the workspace source simply
finds nothing. The web host needs no special case. Two earlier drafts got this wrong in opposite directions by putting a
second opinion about content location in the extension.

Workspace order is something a user can see and change, which a filesystem-derived rule is not.

## Consequences

- In the browser, a file with uncommitted changes the user has *not* opened resolves to its published version.
  Acceptable, and worth knowing before someone reports it.
- The server ignores those file-change notifications today, so an edit to a manifest that is not open is not taken up
  until a restart. That is [LVR-R12](../flows/lsp-visualization-requests.md#lvr-r12).
