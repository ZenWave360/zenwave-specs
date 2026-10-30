# 0014. One manifest per workspace, and the client never second-guesses resolution

**Status:** accepted; details by agent 2026-09-17, owner review pending. **Origin:** VS Code change 003. **Used by:** [LC-R5](../zenwave-platform-vscode/lsp-client.md#lc-r5), [LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6)

## Decision

The client resolves at most one manifest for the workspace and passes it at initialise:

1. the `zenwave.workspace.manifest` setting, authoritative, nothing searched;
2. otherwise a `.zenwave/config.yml` at a workspace folder root, naming `project-manifest`;
3. otherwise no manifest, and single-file behaviour.

With several folders, a setting in any folder outranks every config file, and within a route the first folder in
workspace order wins. Every offer not used is written to the output channel. A changed resolution restarts the server;
a changed file is forwarded as `workspace/didChangeWatchedFiles`.

The client does not fetch content, join paths for the manifest or choose a source.

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
- `.zenwave/config.yml` is a convention the project intends, and IntelliJ does not rely on it yet.
- The server ignores those file-change notifications today, so an edit to a manifest that is not open is not taken up
  until a restart. That is [LVR-R12](../flows/lsp-visualization-requests.md#lvr-r12).
