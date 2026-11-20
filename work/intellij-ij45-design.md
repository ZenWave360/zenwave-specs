# Design: IJ/4 (EventFlow page and host) and IJ/5 (EventFlow model and state)

The design ports VS Code's `src/eventflow/{protocol,session,diagram-state,positions}.ts` to Kotlin almost line for line. There is one IntelliJ difference: one tool-window browser shows many documents, so one session switches between documents and keeps a per-document state store. The model is held by reference. The plugin never reads `flowGraph` or `serviceGraph`.

Root of all paths below: `C:/Users/ivangsa/workspace/zenwave/grok-work/ij-update`. Package prefix: `io.zenwave360.platform.plugins.zfl.toolwindow` (written `tw.` below).

## 1. Asset delivery (IJ-D2)

**Choice: a Gradle refresh task with the assets committed.** It copies the existing `refreshMermaidPreviewBundle` pattern in `build.gradle.kts`. The build needs no network and no Node. The pinned version is in `gradle.properties`, so a refresh gives the same files every time. A committed sync script would need pnpm and a sibling checkout, so it is not used.

- In `gradle.properties`, add `eventflowWebviewVersion = 0.0.0-next-20261110162033`. This is VS Code's pin (`vscode-an4/package.json`, `zenwaveEventFlowWebview.version`). To move to the current `@next`: run `npm view @zenwave360/vistas-eventflow-webview@next version`, update the property, and rerun the task. `@next` is never resolved inside the build, because that would not be reproducible.
- In `build.gradle.kts`, register three tasks, all `notCompatibleWithConfigurationCache`, the same as the Mermaid tasks:
  - `downloadEventflowWebviewTarball` downloads `https://registry.npmjs.org/@zenwave360/vistas-eventflow-webview/-/vistas-eventflow-webview-${v}.tgz` to `build/eventflow-webview/`.
  - `extractEventflowWebviewTarball` extracts it with `tarTree(resources.gzip(..))`.
  - `refreshEventflowWebview`:
    1. Deletes `src/main/resources/web/eventflow/`.
    2. Copies `package/webview-toolbar/**` into it: `index.html`, `protocol.json`, `assets/index-*.js`, `assets/index-*.css`.
    3. Writes `web/eventflow/SOURCE.txt`, containing `@zenwave360/vistas-eventflow-webview@<v> webview-toolbar/`.
    4. Fails unless `protocol.json` is exactly `{"protocol":"zenwave.eventflow.webview","protocolVersion":1}`. Parse it with Gson and compare the fields. This is the build-time check in EWP-R5.
- Run the task and commit the result. This removes `index-yNYAXfAh.js`, `index-yNYAXfAh.js.map` and `index-ClZOj7FK.css`.
- `zenwave-architectural-vistas` `scripts/sync-eventflow-webview.mjs` and `sync:intellij` are no longer used by the plugin. Retiring them is a separate change in that repository and is not part of this plan.

## 2. Classes and responsibilities

**New**

- `tw.diagram.ZflEventFlowProtocol` (`ZflEventFlowProtocol.kt`): the message types from section 3, plus `parseInbound(raw: String): ZflInboundMessage?`, `ZflPageMessage.toJson(): JsonObject` and `readiness(payload): ZflReadiness`. Pure; no IntelliJ API.
- `tw.diagram.ZflEventFlowPage` (`ZflEventFlowPage.kt`): pure HTML work.
  - `assetPaths(indexHtml)`, moved from the host.
  - `buildPageHtml(indexHtml, nonce, bridgeScript)`: inserts the CSP `<meta>` and the nonce'd bridge `<script>` right after `<head>`. It throws when `index.html` has no `./assets/` reference, has any `src` or `href` that is not `./assets/…`, or has no `<head>`, exactly like VS Code `page.ts`.
  - `contentSecurityPolicy(nonce)` and `createNonce()`.
- `tw.diagram.ZflDiagramStatus` (`ZflDiagramStatus.kt`): ports `diagram-state.ts`.
  - The sealed `ZflDataState`: `Loading`, `Rendered`, `NoServer`, `Unsupported`, `Unreadable(detail)`, `NotFound`, `UnsupportedDocument`, `Failed(detail)`.
  - The sealed `ZflPageState`: `Loading`, `Ready(version)`, `Failed(message)`.
  - `dataStateOf(ZenwaveCall<*>)`.
  - `present(fileName, page, data, hasDiagram): ZflDiagramPresentation?`, where `ZflDiagramPresentation(mode: OVERLAY|BANNER, kind, title, detail)`. The text comes from bundle keys. There are no action buttons in this block.
- `tw.diagram.ZflEventFlowSession` (`ZflEventFlowSession.kt`): ports `DiagramSession`. It is confined to the EDT and holds no IntelliJ API.
  - It owns: page readiness; the current document; the generation counter; the refresh key; deciding whether to render once the page is ready (`renderIfReady`); handling inbound messages; the positions rules.
  - Its constructor takes `ports: ZflEventFlowPorts` and `store: ZflDiagramStateStore`.
- `tw.diagram.ZflEventFlowPorts` (same file): the IntelliJ edge, so tests can use fakes.
  - `post(ZflPageMessage)`
  - `showState(ZflDiagramPresentation?)`
  - `features(): ZenwaveServerFeatures`
  - `documentVersion(doc): Long?`
  - `requestViews(doc, variant: String?, lanes: String?, positions: Map<String,ZenwavePoint>?): ZenwaveCall<ZenwaveEventFlowViews>` (runs off the EDT)
  - `positions(doc): ZflPositionsStore`
  - `background(work: () -> T, then: (T) -> Unit)`
  - `log`
  - `warn(message)`
- `tw.ZflDiagramStateStore` (`ZflDiagramState.kt`, beside `ZflDiagramViewMode.kt`): holds per-diagram state. See section 4.
- `tw.positions.ZflPositionsFile` (`positions/ZflPositionsFile.kt`): pure, ports `positions.ts`. Defines `SCHEMA`, `fileName(modelName)`, `parse(text): ZflPositionsRead`, `validate(JsonElement?): Map<String,ZenwavePoint>?` and `serialize(map): String`.
- `tw.positions.ZflPositionsStore` (interface) with the implementation `ZflVfsPositionsStore(project, model: VirtualFile)`. Methods: `read(): ZflPositionsRead` and `write(positions)`, which throws `IOException` carrying a message for the user.

**Changed**

- `tw.diagram.ZflDiagramHost`: the interface becomes a transport.
  - `getComponent()`
  - `post(message: ZflPageMessage)`
  - `setInboundListener((ZflInboundMessage) -> Unit)`
  - `setPageListener(ZflPageEvents)`, with `loadEnded()` and `loadFailed(message)`
  - `showState(ZflDiagramPresentation?)`
  - `showEmpty()`
  - Delete `renderBundle(String, …)`, `setViewMode`, `setHumanizeLabels`, `showLoading` and `showError`.
- `tw.diagram.ZflJcefDiagramHost`: owns the browser, the `JBCefJSQuery`, the resource handler and the CSP'd HTML. It parses inbound messages and hands them to the EDT. It has no pending-bundle logic any more; the session owns that.
- `tw.ZflToolWindowController`: owns the tree refresh as before, the 250 ms debounce, and the mapping from session-tracker events to `session.open(doc)` or `session.refresh()`. It no longer builds the model.
- `tw.ZflToolWindowDependencies`: remove `diagramModelProvider`. `live()` builds the session ports from `ZenwaveLspProjectService` through `ZflLanguageServiceAdapter`.
- `tw.ZflDiagramToolWindowPanel`: `topBar` loses `onViewModeSelected` and `onHumanizedLabelsChanged`.
- `tw.ui.ZflToolWindowTopBar`: remove `viewSelector`, `viewLabel`, `selectedViewMode()` and `humanizeLabelsEnabled()`. The page owns these controls (EF-R22).
- `tw.ui.ZflStatePanel`: add a banner strip (NORTH, a `JBLabel` with a warning background) above the content card. Add `showBanner(title, detail)` and `hideBanner()`.
- `io.zenwave360.platform.lsp.ZenwaveRequestFailures`:
  - `ZenwaveFailure` gains `code: Int? = null` and `detail: String? = null`.
  - `fromThrowable` passes `response.code` and `response.message`.
  - Add `UNSUPPORTED_DOCUMENT = "unsupportedDocument"` and `INVALID_PARAMS = -32602`.
- `messages/ZenWaveModelEditorBundle.properties`: add the status texts from VS Code `presentState`, plus `zfl.eventflow.positions.lanes` and `zfl.eventflow.positions.noFolder`.
- `ZenwaveLspProjectService` and `ZflLanguageServiceAdapter`: no change. `eventFlowViews(file, text, variant, lanes, positions)` already exists. Never pass `lanes="none"`; pass `null` instead, as VS Code does.

**Deleted:** `tw.model.ZflDiagramModelProvider.kt`, its test, and `tw.ui.ZflDiagramViewModeRenderer.kt`. Keep Jackson: `settings/SdkAvailablePlugins.kt` still imports it, and it comes in transitively, so `build.gradle.kts` does not change for this. Also remove the `zfl.toolwindow.viewSelector.*` keys.

## 3. Message model (`ZflEventFlowProtocol.kt`)

Parsing uses Gson, which the plugin already uses through lsp4j and in `ZenwaveVisualization.kt`. Do not add kotlinx.serialization. Inbound: `JsonParser.parseString` inside a try/catch, then checks field by field, mirroring `inboundMessage()`. Anything malformed or unknown returns `null` and is ignored (EWP-R6). Outbound: build a `JsonObject` by hand, so that a JSON `null` is written explicitly. Gson's default drops nulls, which would break `variant: null` and `nodeId: null`.

```kotlin
const val PROTOCOL = "zenwave.eventflow.webview"; const val PROTOCOL_VERSION = 1
enum class ZflLanes(val wire: String) { NONE("none"), SYSTEMS("systems"), SERVICES("services");
  companion object { fun fromWire(v: String?) = entries.firstOrNull { it.wire == v } } }
// ViewMode = existing ZflDiagramViewMode (FLOW/SERVICES, wireValue())
data class ZflDisplaySettings(val humanizeLabels: Boolean, val lanes: ZflLanes)
data class ZflSavedPositionsNote(val exists: Boolean, val applied: Boolean, val missing: List<String>? = null)

sealed interface ZflPageMessage {                       // host -> page; JSON {type, payload}
  data class RenderBundle(val flowGraph: JsonElement, val serviceGraph: JsonElement,
      val viewMode: ZflDiagramViewMode, val displaySettings: ZflDisplaySettings,
      val lanesSupported: Boolean, val diagramId: String,
      val variants: List<ZenwaveFlowVariant>?,          // null => omit variants AND variant
      val variant: String?,                             // written (possibly JSON null) only when variants != null
      val savedPositions: ZflSavedPositionsNote?) : ZflPageMessage   // null => omitted
  data class SetViewMode(val viewMode: ZflDiagramViewMode) : ZflPageMessage
  data class SetDisplaySettings(val displaySettings: ZflDisplaySettings) : ZflPageMessage
  data class HighlightNode(val nodeId: String?) : ZflPageMessage
  data class SavePositionsFailed(val message: String) : ZflPageMessage
}
sealed interface ZflInboundMessage {                    // page -> host
  data class WebviewReady(val payload: JsonElement?) : ZflInboundMessage
  data class ViewModeChanged(val viewMode: ZflDiagramViewMode) : ZflInboundMessage  // only "flow"|"services"
  data class VariantChanged(val variant: String?) : ZflInboundMessage               // string or JSON null
  data class LabelsChanged(val humanize: Boolean) : ZflInboundMessage
  data class LanesChanged(val lanes: ZflLanes) : ZflInboundMessage                  // only the three values
  data class SavePositions(val positions: Map<String, ZenwavePoint>) : ZflInboundMessage // via ZflPositionsFile.validate
}
sealed interface ZflReadiness { data class Ready(val version: Int); data class Mismatch(val message: String) }
```

- Never write `serviceGraph` or `flowGraph` as JSON null. The views from the server always carry both.
- `readiness` returns `Mismatch` when the version is missing, or when `protocol` or `protocolVersion` differs. Use the same wording as VS Code, with "plugin" in place of "extension".
- The `zenwave.host.*` messages are not ported. The IntelliJ host has no host script; Swing shows states, and the CEF load handler reports load errors.

## 4. State

`ZflDiagramStateStore` belongs to the session and lives as long as the tool window. It is keyed by `ZflSessionFile.documentUri`, which is `VirtualFile.url` and also serves as the `diagramId`. It is an access-ordered `LinkedHashMap` capped at 32 entries.

```kotlin
class ZflDiagramEntry(var viewMode: ZflDiagramViewMode = FLOW, var humanize: Boolean = true,
    var lanes: ZflLanes = NONE, var variant: String? = null,
    var lastGood: ZenwaveEventFlowViews? = null, var lastSaved: ZflSavedPositionsNote? = null,
    var lastRefreshKey: String? = null, var positionsState: String? = null, var positionsExist: Boolean = false)
```

- The default choices are `humanize=true` and `lanes=NONE`. No IDE setting is added in this block.
- The variant is never written to disk (EF-R12). It lasts only for the tool window's lifetime.
- **Effective lanes:** `if (features.flowLanes.isNotEmpty()) entry.lanes else NONE`. `lanesSupported` uses the same `isNotEmpty()` test.
- **Switching document**, `session.open(doc)` on the EDT:
  1. Set the current document.
  2. Increment `generation`, so answers in flight for the old document are dropped.
  3. Set `rendered=false`.
  4. If `entry.lastGood != null`, render it at once from the cache.
  5. Call `refresh()`. The refresh key skips the server call when nothing changed (EF-R23). So switching A → B → A re-renders A from the cache with no request, and A keeps its variant, lanes and humanize choices.
- **Editing:** `ZflSessionTracker` fires on a document change of the selected file. The controller's `Alarm` becomes `Alarm.ThreadToUse.SWING_THREAD` with a 250 ms delay, cancelled and rescheduled on each event, and then calls `session.refresh()`. The text version changed, so the key differs and one request is made.
- **When nothing is selected:** `host.showEmpty()`. The store is kept.
- **Inbound messages:**
  - `viewModeChanged`: store the view; send nothing back.
  - `labelsChanged`: store it and send `SetDisplaySettings` when rendered. No request.
  - `lanesChanged`: store it; if the server supports lanes, `refresh()`.
  - `variantChanged`: only when `features.flowVariants` is set and the value differs. Store it and `refresh()`.

## 5. Request flow

`refresh()` on the EDT:

1. `gen = ++generation`. Capture `doc`, `version = ports.documentVersion(doc)`, the entry choices, and `withPositions = features.savedPositions`.
2. Call `ports.background({ ... })` off the EDT, through `AppExecutorUtil.getAppExecutorService()`. Back on the EDT, use `invokeLater(…, ModalityState.any())` with an expiry condition that checks the session is disposed.
3. In the background:
   1. Read the positions file when `withPositions` is set (section 6).
   2. Compute `key = listOf(version, variant, viewMode, humanize, lanes, if (withPositions && lanes==NONE) positionsState else null).joinToString`. Use `null` for the key when `version == null` or the positions file could not be read.
   3. If `key == entry.lastRefreshKey`, return `Skip`.
   4. Otherwise, read the text with `ReadAction.compute { FileDocumentManager.getDocument(file)?.text }` and call `ports.requestViews`. The rules from `askServer`:
      - A variant gets `variant`, no positions, and `lanes` when not NONE.
      - Lanes other than NONE get `lanes` and no positions.
      - Otherwise send the file's positions, or `null`.
   5. If a variant was sent and the result is `Err` with `failure.code == -32602`, log it, set `entry.variant = null` and ask once more for the full diagram.
4. On the EDT: return if `gen != generation`.
   - `data = dataStateOf(result)`.
   - On `Ok`: set `lastRefreshKey = key`, `lastGood = views`, and `lastSaved` from `savedAnswer` (VS Code `session.ts`). Then `rendered=false` and `renderIfReady()`.
   - Finally `present()`, which calls `host.showState(...)`.
5. `renderIfReady()` runs only when the page is `Ready`, `lastGood` exists and `!rendered`. It posts a `RenderBundle` built from `lastGood.flowGraph` and `lastGood.serviceGraph` by reference:
   - `variants` and `variant` only when `features.flowVariants` is set;
   - `savedPositions` only when `lastSaved` is set.
   Then it posts `HighlightNode` if a highlight is pending. Expose `session.highlightNode(id)` for IJ/6.3.
6. `dataStateOf` maps failures:

| Failure | Data state |
| --- | --- |
| `NO_SERVER` | `NoServer` |
| `OLD_SERVER` | `Unsupported` |
| `BAD_DOCUMENT`, kind `documentUnreadable` | `Unreadable(detail)` |
| `BAD_DOCUMENT`, kind `documentNotFound` | `NotFound` |
| `BAD_DOCUMENT`, kind `unsupportedDocument` | `UnsupportedDocument` |
| anything else | `Failed(detail ?: message)` |

   `Unreadable` shows the server's own message (`detail`). With a diagram on screen it shows as a BANNER and the old diagram stays. Without one it shows as an OVERLAY.
7. **Page readiness (EWP-R3, EWP-R5):**
   - On `WebviewReady`, run `readiness`. `Mismatch` gives `page = Failed`, which is an OVERLAY: "The EventFlow diagram page could not be loaded", with the detail. It is never a blank page.
   - `Ready` sets `rendered=false`, so a reload renders again, then calls `renderIfReady()`.
   - The host's `loadEnded()` starts a 15 s EDT timer. If no `webviewReady` has arrived by then, `page = Failed("did not report that it loaded")`.
   - `loadFailed` on the main frame also gives `page = Failed`.
8. `ZenwaveLspProjectService.eventFlowViews` already asserts it is off the EDT and has a 30 s timeout. ELK runs in process (IJ-D3), so only the generation check drops stale work. Nothing cancels a layout.

## 6. Saved positions (EF-R14, decision 0022)

- **File:** `<model>.zfl.positions.json` in the model's folder. `serialize` must give exactly this, byte for byte:

  ```
  {\n  "schema": "zfl.eventflow.positions@1",\n  "flow": {\n    "<id>": { "x": 120, "y": 40 },\n ...\n  }\n}\n
  ```

  Keys are sorted with `compareTo` on the string. Numbers are whole, written as `Math.round(x)`, so no `.0`. An empty map gives `"flow": {}`.
- **`parse`** returns `ZflPositionsRead(exists, positions?, why?)`:
  - JSON that does not parse: `why = "it is not JSON (…)"`.
  - Wrong `schema`: `why = "its schema is …"`.
  - `flow` that is not an object: `why = "it has no \"flow\" object"`.
  - An entry without numeric `x` and `y`: `why = "invalid position for <id>"`. VS Code passes such values on and the server judges them; `ZenwavePoint` is typed, so the IntelliJ client rejects them here instead.
- **`validate`**, used for the `savePositions` payload: the value must be an object of finite numbers, each rounded. Anything else returns `null`, and the message is ignored.
- **Read** (`ZflVfsPositionsStore.read`, background thread, inside `ReadAction`): `model.parent?.findChild(name)`. Use the open Document's text if there is one, otherwise `VfsUtilCore.loadText`. No parent (a `LightVirtualFile`) means `exists=false`. The session stores `positionsState`: `"absent"`, `serialize(positions)` or `"invalid <why>"`. It logs the `why` once per distinct problem.
- **Write**, on the EDT, from `SavePositions`. The rules, in order:
  1. If effective lanes are not NONE: post `SavePositionsFailed(bundle "zfl.eventflow.positions.lanes")`, which reads "Positions are not saved in lanes. Choose No lanes to save them." Stop.
  2. If `!features.savedPositions || variant != null`: log and ignore.
  3. Otherwise call `store.write(serialize(...))`:
     - `parent == null` or `!parent.isWritable`: throw `IOException(bundle noFolder)`.
     - If the file exists, `ReadonlyStatusHandler.getInstance(project).ensureFilesWritable(listOf(f))`. If that has read-only files, throw `IOException("<name> is read-only")`.
     - Then run `WriteCommandAction.runWriteCommandAction(project, "Save EventFlow Positions", null, { val f = parent.findChild(n) ?: parent.createChildData(this, n); FileDocumentManager.getDocument(f)?.let { it.setText(text); saveDocument(it) } ?: VfsUtil.saveText(f, text) })`.
  4. On success: `positionsState = text` and `refresh()`.
  5. On any exception: `log.warn`, `ports.warn("The positions of X were not saved: why")` as a balloon through `NotificationGroupManager` (the existing group), and `post(SavePositionsFailed(why))`.
- **Applied or not:** the server's `savedPositions {applied, reason, missing}` becomes `ZflSavedPositionsNote(exists, applied, missing)`, and only for the full diagram. The page shows "not applied … missing" in its status bar (EF-R22, EF-Q9).
- **Outside changes:** the controller subscribes to `VirtualFileManager.VFS_CHANGES` through `project.messageBus.connect(controller)`. When an event's path is the current model's positions file, it calls `session.positionsFileChanged()`, which re-reads in the background and refreshes only if the state differs from `positionsState`.

## 7. Task order for Grok

**Step 1: assets and page (IJ/4.1, 4.2).**

- Gradle tasks and property (section 1). Run `refreshEventflowWebview` and commit the assets.
- `ZflEventFlowPage.kt`. `ZflJcefDiagramHost` serves `buildPageHtml(index, nonce, bridge = "")` from `createResource("/index.html")`, with a fresh nonce per request and the bytes passed to `JBCefStreamResourceHandler`. Assets are still served from `/assets/*`.
- The CSP: `default-src 'none'; script-src 'self' 'nonce-N'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'`.
- Tests in `ZflEventFlowPageTest`, plain JUnit4:
  - every `src` and `href` in the committed `index.html` resolves as a classpath resource under `web/eventflow`;
  - `protocol.json` and the `<meta zenwave-webview-protocol-version>` both say version 1;
  - the built HTML has the CSP before the first `<script`, no `unsafe-inline` and no `unsafe-eval`, and the bridge `<script nonce=N>` matches the CSP nonce;
  - a remote `src` throws;
  - an index with no assets throws.
- Done when `runIde` loads the toolbar page with no console error.

**Step 2: two-way host, server model and state (IJ/4.3, 4.4, 5.1, 5.2, 5.4).**

- Protocol, status, store, session (without positions; the ports take a no-op store), host transport, controller rewiring, `ZenwaveFailure.code` and `detail`, top bar trimming, and the deletions.
- Bridge script:

  ```
  window.__zenwaveHost={postMessage:function(m){var request=JSON.stringify(m);<jsQuery.inject("request")>}};
  ```

  The handler returns `null`.
- Outbound: `browser.cefBrowser.executeJavaScript("window.postMessage(" + gson.toJson(msg.toJson()) + ",'*');", url, 0)`.
- Tests:
  - `ZflEventFlowProtocolTest`: each of the six inbound types; unknown type; no type; non-JSON; `lanes:"diagonal"`; `variant:3`; `humanize:"yes"`; `savePositions` with NaN or a string; readiness ok, missing and v2; `RenderBundle` JSON has `"variant":null` when variants are set and no `variant` key when they are not; `HighlightNode(null)` gives `"nodeId":null`.
  - `ZflEventFlowSessionTest`: fakes, with `background` running synchronously.
    - No `renderBundle` before `webviewReady`; one after.
    - A mismatch gives OVERLAY `page-failed` and no bundle.
    - `variantChanged` gives a request with that variant and no positions, and a bundle with `variant`.
    - -32602 retries the full diagram with `variant=null`.
    - `lanesChanged(SYSTEMS)` requests `lanes="systems"`.
    - With empty `flowLanes`: `lanesSupported=false`, displaySettings lanes `none`, and `lanesChanged` makes no request.
    - `labelsChanged` posts `SetDisplaySettings` and makes no request.
    - A → B → A with no edits makes 2 requests, not 3, and A keeps its choices.
    - A version bump makes exactly one request.
    - A stale generation is dropped.
    - `flowGraph` in the bundle is the server's object (`assertSame`).
    - Each failure category maps to its presentation; an unreadable document with a diagram on screen gives a BANNER and no new bundle.
  - `ZflEventFlowToolWindowTest` (`PlatformTestCase`, in-process server, recording fake host):
    - `lsp/checkout-variants.zfl`: the posted `flowGraph` equals `eventFlowViews(...).flowGraph` (`JsonElement.equals`) and has 2 variants;
    - `lsp/broken.zfl`: `Unreadable` with the server's message.
  - `ZenwaveRequestFailureTest`: -32602 keeps its `code`.
- Done when `grep -rn LinkageError src/main` finds nothing and `test buildPlugin` passes.

**Step 3: saved positions (IJ/5.3).**

- `ZflPositionsFile`, `ZflVfsPositionsStore`, the session's positions paths, and the VFS listener.
- Tests:
  - `ZflPositionsFileTest`: an exact-text round trip (keys `b`, `a`, `10` give the order `10`, `a`, `b`; 12.6 is written as 13); the three `why` cases; `validate` rejects NaN.
  - Session tests:
    - the full diagram sends the file's positions;
    - a variant and lanes send none;
    - `savePositions` in lanes gives `SavePositionsFailed(lanes text)`;
    - a write that throws gives `SavePositionsFailed(message)` and a warning;
    - a successful write gives a refresh;
    - a server answer `{applied:false, missing:[x]}` gives a bundle with `savedPositions {exists:true, applied:false, missing:[x]}`.
  - `ZflVfsPositionsStoreTest` (`PlatformTestCase`, `myFixture.addFileToProject`): a write creates the sibling file with the exact text; with `WriteAction.run { f.isWritable = false }`, `write` throws, and through the session that yields `savePositionsFailed`.

## 8. Risks

- **JCEF threading.**
  - `JBCefJSQuery` handlers and `CefLoadHandler` callbacks run on CEF threads. Parse there, then `invokeLater(…, ModalityState.any(), disposedCondition)` to the session.
  - The session is touched only on the EDT. `executeJavaScript` is thread-safe, but calls to it come only from the EDT.
  - Never call the language server from a CEF or EDT thread; the service already asserts this.
- **`JBCefJSQuery` lifecycle.**
  - Create the browser with `JBCefBrowser.createBuilder().build()` and no URL. Then `JBCefJSQuery.create(browser as JBCefBrowserBase)`. Only then `loadURL(indexUrl)`.
  - If `runIde` shows `cefQuery_* is not defined`, set `JBCefClient.Properties.JS_QUERY_POOL_SIZE` to 1 before creating the query.
  - Disposal: `Disposer.register(host, browser)` and then `Disposer.register(host, jsQuery)`. Children are disposed last-registered-first, so the query goes before the browser. The host keeps a `disposed` flag: inbound messages after disposal are dropped, and so are posts.
  - A page reload sends a second `webviewReady`. The session handles it by re-rendering.
- **CSP.**
  - The policy goes in a `<meta>` inserted before the module script.
  - `'self'` is `http://zfl-toolwindow`, the scheme registered by `JBCefLocalRequestHandler`. Same origin, so the assets' `crossorigin` attribute needs no CORS headers.
  - Assumption to confirm in `runIde` (IJ/5.5): CEF `executeJavaScript` is not subject to `script-src`. If a renderBundle is blocked, put the message in a nonce'd channel. Do not add `unsafe-eval`.
  - Gson escapes `<`, `>` and `=` as `\u003c`, which is still a valid JS literal, so the server's JSON cannot break out of the script.
- **Other.**
  - Large bundles go through `executeJavaScript` as a single string. That is fine at MB size.
  - The 15 s readiness timeout must not fire while JCEF is unsupported. That path already shows the plain unsupported message and creates no browser.

### Critical Files for Implementation
- C:/Users/ivangsa/workspace/zenwave/grok-work/ij-update/src/main/kotlin/io/zenwave360/platform/plugins/zfl/toolwindow/diagram/ZflJcefDiagramHost.kt
- C:/Users/ivangsa/workspace/zenwave/grok-work/ij-update/src/main/kotlin/io/zenwave360/platform/plugins/zfl/toolwindow/ZflToolWindowController.kt
- C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-an4/src/eventflow/session.ts (the source to port; also protocol.ts, positions.ts, diagram-state.ts, page.ts)
- C:/Users/ivangsa/workspace/zenwave/grok-work/ij-update/src/main/kotlin/io/zenwave360/platform/lsp/ZenwaveRequestFailures.kt
- C:/Users/ivangsa/workspace/zenwave/grok-work/ij-update/build.gradle.kts (pattern to copy: `refreshMermaidPreviewBundle`)