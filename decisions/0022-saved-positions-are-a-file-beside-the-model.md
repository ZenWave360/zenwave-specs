# 0022. Saved positions are a file beside the model

**Status:** accepted by owner, 2026-11-01; not built. **Used by:** [EF-R12](../flows/eventflow.md#ef-r12), [EF-R14](../flows/eventflow.md#ef-r14), [LVR-R18](../flows/lsp-visualization-requests.md#lvr-r18)

## Decision

When a user arranges a full EventFlow diagram and asks to save it, the positions go to a JSON file beside the model, named after it: `checkout.zfl` saves to
`checkout.positions.json`. Opening the diagram uses that file when it applies. A variant of a flow always has automatic layout and never reads or changes the file.

The server still returns a positioned model. It applies the file's positions in place of ELK, in `dsl-kotlin`, and the page does not compute a layout.

## Why

The owner wants an arrangement to be kept deliberately, not as a side effect of dragging. A file in the workspace can be committed and shared, and leaves ZFL as the only source of meaning. Keeping the application on the
server preserves [decision 0001](0001-layout-stays-on-the-server.md): two IDEs draw the same file the same way.

## Consequences

- Layout annotations in ZFL are not needed.
- The DSL can export a whole model today and cannot apply positions, so this needs new code ([EF-T7](../flows/eventflow.md#ef-t7)).
- A renamed node id no longer matches, so the diagram falls back to automatic layout and says so ([EF-Q9](../flows/eventflow.md#ef-q9)).
- The visual ZFL editor builds on this after the variants work, rather than deciding durable placement separately.
