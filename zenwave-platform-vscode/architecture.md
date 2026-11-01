# VS Code client architecture

<a id="vscode-architecture"></a>

How the ZenWave Platform extension for VS Code is built, and why. It is the client for
ZDL, ZFL and the architecture manifest, on desktop and in the browser. For the
platform around it, read [the stack](../architecture/stack.md).

**Status:** 2026-10-30. Structure checked against
`packages/extension/src`. Merges the earlier project context and architecture notes.
What each feature does is in its own document, listed [below](#vscode-capabilities).

It supersedes [`zdl-vscode`](https://github.com/ZenWave360/zdl-vscode) and is the sibling
of the IntelliJ plugin `ZenWaveDomainModelEditor`. The two should converge. Where they
differ, it should be because the host forced it, not by accident.

## Its one job

If a question is about what a model *means* or how a diagram is *drawn*, the answer is
upstream. This repository is responsible for how that meaning is presented and driven
inside VS Code.

## Modules

```
src/node/extension.ts        Node host entry: builds host services, calls activate()
src/browser/extension.ts     Worker host entry: the same, for the web
src/activate.ts              host-agnostic activation

src/host/                    capabilities, output channel
src/lsp/feature.ts           trust, settings, manifest, status bar, context keys, commands
src/lsp/supervisor.ts        one lifecycle; requests answer ok | no-server | unsupported | failed
src/lsp/requests.ts          typed zenwave/* wrappers for feature code
src/lsp/manifest*.ts         setting → .zenwave/config.yml → none, through vscode.workspace.fs
src/lsp/credential*.ts       origin-matched answers to zenwave/credential
src/sdk/                     SDK runner: model reading, command assembly, shell quoting, catalogue
src/model/actions.ts         editor commands over zenwave/* requests
src/model/navigation.ts      opens server locations (uri + range) the editor's way
src/model/active-document.ts the model document in the active tab, text or custom editor
src/explorer/                Architecture and Model trees over zenwave/hierarchy
src/eventflow/               EventFlow custom editor: hosts the vistas page, relays view models
```

Feature code reaches the server only through the `LanguageServerApi` that `activate`
returns. A request never throws and never hangs.

Two packages live in the repository: `packages/extension` and
`packages/preview-renderer`, which is an empty placeholder whose future is
[backlog](../work/backlog.md) item 005/1.4.

## Rules that shape the code

<a id="va-r1"></a>
**VA-R1 (exists). Two hosts, one activation.** The two entries only construct
host-specific services and call the shared `activate()`. No feature logic lives in them.
The failure this prevents is a Node API reached *transitively* from shared code: esbuild
bundles it for `platform: browser`, and it fails at run time inside a Web Worker where
stack traces are no help. Only `src/node/` may touch Node, and ESLint enforces it.

<a id="va-r2"></a>
**VA-R2 (exists). Capabilities come from construction.** The Node entry knows it is Node.
Nothing sniffs `vscode.env` from shared code. See [host capabilities](host-capabilities.md).

<a id="va-r3"></a>
**VA-R3 (exists). Hide what can never work, degrade what partly can.** In the browser
`zenwave-sdk` is not temporarily unavailable, it is permanently unavailable, and a
control that can never succeed teaches the user the extension is broken. Context keys
hide; they do not secure, so commands re-check when they run. Because hiding makes things
silently absent, activation logs what it detected.

<a id="va-r4"></a>
**VA-R4 (exists). The transport follows the entry point.** Shared code imports only
*types* from `vscode-languageclient`, whose bare entry is the Node build. Each host entry
supplies its own client.

<a id="va-r5"></a>
**VA-R5 (exists). Rendered editors are custom editors, opened by choice.** Diagrams are
custom editors with `priority: "option"`, so opening a model always shows its text. See
[decision 0010](../decisions/0010-rendered-views-are-custom-editors.md). Because
`window.activeTextEditor` is undefined while one has focus, the active document is
resolved through `window.tabGroups`.

<a id="va-r6"></a>
**VA-R6 (exists). A custom request needs a command to exist.** The language client wires
standard LSP features by itself. A `zenwave/*` request is invisible until someone writes
a command, a menu entry and a `when` clause. This is the trap that left those features
missing the first time.

<a id="va-r7"></a>
**VA-R7 (exists). The server/client division flips between kinds of data.** A view model
and a preview are pictures that must look the same in every IDE, so the server's titles
and layout bind. A hierarchy node is raw material each IDE presents in its own idiom, so
its name is only a default. See [LVR-R11](../flows/lsp-visualization-requests.md#lvr-r11).

## Identity

Ships as a new marketplace extension, `ZenWave360.zenwave-platform`. The intent is that
`ZenWave360.zdl-vscode` is deprecated with a pointer to the successor, and that users
migrate by hand. How is not settled and not scheduled: the predecessor contributes the
same language ids, so what someone with both installed experiences is a real question.
Treat it as an intention, not as specified behaviour.

<a id="vscode-capabilities"></a>
## Capabilities

| Capability | Document | State |
| --- | --- | --- |
| Hosts and gating | [host-capabilities](host-capabilities.md) | exists |
| Languages and highlighting | [languages](languages.md) | exists |
| Running the SDK, authoring plugins | [sdk-runner](sdk-runner.md) | exists, manual checks pending |
| The language server connection | [lsp-client](lsp-client.md) | mostly exists; source pinning and credentials wait on the server |
| EventFlow diagram | [eventflow-panel](eventflow-panel.md) | exists |
| Architecture and Model trees | [model-explorer](model-explorer.md) | exists |
| Semantic commands | [model-actions](model-actions.md) | partial |
| Model preview | [model-preview](model-preview.md) | partial: on branches, not published |
| Build and publish | [release](release.md) | pipeline built, nothing published |

The evidence and what is missing are in [status](../architecture/status.md).

## Conventions

- **Language:** TypeScript, `strict`, no `any` at module boundaries.
- **Bundler:** esbuild, two targets: `dist/node/extension.js` (platform `node`) and
  `dist/browser/extension.js` (platform `browser`, format `cjs` for the worker host).
- **Command ids:** `zenwave.<area>.<verb>`. **Settings:** `zenwave.<area>.<setting>`.
- **Context keys:** `zenwave.<capability>Available`, for `when` clauses.

## A warning about upstream claims

Much of what this client relies on was established by reading Kotlin, and several claims
that entered these specs as fact turned out to be inferences: a planning document read as
a description of what exists, an identifier assumed to be shared between two subsystems,
a request assumed to compose with another. A fresh reader checking claims against the code
caught them all. Verify against the implementation before building on a statement about
upstream, including the ones in this manual.

## Sources

`packages/extension/src`, `packages/extension/package.json`; the earlier
`project.md`, `architecture.md` and the designs of changes 001 to 009, all in git history.
