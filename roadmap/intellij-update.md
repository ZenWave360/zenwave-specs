# IntelliJ plugin: update to the current stack

<a id="intellij-update"></a>

Refreshed 2026-11-16 from a read-only survey of `ZenWaveDomainModelEditor` at 79964a2 (2026-10-13, `main`, two commits ahead
of `origin`). It replaces the plan of 2026-11-06, which surveyed the same commit. Nothing was built or run. The work is a
task board of its own: [IntelliJ backlog](../work/intellij-backlog.md).

The plugin has not changed in 34 days while the stack moved. The checkout still carries the owner's uncommitted changes in
`build.gradle.kts`, `settings.gradle.kts`, `gradle/libs.versions.toml` and `README.md` (conditional `includeBuild`,
`dslKotlin` 1.10.0-SNAPSHOT) and an untracked `openspec/`. They were read and not touched.

Reference for the features is VS Code on `feature/architecture-navigator` (fbd321a, checked out at `grok-work/vscode-an4`).

Tags: **M** mechanical, fit for Grok; **J** judgement; **O** the owner. Sizes S/M/L.
Any change to the ZDL, ZFL or ZW languages needs the owner's approval. This plan contains none; where a language change
is in the neighbourhood it is named, and not planned.

## Findings

### Headline

- Last plugin commit is 34 days old; the last changelog entry is 0.7.1 (2026-05-14) while `pluginVersion` is 0.8.1.
- `dsl-kotlin`: the plugin asks for 1.7.0-SNAPSHOT in the commit and 1.10.0-SNAPSHOT in the owner's uncommitted change; the
  stack is at 1.11.0-SNAPSHOT. That is four minors behind, or one if the uncommitted change is taken.
- The server has 11 `zenwave/*` requests and 1 notification. The plugin calls 2 (`hierarchy`, `organizeZflServices`).
- Of 23 feature rows compared with VS Code: 4 present, 7 partial, 12 missing.
- None of the four architecture libraries is a plugin dependency, and `zenwave:` documents, the architecture tree and the
  manifest chooser do not exist.

### Versions and libraries

Plugin paths are relative to `ZenWaveDomainModelEditor`. "Plugin" is the working tree, with the committed value where it differs.

| Item | Plugin | Stack, target | Gap |
| --- | --- | --- | --- |
| IntelliJ Platform | `platformVersion = 2025.2.5` (`gradle.properties:12`), `pluginSinceBuild = 252` (`:9`) | not verified; the newest stable at the time of the work, an owner choice ([IJ-D1](#ij-d1)) | unknown, probably two releases |
| IntelliJ Platform Gradle plugin | 2.16.0 (`gradle/libs.versions.toml:15`) | latest 2.x, not checked online | unknown |
| Gradle | wrapper 9.5.0 (`gradle/wrapper/gradle-wrapper.properties:3`), property `gradleVersion = 9.2.1` (`gradle.properties:23`) | one value | the two disagree |
| Kotlin | 2.2.21 (`libs.versions.toml:16`) | 2.3.0 (`dsl-kotlin/gradle/libs.versions.toml:2`; `zenwave-lsp/build.gradle.kts:5-8`) | one minor; metadata risk, see [Risks](#risks) |
| JDK | toolchain 21 (`build.gradle.kts:23`), CI 21 (`.github/workflows/build.yml:51`) | 21 in `lsp-core` and `lsp-jvm` (`build.gradle.kts:13`, `:22`), 17 in `zenwave-architecture` | none |
| `dsl-kotlin` | 1.7.0-SNAPSHOT committed; 1.10.0-SNAPSHOT uncommitted (`libs.versions.toml:6`) | 1.11.0-SNAPSHOT (`dsl-kotlin/build.gradle.kts:16`) | 4 minors, or 1 |
| `lsp-core`, `lsp-jvm` | 0.1.0-SNAPSHOT (`libs.versions.toml:10`) | 0.1.0-SNAPSHOT (`zenwave-lsp/build.gradle.kts:14`) | same string, so no version tells how old a snapshot is |
| `dsl-views`, `dsl-docs` | not declared; `dsl-views` is used directly in `ZflPreviewEditor.kt:6-8` and arrives only transitively | 1.11.0-SNAPSHOT (`lsp-core/build.gradle.kts:44-45`) | not substituted in `settings.gradle.kts:18-23` |
| `architecture-manifest`, `workspace-runtime`, `json-schema-ref-parser-kmp` | none; they arrive through `lsp-core` | 1.0.0-SNAPSHOT (`lsp-core/build.gradle.kts:46-48`) | needed on the snapshot repository in CI |
| `lsp4j` | 0.21.1 (`libs.versions.toml:11`) | 0.21.1 (`lsp-jvm/build.gradle.kts:12`) | equal; the IDE bundles its own, see [Risks](#risks) |
| `zenwave-sdk-cli`, `zdl-to-markdown` | 2.6.0-SNAPSHOT (`libs.versions.toml:7-8`) | not part of the platform stack | exist only for the ZDL PlantUML preview and one `JSONPath` use |
| Snapshot repository | `https://central.sonatype.com/repository/maven-snapshots` (`build.gradle.kts:33`) | `https://www.zenwave360.io/maven-snapshots/` (`zenwave-lsp/build.gradle.kts:78`; [decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md)) | the plugin cannot resolve the stack's snapshots in CI |
| ANTLR | `antlr4 4.13.2` in the catalogue, unused `antlr4Version = 4.12.0` (`gradle.properties:36`) | generated Java parsers in `dsl-kotlin` (`io.zenwave360.language.antlr.java`) | duplicate version |
| `Zdl.g4`, `Zfl.g4` | token sets in `ZflTokenTypes.kt:46` and `ZdlTokenTypes.kt` | changed since the plugin's last build: `for` optional, `on` takes an event list, policy annotations | highlight and brace sets unaudited |

What the library change costs in code:

- Packages did not move (`io.zenwave360.language.*`). `GenerateMermaidFromZfl`, `MermaidDiagramsView` and
  `MermaidSequenceRenderMode` are in `io.zenwave360.dsl:dsl-views`; `GenerateFlowViewFromZfl` and
  `GenerateServiceViewFromZfl` are in `dsl-kotlin`.
- The composite build is the owner's uncommitted change: it includes `../dsl-kotlin` and `../zenwave-lsp` when present and
  falls back to published artifacts when `CI=true` (`settings.gradle.kts:6-32`, `build.gradle.kts:28-31`). The `zenwave-lsp`
  settings include `dsl-kotlin`, `json-schema-ref-parser-kmp` and `zenwave-architecture` themselves. Whether those nested
  substitutions reach the plugin's resolution is not checked (task IJ/1.4).

### Features against VS Code

Present means the behaviour a user sees exists; partial, that it exists in another form or part; missing, that it does not.
Evidence is the plugin at 79964a2 and the VS Code branch above. The rules are in the linked documents.

| # | Feature (spec) | State | Evidence |
| --- | --- | --- | --- |
| 1 | ZFL flowchart and sequence diagrams ([MP-R17](../zenwave-platform-vscode/model-preview.md#mp-r17)) | partial | Built in the plugin by `GenerateMermaidFromZfl().execute(...)` (`ZflPreviewEditor.kt:80`), two modes (`:37-44`), no call to `zenwave/preview`. Titles and layout change when the library is upgraded; the modes do not follow `previewModes`. |
| 2 | ZDL preview ([decision 0009](../decisions/0009-mermaid-not-plantuml.md), [0020](../decisions/0020-previews-come-from-dsl-docs-through-the-server.md)) | partial | PlantUML from the SDK (`ZdlPreviewEditor.kt:9,27`); the stack returns Mermaid. |
| 3 | Model Docs, Scripts Docs, ZDL Diagrams ([MP-R22](../zenwave-platform-vscode/model-preview.md#mp-r22), [MP-R23](../zenwave-platform-vscode/model-preview.md#mp-r23), [MP-R25](../zenwave-platform-vscode/model-preview.md#mp-r25)) | missing | `.zw` is registered as ZDL (`plugin.xml`, `extensions="zdl;zw"`) and gets the same PlantUML preview. |
| 4 | EventFlow rendering in the JCEF page | partial | Tool window "ZFL Diagram" (`plugin.xml`), `ZflJcefDiagramHost.kt:114` sends `renderBundle`. The model is built locally (`ZflDiagramModelProvider.kt:30-31`). |
| 5 | EventFlow toolbar page ([EF-R3](../flows/eventflow.md#ef-r3), [EF-R11](../flows/eventflow.md#ef-r11)) | missing | `scripts/sync-eventflow-webview.mjs:20` copies `apps/eventflow-webview/dist`, the page without a toolbar; the page with it, `apps/eventflow-toolbar-webview`, is not copied. The bundled assets (`src/main/resources/web/eventflow/assets/index-yNYAXfAh.js`) predate all rendering fixes. |
| 6 | Variants ([EF-R12](../flows/eventflow.md#ef-r12), [LVR-R18](../flows/lsp-visualization-requests.md#lvr-r18)) | missing | No `variantChanged`, no `variant` parameter; VS Code `eventflow/protocol.ts:131`. |
| 7 | Lanes ([EF-R20](../flows/eventflow.md#ef-r20) to [EF-R24](../flows/eventflow.md#ef-r24)) | missing | No `lanesChanged`; the server advertises `flowLanes: none, systems, services` (`ZenwaveLspServer.kt:445`). |
| 8 | Saved positions ([EF-R14](../flows/eventflow.md#ef-r14), [decision 0022](../decisions/0022-saved-positions-are-a-file-beside-the-model.md)) | missing | No `savePositions`, no `*.zfl.positions.json`; the server advertises `savedPositions` (`:444`). |
| 9 | Humanize labels | present | Swing control (`ZflToolWindowTopBar.kt:21`) to `setHumanizeLabels` (`ZflJcefDiagramHost.kt:154`). It is a host control, where the page owns it now ([EF-R22](../flows/eventflow.md#ef-r22)). |
| 10 | Diagram and tree selection follow each other ([ME-R7](../zenwave-platform-vscode/model-explorer.md#me-r7), [EWP-R2](../flows/eventflow-webview-protocol.md#ewp-r2)) | missing | `ZflDiagramHost` has no highlight method; the host never receives a page message (no `JBCefJSQuery`; `webviewReady` appears nowhere in `src/main/kotlin`). |
| 11 | Sequence diagrams from the server ([LVR-R17](../flows/lsp-visualization-requests.md#lvr-r17)) | missing | No `zenwave/preview` call anywhere in `src/main/kotlin`. |
| 12 | Hierarchy tree for ZFL ([ME-R4](../zenwave-platform-vscode/model-explorer.md#me-r4)) | present | `ZenwaveLspProjectService.kt:113-117` calls `hierarchy`; labels are rewritten in `ZflHierarchyPresentationFormatter.kt:12-17` ([decision D10](../work/owner-decisions-2026-11-12.md) says the server composes them). |
| 13 | Model tree as the outline of any document ([ME-R3](../zenwave-platform-vscode/model-explorer.md#me-r3), [ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9)) | missing | The tree lives in the ZFL tool window only; no ZDL, `.zw`, OpenAPI or Markdown outline. |
| 14 | Go to definition ([LVR-R7](../flows/lsp-visualization-requests.md#lvr-r7)) | present | `ZenwaveGotoDeclarationHandler` (`plugin.xml`), `ZenwaveLspProjectService.kt:142`. |
| 15 | References and `conceptAt` ([LVR-R8](../flows/lsp-visualization-requests.md#lvr-r8), [LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9)) | missing | `forwardReferences`, `reverseReferences`, `symbolAt`, `conceptAt` are never called. |
| 16 | Capability discovery and error kinds ([LVR-R1](../flows/lsp-visualization-requests.md#lvr-r1)) | missing | `capabilities.experimental` is never read; -32803 is not handled. The plugin cannot tell an old server from a broken document. |
| 17 | Manifest choice, `allowedDomains`, remote manifest name ([LC-R5](../zenwave-platform-vscode/lsp-client.md#lc-r5), [decision 0014](../decisions/0014-one-manifest-per-workspace.md)) | partial | Only `.zenwave/config.yml` found by walking up (`ZenwaveWorkspaceConfigProvider.kt:20-50`); only `configUri` and `projectManifestUri` are sent (`ZenwaveLspProjectService.kt:347-353`). The server reads `remoteManifestName` and `allowedDomains` (`ZenwaveInitializationOptions.kt:19-24`). VS Code dropped the config file ([D18](../work/owner-decisions-2026-11-12.md)), and since zenwave-lsp 8aa3a49 the server no longer reads `configUri`. The plugin still reads the file until [IJ-D4](#ij-d4) replaces it ([IJ/8.1](../work/intellij-backlog.md)); then `ZenwaveWorkspaceConfig` can be deleted from lsp-core. |
| 18 | `zenwave:` resources: `statResource`, `readResource` ([AR-R1](../flows/architecture-resources.md#ar-r1), [AR-R4](../flows/architecture-resources.md#ar-r4)) | missing | No virtual file system, no calls. The server serves both (`ZenwaveLspServer.kt:100-105`). |
| 19 | Architecture tree ([ME-R2](../zenwave-platform-vscode/model-explorer.md#me-r2), [ME-R6](../zenwave-platform-vscode/model-explorer.md#me-r6)) | missing | Nothing in `plugin.xml`. |
| 20 | SDK runner ([decision 0011](../decisions/0011-sdk-runner-is-a-task-with-quoted-values.md)) | partial | A run marker builds a command and sends it to a terminal (`ZdlRunPluginLineMarkerContributor.kt:50-90`, `ZenWaveSDKTerminalRunner.kt:28,40`). Values are not quoted (`:83`, `"${it.key}=${it.value}"`) and no shell is checked. |
| 21 | Plugin catalogue ([decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md)) | partial | The SDK is started on every project open (`SdkAvailablePlugins.kt:27-48`, `waitFor()`); the spec says nothing starts it but a Run, and a refresh only when asked ([D20](../work/owner-decisions-2026-11-12.md)). No `zenwave/pluginCatalogue` notification. |
| 22 | Organize services ([MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5), [LVR-R19](../flows/lsp-visualization-requests.md#lvr-r19)) | partial | The action exists (`plugin.xml`, `ZflOrganizeServicesAction`) and sends no `mode` (`ZenwaveLspProjectService.kt:134-140`), so it removes unused elements; backlog PX/5.4. No additive mode, no *Add missing services*. |
| 23 | Diagnostics, hover, formatting, folding, completion | present | `ZenwaveEditorDiagnostics`, `ZenwaveFormattingService`, `ZenwaveDocumentationProvider`, folding builders, `ZdlCompletionContributor`; unit tests under `src/test/kotlin/.../lsp`. |

Counts: 4 present (9, 12, 14, 23), 7 partial (1, 2, 4, 17, 20, 21, 22), 12 missing.

### What the 2026-11-06 plan got right and what moved

- The plugin does run the server in process: `ZenwaveLspServer(defaultCoreLanguageServer())`
  (`ZenwaveLspProjectService.kt:277`). Every request can be called as a method; none has a wire. The plugin passes no
  `LanguageClient` (`connect` is never called), so anything the server sends to the client has no receiver. That matters
  for `zenwave/credential` ([LVR-R13](../flows/lsp-visualization-requests.md#lvr-r13)), which no server sends yet.
- The JCEF host only sends. It has no `JBCefJSQuery` (`ZflJcefDiagramHost.kt:114-200` are all `postMessage` scripts).
- Decision 0005 is confirmed ([D3](../work/owner-decisions-2026-11-12.md)): the plugin stays in its own repository. D18
  calls IntelliJ "now secondary", which sets the order of this plan.

## The 2026-11-06 plan, item by item

| Item | Verdict | Now |
| --- | --- | --- |
| A1 Align versions, decide Kotlin | holds, changed | `dsl-kotlin` target 1.11.0-SNAPSHOT is unchanged; the snapshot repository is wrong in the plugin, which the old plan missed ([IJ/1.2](../work/intellij-backlog.md#ij-1-2)). |
| A2 Add `dsl-views` and the architecture libraries to the composite | changed | The preview moves to the server (C), so no direct `dsl-views` dependency remains. `settings.gradle.kts` needs `dsl-kotlin` and `zenwave-lsp` only; the rest is checked in IJ/1.4. |
| A3 Compile and fix | holds | Larger: the DTOs and `lsp-jvm` API moved, and 4 tests build `ZenwaveLspServer`. |
| A4 Target IntelliJ version | holds | Open as [IJ-D1](#ij-d1). |
| A5 Tidy | holds, extended | Plus wrapper against `gradleVersion`, the stale changelog, and removal of `zenwave-sdk-cli` once ZDL previews move. |
| B1 Use the toolbar page | holds | The script is in `zenwave-architectural-vistas` (`scripts/sync-eventflow-webview.mjs:20`, `package.json:16`). The VS Code extension takes the page from npm (`@zenwave360/vistas-eventflow-webview`); how the plugin gets it is [IJ-D2](#ij-d2). |
| B2 Sync, delete old assets, check resources | holds | Unchanged. |
| B3 Make the host two-way | holds, larger | Add the humanize message ([EF-R22](../flows/eventflow.md#ef-r22)), the status bar messages, `savePositionsFailed` and protocol-version handling; the VS Code messages are the reference (`src/eventflow/protocol.ts:128-160`). |
| B4 Model from `zenwave/eventFlowViews` | holds, changed | The request now takes `variant`, `positions` and `lanes` and returns `variants`, `savedPositions`, `lanes` (`DtoMapper.kt:142-147`), and the capability flags `flowVariants`, `savedPositions`, `flowLanes` decide what the host offers. |
| B5 Delete `ZflDiagramModelProvider` | holds | Unchanged. |
| B6 `runIde` checks | holds | EWP-R3 still notes the IntelliJ run as pending. |
| C1 Preview through the service | holds, changed | `zenwave/preview` now has `mode` and grouped representations ([LVR-R17](../flows/lsp-visualization-requests.md#lvr-r17)). |
| C2 `ZflPreviewEditor` uses it | holds | Unchanged. |
| C3 Drop direct `dsl-views` use | holds | Unchanged. |
| C4 ZDL through `zenwave/preview`, optional | changed: no longer optional | [Decision 0009](../decisions/0009-mermaid-not-plantuml.md) and [D5](../work/owner-decisions-2026-11-12.md) settle Mermaid; only the timing is open ([IJ-D6](#ij-d6)). |
| C5 Check the split editor | holds | Unchanged. |
| Risks: Kotlin metadata | holds | See below. |
| Risks: CI needs `architecture-*` and `workspace-runtime` snapshots | changed | They are published to the Git snapshot repository ([decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md)); the plugin does not list it. |
| Risks: LVR-R17 to R19 `proposed` | holds | Still `proposed` in `lsp-visualization-requests.md:361-376`, implemented on the server. Flip with [IJ/9.5](../work/intellij-backlog.md#ij-9-5). |
| New since 2026-11-06 | not in the old plan | The architecture navigator, the Model tree outline, lanes, humanize in the page, the quoted SDK runner, the shipped catalogue, additive organize, capability flags, `initializationOptions` for allowed domains. |

## Plan

### A. Build and libraries

1. **O, S.** Settle the owner's uncommitted build changes: commit, change or drop them.
2. **M, S.** `dslKotlin` 1.11.0-SNAPSHOT; add `https://www.zenwave360.io/maven-snapshots/` (snapshots only); keep `mavenLocal()` out when `CI=true`.
3. **J, S.** Kotlin: keep 2.2.21 if the compiler reads 2.3.0 metadata, otherwise move to 2.3.0 if the target IDE allows it.
4. **M, M.** Compile and fix; check which `includeBuild` substitutions are really needed.
5. **J, S-M.** Target IntelliJ version, `sinceBuild`, Gradle plugin; `verifyPlugin`.
6. **M, S.** Tidy.
7. **J, S.** Audit the token sets against the grammars of `dsl-kotlin` 1.11.

### B. The server's contract

Read capabilities, handle the error kinds, add `eventFlowViews` and `preview` methods next to `hierarchy`.

### C. Previews from the server

ZFL sequence diagrams, then ZDL, `.zw` Model Docs and Scripts Docs, all from `zenwave/preview`.

### D. EventFlow: page and host, then model and state

Toolbar page, two-way host, model from `zenwave/eventFlowViews`, variants, lanes, labels, saved positions, tree selection.

### E. Hierarchy and navigation

Server labels ([D10](../work/owner-decisions-2026-11-12.md)), ZDL hierarchy, references.

### F. SDK runner and actions

Quote values, drop the startup SDK call, shipped catalogue, additive organize.

### G. Architecture navigator (waits for [IJ-D5](#ij-d5))

Manifest choice, `zenwave:` file system, tree.

### H. Release

CI, version scheme, notes, owner-only Marketplace steps, spec flips.

The tasks, with ids, files and checks, are in the [board](../work/intellij-backlog.md).

## Order

A first, in the order listed; A3 and A5 wait for [IJ-D1](#ij-d1). B after A4. Then C and D in parallel (D1 and D2 can start as soon
as the page source is chosen, [IJ-D2](#ij-d2)). E after B, F after A4 and in parallel with C and D, H last. G only if the owner
puts it in this update.
Eight to nine branches, 45 tasks, about 40 files; overall L, with G alone M-L again. Without G: M-L.

## Risks

- **Kotlin metadata against the IDE.** The libraries are built with Kotlin 2.3.0; the plugin compiles with 2.2.21. A compiler
  reads metadata one minor ahead, which fits here, but nothing in this survey proves it. The IDE's own bundled Kotlin
  (stdlib dependency is off, `kotlin.stdlib.default.dependency = false`, `gradle.properties:32`) bounds how new the plugin
  may go; a target IDE that bundles Kotlin older than the libraries' runtime will fail at load time, not at compile time.
  `verifyPlugin` and one `runIde` start catch it. The coroutines excludes (`build.gradle.kts:46-64`) stay: `lsp-core` is
  built against coroutines 1.8.1 and the IDE ships its own.
- **Snapshot publishing and CI.** The stack publishes `-SNAPSHOT` versions to a Git-hosted repository on every push to
  `develop`; a snapshot changes under its consumers and carries no record of its commit
  ([decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md)). The plugin's CI cannot be
  reproduced from a plugin commit alone, and `lsp-core` publishing races `dsl-kotlin`
  ([PX/9.6](../work/backlog.md)). A plugin release needs stable upstream versions, as the VS Code stable build does
  ([R-Q1](../zenwave-platform-vscode/release.md#r-q1)). Decision 0023 describes only the VS Code side.
- **In-process server against a protocol client.** In process the plugin has no wire, so wire bugs (BUG/5, initialisation
  options over stdio) never show, and the two clients can drift ([decision 0006](../decisions/0006-one-javascript-server-in-the-extension.md)).
  The other route is `lsp-jvm` over stdio through the platform's LSP support or LSP4IJ, which gives the same transport as VS
  Code and diagnostics, hover and formatting for free, at the price of a second JVM, a new dependency, and rewriting the
  working adapters. Not recommended for this update ([IJ-D3](#ij-d3)). The platform's LSP API availability depends on the
  IDE edition and version, which I did not verify.
- **Bundled `lsp4j`.** The IDE ships its own `org.eclipse.lsp4j`; the plugin ships 0.21.1. A mismatch in the classes the
  server's DTOs touch shows only at runtime. Check in `runIde` (task IJ/1.5).
- **JCEF.** Not every JBR has JCEF ([001/1.2](../work/backlog.md) is still a manual check); `JBCefApp.isSupported()` must
  be answered with a message, not an empty pane.
- **Layout in process.** `eventFlowViews` runs ELK on the IDE's JVM. It must stay off the EDT, and the picture can differ
  from VS Code's, which runs ELK in JavaScript (open question in the [backlog](../work/backlog.md), 004/7.12).
- **Server-to-client messages have no receiver** in process (see Findings); credentials need one before remote private
  content is possible ([AN/3.1](../work/backlog.md)).
- **Hierarchy labels.** [LVR-R11](../flows/lsp-visualization-requests.md#lvr-r11) says the server does not encode
  presentation; [D10](../work/owner-decisions-2026-11-12.md) says it composes the labels. The plugin's formatter follows
  whichever wins; its tests will break.

## For the owner

Each question has an anchor, and the board lists them at the top.

<a id="ij-d1"></a>
**IJ-D1. Which IntelliJ versions?** The build target (`platformVersion`) and the oldest supported (`sinceBuild`, now 252, 2025.2).
Newer than 2025.2 means a newer bundled Kotlin and JCEF, fewer old-IDE workarounds. Recommendation: build against the newest
stable release and set `sinceBuild` to the oldest release still receiving fixes, decided after `verifyPlugin` (IJ/1.5).

<a id="ij-d2"></a>
**IJ-D2. Which EventFlow page, and how does it reach the plugin?** The toolbar page is needed for variants, lanes and labels
(recommended, as in [EF-R3](../flows/eventflow.md#ef-r3)). Delivery: (a) keep copying built assets into
`src/main/resources/web/eventflow` with `pnpm sync:intellij` (today's way, simple, a binary diff in every commit); (b) download
the npm package at build time, as VS Code does (reproducible, needs network and a published version).

<a id="ij-d3"></a>
**IJ-D3. Keep the server in process?** Recommended: yes for this update, and record it in
[decision 0006](../decisions/0006-one-javascript-server-in-the-extension.md) as a consequence rather than a gap. Revisit when
a second JVM-hosted client or a wire bug makes drift costly.

<a id="ij-d4"></a>
**IJ-D4. How does the plugin find the manifest?** [D18](../work/owner-decisions-2026-11-12.md) dropped `.zenwave/config.yml` for
VS Code (backlog DEC/2, 2026-11-20); the plugin still reads it, and lsp-core keeps `ZenwaveWorkspaceConfig` only for it. Options: keep it for IntelliJ; or a project setting (file or URL, plus allowed domains and
remote manifest name) as in [decision 0014](../decisions/0014-one-manifest-per-workspace.md). The second matches VS Code and
needs no file in the repository.

<a id="ij-d5"></a>
**IJ-D5. Is the architecture navigator part of this update?** It needs a read-only virtual file system, a tree, and a
credential receiver: L, and independent of the rest. Recommendation: no. Ship parity of previews, EventFlow and the runner
first, since IntelliJ is secondary ([D18](../work/owner-decisions-2026-11-12.md)); plan G afterwards.

<a id="ij-d6"></a>
**IJ-D6. When does the ZDL preview change from PlantUML to Mermaid?** [Decision 0009](../decisions/0009-mermaid-not-plantuml.md)
says it will. The change shows a new notation and drops the `zenwave-sdk-cli` dependency. Recommendation: in this update,
with block 3.

<a id="ij-d7"></a>
**IJ-D7. What does *Organize services* do by default?** Backlog PX/5.4: the plugin removes unused elements, and the owner
understood it not to ([MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5), [D25](../work/owner-decisions-2026-11-12.md)).
Recommendation: additive by default, full on request, as in VS Code.

<a id="ij-d8"></a>
**IJ-D8. Where does the plugin catalogue come from?** [Decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md): a
catalogue generated by release automation. The VS Code one is shipped in its VSIX. Options: the plugin ships the same file,
pulled in at build time; or it keeps asking the SDK, but only when the user asks ([D20](../work/owner-decisions-2026-11-12.md)).

<a id="ij-d9"></a>
**IJ-D9. How is the plugin released?** Version scheme, pre-release channel and the stable gate are specified for VS Code only
([decisions 0023 to 0025](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md)). Marketplace upload,
signing keys and tokens are the owner's alone ([D2](../work/owner-decisions-2026-11-12.md)). Recommendation: copy the VS Code
scheme (pre-release channel on `develop`, stable by tag), and publish nothing until the stack has stable versions.

Manual checks that only a person with IntelliJ can do are tagged **O** on the board: the `runIde` runs of block 5, the
comparisons with VS Code, and the release.
