# 0009. Mermaid, not PlantUML, generated upstream

**Status:** accepted; the ZDL part by agent 2026-09-16, owner review pending. **Origin:** VS Code project decisions, change 001 task 1.5, VS Code change 005. **Used by:** [MP-R6](../zenwave-platform-vscode/model-preview.md#mp-r6)

## Decision

Diagrams reach clients as Mermaid, generated in `dsl-kotlin`, and clients render them with a bundled
library. `zenwave/preview` never returns PlantUML. The SDK's PlantUML output and IntelliJ's ZDL preview
are left as they are.

## Why

PlantUML needs either a JVM, impossible in a browser, or a remote server, which sends the user's domain
model to a third party by default. The generator has to live where the server can run it on every host:
`ZdlToMarkdownPlugin` is JVM-only, and `dsl-kotlin` is multiplatform and already held the ZFL counterpart.

An earlier plan ported the Handlebars renderer from `zdl-vscode` behind a `PreviewProvider` interface as
an interim step. It was dropped: it would ship a renderer whose only purpose is to be deleted, and be a
second opinion on what a model looks like in the meantime.

## Consequences

- `GenerateMermaidFromZdl` renders one whole-document `classDiagram`. Javadoc, method annotations,
  lifecycle state machines and the input, output and event namespaces of the PlantUML templates are not
  carried over.
- Until IntelliJ moves, the two IDEs show ZDL diagrams in different notations. That is known, not a bug.
- Mermaid dominates the VSIX size. It is loaded on the first diagram but ships either way.
