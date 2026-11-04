# A preview that follows the focused file (PX/9.4, analysis)

**Status:** analysis for the owner, 2026-11-04. Nothing here is a rule yet.

## What was asked

During the pre-release test the owner asked for a preview panel that follows the file in focus,
for exploring and checking a design: move from `orders.zdl` to `booking-lifecycle-flow.zfl` and the
panel shows the second one without opening another preview. The open problem is which diagram it
keeps in view as the focus moves.

## How it fits what exists

[MP-R3](../zenwave-platform-vscode/model-preview.md#mp-r3) says a preview belongs to one document and
never follows the active editor. That stays true for the previews we have. A following preview is a
second kind, as VS Code's Markdown has a *locked* preview (ours today) and a dynamic one. The
proposal:

- One following preview per window at most, opened with a new command *Open Following Preview* (and
  a pin icon in its title bar to lock it, which turns it into a normal MP-R3 preview of the current
  file).
- It follows the last focused text editor of a `.zdl`, `.zfl` or `.zw`. Focusing anything else
  (the preview itself, an EventFlow diagram, a `.ts` file, the explorer) leaves it where it is.
- Everything else is the current preview: same page, modes, Copy as Markdown, last good drawing.

## Keeping the right diagram in view

This is the hard part. Options, from simplest to most useful:

1. **Remember per file.** The panel keeps, for each file it has shown, the mode, the selected
   diagram and the scroll position, and restores them when focus comes back to that file. A file
   seen for the first time opens at its default (MP-R4). Cheap, predictable, no server work.
2. **Follow the cursor inside the file.** On a pause after the cursor moves, the host asks the
   server which representation covers the symbol under the cursor (`zenwave/symbolAt` exists) and
   selects it: the cursor in `aggregate Booking` shows its class or state diagram in ZDL Diagrams;
   the cursor in a `start` or an `@outcome` in ZFL shows that variant's sequence diagram. In Model
   Docs, it scrolls to the heading of that symbol instead of switching page. Needs a mapping from
   symbol to representation id (or heading anchor) on the server, one new request or an additive
   field in `zenwave/preview`.
3. **Follow navigation across files.** When Go to Definition jumps from a ZFL step to a ZDL
   command, the panel shows the command's diagram, not the ZDL's default page. This is option 2
   applied on arrival, and comes for free once option 2 exists.

The cursor must never fight the user: a diagram the user picked by hand in the panel wins until the
cursor moves to a different symbol, and typing (MP-R5 re-renders) never changes the selection.

## Recommendation

Build 1 first, with the command and the lock. It is small, needs only the extension, and already
makes exploring several files usable. Then 2, which is where the value for checking a design is,
and decide its server shape together with the navigation interview (PX/7.1), since both map
symbols to places. 3 needs no extra work after 2.

## Questions for the owner

- One following panel per window, or one per editor group?
- Should the EventFlow diagram follow the focus too, or only the Mermaid preview?
- In Model Docs, should the cursor scroll the page (option 2) or leave it alone?
