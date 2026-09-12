# 001 — Tasks

The work lands in three repositories. This change is done when each of them has
something a client can be built against, not when the documents are written.

## 1. Review

- [ ] 1.1 Review with `zenwave-lsp`: are both requests the right shape, and does
      the initialize result already carry enough for capability discovery?
- [ ] 1.2 Review with `zenwave-architectural-vistas`: are the two webview changes
      acceptable, and do they keep JCEF working unchanged?
- [ ] 1.4 Settle how a browser-hosted server reaches private repositories when
      the `git` content source fires — VS Code can supply a GitHub session, but
      not without an agreed way to hand it over
- [ ] 1.5 Decide whether ZDL class diagrams become Mermaid upstream — it changes
      what a server may return, and `zenwave-platform-vscode` cannot render
      PlantUML

## 2. zenwave-lsp

- [ ] 2.1 A request returning the flow and service view models for a ZFL
      document, laid out, each naming its schema
- [ ] 2.2 A request returning ordered preview representations for a ZDL or ZFL
      document, each with an id, a title, a format and its content, plus the
      default to show first
- [ ] 2.3 Both advertised in the initialize result alongside the existing custom
      requests
- [ ] 2.4 A document that cannot be read answers as such, distinguishably from an
      empty model
- [ ] 2.5 Hierarchy nodes that point at the document that declares them — today
      every node is built with the requested URI, and an annotated ZDL appears
      only as a related resource
- [ ] 2.6 Answer a hierarchy request for a document that is not open, without the
      client having to open it
- [ ] 2.7 A position-to-symbol step the reference requests accept — the request
      that reports concepts at a position returns architecture identities, which
      they do not
- [ ] 2.8 A way to match a hierarchy node against a view-model node; today one is
      `uri#path` and the other is a kind-scoped name
- [ ] 2.9 Take up configuration and manifest changes on a running server —
      `didChangeConfiguration` and `didChangeWatchedFiles` are empty today
- [ ] 2.10 Decide whether a hierarchy `label` stays composed by the server now
      that it is contractually a default rather than a mandate
- [ ] 2.11 Open documents overlaid on manifest content resolution, so an edited
      document is what contributes to a result wherever it appears
- [ ] 2.12 A request asking the client for a credential for a location, applied to
      that request only, re-asked when a credential stops working, and never
      carried across hosts
- [ ] 2.13 Build loaders with the supplied credential —
      `defaultLoaders(auth: List<AuthenticationValue>)` already takes them
- [ ] 2.14 Carry `ManifestLoadOptions` through to `ZenWaveManifestLoader`, so a
      client can pin a source — today the LSP constructs it with defaults
- [ ] 2.15 Serialisation checked over a real wire, not only in-process — this is
      where IntelliJ's shortcut has been hiding problems, and the recursive
      hierarchy node is the likeliest place for it

## 3. zenwave-sdk

- [ ] 3.1 Confirm the plugin catalogue reports everything else the requirement
      asks for, and that asking generates nothing
- [ ] 3.2 Add where a plugin's documentation lives to what it reports, including
      for plugins that did not ship with the SDK
- [ ] 3.3 Decide how a plugin with no documentation is distinguished from one
      whose location is simply missing
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
