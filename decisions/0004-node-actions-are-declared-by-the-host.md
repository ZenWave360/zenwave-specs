# 0004. Node actions are declared by the host, not discovered by the page

**Status:** proposed, 2026-10-29. **Used by:** [EventFlow](../flows/eventflow.md#ef-r4)

## Decision

The page offers on a node exactly the actions the host has told it about. It sends
back the node id and the action id when one is chosen. It never works out a
destination, and it does not contain strings for actions it has not been told about.

The host builds the list from what the language server resolved: the node's source
reference, its hierarchy counterpart's location, an AsyncAPI location when one
exists.

## Why

- Which destinations exist depends on what the host knows: no server means no ZDL,
  an architecture without an AsyncAPI means no AsyncAPI. The page cannot know.
- An absent action is clearer to the user than a visible one that fails.
- IntelliJ and VS Code reach their destinations in different ways. A page that only
  reports intent works in both without a change.
- The host knows its own vocabulary and can add actions only it has.

## Alternatives considered

- **Targets inside the view model.** Simplest for the host, but it makes the model
  carry things a host may want to differ on, and a new destination kind becomes a
  change to a shared model schema.
- **A native VS Code menu.** Looks right in VS Code and nowhere else. See
  EventFlow EF-Q6.

## Open

How big the action map is and whether it is sent up front (EF-Q5).
