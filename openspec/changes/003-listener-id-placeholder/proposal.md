# 003 — Transitions without an id, and an id placeholder in listeners

## Why

Arcadia's modulith has `InventoryService.releaseStock`, which releases every
`StockReservation` of an order when payment is declined, retries run out, or the
payment is voided:

```zdl
@listener(zdl: PaymentsProcessingZdl, event: PaymentDeclined)
@listener(zdl: PaymentsProcessingZdl, event: PaymentRetryExhausted)
@listener(zdl: PaymentsProcessingZdl, event: PaymentVoided)
@transition(from: [RESERVED, CONFIRMED], to: RELEASED)
releaseStock(id, ReleaseStockInput) StockReservation[] withEvents StockReleased
```

The `id` is there only because the ZDL validator rejects a `from` transition
without one ("state transitions require an id parameter"). But the operation
does not act on a single reservation identified by its aggregate id. It acts on
the reservations **correlated** with an order, and the key is `orderId`, which
every triggering event already carries. The rule made the model say something
false, and the generated listener could not fill in the `id`: it declared
`CUSTOM_REQUIRED` and threw `UnsupportedOperationException`, and the developer
hand-edited it to `releaseStock(null, mapper.asReleaseStockInput(event))`.

Two things are wrong here:

1. **The validator conflates "checks a current state" with "is addressed by
   aggregate id".** A transition needs *some* way to find the entities it
   applies to; that way does not have to be the `id` parameter.
2. **Listeners give up on any method that takes an `id`.** When a method
   legitimately takes an id, as with `capturePayment(id, CapturePaymentInput)`
   triggered by `FulfillmentScheduled`, the event rarely carries that exact id.
   Usually a lookup through a correlation key is needed, and only the developer
   knows it. The generator can still map everything else and leave exactly one,
   clearly marked, hole.

An `@listener(..., id: <field>)` option was considered and rejected (see
`design.md`): in the cases found, the event does not carry the id, so the
option would just move the `TODO` into the model.

## What changes

- ZDL validation: a `@transition` with `from` states no longer requires an `id`
  parameter. The other transition rules (target entity resolution, `@lifecycle`
  present, valid state values) stay.
- SDK listeners (`@listener`, Spring Modulith `EventListeners`, Java and
  Kotlin): a method shaped `(id, Input)` or `(id)` is generated as a compiling
  delegation. The input is mapped as today, and `id` is a typed local set to
  `null` (Java), or `TODO(...)` (Kotlin), with a `TODO CUSTOM_REQUIRED` comment
  naming the event.
- SDK service implementation: a `from` transition without an `id` gets a body
  that stubs the lookup with a `TODO`, then applies the from-check, input
  update, to-state, save and events to what the lookup returned. It no longer
  falls into `findAll()` (entity services) or into `new Aggregate()` (aggregate
  services), both of which would be wrong at runtime.
- Arcadia: `releaseStock(ReleaseStockInput)` with `orderId` back in the input.

## Non-goals

- No change to the `@listener` / `@asyncapi` / `@timer` annotation syntax.
- No automatic id extraction by naming convention.
- AsyncAPI consumer adapters (`BackendApplicationAsyncApiAdaptersGenerator`)
  have the same `paramId == null` guard. Aligning them is listed as an optional
  task, not a requirement of this change.
