# 0026. Deleting a trigger keeps the body; `completed` and service are warnings

**Status:** accepted by owner, 2026-11-05; not built. **Used by:**
[ZVE-R19](../flows/zfl-visual-editing.md#zve-r19),
[ZVE-R20](../flows/zfl-visual-editing.md#zve-r20),
[ZFL-R6 to ZFL-R8](../dsl-kotlin/zfl-language.md#zfl-r6)

## Decision

1. Removing the last trigger of a policy keeps its body. `when X do Y { body }`
   becomes `do Y { body }`, with its annotations and javadoc; `when X do Y` without a
   body is removed. Only deleting the command itself removes a body.
2. ZFL reports an action that no policy triggers and no action calls as a warning.
3. A flow without a `completed` end outcome is valid, with a warning. It was an error.
4. A command without a service is valid, with a warning. It was an error.

Points 2 to 4 are changes to the language, for every consumer, not a mode of the
visual editor.

## Why

A policy body carries the work of a step: its service, its calls, its handlers and
what it emits. The owner does not want it lost because an event or an actor was
deleted; whoever wants it gone deletes the command. ZFL already has `do Y { … }`
for an action with no trigger, so the body has somewhere valid to go, and the
grammar does not change.

The visual editor only edits valid ZFL ([decision 0021](0021-zfl-text-owns-visual-editing.md)).
With `completed` and the service as errors, an empty flow and a freshly drawn
command would both make the document invalid and the canvas read-only. The owner
holds that the service was always meant to be optional. No production code in
`zenwave-lsp`, the vistas or `zenwave-sdk` depends on either, checked 2026-11-05.

## Consequences

- Deletion never cascades into a body, replacing the cascade first proposed in
  [ZVE-R7](../flows/zfl-visual-editing.md#zve-r7).
- A disconnected command stays in the text and on the canvas, with a warning, until
  someone reconnects or deletes it.
- The LSP, Model Docs and the diagrams show warnings where they showed errors, and
  draw a command without a service by its system or name, as they already can.
- An empty `flow X { }` is valid, so the editor can start from one written in the text
  ([ZVE-R25](../flows/zfl-visual-editing.md#zve-r25)).
