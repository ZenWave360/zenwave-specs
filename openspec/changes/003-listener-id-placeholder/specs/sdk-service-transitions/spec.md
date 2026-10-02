## Purpose

What the SDK generates for a service method with a `from` transition and no
`id` parameter.

## ADDED Requirements

### Requirement: A from-transition without an id generates a lookup stub, never a guess
For a service method with `@transition(from: ...)` and no `id` parameter, the
generated implementation SHALL declare the entities it acts on through a lookup
marked `TODO CUSTOM_REQUIRED`, and SHALL apply the from-state check, the input
update (if there is an input), the to-state (if any), persistence and the
declared events to exactly those entities. It SHALL NOT load all entities, and
SHALL NOT operate on a newly created instance.

#### Scenario: Entity service, array return
- **GIVEN** `service InventoryService for (StockReservation)` with
  `@lifecycle` on `StockReservation`
- **AND** `@transition(from: [RESERVED, CONFIRMED], to: RELEASED) releaseStock(ReleaseStockInput) StockReservation[] withEvents StockReleased`
- **WHEN** the Java backend is generated
- **THEN** `InventoryServiceImpl.releaseStock` contains a `TODO CUSTOM_REQUIRED`
  lookup that yields an empty list
- **AND** for each element it calls the from-transition check, updates it from
  the input, and sets `RELEASED`
- **AND** it saves them and publishes `StockReleased` as other lifecycle
  branches do
- **AND** it does not call `findAll`
- **AND** the project compiles

#### Scenario: Entity service, single or Optional return
- **GIVEN** the same transition with return type `StockReservation` or
  `StockReservation?`
- **WHEN** generated
- **THEN** the lookup yields `Optional.empty()`, and the body follows the shape
  of the existing lifecycle `findById(...).map(...)` branches (`orElseThrow()`
  for a required return)

#### Scenario: Aggregate service
- **GIVEN** an aggregate service method with `@transition(from: ...)` and no id
- **WHEN** generated
- **THEN** the aggregate is obtained through a `TODO CUSTOM_REQUIRED` lookup
  that `orElseThrow()`s instead of `new Aggregate()`, and the transition check,
  command, to-state, save and events follow unchanged

#### Scenario: Planner and template agree
- **GIVEN** any of the method shapes above
- **WHEN** `ServiceMethodBodyPlanner.planEntityMethodBody` is evaluated
- **THEN** it returns the new body case that matches the branch the template
  renders

#### Scenario: Methods with an id are unchanged
- **GIVEN** any transition method with an `id`
- **WHEN** generated
- **THEN** the output is byte-identical to before this change
