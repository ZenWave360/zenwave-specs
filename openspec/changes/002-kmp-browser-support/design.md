# 002 — Design

## Context

This design exists because an audit produced a much smaller answer than the
assumption it replaced. The assumption, recorded in
`zenwave-platform-vscode`'s architecture notes, was that browser support meant
porting work in `zenwave-lsp`. It does not.

**Targets.** Every KMP module in the stack declares `js(IR) { nodejs() }` and
none declares `browser()`. On its own that is not disqualifying: with
`useEsModules()` the output is an ES module a browser can load. The target
declaration mostly governs test runners and dev servers.

**Node API usage.** Across `dsl-kotlin`, `json-schema-ref-parser-kmp`,
`zenwave-architecture` and `zenwave-lsp`, exactly one `jsMain` file references a Node
API:

```kotlin
// json-schema-ref-parser-kmp/src/jsMain/.../NodeFsLoader.kt
@JsModule("node:fs")
private external object NodeFsModule { … }
```

and it is reached through the default loader set:

```kotlin
actual fun defaultLoaders(auth) = listOf(NodeFsLoader(), FetchLoader(auth))
```

**What is already clean**, and worth recording so nobody re-audits it:

| Module | Finding |
| --- | --- |
| `dsl-kotlin` jsMain | `npm("elkjs")` only; no Node API. Consistent with `zdl-vscode` having shipped it to the browser |
| `FetchLoader` | uses the global `fetch`; identical in a browser |
| `lsp-core` jsMain | two files, no Node API |
| `architecture-manifest` jsMain | one file, returns `null` |
| `dsl-kotlin` `npm("fs")`, `kotlin-node` | declared in **jsTest**, not in the published artifact |

**The chain.** `json-schema-ref-parser-kmp` → `architecture-manifest` →
`architecture-graph` → `workspace-runtime` → `lsp-core` → `lsp-js`. One import at the
bottom, every consumer above it.

## Goals / Non-Goals

**Goals:**

- One stated property, owned by the producers, that consumers can rely on.
- Keep the obligation about *what is observable* — the artifact runs in a browser
  — rather than about a particular file.
- Make a regression fail in the repository that caused it.

**Non-Goals:**

- **Prescribing how `json-schema-ref-parser-kmp` fixes its loader.** Several
  shapes work and the trade-offs are that repository's to weigh; see below.
- **Requiring every capability to exist in a browser.** Archive extraction,
  classpath loading and a real filesystem are legitimately server-only. The
  requirement is that their absence is reported, not that they are ported.
- **`lsp-js`'s protocol transport.** Browser message transports are tracked in
  `zenwave-platform-vscode`'s `003-lsp-client` as an upstream prerequisite; this
  change is about the libraries underneath being loadable at all.
- **Node support.** Nothing here removes it. Both must work.

## Decisions

### The requirement is the artifact's behaviour, not the offending line

It is tempting to write "remove `@JsModule("node:fs")` from `NodeFsLoader`". That
would be a spec dictating an implementation, and it would be wrong within a
release: the fix might be a named target, a separate artifact, or a lazily
resolved import, and any of them satisfies a consumer equally.

So the requirement is that the published artifact loads and works in a browser,
and the specific import is context recorded here.

### The static-import failure mode deserves its own scenario

A requirement saying "works in a browser" would be read by most people as "the
features you call work". The failure here is different and worse: a module-level
external declaration is resolved when the graph loads, so a capability **nobody
calls** stops the consumer from starting.

That is why "a capability nobody calls" is a scenario rather than a footnote. It
is the difference between a feature being unavailable and an extension never
activating, and it is the shape the next regression will take too.

### I/O is injected, because that is already the direction of travel

`ZenWaveManifestLoader` already accepts `documentLoaders`, and
`defaultLoaders(auth)` already takes credentials rather than finding them. The
requirement generalises what these APIs already gesture at: a library says what
it needs read, a host says how to read it.

This is also what the VS Code client needs for a second reason. In a web host,
workspace content lives behind a virtual filesystem only the extension host can
reach, so no library-side default could serve it — the host has to supply the
means or the content is unreachable. The same seam serves credentials, which
`001-ide-client-contracts` puts on the client side for security reasons.

The third scenario — *not paying for the default* — is the one that carries the
real constraint. Offering a Node default is fine; making a browser consumer load
it in order to replace it is not.

### Options for the loader, for the repository that owns it

Not prescribed, but recorded so the decision starts from a survey rather than
from scratch. In Kotlin/JS, `js(IR) { browser(); nodejs() }` is one target with
one `jsMain`, so there is no per-environment `actual`:

- **Named targets** — separate browser and Node targets with their own source
  sets. Most explicit; two artifacts to publish and for consumers to choose
  between.
- **A separate artifact for the Node loader** — the core stays platform-neutral
  and a Node consumer adds one dependency. Clean layering; a breaking change for
  existing Node consumers unless the default is preserved somewhere.
- **Resolving the import lazily** — the reference stops being a module-level
  external. Smallest diff; easiest to reintroduce by accident later, which is
  what the verification requirement is there to catch.

### Decision (task 1.1): the Node filesystem import is resolved lazily, at call time

Decided by agent on 2026-09-16, pending review

**Chosen option:** resolving the import lazily. Named targets and a separate
artifact were rejected.

**Reason.** It is the only option that changes nothing for any existing
consumer:

- `zenwave-architecture`'s `ZenWaveManifestLoader` calls `defaultLoaders()` from
  **commonMain** (`architecture-manifest/.../ZenWaveManifestLoader.kt:28`). A separate
  Node-loader artifact would break that call on JS or make `architecture-manifest`
  choose a platform, and moving the problem up one repository does not fix it.
- Named JS targets would make every Kotlin consumer with a single `js()` target
  (`architecture-manifest`, `lsp-core`) choose between two variants through Gradle
  attributes. Choosing wrong brings back today's failure, as the Risks section
  says.
- The static import only exists because `NodeFsLoader.kt` declares
  `@JsModule("node:fs") external object NodeFsModule`. Kotlin/JS turns that
  into a top-level `import`, both in this library's own npm package and in any
  Kotlin consumer's final bundle, because the klib carries the declaration.
  Remove that declaration and the static import is gone everywhere, with no
  change to the API.

The downside the survey names, that the import is easy to bring back by
accident, is what task 6.2's browser-load check catches.

**What `json-schema-ref-parser-kmp` implements** (no public signature changes):

1. Delete the `@JsModule("node:fs") external object NodeFsModule` declaration.
   `NodeFsLoader` keeps its name, package
   (`io.zenwave360.jsonrefparser.io`), constructor and `canLoad` behaviour.
2. `NodeFsLoader.load` (already `suspend`) gets the `fs` module when it is
   called, through a private helper in `jsMain`:
   - if `globalThis.process?.getBuiltinModule` is a function, call it with
     `"node:fs"`. This works on Node 20.16+/22.3+, is synchronous, and bundlers
     cannot see it;
   - otherwise, if `globalThis.process?.versions?.node` is a string, use
     `await (new Function("s", "return import(s)"))("node:fs")` and take its
     `readFileSync` (or `default.readFileSync`). The specifier is never a
     literal `import()` in the output, so webpack, esbuild and Vite do not try
     to resolve it. Cache the resolved module in a private top-level `var`;
   - otherwise (browser or Web Worker), throw
     `CapabilityUnavailableException(RefParserPlatform.FILESYSTEM, …)` (see the
     task 1.3 decision).
   The implementer must confirm Kotlin's `js("…")` parser accepts the chosen
   expression. `new Function` is used above because Kotlin's `js()` may reject a
   bare `import(…)`.
3. `jsMain` `defaultLoaders(auth)` still returns
   `listOf(NodeFsLoader(), FetchLoader(auth))`, in that order, on every JS
   runtime. Constructing `NodeFsLoader` touches no Node API. Keeping the list
   the same on every runtime avoids a default set that depends on the runtime;
   a browser consumer that reaches a file URI gets a reported unavailability
   instead of "no loader".
4. `libs.kotlin.node` (kotlin-wrappers) moves from `jsMain` to `jsTest` if no
   main source references it after step 1. It is a wrapper library whose
   externals are `@JsModule` declarations, which is exactly what task 6.2 is
   there to keep out.
5. Add `browser()` next to `nodejs()` in `js(IR)` (task 6.1), keeping
   `useEsModules()` and `binaries.executable()`, and add the browser-load check
   (task 6.2).

Deviation by agent on 2026-09-16, pending review: implemented in
`json-schema-ref-parser-kmp` 9d87a93 with two variants of the steps above.
(a) Step 4: `libs.kotlin.node` is removed rather than moved to `jsTest`. The
test utilities also switched to `process.getBuiltinModule`, because the browser
test run bundles the whole `jsTest` compilation and a `@JsModule` wrapper there
fails that bundle the same way as one in `jsMain`. So the Kotlin/JS tooling
Node is pinned to 22.12.0 (the plugin default 22.0.0 predates
`getBuiltinModule`); a test still exercises the dynamic-`import()` fallback.
Published consumers are unaffected. (b) Steps 2 and 5: the browser check runs
only `JsRuntimeTest` in the browser; the common suite reads fixtures from disk
and stays Node/JVM-only.

### Decision (task 1.2): existing Node consumers keep today's defaults; no migration

Decided by agent on 2026-09-16, pending review

**Chosen option:** keep today's default behaviour for every existing consumer.

- **JVM** (`ClasspathLoader`, `FileLoader`, `HttpLoader`): unchanged.
- **JS on Node** (`nodejs-test-project`, zenwave-lsp's `lsp-js` on Node, any
  npm consumer of `@zenwave360/json-schema-ref-parser-kmp`): `defaultLoaders()`
  returns the same two loaders in the same order, and `NodeFsLoader` reads the
  same files with `readFileSync(path, "utf8")`. The only difference is that the
  `fs` module is fetched on the first `load` instead of when the module graph
  loads. `load` was already `suspend`, and the exported
  `dereferenceSchema`/`dereferenceSchemaText` already return a `Promise`, so
  callers cannot tell the difference.
- **Minimum Node version:** unchanged in practice. The fallback in the task 1.1
  decision covers every Node version with dynamic `import()`, and
  `getBuiltinModule` is only an optimisation.
- **JS in a browser:** this never loaded before, so there is no behaviour to
  keep. It now loads, reads over HTTP(S) with `FetchLoader`, and reports the
  filesystem as unavailable.

**Migration:** none. Nothing that another consumer reads changes: no API, no
artifact coordinates, no npm package name, no export. Task 2.2 ("keep the Node
filesystem loader available to Node consumers") is satisfied by the existing
`nodejs-test-project` suite, which keeps passing unmodified.

### Decision (task 1.3): each library answers a synchronous capability query, and a shared exception reports unavailability

Decided by agent on 2026-09-16, pending review

**Chosen option:** each library that has platform-dependent capabilities
exposes a small, side-effect-free query object in **commonMain**. When a
consumer reaches something that is unavailable anyway, it gets one exception
type, defined at the bottom of the chain so every library above can use it.
Asking never throws and never loads anything.

**Reason.** The spec asks for two things: a consumer can find out before
depending on a capability, and an unavailable capability reads as unavailable,
not as a defect. A query object answers the first; a typed exception answers the
second. Putting the exception in `json-schema-ref-parser-kmp` needs no new
artifact, because `architecture-manifest`, and through it `workspace-runtime` and
`lsp-core`, already depend on it. `dsl-kotlin` has no platform-dependent
capability today, so it adds nothing.

**Shape, in `json-schema-ref-parser-kmp`** (package
`io.zenwave360.jsonrefparser.platform`, commonMain):

```kotlin
class CapabilityUnavailableException(
    val capability: String,   // one of the capability ids below
    val platform: String,     // "jvm" | "node" | "browser"
    message: String = "Capability '$capability' is not available on $platform",
) : UnsupportedOperationException(message)

object RefParserPlatform {
    const val FILESYSTEM = "jsonrefparser.filesystem"
    const val CLASSPATH  = "jsonrefparser.classpath"
    const val HTTP       = "jsonrefparser.http"
    val name: String                              // "jvm" | "node" | "browser"
    fun capabilities(): Set<String>
    fun isAvailable(capability: String): Boolean  // false for unknown ids
}
```

- JVM: `name = "jvm"`, `{FILESYSTEM, CLASSPATH, HTTP}`.
- JS: `name` is computed when read. It is `"node"` when
  `globalThis.process?.versions?.node` is a string, otherwise `"browser"`.
  Node: `{FILESYSTEM, HTTP}`. Browser: `{HTTP}` when a global `fetch` exists.
- JS export (in `NodeJsExports.kt`): `refParserPlatform(): dynamic` returning
  `{ name: string, capabilities: string[] }`.
- `RefParser`: when no loader can load a URI, and the URI is a `file:` or bare
  path while `FILESYSTEM` is unavailable (or `classpath:` while `CLASSPATH` is
  unavailable), throw `CapabilityUnavailableException` instead of the generic
  "no loader" error.

**Same convention, in `zenwave-architecture`** (`architecture-manifest`, package
`io.zenwave360.architecture.manifest`, commonMain):

```kotlin
object ManifestPlatform {
    const val ARCHIVE_EXTRACTION = "manifest.archiveExtraction"
    fun capabilities(): Set<String>   // JVM: {ARCHIVE_EXTRACTION}; JS: {}
    fun isAvailable(capability: String): Boolean
}
```

When a candidate with an `archiveEntry` meets a `null` archive-entry loader,
`ZenWaveManifestLoader` throws `CapabilityUnavailableException(
ManifestPlatform.ARCHIVE_EXTRACTION, RefParserPlatform.name)` instead of
`error("No archive-entry loader is available …")` (currently
`ZenWaveManifestLoader.kt:367-368`). Content resolution still treats it like any
other candidate failure and moves on to the next candidate (the existing
`catch (error: Throwable)` loop). If this is the last error, it appears in
`ManifestResourceLoadException`'s "Final load error", which then names the
capability. This is task 3.3.

**Convention for future libraries:** an `object <Library>Platform` with
`capabilities()` and `isAvailable(id)`, capability ids namespaced
`<library>.<capability>`, and `CapabilityUnavailableException` thrown when an
absent capability is reached. A higher library (for example `lsp-core`) may
report the union of the ids below it, but must not rename them.

**Additive:** yes. These are new types and exports. The only change in existing
behaviour is the exception type on paths that failed before anyway.
`CapabilityUnavailableException` extends `UnsupportedOperationException`, so an
existing `catch (e: RuntimeException)` still catches it.

Deviation by agent on 2026-09-16, pending review: in `json-schema-ref-parser-kmp`
9d87a93, `RefParser.parse()` always throws the exception for an unavailable root
URI. For `$ref` targets, the resolver throws it (unwrapped, not inside
`MissingRefException`) only under `OnMissing.FAIL`; under `OnMissing.SKIP` the
reference is skipped as before, so a caller's skip policy is honoured. On the
JVM nothing changes, because every capability is available. On Node, a
`classpath:` `$ref` under `FAIL` now throws `CapabilityUnavailableException`
instead of `MissingRefException("Cannot load: …")`.

Deviation by agent on 2026-09-16, pending review (task 5.2, `dsl-kotlin` 835a75f):
the Node-only test dependencies are removed rather than kept in `jsTest`. The npm `fs`
placeholder and `kotlin-node` were used only by the test fixture reader, whose static
`@JsModule("fs")` import breaks the browser test bundle (that bundle includes the whole
`jsTest` compilation). The reader now uses `process.getBuiltinModule("node:fs")`. The
Kotlin 2.3.0 default Node for tests supports it, so no Node version pin was needed. The
published artifact never listed these dependencies, so consumers see no change. As in
`json-schema-ref-parser-kmp`, only a browser-safe smoke test runs in the browser; the
common suite still reads fixtures from disk on Node and the JVM.

### Verification belongs to the producer

A consumer discovering this is a consumer discovering it in a Web Worker, in
production, with a stack trace that points at a bundle. The only party who can
catch it cheaply is the repository that introduced it, and the only moment is
before publication.

Declaring `browser()` is most of the mechanism — it makes browser tests
expressible — but declaring the target is not the requirement. Running something
in a browser that would fail on a Node import is.

## Risks / Trade-offs

- **The fix is in the least glamorous repository in the stack.** The work is one
  decision in `json-schema-ref-parser-kmp`, blocking a headline feature three
  repositories away. That distance is exactly why it has not happened yet, and
  why it is worth a contract rather than an issue.
- **Two published artifacts, if named targets win.** Consumers then have to pick
  correctly, and picking wrong reproduces today's failure with an extra step.
- **"Report unavailability" is easy to satisfy badly.** A capability that throws
  a platform exception technically reports something. The scenario asks for a
  consumer to be able to *ask* before depending on it, which is a stronger claim
  and the one worth testing.
- **This constrains future library work.** Every new capability in these modules
  now has to consider the browser, including ones whose author only cares about
  the CLI. That cost is the point, but it is a real cost and worth naming.
