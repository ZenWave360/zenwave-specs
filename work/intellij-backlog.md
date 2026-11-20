# IntelliJ backlog

<a id="intellij-backlog"></a>

Everything open for `ZenWaveDomainModelEditor`, the IntelliJ plugin, in one place. It is separate from the [VS Code board](backlog.md) and
shares its style. The analysis, the gap tables and the risks are in [the IntelliJ update](../roadmap/intellij-update.md).

**Status:** written 2026-11-16 from a read-only survey of the plugin at 79964a2 (`main`, 2026-10-13). Nothing was built or run, so
every file and line is from reading, not from a failing build. VS Code reference: `feature/architecture-navigator` at fbd321a.

Tags: **M** mechanical, fit for Grok; **J** judgement; **O** the owner. Sizes S/M/L. Paths are relative to
`ZenWaveDomainModelEditor/` unless a repository is named. "Needs" lists the tasks or decisions that must land first.
Each block is 3 to 6 tasks to implement and review together; build and run the plugin once per block, not per task.

**No task here changes the ZDL, ZFL or ZW languages.** If one turns out to need it (a grammar token, a new annotation), stop and
ask the owner: such a task is not ready until the owner approves. The plugin takes its lexer and parser from `dsl-kotlin`, so
the grammar changes already made reach it by the version bump (IJ/2.4).

```
IJ/1  build and libraries          IJ/4  EventFlow page and host      IJ/7  SDK runner and actions
IJ/2  the server's contract        IJ/5  EventFlow model and state    IJ/8  architecture navigator (waits for D5)
IJ/3  previews from the server     IJ/6  hierarchy and navigation     IJ/9  release and specs
```

## Decisions for the owner

Each is specced, with options and a recommendation, under [For the owner](../roadmap/intellij-update.md#for-the-owner). Tasks that
wait for one say so in Needs.

- [ ] **IJ-D1** Which IntelliJ versions to build against and support: `platformVersion`, `sinceBuild` ([IJ-D1](../roadmap/intellij-update.md#ij-d1)). Blocks IJ/1.3, 1.5.
- [ ] **IJ-D2** Which EventFlow page, and how it reaches the plugin: copied assets or an npm package ([IJ-D2](../roadmap/intellij-update.md#ij-d2)). Blocks IJ/4.1.
- [ ] **IJ-D3** Keep the language server in process, or move to `lsp-jvm` over a protocol client ([IJ-D3](../roadmap/intellij-update.md#ij-d3)). Recommended: in process. Blocks nothing if confirmed.
- [ ] **IJ-D4** How the plugin finds the manifest: keep `.zenwave/config.yml` or a project setting. VS Code dropped the file (DEC/2, 2026-11-20); the plugin still reads it until this is decided and IJ/8.1 lands ([IJ-D4](../roadmap/intellij-update.md#ij-d4), [D18](owner-decisions-2026-11-12.md), [decision 0014](../decisions/0014-one-manifest-per-workspace.md)). Blocks IJ/8.1.
- [ ] **IJ-D5** Whether the architecture navigator is in this update ([IJ-D5](../roadmap/intellij-update.md#ij-d5)). Blocks all of IJ/8.
- [ ] **IJ-D6** When the ZDL preview changes from PlantUML to Mermaid ([IJ-D6](../roadmap/intellij-update.md#ij-d6), [decision 0009](../decisions/0009-mermaid-not-plantuml.md)). Blocks IJ/3.4.
- [ ] **IJ-D7** What *Organize services* does by default ([IJ-D7](../roadmap/intellij-update.md#ij-d7), backlog PX/5.4). Blocks IJ/7.4.
- [ ] **IJ-D8** Where the plugin catalogue comes from ([IJ-D8](../roadmap/intellij-update.md#ij-d8), [decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md)). Blocks IJ/7.2.
- [ ] **IJ-D9** Version scheme and release path of the plugin ([IJ-D9](../roadmap/intellij-update.md#ij-d9), [decisions 0023 to 0025](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md)). Blocks IJ/9.2, 9.4.

## Block 1. Build and libraries

Source: [update, A](../roadmap/intellij-update.md#findings), the version table. One branch.

<a id="ij-1-1"></a>
- [ ] **IJ/1.1** (**O**, S) Settle the owner's uncommitted changes in the plugin: commit, change or drop them, and ignore or commit `openspec/`.
  - Files: `build.gradle.kts`, `settings.gradle.kts`, `gradle/libs.versions.toml`, `README.md`, `openspec/`. Do not edit them before the owner decides.
  - Verify: `git status` clean on `main`; the README paragraph on local siblings matches `settings.gradle.kts:6-32`.
  - Needs: nothing. Source: [findings](../roadmap/intellij-update.md#findings).

<a id="ij-1-2"></a>
- [ ] **IJ/1.2** (M, S) Move `dslKotlin` to 1.11.0-SNAPSHOT and add the stack's snapshot repository, `https://www.zenwave360.io/maven-snapshots/` with `snapshotsOnly()`, so a CI build (`CI=true`, no `mavenLocal()`) resolves `dsl-*`, `lsp-*`, `architecture-*` and `json-schema-ref-parser-kmp`.
  - Files: `gradle/libs.versions.toml:6`, `build.gradle.kts:33`.
  - Verify: `./gradlew dependencies --configuration runtimeClasspath -PuseLocalDependencies=false` resolves every `io.zenwave360` module with no local repository.
  - Needs: IJ/1.1. Source: [versions](../roadmap/intellij-update.md#versions-and-libraries), [decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md).

- [ ] **IJ/1.3** (J, S) Decide the plugin's Kotlin: build the plugin as is (2.2.21) against `lsp-core` built with 2.3.0; if the compiler rejects the metadata, move to 2.3.0 if the target IDE's bundled Kotlin allows it. Record the result under Risks in the update.
  - Files: `gradle/libs.versions.toml:16`, `build.gradle.kts:22-24`.
  - Verify: `compileKotlin` passes, then `runIde` loads the plugin with no `NoSuchMethodError` or `IncompatibleClassChangeError` in `idea.log`.
  - Needs: IJ/1.2, IJ-D1. Source: [Risks](../roadmap/intellij-update.md#risks).

<a id="ij-1-4"></a>
- [ ] **IJ/1.4** (M, M) Compile against the current libraries and fix what breaks, and find which composite substitutions are really needed: `dsl-kotlin` and `zenwave-lsp` only, or also `dsl-views`, `dsl-docs` and the architecture libraries.
  - Files: `src/main/kotlin/.../plugins/zfl/editor/ZflPreviewEditor.kt:6-8`, `.../lsp/ZenwaveLspProjectService.kt`, `.../toolwindow/model/ZflDiagramModelProvider.kt`, tests under `src/test/kotlin/.../lsp`, `settings.gradle.kts:18-30`.
  - Verify: `.\gradlew.bat --no-daemon --console=plain --no-watch-fs --max-workers=2 test buildPlugin` passes with siblings, and again with `-PuseLocalDependencies=false`.
  - Needs: IJ/1.2. Source: [A3, A2 of the old plan](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item).

<a id="ij-1-5"></a>
- [ ] **IJ/1.5** (J, S-M) Set the target IDE, `sinceBuild` and the IntelliJ Platform Gradle plugin version; run the verifier; check the IDE's bundled `lsp4j` and coroutines against the plugin's.
  - Files: `gradle.properties:9,12`, `gradle/libs.versions.toml:15`, `build.gradle.kts:139-143`.
  - Verify: `verifyPlugin` reports no compatibility problem for the recommended IDEs; `runIde` opens a `.zfl` with diagnostics and hover.
  - Needs: IJ-D1, IJ/1.4. Source: [Risks](../roadmap/intellij-update.md#risks).

- [ ] **IJ/1.6** (M, S) Tidy: make `gradleVersion` (`gradle.properties:23`, 9.2.1) agree with the wrapper (9.5.0); drop the unused `antlr4Version = 4.12.0` (`:36`); write the changelog from 0.7.1 to the current version; check the Qodana version.
  - Files: `gradle.properties`, `gradle/wrapper/gradle-wrapper.properties`, `CHANGELOG.md`, `gradle/libs.versions.toml:18`.
  - Verify: `./gradlew wrapper --gradle-version` reports one value; `buildPlugin` renders change notes from the changelog.
  - Needs: IJ/1.4. Source: [A5](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item).

## Block 2. The server's contract

Source: [LVR-R1](../flows/lsp-visualization-requests.md#lvr-r1), [update, B](../roadmap/intellij-update.md#findings). The plugin is the only client with no capability check. One branch.

- [ ] **IJ/2.1** (M, S) Read `capabilities.experimental` from the `initialize` result into one object: `customRequests`, `previewModes`, `organizeModes`, `flowVariants`, `savedPositions`, `flowLanes`. Every later feature asks it.
  - Files: `.../lsp/ZenwaveLspProjectService.kt` (the `initialize` call near `:282`), a new `ZenwaveServerFeatures.kt` beside it.
  - Verify: a unit test with the in-process server asserts all 11 `zenwave/*` methods and the flags; a test with an old-server stand-in (empty `experimental`) reports every feature unavailable.
  - Needs: IJ/1.4. Source: [LVR-R1](../flows/lsp-visualization-requests.md#lvr-r1).

- [ ] **IJ/2.2** (M, S) Map -32803 errors by `data.kind` (`documentNotFound`, a document that cannot be read, `resourceNotDeclared`, `resourceUnresolved`) to messages the editors show: three failures, three messages (no server, old server, bad document).
  - Files: `ZenwaveLspProjectService.kt`, `BundleMessages.kt`, `messages/ZenWaveModelEditorBundle.properties`.
  - Verify: tests for each kind, with a message that names the kind and not "it does not work".
  - Needs: IJ/2.1. Source: [LVR-R2](../flows/lsp-visualization-requests.md#lvr-r2), [LVR-R3](../flows/lsp-visualization-requests.md#lvr-r3).

- [ ] **IJ/2.3** (M, S) Service methods `eventFlowViews(file, text, variant, lanes, positions)` and `preview(file, text, languageId, mode, sequenceRenderMode)` next to `hierarchy`, each synchronising the document first and returning a typed result or an error kind. Calls stay off the EDT.
  - Files: `ZenwaveLspProjectService.kt` (beside `hierarchy`, `:113-117`), `ZflLanguageServiceAdapter.kt`, a DTO file for `{flowGraph, serviceGraph, variants, savedPositions?, lanes?}`.
  - Verify: tests on `src/test/testData` fixtures: a flow with variants returns `variants`; a document with a syntax error returns the error kind; a call on the EDT fails an assertion.
  - Needs: IJ/2.1. Source: [LVR-R2](../flows/lsp-visualization-requests.md#lvr-r2), [LVR-R3](../flows/lsp-visualization-requests.md#lvr-r3), [LVR-R18](../flows/lsp-visualization-requests.md#lvr-r18).

<a id="ij-2-4"></a>
- [ ] **IJ/2.4** (J, S) Audit the lexer token sets, highlighter, brace matcher and folding against `Zdl.g4` and `Zfl.g4` of `dsl-kotlin` 1.11: the optional `for` keyword, `on` taking an event list, `@title`, `@actor`, `@timer` on policies. No grammar change: if the plugin needs one, stop (language rule).
  - Files: `.../zfl/language/ZflTokenTypes.kt:46+`, `.../zdl/language/ZdlTokenTypes.kt`, `ZflSyntaxHighlighter.kt`, `ZflBraceMatcher.kt`, `ZdlBraceMatcher.kt`, `DslBlockFoldingTest.kt`.
  - Verify: a fixture using each new construct parses with no PSI error element and highlights like its neighbours.
  - Needs: IJ/1.4. Source: `dsl-kotlin` commits `0d841b9`, `e071c60`; [backlog PX/10.5](backlog.md).

## Block 3. Previews from the server

Source: [update, C](../roadmap/intellij-update.md#findings), [decision 0020](../decisions/0020-previews-come-from-dsl-docs-through-the-server.md). One branch.

- [ ] **IJ/3.1** (M, S) The ZFL preview takes its representations from `zenwave/preview`, mapped to the editor's `MarkdownPreviewRepresentation`, honouring `defaultRepresentationId` and the server's titles and grouping.
  - Files: `.../zfl/editor/ZflPreviewEditor.kt:76-100`, `ZenwaveLspProjectService.kt`.
  - Verify: `ZflPreviewEditorTest` builds representations from a server answer; the flowchart and one sequence per outcome appear with the server's titles.
  - Needs: IJ/2.3. Source: [LVR-R3](../flows/lsp-visualization-requests.md#lvr-r3), [LVR-R17](../flows/lsp-visualization-requests.md#lvr-r17).

- [ ] **IJ/3.2** (J, S-M) Make the render-mode selector depend on `previewModes` and the sequence modes the server offers; call off the EDT; check each `format`; say what happens when the server does not answer.
  - Files: `ZflPreviewEditor.kt:35-66`, `CompositeMarkdownPreviewEditor.kt`.
  - Verify: with `previewModes` absent the selector is hidden and a message names the old server; a slow server shows a waiting state, not a frozen editor.
  - Needs: IJ/3.1. Source: [MP-R17](../zenwave-platform-vscode/model-preview.md#mp-r17).

- [ ] **IJ/3.3** (M, S) Remove the plugin's direct `dsl-views` use and its imports; update the test.
  - Files: `ZflPreviewEditor.kt:6-8,29,73`, `ZflPreviewEditorTest.kt`.
  - Verify: `grep -rn "io.zenwave360.language.eventflow" src/main` finds no `dsl-views` class; `test` passes.
  - Needs: IJ/3.1. Source: [C3](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item).

- [ ] **IJ/3.4** (J, M) ZDL, `.zw` previews through `zenwave/preview`: Model Docs, ZDL Diagrams (modes `docs` and `diagrams`, Show and Element selectors) and Scripts Docs for `.zw`; remove PlantUML, and `zdl-to-markdown` and `zenwave-sdk-cli` if nothing else uses them (`JSONPath` in `FieldCompletionContributor.kt:13` does).
  - Files: `.../zdl/editor/ZdlPreviewEditor.kt:9,27`, `ZdlPreviewEditorProvider.kt`, `ZdlSplitEditorProvider.kt`, `build.gradle.kts:50-56`, `gradle/libs.versions.toml:7-8`.
  - Verify: a `.zdl` shows Model Docs and per-element diagrams; a `.zw` shows Scripts Docs; the build no longer needs the SDK libraries (or says which use remains).
  - Needs: IJ-D6, IJ/3.1, IJ/2.3. Source: [MP-R22](../zenwave-platform-vscode/model-preview.md#mp-r22), [MP-R23](../zenwave-platform-vscode/model-preview.md#mp-r23), [MP-R25](../zenwave-platform-vscode/model-preview.md#mp-r25), [decision 0009](../decisions/0009-mermaid-not-plantuml.md).

- [ ] **IJ/3.5** (J, S) Hold the host to what the server promises: rendered content carries no code and no remote references ([LVR-R14](../flows/lsp-visualization-requests.md#lvr-r14)), so check how the Markdown preview and the Mermaid HTML page treat links, raw HTML and scripts; follow workspace and `http(s)` links through the IDE ([MP-R20](../zenwave-platform-vscode/model-preview.md#mp-r20)); accept only the exact `details` and `summary` lines ([MP-R21](../zenwave-platform-vscode/model-preview.md#mp-r21)).
  - Files: `CompositeMarkdownPreviewEditor.kt`, `.../editor/` HTML builders, `src/main/resources/web/mermaid/`.
  - Verify: tests with a representation carrying `<script>`, `javascript:` and a remote image: none runs or loads; a workspace link opens the file.
  - Needs: IJ/3.1. Source: [LVR-R14](../flows/lsp-visualization-requests.md#lvr-r14).

- [ ] **IJ/3.6** (**O**, S) Check by hand the split `.zfl` and `.zdl` editors and every mode, and compare with VS Code on the same fixtures.
  - Files: none. Verify: `runIde`; differences recorded as bugs against one of the two clients ([backlog 005/7.15](backlog.md)).
  - Needs: IJ/3.1 to 3.5. Source: [backlog 005/7.15](backlog.md).

## Block 4. EventFlow page and host

Source: [update, B](../roadmap/intellij-update.md#findings), [EWP](../flows/eventflow-webview-protocol.md), [EF-R3](../flows/eventflow.md#ef-r3). Spans two repositories, so one branch in each. The page is `zenwave-architectural-vistas/apps/eventflow-toolbar-webview`.

- [ ] **IJ/4.1** (M, S) Point `pnpm sync:intellij` at the toolbar page, or implement the delivery chosen in IJ-D2.
  - Files: `zenwave-architectural-vistas/scripts/sync-eventflow-webview.mjs:20`, `package.json:13-17`; or a Gradle task downloading the package (`build.gradle.kts`).
  - Verify: `pnpm sync:intellij:dry-run` lists the toolbar page's files and the plugin's old `index-yNYAXfAh.*` assets as deleted.
  - Needs: IJ-D2. Source: [B1](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item), [EF-R3](../flows/eventflow.md#ef-r3).

- [ ] **IJ/4.2** (M, S) Run the sync, commit the new assets, and check the JCEF resource handler still finds `./assets/*` and serves them under the host's content security policy.
  - Files: `src/main/resources/web/eventflow/`, `.../diagram/ZflJcefDiagramHost.kt:215-244`.
  - Verify: `runIde`: the tool window loads the page with a toolbar and no console error; `assetPaths` in a test lists every script and style in `index.html`.
  - Needs: IJ/4.1. Source: [EWP-R4](../flows/eventflow-webview-protocol.md#ewp-r4).

- [ ] **IJ/4.3** (J, M-L) Make the host two-way with `JBCefJSQuery`: receive `webviewReady` (with `protocol` and `protocolVersion`), `variantChanged`, `lanesChanged`, `labelsChanged`, `savePositions`; ignore unknown types; keep the pending-bundle flush until readiness. Mirror the message shapes of VS Code's `src/eventflow/protocol.ts:128-160`, and do not invent types.
  - Files: `ZflJcefDiagramHost.kt` (`:23-60`, `:114-200`), `ZflDiagramHost.kt`, a new inbound-message parser with tests.
  - Verify: unit tests for each inbound message and for an unknown one; `webviewReady` with an unsupported `protocolVersion` shows a message, not a blank page.
  - Needs: IJ/4.2. Source: [EWP-R3](../flows/eventflow-webview-protocol.md#ewp-r3), [EWP-R5](../flows/eventflow-webview-protocol.md#ewp-r5), [EWP-R6](../flows/eventflow-webview-protocol.md#ewp-r6), [EF-R12](../flows/eventflow.md#ef-r12).

- [ ] **IJ/4.4** (J, S) Send what the page needs to know about the host: `lanesSupported` only when the server advertises `flowLanes`; the humanize setting and the highlight message; show page messages (status bar) and the load error; show a plain message when JCEF is not supported.
  - Files: `ZflJcefDiagramHost.kt`, `ZflDiagramPane.kt`, `CompositeMarkdownPreviewEditor.kt:131` (the `JBCefApp.isSupported()` check).
  - Verify: tests with a stub server lacking `flowLanes`: no lanes control; with JCEF unsupported, a message, not an empty pane.
  - Needs: IJ/4.3, IJ/2.1. Source: [EWP-R2](../flows/eventflow-webview-protocol.md#ewp-r2), [EF-R22](../flows/eventflow.md#ef-r22), [backlog 001/1.2](backlog.md).

## Block 5. EventFlow model and state

Source: [LVR-R2](../flows/lsp-visualization-requests.md#lvr-r2), [LVR-R18](../flows/lsp-visualization-requests.md#lvr-r18), [EF-R12 to EF-R14](../flows/eventflow.md#ef-r12), [decision 0022](../decisions/0022-saved-positions-are-a-file-beside-the-model.md). One branch.

- [ ] **IJ/5.1** (J, M) Take the diagram model from `zenwave/eventFlowViews` through `ZenwaveLspProjectService`, replacing the local build: the tool window sends `flowGraph`, `serviceGraph` and `variants` unchanged to the page and handles the error kinds.
  - Files: `ZflToolWindowController.kt:90-140`, `ZflToolWindowDependencies.kt:25`, `ZflLanguageServiceAdapter.kt`.
  - Verify: a test with a fixture ZFL: the host receives the server's JSON byte-for-byte; a document with a syntax error shows the server's message, not an empty diagram.
  - Needs: IJ/2.3, IJ/4.3. Source: [B4](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item), [LVR-R2](../flows/lsp-visualization-requests.md#lvr-r2).

- [ ] **IJ/5.2** (J, M) Per-diagram state for variant, lanes and humanize; a `variantChanged` or `lanesChanged` message makes a new request and sends a new `renderBundle`; a variant never reads or writes saved positions.
  - Files: `ZflToolWindowController.kt`, `ZflSessionTracker.kt`, a new state class beside `ZflDiagramViewMode.kt`.
  - Verify: tests: choosing a variant requests it from the server and shows it; switching document and back keeps each file's choice; lanes values are `none`, `systems`, `services` only.
  - Needs: IJ/5.1. Source: [EF-R12](../flows/eventflow.md#ef-r12), [EF-R22](../flows/eventflow.md#ef-r22), [EF-R20 to R24](../flows/eventflow.md#ef-r20).

- [ ] **IJ/5.3** (J, M) Saved positions: read `<file>.zfl.positions.json` beside the model and pass `positions` in the request; on `savePositions` write it through the IDE's file API with sorted keys and whole numbers, or refuse with `savePositionsFailed`; say in the page when positions did not apply.
  - Files: new `ZflPositionsFile.kt`, `ZflToolWindowController.kt`, `ZenwaveLspProjectService.kt`.
  - Verify: tests: round trip of the file format `zfl.eventflow.positions@1`; a node renamed so a position is missing falls back to automatic layout and the page says why; a read-only file yields `savePositionsFailed`.
  - Needs: IJ/5.2. Source: [EF-R14](../flows/eventflow.md#ef-r14), [decision 0022](../decisions/0022-saved-positions-are-a-file-beside-the-model.md), [EF-Q9](../flows/eventflow.md#ef-q9).

- [ ] **IJ/5.4** (M, S) Delete `ZflDiagramModelProvider` and its test and Jackson if nothing else needs it; remove the Swing view and humanize controls the page now owns.
  - Files: `.../toolwindow/model/ZflDiagramModelProvider.kt`, `ZflDiagramModelProviderTest.kt`, `ZflToolWindowTopBar.kt:21,84,91`, `build.gradle.kts`.
  - Verify: `test buildPlugin` passes; `grep -rn "LinkageError" src/main` finds nothing.
  - Needs: IJ/5.1, IJ/5.2. Source: [B5](../roadmap/intellij-update.md#the-2026-11-06-plan-item-by-item), [EF-R22](../flows/eventflow.md#ef-r22).

- [ ] **IJ/5.5** (**O**, M) `runIde` on one fixture: load, variants, lanes, humanize, save positions, reopen, and the highlight from the tree; record that [EWP-R3](../flows/eventflow-webview-protocol.md#ewp-r3) is checked in IntelliJ, and compare nodes and layout with VS Code.
  - Files: none. Verify: a short note in the commit or on the board; differences logged ([backlog 004/7.12, EF-R3/5](backlog.md); JVM and JS ELK sizes differ, spec question 1).
  - Needs: IJ/5.1 to 5.4. Source: [backlog 004/7.12](backlog.md), [EWP-R3](../flows/eventflow-webview-protocol.md#ewp-r3).

## Block 6. Hierarchy and navigation

Source: [model explorer](../zenwave-platform-vscode/model-explorer.md), [LVR-R5 to R11](../flows/lsp-visualization-requests.md#lvr-r5). The tree is IntelliJ's tool window, not a custom editor ([decision 0010](../decisions/0010-rendered-views-are-custom-editors.md)). One branch.

- [ ] **IJ/6.1** (J, S) Follow the hierarchy-label decision: once the owner's D10 is written into LVR-R11, the plugin shows the server's label as it stands and keeps only icons and grouping.
  - Files: `.../toolwindow/tree/ZflHierarchyPresentationFormatter.kt:7-17`, `ZflTreeModelProvider.kt`, `ZflTreeModelProviderTest.kt`.
  - Verify: the tree shows exactly the server's labels for a fixture; unknown node kinds still show.
  - Needs: [DEC/1 in the VS Code board](backlog.md) (D10 recorded in LVR-R11). Source: [D10](owner-decisions-2026-11-12.md), [LVR-R11](../flows/lsp-visualization-requests.md#lvr-r11), [ME-R6](../zenwave-platform-vscode/model-explorer.md#me-r6).

- [ ] **IJ/6.2** (J, M) A model tree for `.zdl` and `.zw` documents, not only ZFL, from `zenwave/hierarchy`; collapse fields as the VS Code tree does; "nothing provides an outline" when the server has no answer.
  - Files: `.../toolwindow/` (the ZFL-only tool window and `ZflSessionTracker.kt`), `plugin.xml` (tool window or structure view), `ZenwaveLspProjectService.kt:113`.
  - Verify: opening a `.zdl` fills the tree with entities, events and services; fixtures with `.zw` and with no answer.
  - Needs: IJ/2.1. Source: [ME-R3](../zenwave-platform-vscode/model-explorer.md#me-r3), [ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9), [LVR-R5](../flows/lsp-visualization-requests.md#lvr-r5), [D22](owner-decisions-2026-11-12.md).

- [ ] **IJ/6.3** (J, M) Tree and diagram follow each other: selecting a node highlights it in the page and a node click selects the tree item, matching by the ids both carry.
  - Files: `ZflToolWindowController.kt`, `ZflNavigationService.kt`, `ZflDiagramHost.kt`, `ZflJcefDiagramHost.kt`.
  - Verify: tests on the id matching with a fixture; `runIde` check in IJ/5.5.
  - Needs: IJ/4.3, IJ/5.1. Source: [ME-R7](../zenwave-platform-vscode/model-explorer.md#me-r7), [LVR-R10](../flows/lsp-visualization-requests.md#lvr-r10), [EWP-R2](../flows/eventflow-webview-protocol.md#ewp-r2).

- [ ] **IJ/6.4** (J, M) References: `zenwave/symbolAt` then `forwardReferences` and `reverseReferences` behind Find Usages and a "Go to references" action, and `conceptAt` where the spec asks for it.
  - Files: new `ZenwaveReferencesHandler.kt`, `ZenwaveLspProjectService.kt`, `plugin.xml`.
  - Verify: tests on a two-file fixture: usages of an entity found in the second file. Note [LVR-R8, R9](../flows/lsp-visualization-requests.md#lvr-r8) are *partial* and [D28](owner-decisions-2026-11-12.md) changes `conceptAt`'s answer to an object; do not build `conceptAt` before that lands (backlog `001/2.x`).
  - Needs: IJ/2.1. Source: [LVR-R7 to R9](../flows/lsp-visualization-requests.md#lvr-r7), [backlog PX/9.7](backlog.md).
  - Amended 2026-11-20 by [navigation](../zenwave-lsp/navigation-spec.md): who uses a concept is Find Usages only, with no second action ([NAV-R19](../zenwave-lsp/navigation-spec.md#nav-r19)); forward references stay an action; Go to Declaration shows a list when there are several targets instead of `firstOrNull()` ([NAV-R6](../zenwave-lsp/navigation-spec.md#nav-r6)); the manual checklist is [NAV-R22](../zenwave-lsp/navigation-spec.md#nav-r22) (backlog PX/7.2, PX/7.5).

- [ ] **IJ/6.5** (**O**, S) Compare the tree and the references with VS Code on the same fixtures.
  - Files: none. Verify: differences logged as bugs against one client ([backlog 006/7.4, 001/6.4](backlog.md)).
  - Needs: IJ/6.1 to 6.4. Source: [backlog 006/7.4](backlog.md).

## Block 7. SDK runner and actions

Source: [decision 0011](../decisions/0011-sdk-runner-is-a-task-with-quoted-values.md), [decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md), [MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5). Independent of blocks 3 to 6; one branch.

- [ ] **IJ/7.1** (J, S) Quote every value that reaches the command: config options, CLI options, imports, injected paths, `zwCli`. Only POSIX shells and PowerShell are supported; refuse any other with an explanation (`cmd.exe` included).
  - Files: `.../zdl/editor/ZdlRunPluginLineMarkerContributor.kt:50-90`, `ZenWaveSDKTerminalRunner.kt:28,40`, `ZenWaveSDKTerminalRunnerTest.kt`.
  - Verify: tests with values containing spaces, `"`, `'`, `&`, `;`, `$`, `%`: each reaches the SDK as one argument, in both shell families; a value with `"` under Windows PowerShell is refused as the spec says.
  - Needs: IJ/1.4. Source: [decision 0011](../decisions/0011-sdk-runner-is-a-task-with-quoted-values.md), [SR-R2](../zenwave-platform-vscode/sdk-runner.md#sr-r2).

- [ ] **IJ/7.2** (J, M) Stop starting the SDK on every project open. Ship the catalogue (source per IJ-D8), send it to the server with `zenwave/pluginCatalogue`, and refresh from the installed SDK only when the user asks, persisted at application or project scope as the user chooses.
  - Files: `.../settings/SdkAvailablePlugins.kt:27-60`, `PluginsCompletionContributor.kt:18-55`, `plugin.xml` (`postStartupActivity`), settings configurables, `ZenwaveLspProjectService.kt`.
  - Verify: opening a project starts no process (a test asserts it); completion for `plugins` works with no SDK installed; the refresh action works with one.
  - Needs: IJ-D8, IJ/2.1. Source: [decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md), [D20](owner-decisions-2026-11-12.md), [SR-R11, SR-R12](../zenwave-platform-vscode/sdk-runner.md#sr-r11).

- [ ] **IJ/7.3** (J, S) Configuration-level CLI options act in the plugin as in VS Code: inherited with the enclosing configuration, excluded for `(inherit false)`, and a plugin-local option replaces a shared one with the same name.
  - Files: `ZdlRunPluginLineMarkerContributor.kt:97+` (`inheritedCommandOptions`), `ZenWaveSDKTerminalRunnerTest.kt`.
  - Verify: a fixture with `--force` in `config`: the complete command matches the one VS Code emits.
  - Needs: IJ/7.1. Source: [backlog 001/6.5](backlog.md).

- [ ] **IJ/7.4** (J, S) *Organize services* sends `mode` and respects `organizeModes`: additive by default, full when asked and after a confirmation; add *Add missing services* if the owner wants parity.
  - Files: `ZenwaveLspProjectService.kt:134-140`, `ZflOrganizeServicesSupport.kt:24`, `ZflOrganizeServicesAction.kt`, `plugin.xml` (actions), tests.
  - Verify: tests: additive removes nothing from a fixture with an unused service; full does and asks first; a server without `organizeModes` gets the old behaviour with a notice.
  - Needs: IJ-D7, IJ/2.1. Source: [MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5), [LVR-R19](../flows/lsp-visualization-requests.md#lvr-r19), [backlog PX/5.4](backlog.md), [D25](owner-decisions-2026-11-12.md).

- [ ] **IJ/7.5** (**O**, S) Run the marker in a bash, a zsh and a PowerShell terminal on one project with an awkward path; check the catalogue refresh by hand.
  - Files: none. Verify: the commands run and generate; results noted.
  - Needs: IJ/7.1 to 7.4. Source: [decision 0011](../decisions/0011-sdk-runner-is-a-task-with-quoted-values.md).

## Block 8. Architecture navigator (waits for IJ-D5)

Not ready: the owner decides first whether this is in the update. If yes, these tasks follow the VS Code ones (backlog AN/4 and AN/5), and the server side is already built ([AN/2.3](backlog.md), [AN/3.2](backlog.md)). Credentials ([AN/3.1](backlog.md)) are not built on the server, so remote private content is out of scope here.

- [ ] **IJ/8.1** (J, M) The manifest and its server inputs as project settings instead of `.zenwave/config.yml` (per IJ-D4): a file or URL, `remoteManifestName`, `allowedDomains`; sent in `initializationOptions.zenwave`; the server restarts when they change.
  - Files: `.../settings/ProjectSettingsState.kt`, `ProjectSettingsConfigurable.kt`, `ZenwaveWorkspaceConfigProvider.kt`, `ZenwaveLspProjectService.kt:226-300,347-353`.
  - Verify: tests: settings produce the options the server's `parseZenwaveInitializationOptions` accepts (`ZenwaveInitializationOptions.kt:19-24`); an invalid name falls back and logs the warning.
  - Needs: IJ-D4, IJ-D5, IJ/2.1. Source: [LC-R5](../zenwave-platform-vscode/lsp-client.md#lc-r5), [decision 0014](../decisions/0014-one-manifest-per-workspace.md), [AR-Q1, AR-Q4](../flows/architecture-resources.md#ar-q1).
  - Afterwards: delete `ZenwaveWorkspaceConfig` (and its test) from zenwave-lsp `lsp-core/.../config/`, its last reader gone; drop IJ/F.2.

- [ ] **IJ/8.2** (J, L) A read-only `zenwave:` virtual file system that calls `zenwave/statResource` and `zenwave/readResource`, serves only declared addresses, opens each file in the editor for its type, and says why one cannot be opened.
  - Files: new `.../resources/ZenwaveFileSystem.kt`, `plugin.xml` (`virtualFileSystem`, file type bindings), `ZenwaveLspProjectService.kt`.
  - Verify: tests with the in-process server and the Arcadia reference manifest: a remote ZDL opens with diagnostics; an undeclared address reports `resourceNotDeclared`; the file cannot be edited.
  - Needs: IJ/8.1. Source: [AR-R1 to AR-R9](../flows/architecture-resources.md#ar-r1), [decision 0027](../decisions/0027-the-server-serves-the-zenwave-scheme.md), [LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6).

- [ ] **IJ/8.3** (J, L) An Architecture tool window with domains, services, Artifacts, Docs and Consumers from the manifest's hierarchy, lazy opening, a failure marker with the URLs, Refresh, and folder or glob entries shown as pending.
  - Files: new `.../architecture/` tool window, `plugin.xml`.
  - Verify: tree-model tests as the VS Code ones (`AN/5.1`, `AN/5.2`); `runIde` against the reference manifest.
  - Needs: IJ/8.2, IJ/6.2. Source: [ME-R2](../zenwave-platform-vscode/model-explorer.md#me-r2), [ME-R6](../zenwave-platform-vscode/model-explorer.md#me-r6), [AR-R6](../flows/architecture-resources.md#ar-r6).

- [ ] **IJ/8.4** (J, M) Give the in-process server a `LanguageClient` so server-to-client messages have a receiver (`connect`), and wire logging and, later, `zenwave/credential` to the IDE's password store.
  - Files: `ZenwaveLspProjectService.kt` (server creation, `:277`), a new `ZenwaveClient.kt`.
  - Verify: a test sends a log message from the server and sees it in `idea.log`; credentials stay out of scope until AN/3.1 lands.
  - Needs: IJ-D5; waits for [AN/3.1](backlog.md) for credentials. Source: [LVR-R13](../flows/lsp-visualization-requests.md#lvr-r13), [decision 0008](../decisions/0008-credentials-are-handed-over-per-request.md).

- [ ] **IJ/8.5** (**O**, M) Open the Arcadia manifest by URL in `runIde`, expand a service, open a remote ZDL, an OpenAPI and a Markdown file; compare with VS Code.
  - Files: none. Verify: the check of [AN/6.1](backlog.md) repeated for IntelliJ, recorded.
  - Needs: IJ/8.1 to 8.3. Source: [backlog AN/6.1](backlog.md).

## Block 9. Release and specs

Source: [decisions 0023 to 0025](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md), [update, Risks](../roadmap/intellij-update.md#risks). The last block of the iteration.

- [ ] **IJ/9.1** (J, S) CI resolves the stack from the snapshot repository and waits for the upstream publish, as `lsp-core` does for `dsl-kotlin`; the build runs with `CI=true` and no sibling.
  - Files: `.github/workflows/build.yml`, `release.yml`, `build.gradle.kts:27-33`.
  - Verify: a push to a branch builds green from a clean runner with no local repository; the log shows the snapshot timestamps resolved.
  - Needs: IJ/1.2. Source: [backlog PX/9.6](backlog.md), [decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md).

<a id="ij-9-2"></a>
- [ ] **IJ/9.2** (J, S) Write the plugin's version scheme and channels: pre-release on `develop`, stable by tag, notes as files, and the stable gate. Record it as a decision beside 0023 to 0025.
  - Files: `gradle.properties:6`, `build.gradle.kts:117-122` (channels from the version), a new file in `decisions/`.
  - Verify: the decision is listed in `decisions/README.md`; a dry-run of the version computation gives the expected channel for `0.9.0-alpha.1` and `0.9.0`.
  - Needs: IJ-D9. Source: [decisions 0023 to 0025](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md).

- [ ] **IJ/9.3** (M, S) README, plugin description, change notes and third-party notices match the new features, including the bundled Mermaid and the EventFlow page.
  - Files: `README.md` (`<!-- Plugin description -->`), `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`.
  - Verify: `buildPlugin` fails on a missing description section, and the generated plugin XML shows the new text.
  - Needs: IJ/5.4, IJ/7.4. Source: [findings](../roadmap/intellij-update.md#findings).

- [ ] **IJ/9.4** (**O**, M) `verifyPlugin`, signing and the Marketplace upload. Only the owner holds the keys and tokens.
  - Files: `build.gradle.kts:100-128` (signing, publishing), `certs/`.
  - Verify: the verifier passes on the recommended IDEs; the owner uploads.
  - Needs: IJ-D9, IJ/9.1 to 9.3, and stable upstream versions. Source: [D2](owner-decisions-2026-11-12.md), [R-Q1](../zenwave-platform-vscode/release.md#r-q1).

<a id="ij-9-5"></a>
- [ ] **IJ/9.5** (M, S) Spec flips and gaps, in this repository: describe the plugin where [the stack](../architecture/stack.md) says "not described here"; flip LVR-R17 to R19 to *exists*; mark [EWP-R3](../flows/eventflow-webview-protocol.md#ewp-r3) and EF-R3 as checked in IntelliJ; update [status](../architecture/status.md); tick the IntelliJ items of the VS Code board that this board closed (`001/5.3`, `EF-R3/5`, `004/7.12`, `006/7.4`, `007/7.8`, `005/7.15`, `PX/5.4`).
  - Files: `architecture/stack.md:58`, `architecture/status.md`, `flows/lsp-visualization-requests.md:361-376`, `flows/eventflow-webview-protocol.md:49`, `work/backlog.md`, `README.md` (table of contents: add this board and the update).
  - Verify: each flipped rule names the commit that made it true; the README links both documents.
  - Needs: the tasks each flip depends on. Source: [AGENTS.md](../AGENTS.md#changing-behaviour).

## Order

1 → 2, then 3 and 4→5 in parallel; 7 any time after IJ/1.4; 6 after 2 and 5; 9 last. 8 only if the owner says so.
Decisions IJ-D1, D2, D6, D7, D8 are wanted before block 1 closes, so the blocks that wait on them can start in order.

## Follow-ups from the 2026-11-17 review

Low findings from the Opus and Codex reviews of `feature/ij-eventflow` (901351c). None blocks the 0.9 build.

- [ ] **IJ/F.1** (J, S) Echo `diagramId` in the page's `savePositions` so a save queued just before a document switch cannot land in the other file. This changes the webview contract ([EWP](../flows/eventflow-webview-protocol.md)), so it needs a vistas release.
- [ ] **IJ/F.2** (M, S) Saving `.zenwave/config.yml` does not refresh a diagram that shows "server down" until the next edit; trigger a refresh after config invalidation.
- [ ] **IJ/F.3** (J, S) Hover and definition can still start a server or probe up to 13 times inside a read action once they hold the lock; make that path cancellable or skip the start.
- [ ] **IJ/F.4** (M, S) A failed start with no text or stamp adopts the next document state as failing; match it to the state of the failed attempt.
- [ ] **IJ/F.5** (M, S) `refreshEventflowWebview` deletes the assets before checking `protocol.json`; extract and check under `build/` first.
- [ ] **IJ/F.6** (M, S) Test gaps: running→failed notification through the real session; config fix notifies the diagram; `starts == 1` in `ZflDeadServerRefreshTest`.
- [ ] **IJ/F.7** (J, S) Design notes: `ZflEventFlowSession` imports `BundleMessages`; no outcome logging like VS Code's `describeOutcome`; make the live ports a `Disposable` child; share the request/parse/failure path of `eventFlowViews` and `preview` before IJ/3.
