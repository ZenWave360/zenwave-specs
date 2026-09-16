# 002 — Tasks

The work is spread across the producing repositories. It is done when a consumer
can bundle the language stack for a browser and it loads.

## 1. Decide

- [ ] 1.1 `json-schema-ref-parser-kmp` chooses how to keep the Node filesystem
      loader out of a browser's module graph — named targets, a separate
      artifact, or a lazily resolved import (surveyed in `design.md`)
      (decision recorded in design.md §Decision (task 1.1), pending review)
- [ ] 1.2 Agree whether existing Node consumers keep today's default behaviour,
      and what the migration is if they do not
      (decision recorded in design.md §Decision (task 1.2), pending review)
- [ ] 1.3 Agree how a consumer asks which capabilities exist on its platform
      (decision recorded in design.md §Decision (task 1.3), pending review)

## 2. json-schema-ref-parser-kmp

- [x] 2.1 Apply the chosen fix, so loading the library in a browser does not
      require a Node filesystem module
      Done in 9d87a93 (branch `vscode-platform/ref-parser`): the `@JsModule("node:fs")`
      declaration is gone; `NodeFsLoader.load` resolves `fs` at call time via
      `jsMain/.../platform/JsPlatform.kt` `nodeFs()`. `jsBrowserTest` loads the
      library in headless Chromium (Edge 153 locally).
- [x] 2.2 Keep the Node filesystem loader available to Node consumers
      Done in 9d87a93: `defaultLoaders()` unchanged on JS; `nodejs-test-project`
      (5 tests) and `jsNodeTest` (125, incl. `NodeTargetSmokeTest` and both
      `getBuiltinModule` and dynamic-import resolution paths) pass.
- [x] 2.3 Confirm the HTTP loader works unchanged in a browser — it already uses
      the global `fetch`
      Confirmed in 9d87a93: `FetchLoader` unchanged; `JsRuntimeTest.
      fetchLoaderResolvesCrossDocumentRefsInABrowser` dereferences `GH-36/root.json`
      and its relative `$ref` over HTTP from the Karma server.
- [x] 2.4 A browser test that loads the library and reads a document through a
      caller-supplied reader
      Done in 9d87a93: `src/jsTest/.../JsRuntimeTest.kt`
      `readsDocumentsThroughACallerSuppliedReader`, run by `jsBrowserTest`.

## 3. zenwave-manifest

- [ ] 3.1 Confirm `manifest-core`, `manifest-graph` and `workspace-runtime` load
      in a browser once the loader is fixed — they carry no Node API of their own
- [ ] 3.2 Confirm a caller can supply its own reader all the way through, without
      a platform default being required to load
- [ ] 3.3 Report archive extraction as unavailable on JS, rather than failing in
      a way that reads like a defect

## 4. zenwave-lsp

- [ ] 4.1 Confirm `lsp-core` loads in a browser once its dependencies do — its
      `jsMain` carries no Node API
- [ ] 4.2 `lsp-js` with real sources, available to consumers as a versioned
      JS artifact. Evidence from `zenwave-platform-vscode` 003:
      `zenwave-lsp/lsp-js/src/main/kotlin/io/zenwave360/lsp/js/.gitkeep` is the
      only tracked main-source file; `lsp-js/build.gradle.kts:5-35` declares
      executable/npm metadata but there is no server implementation to start.
- [ ] 4.3 Provide runnable Node IPC and Web Worker messaging entry points and
      verify initialise plus a supported request over each real wire, with
      capability discovery. `zenwave-platform-vscode` 003 tasks 3.1/3.2 cannot
      connect without these; a client supervisor cannot replace the producer's
      language-server implementation. The desktop transport must be available
      independently of the remaining browser dependency-chain work.

## 5. dsl-kotlin

- [ ] 5.1 Confirm it still loads in a browser — already clean, and the one
      artifact with a track record there
- [ ] 5.2 Keep the Node-only test dependencies in `jsTest`, out of the published
      artifact

## 6. Verification, in each producing repository

- [ ] 6.1 Declare a `browser()` target wherever a JS artifact is published
  - [x] json-schema-ref-parser-kmp: done in 9d87a93 (`build.gradle.kts` `js(IR)`)
- [ ] 6.2 A build step that loads the artifact in a browser and fails if it
      cannot
  - [x] json-schema-ref-parser-kmp: done in 9d87a93 — `jsBrowserTest` (Karma,
        ChromeHeadless; `CHROME_BIN` or a found Chrome/Chromium/Edge) is part of
        `check`; `karma.config.d/fail-on-empty.js` fails a run with no tests
- [ ] 6.3 Confirm the check actually catches a regression, by introducing a Node
      import on a branch and watching the build fail
  - [x] json-schema-ref-parser-kmp: confirmed on throwaway branch (deleted) off
        9d87a93: a module-level `@JsModule("node:fs")` used by `NodeFsLoader` made
        `./gradlew check` fail in `:jsBrowserTest` with `UnhandledSchemeError:
        Reading from "node:fs" is not handled by plugins`; `jsNodeTest` still passed
- [ ] 6.4 Node consumers still work throughout
  - [x] json-schema-ref-parser-kmp: done in 9d87a93 — jvmTest 158, jsNodeTest 125,
        nodeIntegrationTest 5 pass (baseline 155 / 116 / 4)

## 7. Consumer confirmation

- [ ] 7.1 `zenwave-platform-vscode`: the language stack loads in the web
      extension host, which is what `003-lsp-client` is waiting on
- [ ] 7.2 Any other browser consumer that wants it — website, EventCatalog
      components, Astro components — confirms the same

## 8. Archive

- [ ] 8.1 `openspec archive 002-kmp-browser-support --store zenwave-specs`
