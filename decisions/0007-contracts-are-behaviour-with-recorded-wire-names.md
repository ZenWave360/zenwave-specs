# 0007. Contracts describe behaviour; wire names are recorded beside them

**Status:** accepted. **Origin:** cross-repository change 001, design. **Used by:** [visualization requests](../flows/lsp-visualization-requests.md)

## Decision

A rule says what a neighbour can notice: a node "carries the position and dimensions to draw it at",
not `position: {x, y}`. Where a wire name genuinely is the contract (a request method, a message
type, an error kind), it is recorded in a reference section next to the rules. Field-level shapes
are versioned by the `schema` string payloads carry.

## Why

The repositories involved are all still moving. A generated-type version of these documents would be
stale within a month, and a stale schema is worse than none. The cost is that this repository cannot
generate types, and that nothing fails a build when a server stops returning positions: the tests
written from a rule's examples, in each repository, are the only enforcement.

## Rejected

JSON Schema for every message, for now. `contracts/` is reserved for the point where a shape stops
moving.
