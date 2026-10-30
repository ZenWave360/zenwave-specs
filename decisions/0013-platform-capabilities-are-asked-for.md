# 0013. Node is loaded lazily, and a library says what its platform can do

**Status:** accepted by agent 2026-09-16; owner review pending. **Origin:** change 002, tasks 1.1 to 1.3. **Used by:** [KMP browser runtime](../flows/kmp-browser-runtime.md)

## Decision

- `json-schema-ref-parser-kmp` has no module-level `@JsModule("node:fs")`. `NodeFsLoader` gets `fs` when it is called:
  `process.getBuiltinModule` where it exists, otherwise a dynamic `import` bundlers cannot see, otherwise it reports
  the filesystem as unavailable. Existing Node consumers see no difference.
- A library with platform-dependent capabilities exposes `object <Library>Platform` with `capabilities()` and
  `isAvailable(id)`, with ids namespaced `<library>.<capability>`. Asking never throws and never loads anything.
- Reaching something unavailable throws `CapabilityUnavailableException`, defined at the bottom of the chain. It
  extends `UnsupportedOperationException`.

## Why

A platform-only dependency declared at module level is resolved when the module graph loads, not when the code is
called. So a capability **nobody calls** stops the consumer from starting, inside a worker where diagnosis is hardest.
An audit found exactly one such import across the whole stack, at the bottom of a chain every consumer reaches.

## Rejected

- **Named JS targets.** Every consumer with one `js()` target would choose between two variants, and choosing wrong
  brings back the failure.
- **A separate artifact for the Node loader.** `ZenWaveManifestLoader` calls `defaultLoaders()` from common code, so
  this moves the problem up one repository.

## Consequences

The import is easy to bring back by accident, which is why each repository's build loads its artifact in a browser
([KBR-R4](../flows/kmp-browser-runtime.md#kbr-r4)). The check was proven by introducing a Node import on a throwaway
branch in each repository and watching the build fail.

Every new capability in these modules now has to consider the browser, including ones whose author only cares about
the CLI. That cost is the point.
