# KMP Browser Runtime

<a id="kmp-browser-runtime"></a>

**Status:** 2026-10-30: 5 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

State what the shared Kotlin Multiplatform libraries owe a consumer that runs
them in a browser rather than in Node — so that an IDE's web host, a website and
a documentation site can all use the same language stack without each
rediscovering which artifact reaches for a filesystem.

## Rules

<a id="kbr-r1"></a>
### KBR-R1 (exists). The published JS artifacts run in a browser

*Note: `workspace-runtime` was not yet confirmed in a browser on its own; `lsp-js` loads it in the worker test.*

Every Kotlin Multiplatform library published for JS consumption SHALL load and
operate in a browser and in a Web Worker, with no Node runtime present. This
SHALL hold for every library a consumer reaches, including ones it reaches only
through another library.

**Examples**

- *Loading the language stack in a Web Worker.* Given a consumer bundling the language stack for a Web Worker, when the worker starts and the modules are loaded, then they load and the stack is usable, without a Node runtime.
- *A capability nobody calls.* Given a library containing functionality that only makes sense on a server, when a browser consumer loads that library without using that functionality, then loading succeeds.
- *A library reached only indirectly.* Given a consumer that uses a high-level library which depends on several others, when it runs in a browser, then every library in that chain works there, because one that does not makes all of them unusable.

**Why:** the second scenario is the one that bites. A platform-only
dependency declared at module level is resolved when the module graph loads, not
when the code is called — so an unused capability is enough to stop a consumer
from starting at all, and it fails inside a worker where diagnosis is hardest.

<a id="kbr-r2"></a>
### KBR-R2 (exists). Libraries take the means of reading content from their caller

A library that reads content SHALL accept the means of reading it from whoever
calls it, and SHALL NOT require a particular platform's way of reaching storage
or the network. A default suited to one platform MAY be offered, provided a
consumer can replace it and does not pay for it by loading the library.

**Examples**

- *Reading in a browser.* Given a browser consumer whose content is reachable only through the embedding application, when it supplies its own way of reading content, then the library uses it, and never attempts to reach storage itself.
- *Reading on a server.* Given a consumer running with a filesystem available, when it uses the library without supplying anything, then a sensible default is available to it.
- *Not paying for the default.* Given a browser consumer that supplies its own way of reading content, when the library is loaded, then nothing that only a server could satisfy is required in order to load it.

<a id="kbr-r3"></a>
### KBR-R3 (exists). A capability that is unavailable on a platform says so

*Note: See [decision 0013](../decisions/0013-platform-capabilities-are-asked-for.md).*

Where a library offers something that cannot work on the platform it is running
on, it SHALL report that it is unavailable rather than failing in a way a
consumer cannot distinguish from a defect, and a consumer SHALL be able to find
out before depending on it.

**Examples**

- *Something that needs a platform facility.* Given a library capability that depends on a facility a browser does not have, when a browser consumer reaches it, then it is told the capability is unavailable here, rather than receiving an error that reads like a bug.
- *Deciding what to offer a user.* Given a consumer deciding which features to present, when it asks what is available on this platform, then it can find out without triggering a failure to ask.

<a id="kbr-r4"></a>
### KBR-R4 (exists). Browser usability is verified where the artifact is produced

*Note: Each repository runs `jsBrowserTest` in `check`, and a regression was proven to fail in each.*

Each repository publishing a JS artifact SHALL verify that it loads and works in
a browser as part of its own build, so that a regression fails there rather than
in a consumer.

**Examples**

- *Someone adds a platform-only dependency.* Given a contributor who introduces a Node-only dependency into a shared library, when that repository's build runs, then it fails, naming the problem, before the artifact is published.
- *A consumer upgrading a version.* Given a consumer taking a new version of a shared library, when it bundles it for a browser, then it can rely on this having been checked upstream, rather than being the one who discovers it.

**Why:** without this, the only test of browser safety is a user opening a
web IDE, and the only symptom is a worker that fails to start. The property has
to be checked by whoever can still cheaply fix it.

<a id="kbr-r5"></a>
### KBR-R5 (exists). The JS language server provides runnable message endpoints

*Note: See `lsp-js/README.md`.*

The published JS language server SHALL provide entry points that accept and
answer Language Server Protocol messages over Node child-process IPC and Web
Worker messaging, respectively. A consumer SHALL be able to initialise the
server, discover its advertised language and custom-request capabilities, and
use those capabilities without supplying its own language-server implementation.

**Examples**

- *A desktop consumer starts the shipped JS server.* Given a consumer with the published JS server available, when it starts the server in a Node child process and initialises over IPC, then the server answers initialisation and subsequent supported requests through that connection.
- *A browser consumer starts the shipped JS server.* Given a consumer with the published JS server available and no Node runtime, when it starts the server in a Web Worker and initialises through messaging, then the server answers initialisation and subsequent supported requests through that connection without requiring Node APIs.

## Findings worth not re-auditing

An audit across the stack found exactly one Node API reference in published `jsMain`: a `@JsModule("node:fs")` in `json-schema-ref-parser-kmp`, reached through the default loaders by
everything above it (`architecture-manifest`, `architecture-graph`, `workspace-runtime`, `lsp-core`, `lsp-js`). It is now loaded lazily:
[decision 0013](../decisions/0013-platform-capabilities-are-asked-for.md). `dsl-kotlin` needed only `elkjs`, and `FetchLoader` is identical in a browser. Tests that read fixtures from disk stay
Node and JVM only, and a browser-safe smoke test runs in the browser.
