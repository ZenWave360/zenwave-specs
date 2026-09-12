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
`zenwave-manifest` and `zenwave-lsp`, exactly one `jsMain` file references a Node
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
| `manifest-core` jsMain | one file, returns `null` |
| `dsl-kotlin` `npm("fs")`, `kotlin-node` | declared in **jsTest**, not in the published artifact |

**The chain.** `json-schema-ref-parser-kmp` → `manifest-core` →
`manifest-graph` → `workspace-runtime` → `lsp-core` → `lsp-js`. One import at the
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
