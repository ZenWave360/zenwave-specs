# 0021. ZFL text owns visual editing

**Status:** direction accepted by owner, 2026-10-31; implementation rules proposed.
**Used by:** [visual editing](../flows/zfl-visual-editing.md) and the
[delivery plan](../roadmap/event-storming-whiteboard.md).

## Decision

ZFL text is authoritative for a bidirectional visual editor. Canvas actions update
that text, and only valid ZFL models are editable through the canvas. The first
host is single-user VS Code; the editor is developed as a standalone reusable
React component in `zenwave-architectural-vistas`.

This supersedes the authoritative board JSON and one-way-export consequence of
[0019](0019-event-storming-board-is-a-vistas-app.md). Its ownership decision remains:
the UI belongs to the vistas and can be embedded by an IDE.

## Why

The owner chose text authority, valid models only and a reusable component. The
existing display graph loses source information and cannot safely regenerate ZFL.
The visual editor therefore issues semantic intents to KMP, which prepares
validated edits over original text.

## Consequences

- No second authoritative board file and no export/synchronization step.
- KMP owns semantics and source preservation; React owns interaction.
- Visual identity differs from source location and architectural identity.
- Free-form notes and simultaneous collaboration are outside the first release.
- Source targeting, valid atomic edits and revision checks precede UI delivery.
- Repeated appearances, forms, invalid-text display and durable layout remain
  questions in the spec; their proposed defaults are not owner-confirmed answers.
