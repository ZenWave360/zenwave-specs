# ZDL Validation

<a id="zdl-validation"></a>

**Status:** proposed (change 003-listener-id-placeholder, never archived; see work/003-listener-id-placeholder/tasks.md for what is done). Migrated from OpenSpec change 003-listener-id-placeholder on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

What the ZDL validator requires of a service method that declares a
`@transition`.

## Rules

<a id="zv-r1"></a>
### ZV-R1. A transition with from-states requires an id parameter

*Delta: REMOVED*

**Reason:** a `from` transition needs *some* way to find the entities it applies
to, not necessarily the aggregate id. Correlation keys in the input (e.g.
`orderId` releasing all reservations of an order) are legitimate, and the rule
forced models to declare an `id` that nothing could supply.
**Migration:** none needed. Models that declare `(id, ...)` stay valid; models
that were forced to add `id` may remove it.

<a id="zv-r2"></a>
### ZV-R2. A from-transition may omit the id parameter

The ZDL validator SHALL accept a service method whose `@transition` declares
`from` states and whose signature has no `id` parameter, and SHALL still apply
the remaining transition rules to it.

**Examples**

- *Correlated transition without id.* Given `service InventoryService for (StockReservation)` where `StockReservation` has `@lifecycle`, and `@transition(from: [RESERVED, CONFIRMED], to: RELEASED) releaseStock(ReleaseStockInput) StockReservation[]`, when the model is validated, then no problem is reported for `releaseStock`.
- *Other transition rules still apply without id.* Given a from-transition without an id whose `from` names a state that is not in the lifecycle enum, when the model is validated, then "`<STATE>` is not a valid state value" is reported, as it is for methods with an id.

