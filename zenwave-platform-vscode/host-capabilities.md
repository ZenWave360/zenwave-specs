# Host Capabilities

<a id="host-capabilities"></a>

**Status:** exists, 2026-10-30. Checked against `src/host/capabilities.ts`. See also [VA-R2](architecture.md#va-r2).

## Purpose

Knowing what the extension host we are running in can actually do — spawn a
process, open a terminal, reach a local disk, talk to a language server — and
making features that cannot work here absent and explained rather than broken.

## Rules

<a id="hc-r1"></a>
### HC-R1 (exists). The extension activates in both desktop and web hosts

The extension SHALL activate successfully in the Node extension host and in the
Web Worker extension host, from the same published package.

**Examples**

- *Opening a model file in desktop VS Code.* Given VS Code running on a desktop machine, when the user opens a file with a `.zdl`, `.zw` or `.zfl` extension, then the extension activates without error.
- *Opening a model file in vscode.dev.* Given the extension installed in a browser-based VS Code such as vscode.dev, when the user opens a file with a `.zdl`, `.zw` or `.zfl` extension, then the extension activates without error, and no functionality that depends on a Node API is loaded.

<a id="hc-r2"></a>
### HC-R2 (exists). The extension reports what the current host can do

The extension SHALL determine, at activation, whether the current host can run
external processes, use terminal-backed tasks, reach a local file system, and which
language server transport, if any, is usable here (`ipc`, `worker` or `none`), and
SHALL make that determination available to feature code.

**Examples**

- *Capabilities in the desktop host.* Given the extension activating in the Node extension host, when capability detection completes, then process execution, terminal tasks and local file system access are all reported as available, and the language server transport is reported as the child-process one.
- *Capabilities in the web host.* Given the extension activating in the Web Worker extension host, when capability detection completes, then process execution and terminal tasks are reported as unavailable, and the language server transport is reported as the worker-backed one or as none, according to whether a worker server is available in this build.
- *A user asking why language features are missing.* Given a user who sees no diagnostics on an invalid model, when they open the ZenWave output channel, then the reported language server transport tells them whether a server was expected here at all.

<a id="hc-r3"></a>
### HC-R3 (exists). Unavailable features are hidden, not broken

The extension SHALL NOT present commands, menu items or code lenses for features
that cannot function in the current host. Feature availability SHALL be published
as context keys usable in `when` clauses, and SHALL additionally be enforced when
a command executes.

**Examples**

- *SDK actions in the web host.* Given the extension running in a browser-based VS Code, when the user opens the command palette and types "ZenWave", then commands that require running the `zenwave-sdk` CLI are not listed.
- *A gated command invoked directly.* Given a host where process execution is unavailable, when a command requiring process execution is invoked programmatically, bypassing the menu, then the command does nothing destructive and reports that the feature is unavailable in this host.

**Why:** in the browser, `zenwave-sdk` is not temporarily unavailable — it
is permanently unavailable, because it is JVM-only and launched via JBang. A
control that can never succeed misleads the user about whether the extension is
working.

<a id="hc-r4"></a>
### HC-R4 (exists). Host capability reporting is diagnosable

The extension SHALL record the detected host capabilities to its output channel
at activation.

**Examples**

- *A user reports a missing feature.* Given a user who cannot find an expected ZenWave command, when they open the ZenWave output channel, then they can see which capabilities were detected and therefore why the feature is absent.

<a id="hc-r5"></a>
### HC-R5 (superseded by HC-R2)

The transport was a separate change to HC-R2 and is now part of it.
