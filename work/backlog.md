# Backlog

<a id="backlog"></a>

Everything still open, in one place. It replaces the task lists of the OpenSpec changes, whose finished items are history.
Each item keeps the id it had (`001/2.9` is change 001, task 2.9), because code comments still cite some of them, and its evidence.
What each state means for a reader is summarised in [status](../architecture/status.md).

**Status:** generated from the old task lists on 2026-10-30, then annotated where the code has moved on. Items were not all re-verified:
evidence names the commit it was found at. Tick or delete items here as they land, and flip the rule in the document in the same commit.

```
001  cross-repository contracts       kmp  browser support          003  transitions without id
002  VS Code SDK runner               004  VS Code EventFlow        005  VS Code preview
c003 VS Code LSP client               006  VS Code explorer         007  VS Code actions
008  VS Code release
```

## Publishing

The packages are on npm (checked 2026-10-30): `@zenwave360/dsl` latest `1.10.0`, `@zenwave360/vistas-eventflow` and `vistas-eventflow-webview` latest `0.1.0`, and `@zenwave360/lsp-js` only pre-releases, latest `0.1.0-next.0`. The older task notes saying they are unpublished are out of date.

- [x] The VS Code extension still pins `@zenwave360/dsl` `1.9.0-SNAPSHOT` and `lsp-js` `0.1.0-SNAPSHOT` (`packages/extension/package.json`). Move them to published versions, and `lsp-js` to a real `devDependencies` entry as [decision 0006](../decisions/0006-one-javascript-server-in-the-extension.md) planned. **Done 2026-10-30** on zenwave-platform-vscode `feature/local-sibling-dependencies`: `dsl` 1.10.0, `lsp-js` 0.1.0-next.12.1, the page 0.1.0, all resolved by `npm ci` on a clean clone. Built sibling checkouts are linked over them during development, as the composite builds do in Gradle; see that package's README.
- [ ] **008/1.1** Who owns the VS Code Marketplace publisher account, and the Open VSX namespace — the requirement cannot be met without both
- [ ] **008/1.2** Tokens held as repository secrets, with a note of who can rotate them

## Decisions to confirm

Agents took these to keep work moving. The code follows them; confirm or change them.

- [ ] [0005](../decisions/0005-ide-clients-live-in-their-own-repositories.md) IDE clients in their own repositories
- [x] [0006](../decisions/0006-one-javascript-server-in-the-extension.md) One JS server in the extension. Confirmed 2026-10-30.
- [x] [0008](../decisions/0008-credentials-are-handed-over-per-request.md) Credential exchange. Confirmed 2026-10-30.
- [ ] The CORS question in [0008](../decisions/0008-credentials-are-handed-over-per-request.md#open): how a browser reaches private content, which web mode now depends on ([0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md))
- [ ] [0009](../decisions/0009-mermaid-not-plantuml.md) ZDL Mermaid generator scope
- [ ] [0013](../decisions/0013-platform-capabilities-are-asked-for.md) Lazy Node loading and capability query
- [ ] [0014](../decisions/0014-one-manifest-per-workspace.md) Manifest resolution details
- [ ] [0015](../decisions/0015-documentation-url-has-three-states.md) `documentationUrl`
- [ ] [0016](../decisions/0016-numbers-from-the-js-parser.md) JS numbers, and whether decimals stay strings
- [ ] [LVR-R11](../flows/lsp-visualization-requests.md#lvr-r11) The server keeps composing hierarchy labels as plain, IDE-neutral names

## zenwave-lsp

- [ ] **ZVE/3** Expose revision-checked visual-edit projection and edit preparation over unsaved documents, advertise capabilities, and document the wire contract. [Spec](../flows/zfl-visual-editing.md#zve-r12), [gate ES-P4](../roadmap/event-storming-whiteboard.md#es-p4). Evidence, checked 2026-10-31: the message table in `flows/eventflow-webview-protocol.md` defines rendering but no semantic mutations; the existing view model has no revision/edit-target contract. Without this, VS Code cannot safely turn canvas intents into edits against current text. Requires KMP operations below.

Written by the clients that hit each problem, with the file and line.

- [ ] **001/2.9** Take up configuration and manifest changes on a running server — `didChangeConfiguration` and `didChangeWatchedFiles` are empty today Evidence (zenwave-lsp d7156e7): `lsp-jvm/.../ZenwaveLspServer.kt:281,284` are empty overrides; `lsp-js/.../ZenwaveJsLanguageServer.kt` registers no handler for either notification (the `connection.on…` block ending at line 176). What zenwave-platform-vscode sends since vscode-platform/client-003: the standard `workspace/didChangeWatchedFiles` for each folder's `.zenwave/config.yml` and the resolved manifest file, and a restart with new `initializationOptions.zenwave` when the resolved `configUri`/`projectManifestUri` change. Without this task a saved edit to a manifest that is not open is not taken up until a restart (003 task 4.6). No payload is defined for `didChangeConfiguration`; the client sends none **Checked 2026-10-30:** still empty on `lsp-jvm`.
- [ ] **001/2.11** Open documents overlaid on manifest content resolution, so an edited document is what contributes to a result wherever it appears
- [ ] **001/2.12** A request asking the client for a credential for a location, applied to that request only, re-asked when a credential stops working, and never carried across hosts Client side exists: zenwave-platform-vscode vscode-platform/client-003 answers `zenwave/credential` in the decision 1.4 shape (`src/lsp/credentials.ts`) and sends `initializationOptions.zenwave.clientCapabilities.credentialRequest: true`. No server sends the request yet, so 003 tasks 5.1, 5.5, 5.7–5.9 wait on this and 2.13
- [ ] **001/2.13** Build loaders with the supplied credential — `defaultLoaders(auth: List<AuthenticationValue>)` already takes them
- [ ] **001/2.14** Carry `ManifestLoadOptions` through to `ZenWaveManifestLoader`, so a client can pin a source — today the LSP constructs it with defaults (requirement "A client can restrict content resolution to one declared source", added with the wire shape left to this task). Evidence: `lsp-core/.../manifest/ArchitectureManifestParser.kt:17` `private val loader = ZenWaveManifestLoader()`; `ZenwaveInitializationOptions` in `lsp-js/.../ZenwaveJsLanguageServer.kt:38` has only `configUri`/`projectManifestUri`. zenwave-platform-vscode 003 tasks 4.11/4.12 wait on the shape and ship no setting until it exists
- [ ] **001/2.17** A document the server cannot process does not stop it serving the others (requirement "One document a server cannot process does not stop it serving the others"). Evidence (@zenwave360/lsp-js 0.1.0-SNAPSHOT, zenwave-lsp d7156e7, Node IPC): after `didOpen` of zenwave-platform-vscode `packages/extension/fixtures/modules/orders/modules/orders/src/main/resources/apis/openapi.yml` no `publishDiagnostics` arrives for it, and `textDocument/hover` on it **and on an already open, previously answering ZDL** does not answer within 10 s. The first 8 lines of that file followed by `paths: {}` are served normally; the first 8 lines followed by its `paths:` section (internal `#/components/schemas/…` refs only) reproduce it. The JS thread is blocked from `didOpen` (`ZenwaveJsLanguageServer.kt:204-205`, `server.open` → `publishDiagnosticsIfHandled`), so every request on the connection stalls. lsp-jvm not checked. VS Code only avoids it by never sending unrelated YAML (003 selects the manifest by URI); a workspace whose manifest or `@zdl` references reach such a document has no such protection
- [ ] **001/2.18** A request reporting the architectural concepts a position belongs to (requirement "A client can ask which architectural concepts a position belongs to"). Evidence (zenwave-lsp d7156e7): no `zenwave/conceptAt` handler in lsp-jvm or lsp-js and `ZenwaveCustomRequests.ALL` does not list one; `customRequests` of @zenwave360/lsp-js 0.1.0-SNAPSHOT is [hierarchy, forwardReferences, reverseReferences, organizeZflServices, eventFlowViews, preview, symbolAt]. Architecture identities (`ArchitectureConceptRef`) exist only in uncommitted work in the main checkout. zenwave-platform-vscode 007 §4 (`zenwave.model.conceptsAt`) is not offered until this is advertised **Checked 2026-10-30:** `zenwave/conceptAt` now exists on `lsp-jvm` (`CustomRequestMethods`), not on `lsp-js`; `ZenwaveCustomRequests.ALL` still does not list it. What remains is `lsp-js` and the two lists agreeing.
- [ ] **001/2.19** `zenwave/reverseReferences` finds uses from other documents (requirement "Reference requests answer in both directions, and say where"). Evidence (zenwave-lsp d7156e7, lsp-js over Node IPC, zenwave-platform-vscode fixtures `lsp/checkout.zfl` + `lsp/orders/model.zdl` + `lsp/orders.zdl`, all open): reverseReferences answers `[]` for every symbolAt result tried — ZFL system, `when` commands, start event; ZDL service `OrderService` (used by the flow) and entity `CustomerOrder`. Causes: `lsp-core/.../zfl/ZflCrossReferenceContributor.kt:17,37,52` index every ZFL use with `targetSemanticId = null`, which `xref/InMemoryCrossReferenceIndex.kt:84-85` keys as `"$targetUri#"`; a reverse request always carries a semanticId, so it can never reach them (only uses whose target semantic id is recorded, e.g. ZDL → OpenAPI/AsyncAPI, are reachable); ZDL entity-to-entity uses (`customer Customer`) are not indexed at all (`zdl/ZdlCrossReferenceContributor.kt` records APIs, AsyncAPI and REST only). zenwave-platform-vscode `zenwave.model.reverseReferences` therefore always reports "nothing references this" (smoke test asserts that, to be updated when this lands)
- [ ] **001/2.20** Reference results carry the place in the target document (same requirement). Evidence: every `CrossReferenceContribution` is built with `targetRange = null` (`ZflCrossReferenceContributor.kt:18,38,53`, `ZdlCrossReferenceContributor.kt:22,66,95`), so forwardReferences from `when CheckoutStarted do createOrder` answers `[{"targetKind":"reference","label":"createOrder","uri":"…/orders/model.zdl","relationType":"uses"}]` with no `range`; zenwave-platform-vscode opens the ZDL at its first line
- [ ] **001/2.21** `zenwave/symbolAt` resolves the name of a ZDL entity declaration (requirement "A client can resolve a position to the concept declared there", scenario "Asking about what is under the cursor", and "A declaration resolved by its name"). Evidence (lsp-js d7156e7, `lsp/orders.zdl` open): `entity Customer {` at 0:8 and `entity CustomerOrder {` at 4:10 answer `null`; 5:6 inside the body answers `#entities.CustomerOrder`; 5:15 on the field type `Customer` answers `#entities.CustomerOrder.name` with range 4:7–4:20 (the enclosing entity's name, not the referenced entity)
- [ ] **001/2.22** A client learns from the server where the workspace's architecture manifest is (requirement "A client can request the conceptual hierarchy of a document", scenario "Finding what to ask about"). Evidence (zenwave-lsp d7156e7): no `zenwave/workspaceStatus` or other request reports the manifest in use — `ZenwaveCustomRequests.ALL` (`lsp-core/.../visualization/Visualizations.kt:20`) is [hierarchy, forwardReferences, reverseReferences, organizeZflServices, eventFlowViews, preview, symbolAt], and no `workspaceStatus` appears anywhere in zenwave-lsp. zenwave-platform-vscode therefore reads `.zenwave/config.yml` itself, mirroring `ZenwaveWorkspaceConfig.parseScalar` (`src/lsp/manifest-resolution.ts:33`), and its architecture tree (006 task 4.1) asks about the manifest the client resolved rather than the one the server reports working against **Checked 2026-10-30:** `zenwave/workspaceStatus` now exists on `lsp-jvm`, not on `lsp-js`, so the VS Code client still resolves the manifest itself.

## dsl-kotlin: visual ZFL editing

- [ ] **ZVE/1** Prove source-targeted edits, then implement the versioned editing projection and operations in KMP. [Spec](../flows/zfl-visual-editing.md), [gates ES-P1 and ES-P2](../roadmap/event-storming-whiteboard.md#es-p1). Evidence, checked 2026-10-31, under `dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/`: `eventflow/application/GenerateFlowViewFromZfl.kt:16` is a one-way pipeline; `eventflow/view/ZflToFlowGraphTransformer.kt:90,294-301` elides policies and derives IDs from names/endpoints; `source/SourceRef.kt:11` has no end range/revision. Reversing the projection loses source semantics and cannot safely update text. Preserve trigger grouping, occurrences, response semantics and comments; cover JVM/JS, CRLF and Unicode. Resolve appearance identity before freezing contracts.
  - **ES-P1 done (first part), 2026-10-31**, `dsl-kotlin` `feature/zfl-visual-editing` commit `83ee709` (verified; `:dsl-kotlin:jvmTest` and `:dsl-kotlin:jsTest` pass under JDK 24.0.2). Appearance identity resolved as [ZVE-R13](../flows/zfl-visual-editing.md#zve-r13). A KMP edit engine (`zfl/editing/ZflEditor.kt`, `ZflTextEdit.kt`) returns non-overlapping text edits + diagnostics + identity mappings over original parsed text without mutating it, for three operations: add emission, change policy trigger, rename command. 33 commonTest tests + fixtures cover equal names in two flows, repeated bodies, equal policy endpoints with different conditions, mixed AND/OR groups, actor starts, ordered calls/handlers, response/emits/emits-response, parallel edges, CRLF and Unicode *content*; byte-for-byte preservation and rename identity continuity are asserted; ambiguous origins without explicit selection are rejected.
  - **ES-P1 finding, closed by owner decision 2026-10-31 — identifiers stay ASCII, no grammar change.** The ZFL grammar `ID` rule (`Zfl.g4`) is ASCII-only, so Unicode *identifiers* route to `ERRCHAR` and fail parsing; the prototype correctly rejects such an edit, and that is the required behaviour ([ZVE-R5](../flows/zfl-visual-editing.md#zve-r5)).
  - **ES-P2 remains open:** command creation with service selection ([ZVE-Q2](../flows/zfl-visual-editing.md#zve-q2)), event creation via emission, atomic policy creation, add/remove single policy trigger, set policy target command, scoped deletion with reference checks and cascades ([ZVE-R7](../flows/zfl-visual-editing.md#zve-r7)), cross-flow rename, renaming start/emitted events, capability advertisement and invalid/stale/unsupported results, the versioned projection + published contract and JVM/JS serialization parity. A `SourceRef` end-range/offset is only needed when the LSP layer (ES-P4) exposes wire ranges; the prototype uses ANTLR token offsets directly.

## Language stack: browser support

Decisions are in [0013](../decisions/0013-platform-capabilities-are-asked-for.md). The sub-items already done were dropped.

- [ ] **kmp/1.1** `json-schema-ref-parser-kmp` chooses how to keep the Node filesystem loader out of a browser's module graph — named targets, a separate artifact, or a lazily resolved import (surveyed in `design.md`) (decision recorded in design.md §Decision (task 1.1), pending review)
- [ ] **kmp/1.2** Agree whether existing Node consumers keep today's default behaviour, and what the migration is if they do not (decision recorded in design.md §Decision (task 1.2), pending review)
- [ ] **kmp/1.3** Agree how a consumer asks which capabilities exist on its platform (decision recorded in design.md §Decision (task 1.3), pending review)
- [ ] **kmp/3.1** Confirm `architecture-manifest`, `architecture-graph` and `workspace-runtime` load in a browser once the loader is fixed — they carry no Node API of their own
- [ ] **kmp** workspace-runtime: blocked, the module is not in zenwave-architecture's history. At `develop` c82feb5 `settings.gradle.kts` includes only `architecture-manifest` and `architecture-graph`. `workspace-runtime/` exists only as untracked files in the main checkout, so it cannot be built or verified from committed sources
- [ ] **kmp/4.4** `lsp-core`'s manifest tests agree with the manifest content resolution it builds against. Four tests fail identically on JVM and JS, already at a72d9b7 against zenwave-architecture 2edd677 (and a72d9b7 does not compile against the local architecture-manifest 0.1.0-SNAPSHOT: `ArchitectureManifestParser.kt:57` unresolved `repository`): `ArchitectureManifestLanguageModuleTest.hoverAndDefinitionResolveOwnedRepositoryAndSpecs`, `.crossReferenceContributionsExposeOwnedResources`, `ArchitectureManifestParserTest.resolvesServiceOwnedResourcesUsingExpandedRepositoryBase`, `.recordsUnresolvedVariablesAsDiagnostics` (service resources now resolve under the domain path, e.g. `file:///workspace/my-docs/orders/orders-api/...`). Blocked: the matching parser and test changes exist only as uncommitted work in the zenwave-lsp main checkout (branch `codex/integrate-manifest-workspace-runtime`).
- [ ] **kmp/6.1** Declare a `browser()` target wherever a JS artifact is published
- [ ] **kmp/6.2** A build step that loads the artifact in a browser and fails if it cannot
- [ ] **kmp/6.3** Confirm the check actually catches a regression, by introducing a Node import on a branch and watching the build fail
- [ ] **kmp/6.4** Node consumers still work throughout
- [ ] **kmp/7.1** `zenwave-platform-vscode`: the language stack loads in the web extension host, which is what `003-lsp-client` is waiting on
- [ ] **kmp/7.2** Any other browser consumer that wants it — website, EventCatalog components, Astro components — confirms the same

## Reviews across repositories

- [ ] **001/1.1** Review with `zenwave-lsp`: are both requests the right shape, and does the initialize result already carry enough for capability discovery? (decision recorded in design.md §Decision (task 1.1), pending review)
- [ ] **001/1.2** Review with `zenwave-architectural-vistas`: are the two webview changes acceptable, and do they keep JCEF working unchanged? (decision recorded in design.md §Decision (task 1.2), pending review)

## zenwave-sdk and generation

- [ ] **003/3.6** (optional) Apply the same classification to `BackendApplicationAsyncApiAdaptersGenerator.planOperation` (`hasOneBeanParameter` also requires `paramId == null`). Skip it if it needs changes to the AsyncAPI consumer templates beyond the placeholder. — SKIPPED (not ticked): see report; left for a decision
- [ ] **003/5.5** Both services build and their tests pass — waived by owner (tests in the arcadia services are not green independently of 003). Java: `mvn -o test` (JDK 25) 29 run/2 fail/11 err (missing TestDataLoader fixtures, ArchitectureTest `BaseMapper` rules); Kotlin: `mvn -o test` 78 run/0 fail/1 err (ModularityTest cycle, present at d17e9b7). Java main compiles

## zenwave-architectural-vistas

- [ ] **ZVE/2** Build the standalone React visual ZFL editor and browser harness, then publish an embeddable page and editing adapter protocol. [Spec](../flows/zfl-visual-editing.md#zve-r11), [gate ES-P3](../roadmap/event-storming-whiteboard.md#es-p3). Evidence, checked 2026-10-31: `packages/eventflow/src/EventFlowVisualizer.tsx:608` supplies the canvas, with `nodesConnectable={false}` and no semantic editing transport. Without this, users cannot create/connect/delete language elements. Keep KMP prerequisites unchecked until available; preserve read-only consumers.

- [ ] **001/5.3** Confirm JCEF is unaffected by both Evidence, not conclusive without running IntelliJ: `ZflJcefDiagramHost` (ZenWaveDomainModelEditor 9417bf8) registers only the assets `index.html` names as `src`/`href="./…"`, treats CEF `onLoadEnd` as ready and posts with `executeJavaScript("window.postMessage(…)")`; it never listens for `webviewReady`. The page still references only `./assets/*` from `index.html`, with the bootstrap in the entry chunk. The JCEF-like scenario in `browser.test.mjs` serves only those assets, posts `renderBundle` and `setViewMode` after load and renders cleanly. Open: needs a human run of the IntelliJ tool window after `pnpm sync:intellij`

Node actions are rules in [EventFlow](../flows/eventflow.md) (EF-R4 to EF-R9), with no task list yet.

- [x] **EF-R3/1** Extract the state, the view switch and the waiting states to a private `packages/eventflow-page`; `apps/eventflow-webview` stays the same page for IntelliJ
- [x] **EF-R3/2** `apps/eventflow-toolbar-webview` embeds that component with a Flow and Systems selector, and sends `viewModeChanged`
- [x] **EF-R3/3** `@zenwave360/vistas-eventflow-webview` also publishes `webview-toolbar/`, keeping `webview/` where it is
- [x] **EF-R3/4** The VS Code extension packages `webview-toolbar/` when the package has it, and records `viewModeChanged`
- [ ] **EF-R3/5** Manual check: run the IntelliJ tool window after `pnpm sync:intellij` and see no selector
- [ ] **EF-R3/6** Manual check in VS Code, with the page linked locally: click the selector with a pointer, move it with the arrow keys, and see how it looks in a light and a dark theme

## zenwave-platform-vscode

- [ ] **ZVE/4** Embed the reusable visual ZFL editor over the authoritative text document, using guarded edits and native undo/save in both hosts. [Spec](../flows/zfl-visual-editing.md#zve-r4), [gate ES-P5](../roadmap/event-storming-whiteboard.md#es-p5). Upstream prerequisites are phrased and tracked as availability checkboxes in the plan. Verify stale operations, text/canvas refresh, external changes and webview recreation before enabling mutations.

### Model preview

Rules are in [model preview](../zenwave-platform-vscode/model-preview.md).

- [ ] **005/1.1** `003-lsp-client` implemented
- [ ] **005/1.2** `zenwave-lsp`: a request returning ordered preview representations for a ZDL or ZFL document, with titles, formats and a default (contract in `zenwave-specs`)
- [ ] **005/1.3** `zenwave-lsp` / `dsl-kotlin`: ZDL class diagrams emitted as Mermaid, so both IDEs render from one implementation
- [x] **005/1.4** Decide the fate of `packages/preview-renderer` — repurpose or remove; do not leave it empty
- [x] **005/2.1** Register a custom editor for `.zdl` / `.zw` / `.zfl` with `priority: "option"` — verify that opening a model file still gives the text editor
- [x] **005/2.2** Open it in the adjacent column for the side-by-side gesture, focus staying in the text editor
- [x] **005/2.3** Open it in the current column for the in-place gesture, so the tab keeps its position
- [x] **005/2.4** Check what VS Code's own *Reopen Editor With…* switcher offers, and add a visible route back to the text only if that is not enough on its own
- [x] **005/2.5** Reveal an existing preview rather than opening a second one
- [ ] **005/2.6** Manual check: confirm the preview is restored on window reload without a `WebviewPanelSerializer`
- [x] **005/2.7** Content security policy: no remote content, no inline script beyond a nonce, sanitise server-provided HTML
- [x] **005/2.8** Theme from the editor's CSS variables; follow a theme change live
- [x] **005/2.9** Preserve scroll position and selected representation across re-renders
- [x] **005/2.12** `dsl-docs`: a method for previews, separate from `generate`, returning the Markdown for one document ([decision 0020](../decisions/0020-previews-come-from-dsl-docs-through-the-server.md)). ZDL returns the domain page ([MP-R15](../zenwave-platform-vscode/model-preview.md#mp-r15)).
- [x] **005/2.13** `dsl-docs`: a Markdown preview for `.zw`, different from ZDL's: the global configuration with its description and, per plugin, what it will do, its configuration and the resolved sum of its properties ([MP-R14](../zenwave-platform-vscode/model-preview.md#mp-r14)). The resolution rules, inheritance and `(inherit false)`, go in Kotlin; today they are only in the client's `src/sdk/command.ts`.
- [x] **005/2.14** `zenwave-lsp`: depend on `dsl-docs`, serve those pages from `zenwave/preview` as `MARKDOWN`, and recognise `.zw` as ZDL ([MP-T5](../zenwave-platform-vscode/model-preview.md#mp-t5)). Measure generation time on the largest real model, on `lsp-js`.
- [x] **005/2.15** `zenwave-lsp`: ship a copy of the plugin catalogue, generated from a named SDK build, accept a replacement at initialisation and through a notification while running, and pass the last one received, or its own, to `dsl-docs` ([MP-R16](../zenwave-platform-vscode/model-preview.md#mp-r16)).
- [x] **005/2.16** VS Code: send the shipped catalogue at initialisation ([MP-R16](../zenwave-platform-vscode/model-preview.md#mp-r16)). Sending one refreshed from the installed SDK waits on 002/11.7.
- [x] **005/3.1** Name the previewed document in the editor's tab
- [x] **005/3.2** Bind the preview to its document; never re-point an open preview at a different one
- [x] **005/3.3** A helper resolving the model document from `window.tabGroups.activeTabGroup.activeTab.input`, handling both `TabInputText` and `TabInputCustom`, for the palette commands — shared with `004` and `006`
- [x] **005/3.4** Never move or re-position an editor after opening it — a preview the user dragged elsewhere stays there
- [x] **005/3.5** Decide what happens for an untitled buffer, a model open in a diff, and the same model open in two groups: [MP-Q4](../zenwave-platform-vscode/model-preview.md#mp-q4)
- [x] **005/4.1** Request representations through `003`'s helper, keyed on document URI and version; coalesce document changes
- [x] **005/4.2** Render the representations in the order given, under the server's titles, starting on the server's default
- [x] **005/4.3** Hide the selector when there is only one representation
- [x] **005/4.4** Keep the last good render on screen while a new one is in flight
- [x] **005/4.5** Re-render when the document changes on disk, not only in the editor
- [x] **005/5.1** Markdown to HTML, with fenced Mermaid blocks rendered as diagrams
- [x] **005/5.2** Mermaid representations rendered directly
- [x] **005/5.3** HTML representations inserted sanitised
- [x] **005/5.4** Bundle Mermaid; load it on first diagram rather than on panel open
- [x] **005/5.5** A malformed diagram reports itself and leaves the rest readable
- [x] **005/5.6** Mermaid themed for light and dark
- [x] **005/6.1** Distinct states: no server, unsupported by this server, document unreadable, loading
- [x] **005/6.2** `contributes.customEditors` entry, and `zenwave.preview.openToSide` / `zenwave.preview.open` commands for the two gestures
- [x] **005/6.3** Contribute into the shared ZenWave submenu `004` establishes — not a title-bar icon of its own — plus palette entries; reuse the existing preview icons in `resources/` for the submenu items
- [x] **005/6.4** A command opening a quick pick of representations, as a keyboard route to the in-webview selector
- [x] **005/6.5** Keybinding matching the platform's preview convention, if it does not collide with the built-in Markdown preview
- [x] **005/7.1** `npm run typecheck`, `npm run lint`, `npm run build`
- [x] **005/7.2** Opening a `.zdl` file from the explorer still gives the text editor
- [x] **005/7.3** Desktop: preview both fixtures; ZFL shows a flowchart and one representation per outcome
- [x] **005/7.4** The in-place gesture keeps the tab's position; *Reopen Editor With…* gets back to the text
- [x] **005/7.5** Two models previewed at once: each keeps its own document
- [ ] **005/7.6** Manual check: reload the window with a preview open: it comes back
- [ ] **005/7.7** Manual check: drag the preview to another group: it stays put across re-renders
- [x] **005/7.8** Invoke the preview command while a diagram has focus — the tab-group lookup has to find the document with no active text editor
- [x] **005/7.9** Edit a fixture: the preview follows without blanking
- [x] **005/7.10** Switch representation, keep editing: the choice holds
- [ ] **005/7.11** Switch theme with the preview open: it follows. Checked on desktop; on the browser host the setting did not reach the webview in the smoke, and that is not explained yet
- [x] **005/7.12** Clean VS Code profile with no other extensions: diagrams render
- [ ] **005/7.13** Manual check: network disabled: diagrams render
- [x] **005/7.14** With the server stopped: the preview explains
- [ ] **005/7.15** Manual check: compare with IntelliJ's preview on the same fixtures
- [x] **005/7.16** Measure the VSIX size against `004`'s bundle and record it: [MP-T3](../zenwave-platform-vscode/model-preview.md#mp-t3)

### LSP client

- [x] **c003/1.2** Agree how `@zenwave360/lsp-js` is versioned against this extension, and whether it is bundled into the VSIX or a dependency Decision [0006](../decisions/0006-one-javascript-server-in-the-extension.md), confirmed 2026-10-30: bundled into `dist/server`, pinned exactly in `package.json` `zenwaveLanguageServer`, not an npm dependency.
- [ ] **c003/3.6** Activation: a workspace carrying ZenWave configuration, and opening the manifest — not only `onLanguage:zdl` / `onLanguage:zfl` Done for `.zenwave/config.yml` (`workspaceContains:.zenwave/config.yml`), which also covers opening the manifest it names. Open: a manifest named only by `zenwave.workspace.manifest` cannot activate the extension — VS Code has no activation event for a setting, and `onLanguage:yaml` would start it in every workspace with YAML (3.7). Spec question in the client-003 handoff.
- [ ] **c003/4.4** Decide what to do when two workspace folders each carry a configuration: pick one and say which, rather than silently taking the first Implemented and logged; decision recorded in design.md §Decision (task 4.4), pending review.
- [ ] **c003/4.11** `zenwave.workspace.preferredSource` setting, unset by default, mapping to `ManifestLoadOptions.preferredSource` / `allowFallback` Blocked on zenwave-lsp store 001 2.14: no wire shape carries load options, so no setting ships.
- [ ] **c003/4.12** Pinning a source the manifest does not declare reports it, rather than resolving to nothing Blocked on zenwave-lsp store 001 2.14 (requirement added to the store).
- [ ] **c003/4.13** Upstream: `zenwave-lsp` has to carry load options through to `ZenWaveManifestLoader` — today it constructs it with defaults Filed: store 001 task 2.14 with evidence and the new requirement.
- [ ] **c003/5.1** Answer the server's credential request: `vscode.authentication` for hosts the editor signs into, `SecretStorage` otherwise Handler implemented (`src/lsp/credentials.ts`, decision 1.4 shape). Blocked on zenwave-lsp 001 2.12/2.13: no server sends the request.
- [ ] **c003/5.5** Do not carry a credential across a redirect to another origin Client refuses a request whose URL origin differs from the stated origin (unit test). The redirect itself happens in the server's fetch: blocked on zenwave-lsp 001 2.12/2.13.
- [ ] **c003/5.7** Test the refusal with a manifest naming an unauthorised host — this is a security boundary, not a preference The handler's refusal is tested; a manifest-driven request needs a server that asks. Blocked on zenwave-lsp 001 2.12/2.13.
- [ ] **c003/5.8** Re-ask on rejection rather than caching a credential for the session Implemented (`attempt: "rejected"` forces a new GitHub session; a rejected stored secret is not offered again). Blocked on zenwave-lsp 001 2.12/2.13 for the wire.
- [ ] **c003/5.9** Declining leaves the content unreachable and the editor working Client answers `null`. Blocked on zenwave-lsp 001 2.12/2.13.
- [ ] **c003/8.4** A deliberately broken server: the editor still works, the status bar says so, the output channel explains, and there is no notification storm Automated part: a `serverPath` that is not a file fails once with its reason and the editor keeps the document. The status bar and the absence of notifications need a human.
- [ ] **c003/8.5** Kill the server process mid-edit: restart offered, editor responsive Needs a human.
- [ ] **c003/8.6** A workspace mirroring `arcadia-editions` — one folder holding the architecture repository and the service repositories side by side — resolves one manifest and understands models in all of them Needs a human; the server does not use the manifest for resolution yet.
- [ ] **c003/8.7** A browser host with only the architecture repository open: the ordered sources fall through to remote on their own, with no remote-only mode, and unreachable content reads as unresolved rather than broken Needs a human; depends on server content resolution (store 001 2.11).
- [ ] **c003/8.8** A browser host editing a flow in the opened repository: the diagram and the preview follow the unsaved buffer, not the published version — the scenario that fails if the buffer overlay is missing Needs 004/005 and store 001 2.11.
- [ ] **c003/8.9** A private repository in the browser: sign-in is offered and content resolves; declining leaves it unreachable without breaking the editor Blocked on zenwave-lsp 001 2.12/2.13, then a human.
- [ ] **c003/8.10** Restricted Mode: no server starts, nothing is fetched, no credential is asked for, and the reason is legible Needs a human.
- [ ] **c003/8.11** A service repository opened on its own with no manifest: highlighting and single-document features work, architecture views explain themselves Needs a human.
- [ ] **c003/8.12** `npm run run-in-browser`: clean fallback, transport logged as `none` With the worker bundle present the browser host now connects (`worker`). The `none` fallback applies to a build without it and is covered by unit tests of the status; a manual `run-in-browser` check remains.

### SDK runner

- [ ] **002/1.4** The catalogue reports a documentation location for plugins — available to me. Prerequisite: `../zenwave-specs/openspec/changes/001-ide-client-contracts/tasks.md` task 3.2; the shipped catalogue currently reports no plugin documentation links.
- [ ] **002/6.7** Confirm a run never lands in a terminal the user opened themselves
- [ ] **002/9.3** Desktop: lenses appear on the fixture, a run generates into the right directory, and running the same command twice reuses one terminal
- [ ] **002/9.4** Desktop: a failing plugin reports failure
- [ ] **002/9.5** Restricted Mode: the run refuses and explains
- [ ] **002/9.6** Desktop: plugin-name and option completion and hover come from the shipped catalogue, marked with its SDK version, and start no process
- [ ] **002/9.7** Hover a plugin and an option: what the SDK reports, and a link that resolves
- [ ] **002/9.8** A workspace declaring a plugin of its own: explained on the same terms, with no invented link
- [ ] **002/9.9** `npm run run-in-browser`: a plugins block can be written and understood from the shipped catalogue, marked as such, and nothing offers to run it
- [ ] **002/9.10** An unreachable SDK command: Run reports what was looked for and where, before any terminal opens; completion is unaffected
- [ ] **002/9.11** With the login-shell option on, a tool installed only by a shell version manager is found by the runner, and a missing one is reported after the run
- [ ] **002/9.12** `npm run run-in-browser`: no lenses, shipped-catalogue completion available, no errors in the console, highlighting unaffected
- [ ] **002/11.5** **Upstream (`dsl-kotlin`):** numbers are JS numbers in `parseZdl` output, and a negative number keeps its sign — filed in `zenwave-specs` `001-ide-client-contracts` task 4.6
- [ ] **002/11.6** Desktop: run a plugin, edit an option, run it again — a second terminal; run the same command again — that second terminal; with tasks defaulting to `cmd`, Run refuses and explains
- [ ] **002/11.7** Decide whether and when an installed SDK is asked for its catalogue (design: "The installed SDK is not asked, for now")

### EventFlow

- [ ] **004/1.5** Agree how the bundle version is pinned, so a protocol change cannot break the diagram silently Proposal implemented, pending review: design.md §Decision (task 1.5), decided by agent on 2026-09-17. The exact version and protocol version are pinned in package.json `zenwaveEventFlowWebview`, checked at build time against `webview/protocol.json` and at run time against `webviewReady`.
- [ ] **004/2.5** Confirm VS Code restores the diagram on window reload Open: needs a human (a window reload ends the test run). By construction a registered custom editor is restored by VS Code, and the editor rebuilds everything from the document URI.
- [ ] **004/2.9** Retain webview state while the editor is hidden; measure the cost with several diagrams open Retaining is implemented (`retainContextWhenHidden: true`). Open: measuring the memory cost with several diagrams open needs a human (Help > Open Process Explorer).
- [ ] **004/7.6** Reload the window with a diagram open: it comes back Open: needs a human (see 2.5).
- [ ] **004/7.9** Invoke the preview command while a diagram has focus — the tab-group lookup has to find the document with no active text editor Open: the preview command is 005's. The tab-group lookup it needs is proven by the 6.3 smoke with a diagram focused.
- [ ] **004/7.11** Offline with the network disabled: the diagram still renders Open: needs a human with the network disabled. Automated evidence: the CSP has no `connect-src` and nothing remote, the page loads only from the extension (2.7, 2.8), and the smoke reports no CSP violation.
- [ ] **004/7.12** Compare against the IntelliJ tool window on the same fixture — same nodes, same layout Open: needs a human with IntelliJ. Note zenwave-lsp spec question 1: JVM and JS ELK node sizes differ, so the layouts will not match exactly until dsl-kotlin aligns them.

### Explorer

- [ ] **006/1.6** Reconsider the Model tree's scope once `003` lands and the Outline shows the same hierarchy for an open document Reconsidered: keep the full scope (design.md §Decision (task 1.6), decided by agent on 2026-09-17, pending review).
- [ ] **006/7.4** Compare the tree against IntelliJ's Conceptual Hierarchy on the same fixture Open: needs a human with IntelliJ.
- [ ] **006/7.10** A multi-root workspace mirroring `arcadia-editions`: the architecture tree shows the one architecture whichever folder is focused Open: needs a human with a multi-root workspace. By construction the tree asks only about 003's single workspace manifest, which does not depend on the focused folder.
- [ ] **006/7.11** A large model: typing does not make the tree thrash Open: needs a human with a large model. Automated evidence in 3.5 (259-line flow, 60 edits → 1 request).

### Actions

- [ ] **007/1.3** Confirm the four requests behave over a wire as they do in-process: `forwardReferences`, `reverseReferences`, `conceptAt`, `organizeZflServices` Open: `conceptAt` does not exist on the wire (store 001 2.18), so only three of the four can be confirmed. Confirmed over a wire: `forwardReferences`, `reverseReferences`, `organizeZflServices` - upstream lsp-jvm ZenwaveLspWireTest, lsp-js nodeIpcTest and WorkerWireTest (store 001 2.15), plus this branch's smoke test against the real server over IPC (desktop) and in a Web Worker (browser). Gaps against what the commands need are filed as server tasks: reverseReferences always `[]` for ZFL uses (001 2.19), targets carry no `range` (001 2.20), symbolAt null on a ZDL entity name (001 2.21). organizeZflServices answers `null` (not an error) for a flow it cannot parse.
- [ ] **007/2.3** Handle several concepts at one position, and the core's `truncated` flag, without inventing a presentation before seeing real results Open, blocked on zenwave-lsp 001 2.18: symbolAt answers one symbol or null; the list with a `truncated` flag belongs to the concepts-at-a-position request, which does not exist.
- [ ] **007/3.5** Targets in other documents open correctly, including ones in other repositories of the workspace Other documents: done (forward from `lsp/checkout.zfl` opens `lsp/orders/model.zdl` in both hosts, including `vscode-test-web:` URIs). Other repositories of a workspace: open - needs a multi-repository workspace whose server answers targets there (store 001 2.11/2.14), then a human check.
- [ ] **007/4.1** `zenwave.model.conceptsAt` command Open, blocked on zenwave-lsp conceptAt (store 001 2.18). The command is deliberately not contributed until a server advertises the request (a unit test asserts it is absent).
- [ ] **007/4.2** Report the concepts covering the position, named as the server names them Open, blocked on zenwave-lsp conceptAt (store 001 2.18). The command is deliberately not contributed until a server advertises the request (a unit test asserts it is absent).
- [ ] **007/4.3** No architecture resolved says so, and points at the manifest setting Open, blocked on zenwave-lsp conceptAt (store 001 2.18). The command is deliberately not contributed until a server advertises the request (a unit test asserts it is absent).
- [ ] **007/5.6** Check what happens to cursor and folding after the rewrite; a whole-document replacement collapses both Cursor: the minimal replacement leaves a cursor after the change where it was (smoke asserts 27:8 is kept, both hosts). Folding: needs a human (fold a region below the systems block, organise, check it stays folded).
- [ ] **007/7.2** Forward and reverse references on the fixtures, including a target in another document Forward: done in both hosts (a target in another document). Reverse: runs and reports none, because the server finds no reverse references (store 001 2.19); re-verify when that lands.
- [ ] **007/7.3** Concepts at a position inside a service declaration Open, blocked on zenwave-lsp conceptAt (store 001 2.18).
- [ ] **007/7.7** With the server stopped: none of the commands are offered Automated: `when` clauses require `zenwave.languageServerAvailable` (unit test), which 003 sets false unless connected; invoked with the server off, the commands refuse (smoke, desktop). Needs a human to look at the palette and editor context menu with `zenwave.lsp.enabled` off.
- [ ] **007/7.8** Compare all three against IntelliJ on the same fixtures Needs a human (IntelliJ).

### Release

- [ ] **008/2.4** Launch the desktop host and confirm the extension activates on a fixture Local `npm run test:desktop` passes; CI execution remains unavailable (no remote).
- [ ] **008/2.5** Launch the browser host through `@vscode/test-web` and confirm the same Local `npm run test:browser` passes; CI execution remains unavailable (no remote).
- [ ] **008/3.4** Install the built VSIX into a clean editor and confirm it activates
- [ ] **008/6.2** A real pre-release, installed from each registry in a clean editor
- [ ] **008/6.3** Confirm a user on stable is not moved onto the pre-release
- [ ] **008/6.4** Confirm switching back to stable works
- [ ] **008/6.5** Break the browser bundle deliberately on a branch and confirm the release checks catch it Local probe on deleted branch `codex/browser-node-api-probe`: importing `node:fs` in `src/activate.ts` makes `npm run build` exit 1 with the browser Node API diagnostic (`tmp/browser-node-api-probe.log`); CI evidence still needed.

### Release pipelines, built 2026-11-01, never run

Spec: [R-R7 to R-R13](../zenwave-platform-vscode/release.md#r-r7), [decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md). REL/1 to REL/5 are on `zenwave-platform-vscode` `feature/release-pipelines`, tip `3b68326`, review round 3 PASS, never run on GitHub.

- [x] **REL/1** One reusable verifying workflow with the checks now in `ci.yml`, used by pull requests, `main`, pre-release and stable. Move it to `develop` too; today a push to `develop` runs nothing. It takes no registry token ([R-R13](../zenwave-platform-vscode/release.md#r-r13)).
- [x] **REL/2** The version and changelog stamp, the odd-minor check and the pin checks, as tested scripts: [R-R8](../zenwave-platform-vscode/release.md#r-r8), [R-R9](../zenwave-platform-vscode/release.md#r-r9), [R-R10](../zenwave-platform-vscode/release.md#r-r10). Decide with the code what `package.mjs` does with a `-pre` tag now.
- [x] **REL/3** The script that raises `@zenwave360/*` pins from npm `next` ([R-R9](../zenwave-platform-vscode/release.md#r-r9)).
- [x] **REL/4** `pre-release.yml`, on a push to `develop`: [R-R7](../zenwave-platform-vscode/release.md#r-r7), [R-R10](../zenwave-platform-vscode/release.md#r-r10), [R-R12](../zenwave-platform-vscode/release.md#r-r12), [R-R13](../zenwave-platform-vscode/release.md#r-r13). Nothing can be proved without a remote run: the implementer leaves a dry run and the owner runs the first one.
- [x] **REL/5** `release.yml`, on a stable tag, taking the publishing out of `ci.yml`: [R-R11](../zenwave-platform-vscode/release.md#r-r11), [R-R12](../zenwave-platform-vscode/release.md#r-r12), [R-R13](../zenwave-platform-vscode/release.md#r-r13).
- [ ] **REL/6** Owner: environments `vscode-prerelease` and `vscode-release`, `vscode-release` with its reviewer before any trusted publisher is registered for `release.yml` and before the first stable tag, because GitHub creates a named environment that does not exist with no protection, with `VSCE_PAT` and `OVSX_PAT` in them only until trusted publishing works ([R-R13](../zenwave-platform-vscode/release.md#r-r13); global Azure tokens end 2026-12-01). Answer [R-Q2](../zenwave-platform-vscode/release.md#r-q2). Sign the Eclipse Publisher Agreement; see 008/1.1 and 008/1.2. Merge `release-workflows` `feature/git-snapshots` to `main` and move the callers back to it. Push in the order in [Packages a pre-release needs](../zenwave-platform-vscode/release.md#packages-a-pre-release-needs), then raise the pins.
- [ ] **REL/7** Answer [R-Q1](../zenwave-platform-vscode/release.md#r-q1) before the first stable.
- [ ] **REL/8** The desktop smoke `modelActions` failed once with "One undo did not restore the document exactly" and passed on the re-run, on merged `develop`, 2026-11-01. Evidence: `packages/extension/.vscode-test/sdk-smoke-zI1dmT`. Not reproduced in 62 runs on Windows, 2026-11-01, and never run on Linux under Xvfb, where the pipeline runs; the failing run used linked siblings and a development launch. The cause is unknown: in the log the text after the undo equals the organized text, which fits another editor holding focus, a window without focus, or a stale read. On failure the assertion now reports the document versions, the window focus and the active editor, and re-reads after a wait. A failure stops the publication and can be re-run, so it does not hold back the first pre-release. It stays open.
- [ ] **REL/11** Versions and notes as in [decision 0024](../decisions/0024-pre-releases-follow-the-last-release.md): [R-R8](../zenwave-platform-vscode/release.md#r-r8), [R-R10](../zenwave-platform-vscode/release.md#r-r10), [R-R11](../zenwave-platform-vscode/release.md#r-r11).
- [ ] **REL/9** Harden the `trace` job of `pre-release.yml`: `$VERSION` comes from the output of `verify`, which a hostile build can choose, and is spliced into the jq program of `gh`, which can read `$ENV`, including `GH_TOKEN`. Compare with `$ENV.REF`, or refuse a version that is not `major.minor.patch` at the start of `publish` and `trace`. The token lasts only for the job, and a hostile build could already publish a hostile VSIX, so this did not block round 3. Also make `publish-tools.test.ts` catch a second `npm ci` in `artifacts`.
- [ ] **REL/10** A re-run of an old failed run may displace the newest run waiting in the `pre-release` concurrency group, so the newest commit would not publish until the next push. Unconfirmed: settle it with a test workflow.

### Comparing the two IDEs

- [ ] **001/6.4** Compare both IDEs on the same fixture and record any difference as a bug against one of them — expecting the trees to differ in presentation and the diagrams not to differ at all
- [ ] **001/6.5** Make configuration-level CLI options effective in both IDE runners: inherit them with the enclosing configuration, exclude them for `(inherit false)`, and let a plugin-local CLI option replace a shared option with the same name. Use a fixture with `--force` in `config` and compare the complete commands emitted by both clients.

## Previews, diagrams and navigation, agreed 2026-11-01

Not built, and to start only after the phase 3 reviews of `feature/preview-eventflow-storming` pass. In this order, each group depending on the one before only where it says.

**1. `zenwave-platform-vscode`, needing nothing new from the server:**

- [ ] **PX/1.1** Copy as Mermaid on every diagram, through the host's clipboard. [MP-R19](../zenwave-platform-vscode/model-preview.md#mp-r19)
- [ ] **PX/1.2** The file's own icon on the title bar's preview button, one entry per language. [MP-R18](../zenwave-platform-vscode/model-preview.md#mp-r18)
- [ ] **PX/1.3** The modes named per file, with Sequence Diagrams and EventFlow Diagrams for ZFL. [MP-R17](../zenwave-platform-vscode/model-preview.md#mp-r17)
- [ ] **PX/1.4** Inline Go to Definition and Go to References on the Model tree's items. [ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9)

**2. `zenwave-architectural-vistas`:**

- [ ] **PX/2.1** Toolbar controls on the right. [EF-R11](../flows/eventflow.md#ef-r11)
- [ ] **PX/2.2** Open as far out as fits, anchored left, with the first `start` in view. `fitView` is at `EventFlowVisualizer.tsx:612`. [EF-R13](../flows/eventflow.md#ef-r13)

**3. `dsl-kotlin` (`dsl-docs`, `dsl-views`), then `zenwave-lsp` and the client:**

- [ ] **PX/3.1** Move the rules that build a command's arguments into `dsl-kotlin`, and have `command.ts` and `dsl-docs` use them, with Run unchanged. [SR-R14](../zenwave-platform-vscode/sdk-runner.md#sr-r14)
- [ ] **PX/3.2** Scripts Docs: three sections per plugin, with Inherited configuration and the Bash command. Needs PX/3.1. [MP-R22](../zenwave-platform-vscode/model-preview.md#mp-r22)
- [ ] **PX/3.3** The client accepts only the exact `details` and `summary` lines. [MP-R21](../zenwave-platform-vscode/model-preview.md#mp-r21)
- [ ] **PX/3.4** Model Docs: the `apis` block at the top and aggregate policies as text. Needs PX/3.5 for its links. [MP-R23](../zenwave-platform-vscode/model-preview.md#mp-r23)
- [ ] **PX/3.5** The client follows workspace and `http(s)` links through the host. [MP-R20](../zenwave-platform-vscode/model-preview.md#mp-r20)
- [ ] **PX/3.6** Javadoc as CommonMark with hard line breaks, rechecking LVR-R14. `safeJavadoc` is in `dsl-docs`, `internal/Markdown.kt`. [MP-R24](../zenwave-platform-vscode/model-preview.md#mp-r24)

**4. ZDL Diagrams, across `dsl-kotlin`, `zenwave-lsp` and the client:**

- [ ] **PX/4.1** A `dsl-views` transformer for a command: signature, input and output. [MP-R25](../zenwave-platform-vscode/model-preview.md#mp-r25)
- [ ] **PX/4.2** `zenwave/preview` by mode, with grouped representations, measuring the cost on `lsp-js`. [LVR-R17](../flows/lsp-visualization-requests.md#lvr-r17)
- [ ] **PX/4.3** The Show and Element selectors, in the same preview editor. [MP-R25](../zenwave-platform-vscode/model-preview.md#mp-r25)

**5. Reconciling the systems block:**

- [ ] **PX/5.1** `dsl-kotlin`: an additive mode in `ZflSystemsOrganizer`. [MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5)
- [ ] **PX/5.2** `zenwave-lsp`: the request's mode and its capability. [LVR-R19](../flows/lsp-visualization-requests.md#lvr-r19)
- [ ] **PX/5.3** VS Code: CodeLens above `systems` and two palette commands, with *Full* asking first. [MA-R5](../zenwave-platform-vscode/model-actions.md#ma-r5)
- [ ] **PX/5.4** IntelliJ: choose what its action does by default. It removes unused elements today, and the owner understood it not to.

**6. EventFlow variants, then saved positions:**

- [ ] **PX/6.1** `dsl-kotlin` and `zenwave-lsp`: list a flow's variants and lay out one on request. Measure ELK on `lsp-js`. [LVR-R18](../flows/lsp-visualization-requests.md#lvr-r18)
- [ ] **PX/6.2** Page and host: the variant dropdown, with additive messages. [EF-R12](../flows/eventflow.md#ef-r12)
- [ ] **PX/6.3** Saved positions: applying them in `dsl-kotlin`, the file in the host, the control in the page, and answering EF-Q9. Defined, pending implementation. [EF-R14](../flows/eventflow.md#ef-r14)
- [ ] **PX/6.4** Design the visual ZFL editor's placement on what PX/6.1 to 6.3 leave.

**Test reliability, any time:**

- [ ] **PX/8.1** `dsl-kotlin` and `zenwave-lsp`: JS tests fail intermittently in full builds and pass when rerun, which would fail CI with no real error. On 2026-11-01, 8 tests of `dsl-views` `jsNodeTest` hit Mocha's 2000 ms limit in one build and all 91 passed alone. `GenerateMermaidFromZflTest`, `ArcadiaSnapshotTest` and `lsp-core`'s `HierarchyRequestTest` also failed once each; the first was that limit, and the cause of the other two was not read. Raise the limit for the tests that run the parser and ELK, or make them lighter.

**7. Navigation:**

- [ ] **PX/7.1** Hold the interview from the [navigation brief](../roadmap/navigation-brief.md), and turn its answers into rules in [navigation](../zenwave-lsp/navigation-spec.md).

## Ideas to review later

Not to implement now.

- **005/2.10** A button inside ZDL and ZFL text editors, at the bottom right, like Commit in `COMMIT_EDITMSG` ([MP-R13](../zenwave-platform-vscode/model-preview.md#mp-r13)). `editor/content` needs the proposed API `contribEditorContentMenu`, and only allowlisted extensions get it for ordinary users ([MP-T4](../zenwave-platform-vscode/model-preview.md#mp-t4)). Review if VS Code finalises it.

## Not yet tasks

Designed or implied, with no task list yet.

- ZenWave MCP: the runnable server ([MCP-T2](../zenwave-architecture/mcp-adapter.md#mcp-t2)).
- [Resource discovery](../roadmap/resource-discovery.md). Visual ZFL editing now has tasks ZVE/1 through ZVE/4 above.
- [Web Explorer](../roadmap/web-explorer.md): the gaps in VS Code web mode, starting with [WE-Q2](../roadmap/web-explorer.md#we-q2) and [WE-Q3](../roadmap/web-explorer.md#we-q3).
- The rest of the [LSP adapter](../zenwave-lsp/lsp-adapter.md) build order, from step 3 on: staleness, deep links, `zenwave/*` pass-through requests.
- Completion in the language server ([completion](../zenwave-lsp/completion-spec.md)).
- Checking the old performance plan (`_retired/zenwave-lsp/performance-refactoring-plan.md` in commit `ab85572` of this repository) against the code ([LS-Q2](../zenwave-lsp/server-architecture.md#ls-q2)).
- Documentation for `json-schema-ref-parser-kmp`.
- Converting the rules' `SHALL` wording and given-when-then examples to plain prose, as [AGENTS.md](../AGENTS.md) asks, when each document is next edited.
