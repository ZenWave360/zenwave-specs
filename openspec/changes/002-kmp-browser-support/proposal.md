# 002 — Browser support for the shared Kotlin libraries

## Why

The ZenWave language stack is Kotlin Multiplatform with a JS target, and several
consumers need those artifacts to run in a browser rather than in Node:

- the VS Code client's **web extension host** (vscode.dev, github.dev,
  Codespaces in a browser), where extensions run in a Web Worker;
- the ZenWave **website** and **EventCatalog** components, which render
  architecture in a page;
- the **Astro components** planned in `zenwave-architectural-vistas`.

None of them can use a library that reaches for a Node API.

An audit of the published JS surface found this is closer than anyone assumed,
and blocked by less than anyone assumed. Across `dsl-kotlin`,
`json-schema-ref-parser-kmp`, `zenwave-manifest` and `zenwave-lsp`, exactly one
file in any `jsMain` touches a Node API. Everything else is already clean.

What makes that one file decisive is how it is reached. It is imported
statically, through the default loader set, so the failure is not "this feature
does not work in a browser" — it is the module graph failing to load at all,
inside a Web Worker, where a stack trace helps nobody. And because the library
sits at the bottom of the dependency chain, it reaches every consumer above it:

```
json-schema-ref-parser-kmp
  └ manifest-core → manifest-graph → workspace-runtime
      └ lsp-core
          └ lsp-js
```

So one line makes the whole language stack unusable in a browser, and no amount
of work in the repositories above it changes that.

This is written down as a contract because it is exactly the kind of property
that is easy to break by accident, invisible in a build, and expensive to
discover: the next Node API added to any of these modules costs a consumer a
release, and nothing in any producing repository currently objects.

## What Changes

- **A stated obligation** that the shared Kotlin libraries' JS artifacts load and
  work in a browser, naming the artifacts it applies to.
- **A division of responsibility for I/O**: libraries take the means of reading
  content from their caller instead of reaching for a platform API, so a host can
  supply one that suits where it is running.
- **Platform gaps are reported rather than fatal**, so a consumer can tell a
  capability that is absent here from a library that is broken.
- **Verification before publication**, so a regression is a failed build in the
  producing repository rather than a runtime failure in a consumer.

## Capabilities

### New Capabilities

- `kmp-browser-runtime`: the obligation that the shared Kotlin Multiplatform
  libraries are usable from a browser, what they may not assume about the
  platform they run on, and how a host supplies what they need.

### Modified Capabilities

None.

## Impact

- **`json-schema-ref-parser-kmp`** carries the one blocking Node import, and is
  where the fix has to land. It is not trivial: a Kotlin/JS target declaring both
  `browser()` and `nodejs()` shares one `jsMain`, so there is no per-environment
  `actual` without named targets or moving the loader into its own artifact. It
  is one decision about one file, but it is a real one.
- **`zenwave-lsp`** additionally needs `lsp-js` to exist — it is currently a
  `.gitkeep` — and to speak the protocol over browser transports rather than the
  Node build of `vscode-languageserver`.
- **`dsl-kotlin`, `zenwave-manifest`** are already clean, and this change asks
  them to stay that way and to prove it.
- **Every module** gains a browser target, so that breaking this is a build
  failure rather than a consumer's incident.
- **`zenwave-platform-vscode`** is the immediate beneficiary: its
  `003-lsp-client` change cannot deliver a working web host until this lands.
