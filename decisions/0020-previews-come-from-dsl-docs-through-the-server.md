# 0020. Markdown previews come from dsl-docs, through the language server

**Status:** accepted by owner, 2026-10-30. **Used by:** [MP-R14](../zenwave-platform-vscode/model-preview.md#mp-r14), [MP-R15](../zenwave-platform-vscode/model-preview.md#mp-r15)

## Decision

```
dsl-views → dsl-docs → lsp-core (zenwave/preview, MARKDOWN) → VS Code / IntelliJ
```

`dsl-views` makes the diagrams, `dsl-docs` makes the Markdown that contains them, and the server serves it through
the existing `zenwave/preview` request. The VS Code extension renders what it receives and does not call `dsl-docs` itself.

`dsl-docs` gets a separate method for previews, returning what a preview needs. `DslDocs.generate` stays as it is:
it returns the set of pages of a documentation folder, for the SDK plugin and a possible dossier.

## Why

The server already depends on `dsl-views`, and its response already has a `MARKDOWN` format, so this needs no new
request. Calling the library from the extension would need JS exports and npm packaging that `dsl-docs` doesn't have,
another copy of the Kotlin runtime in the VSIX, and a separate integration for IntelliJ.

## Consequences

- No language server means no preview, which [MP-R8](../zenwave-platform-vscode/model-preview.md#mp-r8) already explains to the user.
- A preview is made by the libraries shipped with the extension, and a run by the SDK the user has installed. They can
  differ. This is accepted: there is no way to prevent it.
- Generating on the server can block it, and the JS server has one thread. The time was not measured
  ([LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15)).
