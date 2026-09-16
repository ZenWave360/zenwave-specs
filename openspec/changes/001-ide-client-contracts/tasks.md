# 001 — Tasks

The work lands in three repositories. This change is done when each of them has
something a client can be built against, not when the documents are written.

## 1. Review

- [ ] 1.1 Review with `zenwave-lsp`: are both requests the right shape, and does
      the initialize result already carry enough for capability discovery?
      (decision recorded in design.md §Decision (task 1.1), pending review)
- [ ] 1.2 Review with `zenwave-architectural-vistas`: are the two webview changes
      acceptable, and do they keep JCEF working unchanged?
      (decision recorded in design.md §Decision (task 1.2), pending review)
- [ ] 1.4 Settle how a browser-hosted server reaches private repositories when
      the `git` content source fires — VS Code can supply a GitHub session, but
      not without an agreed way to hand it over
      (decision recorded in design.md §Decision (task 1.4), pending review)
- [ ] 1.5 Decide whether ZDL class diagrams become Mermaid upstream — it changes
      what a server may return, and `zenwave-platform-vscode` cannot render
      PlantUML
      (decision recorded in design.md §Decision (task 1.5), pending review)

## 2. zenwave-lsp

- [x] 2.1 A request returning the flow and service view models for a ZFL
      document, laid out, each naming its schema
      Done in zenwave-lsp 62eb591 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-requests`): `zenwave/eventFlowViews` in lsp-jvm and lsp-js,
      shared `lsp-core/.../visualization/ModelVisualizations.kt` over dsl-kotlin's
      `GenerateFlowViewFromZfl`/`GenerateServiceViewFromZfl` (`schema` `zfl.eventflow.view@1`,
      `zfl.services.view@1`); `ModelVisualizationsTest`, `LspCoreBrowserSmokeTest` (elkjs in a browser).
      Known upstream difference: dsl-kotlin's JVM and JS `ElkFlowLayoutEngine` actuals use different node
      dimensions, so the two servers' flow geometry differs (everything else is identical)
- [x] 2.2 A request returning ordered preview representations for a ZDL or ZFL
      document, each with an id, a title, a format and its content, plus the
      default to show first
      Done in zenwave-lsp 62eb591 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-requests`): `zenwave/preview`; ZFL = `flowchart` then
      `sequence:<outcome>:<index>` (ids, titles and default as IntelliJ's `ZflPreviewEditor`), ZDL = one
      Mermaid `class-diagram` from `GenerateMermaidFromZdl` (decision 1.5)
- [x] 2.3 Both advertised in the initialize result alongside the existing custom
      requests
      Done in zenwave-lsp 62eb591 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-requests`): both servers advertise `ZenwaveCustomRequests.ALL`; lsp-js from
      handler registration, lsp-jvm checked against its `@JsonRequest` annotations in `ZenwaveLspWireTest`
- [x] 2.4 A document that cannot be read answers as such, distinguishably from an
      empty model
      Done in zenwave-lsp 62eb591 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-requests`): JSON-RPC -32803 with `data.kind` `documentUnreadable` (+ LSP
      `diagnostics`; ZFL syntax/parser problems, ZDL ANTLR syntax errors, generator failures),
      `documentNotFound`, `unsupportedDocument`; malformed params -32602
- [x] 2.5 Hierarchy nodes that point at the document that declares them — today
      every node is built with the requested URI, and an annotated ZDL appears
      only as a related resource
      Done in zenwave-lsp d7156e7 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-hierarchy`): a ZFL system, and the services and commands its `@zdl` model declares,
      carry that ZDL's `sourceUri`/`sourceRange` (editor content when open, otherwise read), plus a
      `referenced-by` related resource back to the flow; a ZDL the server cannot reach leaves them in the
      flow. `textDocument/documentSymbol` stays single-document. Wire shape in design.md §Decision (tasks 2.5–2.8)
- [x] 2.6 Answer a hierarchy request for a document that is not open, without the
      client having to open it
      Done in zenwave-lsp d7156e7 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-hierarchy`): `ZenwaveLanguageServer.conceptualHierarchy` reads unopened documents through
      json-schema-ref-parser-kmp's platform loaders (`LoaderDocumentReader`: files on the JVM and Node,
      `http(s)` via fetch everywhere); unreachable → -32803 `documentNotFound`; a kind no module builds
      hierarchies for → `[]`. Caveat: a browser-hosted server cannot read `file:` or `vscode-vfs:` documents,
      so there it answers `documentNotFound` for them (spec question in the lsp-hierarchy handoff)
- [x] 2.7 A position-to-symbol step the reference requests accept — the request
      that reports concepts at a position returns architecture identities, which
      they do not
      Done in zenwave-lsp d7156e7 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-hierarchy`): new `zenwave/symbolAt` `{textDocument:{uri}, position}` → `{uri, semanticId, range?}` or
      `null`, in lsp-jvm and lsp-js. Note: no `conceptAt` request or architecture identities exist in committed
      zenwave-lsp code (only in uncommitted work in the main checkout), so nothing here builds on them
- [x] 2.8 A way to match a hierarchy node against a view-model node; today one is
      `uri#path` and the other is a kind-scoped name
      Done in zenwave-lsp d7156e7 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-hierarchy`): hierarchy nodes gain `viewNodeIds`, the ids of the same document's
      `zenwave/eventFlowViews` nodes and service groups that stand for the concept (only ids actually
      present; empty = no counterpart)
- [ ] 2.9 Take up configuration and manifest changes on a running server —
      `didChangeConfiguration` and `didChangeWatchedFiles` are empty today
- [ ] 2.10 Decide whether a hierarchy `label` stays composed by the server now
      that it is contractually a default rather than a mandate
      (decision recorded in design.md §Decision (task 2.10), pending review)
- [ ] 2.11 Open documents overlaid on manifest content resolution, so an edited
      document is what contributes to a result wherever it appears
- [ ] 2.12 A request asking the client for a credential for a location, applied to
      that request only, re-asked when a credential stops working, and never
      carried across hosts
- [ ] 2.13 Build loaders with the supplied credential —
      `defaultLoaders(auth: List<AuthenticationValue>)` already takes them
- [ ] 2.14 Carry `ManifestLoadOptions` through to `ZenWaveManifestLoader`, so a
      client can pin a source — today the LSP constructs it with defaults
- [x] 2.16 Hierarchies and cross-references read the `when` blocks the current ZFL parser produces.
      Evidence before: `lsp-core/.../zfl/ZflModelEnricher.kt` and `ZflCrossReferenceContributor.kt` read
      `whens[].command`/`system`/`service`/`events` and outcomes directly on `end`, while dsl-kotlin 835a75f
      emits `whens[].action` + `occurrence{system, service, emits}` and `end.endOutcomes`; the 4b sample
      `.handoff/lsp-requests-samples/*/hierarchy-zfl.json` has no commands and outcomes named
      `endOutcomes`/`javadoc`, contrary to "Elements the model implies rather than states".
      Done in zenwave-lsp d7156e7 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-hierarchy`): both shapes are read (`normalizedWhen`); parts with no recorded location fall back
      to the enclosing element's
- [x] 2.15 Serialisation checked over a real wire, not only in-process — this is
      where IntelliJ's shortcut has been hiding problems, and the recursive
      hierarchy node is the likeliest place for it
      Done in zenwave-lsp 62eb591 (worktree `zenwave-lsp-vscode-platform`, branch `vscode-platform/lsp-requests`): lsp-jvm `ZenwaveLspWireTest` (LSP4J launcher on a TCP socket, raw
      JSON-RPC client) and lsp-js `nodeIpcTest` + `WorkerWireTest` cover `zenwave/hierarchy` (4-level
      recursion), forward/reverse references, `organizeZflServices`, both new requests and every error kind.
      No serialisation defect found; lsp-jvm and lsp-js responses compared equal for all of them except
      the flow geometry noted in 2.1

## 3. zenwave-sdk

- [ ] 3.1 Confirm the plugin catalogue reports everything else the requirement
      asks for, and that asking generates nothing
- [ ] 3.2 Add where a plugin's documentation lives to what it reports, including
      for plugins that did not ship with the SDK
- [ ] 3.3 Decide how a plugin with no documentation is distinguished from one
      whose location is simply missing
      (decision recorded in design.md §Decision (task 3.3), pending review)
- [ ] 3.4 Note the two IDE consumers wherever that command line is owned, so a
      future change to it is deliberate

## 4. dsl-kotlin

- [x] 4.1 Record source spans for plugin configuration options — the enclosing
      `config` block already does this in `enterConfig_option`, and
      `enterPlugin_config_option` records nothing
      (`src/commonMain/kotlin/io/zenwave360/language/zdl/internal/ZdlListenerImpl.kt`)
- [x] 4.2 Do the same for plugin CLI options if the pattern extends cleanly; say
      why if it does not
      Declaration and value spans use `plugins.<name>.cliOptions.<option>`;
      a valueless flag has only a declaration span.
- [x] 4.3 Leave interpreted values alone — this is additive, and an existing
      consumer must see the model it sees today
      Contract caveat: decimal values currently remain strings; CLI values
      preserve source text (including quotes), and JS integers are Kotlin Long
      objects rather than plain JS numbers. These existing representations were
      left unchanged; the requirement's blanket interpretation wording is broader
      than the current API and needs clarification, not a silent breaking change.
- [x] 4.4 A test that slices the source with a recorded span and gets the text
      back including its quote delimiters
- [x] 4.5 Say whether the JS artifact needs rebuilding for consumers to see it
      Yes: shared Kotlin changes require `./gradlew jsProductionExecutableCompileSync`
      and consumers must update their bundled or installed JS package. Documented
      in dsl-kotlin's README; existing bundles do not gain the spans automatically.
- [ ] 4.6 Settle the 4.3 caveat on numbers. In `parseZdl` output an integer is a
      Kotlin `Long` object (`maxDepth 3` → `{"h2_1":3,"i2_1":0}`), whose field
      names are compiler-mangled and change between Kotlin versions; a consumer
      that serialises it gets those fields, as the VS Code runner did in its
      command line. Separately, `neg -2` inside a plugin config is reported as
      `2` — the sign is lost. Found from `zenwave-platform-vscode` 002; that
      client now uses `String(value)` as a stopgap. Changing the representation
      is visible to every consumer, so decide it here rather than in dsl-kotlin
      alone
      (decision recorded in design.md §Decision (task 4.6), pending review)
      Decision implemented in dsl-kotlin 835a75f (branch `vscode-platform/dsl`), see 4.7;
      left open because the decision itself awaits review.
- [x] 4.7 Implement the recorded 4.6 decision: JS exports return integers as plain
      numbers (decimal string beyond ±(2^53 − 1)) with the common/JVM model unchanged,
      and negative numeric literals keep their sign on every platform. Evidence before:
      `src/jsMain/kotlin/NodeJsExports.kt` `convertToPlain` passed Kotlin `Long` through;
      `Zdl.g4:85-86` / `Zfl.g4:79-80` defined `INT: DIGIT+` / `NUMBER: DIGIT+ ([.] DIGIT+)?`.
      Done in dsl-kotlin 835a75f: `convertToPlain` `is Long ->` branch; both grammars
      `INT: '-'? DIGIT+` / `NUMBER: '-'? DIGIT+ ([.] DIGIT+)?` (token types unchanged;
      all 383 .zdl/.zfl/.jdl files under the workspace lex to identical token streams);
      tests `ZdlListenerKotlinTest.parseZdl_NegativeNumericLiteralsKeepTheirSign`,
      `ZflListenerKotlinTest.parseZfl_NegativeNumericLiteralsKeepTheirSign`,
      `ZdlFormatterTest.format_keeps_the_sign_of_negative_numbers`,
      `nodejs-test-project/zdl-parser.test.js` "ZDL Parser - Numbers",
      `JsBrowserSmokeTest.parsesZdlIntoPlainJsValues`; README and
      `release-notes/release-notes.v1.10.0.md` document the JS-visible change.
- [x] 4.8 A multiplatform Mermaid class diagram generator for ZDL, as recorded in the
      1.5 decision: `io.zenwave360.language.zdl.application.GenerateMermaidFromZdl`
      `execute(zdlContent: String): String`, with inert output. Evidence before: dsl-kotlin
      had only `eventflow/application/GenerateMermaidFromZfl.kt`; ZDL diagrams existed only
      as PlantUML in zenwave-sdk `ZdlToMarkdownGenerator/*.plantuml.hbs` (JVM-only).
      Done in dsl-kotlin 835a75f: `GenerateMermaidFromZdl` and
      `zdl/view/ZdlToMermaidClassDiagramTransformer.kt` in commonMain, JS export
      `generateMermaidFromZdl(input)`; `GenerateMermaidFromZdlTest` (exact output,
      Mermaid-keyword names, corpora including `complete.zdl`); every ZDL file in the
      workspace (330) produced a diagram accepted by `mermaid.parse` (Mermaid 11.12.3),
      except two copies of zdl-jvm `complete.zdl`, on which `parseZdl` itself already throws.

## 5. zenwave-architectural-vistas

- [ ] 5.1 The page signals readiness through the host-provided channel when one
      exists, falling back to the parent frame
- [ ] 5.2 Confirm the page loads with no remote resources at all, fonts included,
      under a restrictive content security policy
- [ ] 5.3 Confirm JCEF is unaffected by both
- [ ] 5.4 Make the bundle reachable by a second consumer — a second sync target
      or a published package

## 6. Clients

- [ ] 6.1 `zenwave-platform-vscode`: implement `004-eventflow-panel` against this
- [ ] 6.2 `zenwave-platform-vscode`: implement `005-model-preview` against this
- [ ] 6.3 `zenwave-platform-vscode`: implement `006-model-explorer` against the
      hierarchy contract
- [ ] 6.4 Compare both IDEs on the same fixture and record any difference as a
      bug against one of them — expecting the trees to differ in presentation and
      the diagrams not to differ at all

## 7. Archive

- [ ] 7.1 `openspec archive 001-ide-client-contracts --store zenwave-specs`
