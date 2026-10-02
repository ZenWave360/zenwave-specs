## Purpose

What the ZDL validator requires of a service method that declares a
`@transition`.

## REMOVED Requirements

### Requirement: A transition with from-states requires an id parameter
**Reason:** a `from` transition needs *some* way to find the entities it applies
to, not necessarily the aggregate id. Correlation keys in the input (e.g.
`orderId` releasing all reservations of an order) are legitimate, and the rule
forced models to declare an `id` that nothing could supply.
**Migration:** none needed. Models that declare `(id, ...)` stay valid; models
that were forced to add `id` may remove it.

## ADDED Requirements

### Requirement: A from-transition may omit the id parameter
The ZDL validator SHALL accept a service method whose `@transition` declares
`from` states and whose signature has no `id` parameter, and SHALL still apply
the remaining transition rules to it.

#### Scenario: Correlated transition without id
- **GIVEN** `service InventoryService for (StockReservation)` where
  `StockReservation` has `@lifecycle`
- **AND** `@transition(from: [RESERVED, CONFIRMED], to: RELEASED) releaseStock(ReleaseStockInput) StockReservation[]`
- **WHEN** the model is validated
- **THEN** no problem is reported for `releaseStock`

#### Scenario: Other transition rules still apply without id
- **GIVEN** a from-transition without an id whose `from` names a state that is
  not in the lifecycle enum
- **WHEN** the model is validated
- **THEN** "`<STATE>` is not a valid state value" is reported, as it is for
  methods with an id
