# 0001. Layout stays on the server

**Status:** accepted. **Origin:** `openspec/changes/001-ide-client-contracts/design.md`. **Used by:** [EventFlow](../flows/eventflow.md#ef-t1)

## Decision

The flow view model is returned already positioned. Every node carries the position
and dimensions to draw it at, and the renderer does not compute a layout.

## Why

If each client lays the flow out itself, two IDEs end up drawing the same file
differently, and nobody notices until two screenshots sit side by side. The layout
engine (ELK) already lives in `dsl-kotlin`, where it is multiplatform, so one
implementation serves the JVM and JS servers alike.

## Consequences

- A client older than its server can forward a view model with node types it has
  never seen, because nothing in the exchange requires it to understand them.
- Moving a node in the page is presentation only unless we decide otherwise
  (EventFlow EF-Q7).
