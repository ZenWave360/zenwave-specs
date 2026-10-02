# 003 — Design

## 1. Validator (dsl-kotlin)

`ZdlModelValidator.validateServiceMethodTransition`
(`src/commonMain/kotlin/io/zenwave360/language/zdl/internal/ZdlModelValidator.kt`)
currently has rule 1:

```kotlin
if (fromStates != null && paramId != "id") {
    model.addProblem("$mPath.options.transition.value.from", null,
        "state transitions require an id parameter")
    return
}
```

Delete rule 1 and renumber the KDoc. Rules 2–4 (target entity, `@lifecycle`,
valid states) are unchanged. They also run for `from` transitions without an
`id`, which they could not before because of the early `return`.

Tests: `src/commonTest/.../e2e/ZdlValidationE2ETest.kt` expects the message as
the first problem. Remove it from the expected list. Change the fixture method
that triggered it so that it now proves an id-less `from` transition validates
cleanly, rather than just deleting the method.

## 2. LSP (zenwave-lsp)

`lsp-core/src/commonTest/kotlin/io/zenwave360/lsp/core/ZdlLanguageModuleTest.kt`
asserts exactly one diagnostic with that message, for
`@transition(from: RESERVED) releaseStock(ReserveStockInput)`. Turn it into a
test that the same model produces **no** diagnostics.

`settings.gradle.kts` substitutes `../dsl-kotlin` as an included build, so the
test sees the new validator without a publish.

## 3. SDK listeners (zenwave-sdk)

The binding is classified in
`zenwave-sdk-cli/src/main/java/io/zenwave360/sdk/zdl/utils/ZDLListenerUtils.java`
`classifyBinding(...)`. Today `simpleShape` requires `paramId == null`, so every
method with an id becomes `MODE_CUSTOM` (the template throws
`UnsupportedOperationException`).

New classification. `paramId` present no longer disqualifies a binding by
itself:

| Service method shape | Mode | Generated call |
|---|---|---|
| `(Input)`, Input a bean | `MAPPER` (unchanged) | `svc.m(mapper.asInput(event))` |
| `(id, Input)`, Input a bean | `MAPPER` + `idPlaceholder` | `svc.m(id, mapper.asInput(event))` |
| `(id)` | `ID_ONLY` (new) or `MAPPER` with no mapper method; pick whichever keeps the template simpler | `svc.m(id)` |
| anything else (paginated, array, inline/enum input, no bean) | `CUSTOM` (unchanged) | throws |

For `idPlaceholder`, the binding carries:

- `idPlaceholder: true`
- `idParamName`: `method.paramId` (normally `"id"`)
- `idJavaType`: the Java type used for that parameter in the generated service
  interface. Reuse the helper that renders the service method signature; do not
  invent a second id-type resolution.

Java template (`plugins/backend-application-default/.../adapters/events/EventListeners.java.hbs`):

```java
@ApplicationModuleListener
public void onPaymentDeclined(PaymentDeclined event) {
    // TODO CUSTOM_REQUIRED: resolve the {{entity}} id for PaymentDeclined (no event field carries it)
    Long id = null;
    inventoryService.releaseStock(id, mapper.asReleaseStockInput(event));
}
```

Kotlin template (`plugins/customizations/kotlin-backend-application/.../EventListeners.kt.hbs`):
the service parameter is non-null, so use
`val id: <Type> = TODO("CUSTOM_REQUIRED: resolve the id for PaymentDeclined")`.
It compiles, and fails loudly if it's left unfinished. If the Kotlin generator
already has another convention for unfinished listener bodies, follow that one
instead.

The mapper interface is unchanged: the `asXxxInput(event)` method is emitted as
for `(Input)` methods.

`zenwave-sdk/docs/zdl-listener-asyncapi-final-synthesis.md` line ~128 lists
"ids" under `CUSTOM_REQUIRED`. Update it to describe the placeholder.

## 4. SDK service bodies for transitions without an id (zenwave-sdk)

With rule 1 gone, the model can declare, for example:

```zdl
@transition(from: [RESERVED, CONFIRMED], to: RELEASED)
releaseStock(ReleaseStockInput) StockReservation[] withEvents StockReleased
```

Today's templates mis-handle this:

- **Entity services**: `partials/shared/entities-methodBody.hbs` and its mirror
  `plugins/support/ServiceMethodBodyPlanner.java` fall into the `ENTITY_LIST`
  case, which returns `repository.findAll()` and silently releases *every*
  reservation.
- **Aggregate services**: `partials/shared/aggregates-commands-methodBody.hbs`
  has no `paramId`, so it does `new Aggregate()` and then runs the from-state
  check on a fresh root. That throws `InvalidStateTransitionException` at
  runtime.

New case, **ahead of** the list/query/new-instance cases in both the template
and the planner: *has entity (or aggregate) + `transition.from` + no `paramId`*.

Entity service, array return:

```java
// TODO CUSTOM_REQUIRED: load the StockReservation(s) this transition applies to, e.g. by input.getOrderId()
List<StockReservation> stockReservations = List.of();
stockReservations.forEach(existing -> {
    StockReservationTransitions.releaseStock(existing);          // from-check
    inventoryServiceMapper.update(existing, input);              // when there is an input
    existing.setStatus(ReservationStatus.RELEASED);              // when there is a to-state
});
stockReservations = stockReservationRepository.saveAll(stockReservations);
// ...withEvents partial...
return <mapped as the other branches do>;
```

For a single or `Optional` return, do the same with one
`Optional<Entity> x = Optional.empty(); // TODO CUSTOM_REQUIRED: ...` and the
same `.map(...)` chain the existing lifecycle branches use. Aggregate service:
replace `new Aggregate()` with a `TODO CUSTOM_REQUIRED` lookup that
`orElseThrow()`s. Everything after it (transition check, command, to-state,
save, events) stays as it is.

Whatever form the template takes, the generated code must **compile**, and the
only thing left for the developer is the lookup marked `TODO CUSTOM_REQUIRED`.
Apply this to the `jpa` and `mongodb` partials wherever they don't delegate to
`shared/`, and to the Kotlin plugin's partials.

`MethodBodyCase` gets new enum values for the added cases. Keep the planner and
the template in lock-step; there are tests that compare them.

## 5. Arcadia (consumer)

`arcadia-editions-modulith-api/catalog-inventory-domain-model.zdl`:

```zdl
input ReleaseStockInput {
    orderId String required
    reason StockReleaseReason required
}
...
releaseStock(ReleaseStockInput) StockReservation[] withEvents StockReleased
```

The three payments listeners then become plain `MAPPER` bindings (`orderId` is
mapped from the event by name). The `@timer` binding is unaffected.

Regenerate `arcadia-editions-modulith-service` (Java) and
`arcadia-editions-modulith-service-kotlin`. Follow
`arcadia-editions-architecture/skills/arcadia-zenwave-overlay.md` for the
regeneration commands and pitfalls (`--force` overwrites tests). In
`InventoryServiceImpl.releaseStock`, replace the generated lookup `TODO` with
`stockReservationRepository.findByOrderId(input.getOrderId())`, adding the
repository method if it's missing.

## Rejected alternatives

- **`@listener(..., id: <eventField>)`**: in every current case the event
  doesn't carry the target id (e.g. `FulfillmentScheduled` has `orderId`, not
  `paymentId`), so the option would only restate the `TODO` in the model.
  Can be added later without breaking anything.
- **`{entity}Id` naming convention**: silently wrong for correlation keys, as
  with `releaseStock`, where `stockReservationId` doesn't exist and the real key
  is `orderId`.

## Open question (not in tasks)

`confirmStockReservation(id) StockReservation[]` is called through
`@calls(... InventoryService.confirmStockReservation)` from `confirmOrder`. It
has the same shape: its `id` is really an `orderId`. Remodeling it the same way
is a modeling decision for the Arcadia owner; this change doesn't touch it.
