# 0012. The plugin catalogue is shipped; authoring never starts the SDK

**Status:** accepted; supersedes an earlier design. **Origin:** VS Code change 002. **Used by:** [SR-R11](../zenwave-platform-vscode/sdk-runner.md#sr-r11), [SR-R12](../zenwave-platform-vscode/sdk-runner.md#sr-r12)

## Decision

Completion and hover for plugin declarations come only from a catalogue generated from a named SDK build by
release automation and shipped in the extension. Nothing starts the SDK except the user's Run. A missing command
is found by looking it up on the inherited `PATH`, and through a login shell from exit status 127.

## Why

Asking the installed SDK with `jbang zw -h json` took 8 to 12 seconds per call and started a JVM nobody asked for.
Authoring help that costs that is worse than help a release behind. And the browser, where the SDK can never run,
still needs a plugins block to be writable.

## Consequences

A workspace's own plugins are absent from suggestions, and this is not presented as their SDK being incomplete. The
documentation link is data the catalogue reports, never worked out from a plugin's name, because the set of plugins
is open and a derived address would be confidently wrong for anything that did not ship with the SDK.

## Open

Whether an installed SDK should ever be asked, and when: an explicit refresh command, a persisted cache, or never.
Its benefit is real. Task 002/11.7 in the [backlog](../work/backlog.md). If it happens, the extension can hand the newer
catalogue to the language server, which has its own copy too ([MP-R16](../zenwave-platform-vscode/model-preview.md#mp-r16)).

## See also

[Plugin catalogue](../flows/sdk-plugin-catalogue.md), and its `documentationUrl`, in
[decision 0015](0015-documentation-url-has-three-states.md).
