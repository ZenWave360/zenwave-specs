# 0019. The Event Storming board is an app in the vistas

**Status:** accepted by owner, 2026-10-30. **Used by:** [Event Storming whiteboard](../roadmap/event-storming-whiteboard.md)

**Amended 2026-10-31:** [decision 0021](0021-zfl-text-owns-visual-editing.md)
supersedes the separate board file and one-way ZFL export. Vistas ownership and
reuse of visualization components remain. The editor is now a reusable component
developed in a standalone browser harness, then embedded in VS Code.

## Decision

The whiteboard is neither a separate extension nor a separate tool. It is an app inside
`zenwave-architectural-vistas`, and it reuses the read-only view that already exists there.

The first version is not meant to be licensed. A later, advanced version might be.

## Why

The board draws the same concepts the EventFlow view already draws, on the same library, and the platform
already knows how to embed a page from that repository in an IDE. A separate tool would duplicate both.

## Consequences

- The original brief's own extension, packaging and licensing plan no longer applies.
- The original board-file/one-way-export consequence is superseded by 0021: the
  canvas edits the authoritative ZFL document through validated text operations.
- [The vistas' package rule](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) applies: code the two share
  is extracted once both need it. What exactly is shared is [ES-Q7](../roadmap/event-storming-whiteboard.md#es-q7).
