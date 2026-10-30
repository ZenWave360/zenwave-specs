# 0010. Rendered views of a model are custom editors, opened by choice

**Status:** accepted. **Origin:** VS Code changes 004 and 005. **Used by:** [EP-R1](../zenwave-platform-vscode/eventflow-panel.md#ep-r1), [MP-R2](../zenwave-platform-vscode/model-preview.md#mp-r2)

## Decision

The diagram and the preview are registered through `contributes.customEditors` with `priority: "option"`,
each bound to one document. Opening a model file always shows its text.

## Why

A view in the bottom panel is a strip that is awkward to give height to, and a flow diagram needs area.
The editor area is the largest surface VS Code has, and users already know how to split, drag and maximise
it.

Being an editor deletes a feature: IntelliJ's tool window needs a file selector and a session tracker
because it is attached to nothing. A custom editor is attached to a document, so the tab is the selection.
It also gets tab swapping, *Reopen Editor With…* and restoration on reload for free.

`priority: "option"` is not optional. With `"default"`, ZFL would become a language you cannot edit by
double-clicking.

## Consequences

- `window.activeTextEditor` is undefined while one has focus, so commands find the document through
  `window.tabGroups`.
- Controls: two-valued ones go in the title bar as one flipping icon. Anything that needs to show a current
  value from a dynamic list goes inside the page. See also
  [EF-R3](../flows/eventflow.md#ef-r3), which proposes moving EventFlow's into the page.
- One submenu holds the ways to view a model, rather than one icon per editor.
- A webview is kept per open diagram. Retaining state while hidden costs memory, dropping it costs a re-render.
  It retains for now.
