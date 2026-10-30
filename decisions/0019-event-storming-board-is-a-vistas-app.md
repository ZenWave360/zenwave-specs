# 0019. The Event Storming board is an app in the vistas

**Status:** accepted by owner, 2026-10-30. **Used by:** [Event Storming whiteboard](../roadmap/event-storming-whiteboard.md)

## Decision

The whiteboard is neither a separate extension nor a separate tool. It is an app inside
`zenwave-architectural-vistas`, and it reuses the read-only view that already exists there.

The first version is not meant to be licensed. A later, advanced version might be.

## Why

The board draws the same concepts the EventFlow view already draws, on the same library, and the platform
already knows how to embed a page from that repository in an IDE. A separate tool would duplicate both.

## Consequences

- The original brief's own extension, packaging and licensing plan no longer applies.
- The board does not break the rule that editing the architecture goes through Git: it edits its own file in
  the repository, and reaches the model only by a one-way export to ZFL.
- [The vistas' package rule](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) applies: code the two share
  is extracted once both need it. What exactly is shared is [ES-Q7](../roadmap/event-storming-whiteboard.md#es-q7).
