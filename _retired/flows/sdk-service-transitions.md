# SDK Service Transitions

<a id="sdk-service-transitions"></a>

**Status:** proposed (change 003-listener-id-placeholder, never archived; see work/003-listener-id-placeholder/tasks.md for what is done). Migrated from OpenSpec change 003-listener-id-placeholder on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

What the SDK generates for a service method with a `from` transition and no
`id` parameter.

## Rules

<a id="sst-r1"></a>
### SST-R1. A from-transition without an id generates a lookup stub, never a guess

For a service method with `@transition(from: ...)` and no `id` parameter, the
generated implementation SHALL declare the entities it acts on through a lookup
marked `TODO CUSTOM_REQUIRED`, and SHALL apply the from-state check, the input
update (if there is an input), the to-state (if any), persistence and the
declared events to exactly those entities. It SHALL NOT load all entities, and
SHALL NOT operate on a newly created instance.

**Examples**

- *Entity service, array return.* Given `service InventoryService for (StockReservation)` with `@lifecycle` on `StockReservation`, and `@transition(from: [RESERVED, CONFIRMED], to: RELEASED) releaseStock(ReleaseStockInput) StockReservation[] withEvents StockReleased`, when the Java backend is generated, then `InventoryServiceImpl.releaseStock` contains a `TODO CUSTOM_REQUIRED` lookup that yields an empty list, and for each element it calls the from-transition check, updates it from the input, and sets `RELEASED`, and it saves them and publishes `StockReleased` as other lifecycle branches do, and it does not call `findAll`, and the project compiles.
- *Entity service, single or Optional return.* Given the same transition with return type `StockReservation` or `StockReservation?`, when generated, then the lookup yields `Optional.empty()`, and the body follows the shape of the existing lifecycle `findById(...).map(...)` branches (`orElseThrow()` for a required return).
- *Aggregate service.* Given an aggregate service method with `@transition(from: ...)` and no id, when generated, then the aggregate is obtained through a `TODO CUSTOM_REQUIRED` lookup that `orElseThrow()`s instead of `new Aggregate()`, and the transition check, command, to-state, save and events follow unchanged.
- *Planner and template agree.* Given any of the method shapes above, when `ServiceMethodBodyPlanner.planEntityMethodBody` is evaluated, then it returns the new body case that matches the branch the template renders.
- *Methods with an id are unchanged.* Given any transition method with an `id`, when generated, then the output is byte-identical to before this change.

