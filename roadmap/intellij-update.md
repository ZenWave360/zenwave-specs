# IntelliJ plugin: update to the current stack

Plan written 2026-11-06 from a read-only survey of `ZenWaveDomainModelEditor` at 79964a2 (2026-10-13). Nothing was built.
The checkout has uncommitted changes of the owner's in `build.gradle.kts`, `settings.gradle.kts`, `libs.versions.toml`
and `README.md` (conditional `includeBuild`, `dslKotlin` 1.10.0-SNAPSHOT) and an untracked `openspec/`; they are
settled first.

Tags: **M** mechanical, fit for Grok; **J** judgement; **O** the owner. Sizes S/M/L.

## Findings

- Build: IntelliJ Platform Gradle plugin 2.16.0, Kotlin 2.2.21, `platformVersion=2025.2.5`, `sinceBuild=252`,
  `pluginVersion=0.8.1`, JDK 21. zenwave-lsp builds with Kotlin 2.3.0; dsl-kotlin is at 1.11.0-SNAPSHOT.
- Packages did not change (`io.zenwave360.language.*`). What moved is the module: `GenerateMermaidFromZfl`,
  `MermaidDiagramsView` and `MermaidSequenceRenderMode` are now in `io.zenwave360.dsl:dsl-views`, which the plugin
  neither depends on nor substitutes. Only `ZflPreviewEditor.kt:6-8` imports them.
- The plugin already runs the language server in process: `ZenwaveLspProjectService.kt` (~line 277) builds
  `ZenwaveLspServer(defaultCoreLanguageServer())` and calls its methods directly. `preview()` and `eventFlowViews()`
  can be called the way `hierarchy()` is.
- Sequence diagrams are generated locally (`ZflPreviewEditor.kt:80`). The EventFlow model is generated locally too
  (`ZflDiagramModelProvider.kt:30-31`, with ~140 lines of hand mapping as a `LinkageError` fallback).
- The JCEF host (`ZflJcefDiagramHost.kt`) only sends. It has no `JBCefJSQuery` and never hears `webviewReady`. The
  bundled assets in `src/main/resources/web/eventflow/` are stale.
- vistas: `pnpm sync:intellij` copies `apps/eventflow-webview/dist`, the page without a toolbar. Variants, lanes,
  labels and saved positions are in `apps/eventflow-toolbar-webview`, which the script does not copy. Neither is on npm.

## A. Versions and libraries

1. **J, S.** Align versions: dsl-kotlin 1.11.0-SNAPSHOT, lsp 0.1.0-SNAPSHOT. Decide the plugin's Kotlin: 2.2.21
   reading 2.3.0 metadata from lsp may fail, and the IDE's bundled Kotlin bounds it.
2. **M, S.** Add `dsl-views` to the catalogue, `build.gradle.kts` (same coroutine excludes) and the composite
   substitutions; also `dsl-docs`, `architecture-manifest`, `workspace-runtime`, which lsp-core pulls in.
3. **M, S.** Compile and fix: ~3-6 files (`ZflPreviewEditor`, `ZenwaveLspProjectService`, two tests).
4. **J, S-M.** Target IntelliJ version and `sinceBuild`; platform Gradle plugin version.
5. **M, S.** Tidy: duplicated antlr version (4.12.0 vs 4.13.2), SDK 2.6.0-SNAPSHOT deps; `buildPlugin`, `verifyPlugin`.

## B. EventFlow from zenwave-architectural-vistas

1. **J, S.** Use the toolbar page; point `sync-eventflow-webview.mjs` at `apps/eventflow-toolbar-webview/dist`.
2. **M, S.** Run `pnpm sync:intellij`, delete the old assets, check `registerEventFlowResources`
   (`ZflJcefDiagramHost.kt:215-244`) still finds `./assets/*`.
3. **J, M-L.** Make the host two-way per [the webview protocol](../flows/eventflow-webview-protocol.md):
   `JBCefJSQuery`, check `webviewReady.protocolVersion`, keep variant, lanes and labels per diagram, answer
   `variantChanged`/`lanesChanged` with a new `renderBundle`, write or refuse `savePositions`, send
   `lanesSupported` only when the server advertises `flowLanes`.
4. **J, M.** Take the model from `zenwave/eventFlowViews` through `ZenwaveLspProjectService`, read capabilities
   from `initialize`, handle -32803.
5. **M, S.** Delete `ZflDiagramModelProvider` and its test, and Jackson if unused.
6. **O.** `runIde`: load, variants, lanes, save positions, highlight (EWP-R3 waits on this).

## C. Sequence diagrams from the server

1. **M, S.** `ZenwaveLspProjectService.preview(file, text, languageId, sequenceRenderMode)` over
   `ZenwaveLspServer.preview(PreviewRequest)`, mapped to the editor's representations.
2. **J, S-M.** `ZflPreviewEditor` uses it instead of `GenerateMermaidFromZfl`: render mode selector, off the EDT,
   check the `format`, behaviour when the server does not answer.
3. **M, S.** Drop the plugin's direct `dsl-views` use; update `ZflPreviewEditorTest`.
4. **J, M, optional.** ZDL through `zenwave/preview` instead of the SDK's PlantUML: not in scope unless the owner asks.
5. **O.** Check the split `.zfl` editor and both sequence modes.

## Order

A1 → A2 → A3, then B and C in parallel; B1/B2 can start at once. A4/A5 before any release. Three branches.
About 15-20 files; overall M-L.

## Risks

- Kotlin metadata mismatch with the IDE's Kotlin; keep the coroutine excludes.
- Without the composite build, CI needs `architecture-*` and `workspace-runtime` SNAPSHOTs published.
- LVR-R17 to R19 are still `proposed` though implemented; names may move.

## For the owner

Target IntelliJ version, toolbar page (recommended), whether ZDL moves to `zenwave/preview`, the manual `runIde`
checks, and any Marketplace publication.
