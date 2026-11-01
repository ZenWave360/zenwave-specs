# Decisions

Why things are the way they are. One short file per decision. Read them when you want to change
something and need to know what it would cost.

"Owner review pending" means an agent took the decision during implementation so work could continue.
The code follows it, and the owner has not confirmed it. Those are the ones to read first.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-layout-stays-on-the-server.md) | Layout stays on the server | accepted |
| [0002](0002-server-advertises-its-requests.md) | The server advertises its requests at initialise | accepted |
| [0003](0003-protocol-version-is-separate-from-package-version.md) | The page's protocol version is separate from its package version | accepted |
| [0004](0004-node-actions-are-declared-by-the-host.md) | Node actions are declared by the host | proposed |
| [0005](0005-ide-clients-live-in-their-own-repositories.md) | IDE clients live in their own repositories | review pending |
| [0006](0006-one-javascript-server-in-the-extension.md) | One JavaScript server, shipped in the VS Code extension | accepted |
| [0007](0007-contracts-are-behaviour-with-recorded-wire-names.md) | Contracts describe behaviour; wire names are recorded beside them | accepted |
| [0008](0008-credentials-are-handed-over-per-request.md) | Credentials are handed over per request, only to authorised origins | accepted; client built, server not |
| [0009](0009-mermaid-not-plantuml.md) | Mermaid, not PlantUML, generated upstream | accepted; ZDL part pending |
| [0010](0010-rendered-views-are-custom-editors.md) | Rendered views are custom editors, opened by choice | accepted |
| [0011](0011-sdk-runner-is-a-task-with-quoted-values.md) | The SDK runner is a task, and every value is quoted | accepted |
| [0012](0012-plugin-catalogue-is-shipped.md) | The plugin catalogue is shipped; authoring never starts the SDK | accepted |
| [0013](0013-platform-capabilities-are-asked-for.md) | Node is loaded lazily; a library says what its platform can do | review pending |
| [0014](0014-one-manifest-per-workspace.md) | One manifest per workspace, and no second opinion on resolution | details pending |
| [0015](0015-documentation-url-has-three-states.md) | A plugin's documentation location has three states | review pending |
| [0016](0016-numbers-from-the-js-parser.md) | The JS parser returns plain numbers, and negatives keep their sign | review pending |
| [0017](0017-this-manual-replaces-openspec.md) | One manual replaces OpenSpec | accepted |
| [0018](0018-vscode-web-mode-is-the-web-explorer.md) | VS Code in web mode is the Web Explorer and the portal | accepted |
| [0019](0019-event-storming-board-is-a-vistas-app.md) | The Event Storming board is an app in the vistas | accepted |
| [0020](0020-previews-come-from-dsl-docs-through-the-server.md) | Markdown previews come from dsl-docs, through the language server | accepted |
| [0021](0021-zfl-text-owns-visual-editing.md) | ZFL text owns bidirectional visual editing | direction accepted; implementation proposed |
| [0022](0022-saved-positions-are-a-file-beside-the-model.md) | Saved positions are a file beside the model | accepted |
| [0023](0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md) | Pre-releases pin `next`, and Kotlin moves on Git snapshots | direction accepted; pipelines not built |
