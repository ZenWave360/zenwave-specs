# Transitions without an id

<a id="transitions-without-id"></a>

A state transition no longer has to take an `id`. The key that locates the entities it
applies to can arrive in the input, as a correlation key such as `orderId`. And when a
listened-to service method does take an `id`, the generated listener compiles and leaves the
mapping to the developer instead of giving up.

**Status:** exists, 2026-10-30. Checked: `ZDLListenerUtils.java` has `MODE_ID_ONLY` and
`idPlaceholder`, and the validator no longer contains the old message. The two Arcadia services
regenerated against it; their test suites were not green independently of this change, and the
owner waived that check.

## Who owns what

| Piece | Repository |
| --- | --- |
| The validator rule | `dsl-kotlin`, `ZdlModelValidator` |
| Listener classification and templates | `zenwave-sdk`, `ZDLListenerUtils`, `EventListeners.*.hbs` |
| Service method bodies | `zenwave-sdk`, `ServiceMethodBodyPlanner` and the `*-methodBody.hbs` partials, kept in lock-step by tests |
| The consumer that found this | `arcadia-editions`, `releaseStock` |

## Validation

<a id="zdl-validation"></a>
<a id="zv-r1"></a>
**ZV-R1 (superseded by ZV-R2). A transition with from-states requires an id parameter.** *Why
it went:* a `from` transition needs some way to find the entities it applies to, not necessarily
the aggregate id. The rule forced models to declare an `id` that nothing could supply. Models
that declare `(id, ...)` stay valid.

<a id="zv-r2"></a>
**ZV-R2 (exists). A from-transition may omit the id parameter.** The validator accepts a service
method whose `@transition` declares `from` states with no `id` parameter, and still applies the
other transition rules. Example:
`@transition(from: [RESERVED, CONFIRMED], to: RELEASED) releaseStock(ReleaseStockInput) StockReservation[]`
validates cleanly, while a `from` naming a state not in the lifecycle enum still reports
"`<STATE>` is not a valid state value".

## Generated listeners

<a id="sdk-listener-generation"></a>
<a id="slg-r1"></a>
**SLG-R1 (exists). Listeners delegate to id-taking methods with a marked placeholder.** When a
`@listener` targets a service method with an `id` and at most one bean input, the listener
compiles, maps the event to the input exactly as it would without an id, and passes the id from a
local placeholder marked `TODO CUSTOM_REQUIRED` naming the event.

| Service method | Generated |
| --- | --- |
| `(Input)`, a bean | `svc.m(mapper.asInput(event))`, byte-identical to before |
| `(id, Input)`, a bean | `svc.m(id, mapper.asInput(event))`, with the placeholder |
| `(id)` | `svc.m(id)`, with the placeholder and no mapper method |
| paginated, array, non-bean input | the `CUSTOM_REQUIRED` body that throws, as before |

In Java the id is declared with the type from the service signature, initialised to `null`. In
Kotlin it is non-null, initialised with `TODO("CUSTOM_REQUIRED: ...")`, which compiles and fails
loudly if left unfinished.

## Generated service bodies

<a id="sdk-service-transitions"></a>
<a id="sst-r1"></a>
**SST-R1 (exists). A from-transition without an id generates a lookup stub, never a guess.** The
implementation declares the entities through a lookup marked `TODO CUSTOM_REQUIRED`, and applies
the from-state check, the input update, the to-state, persistence and the declared events to
exactly those. It does not load all entities and does not operate on a new instance. *Why:* before
this, entity services fell into the list case and silently released every reservation, and
aggregate services ran the check on a fresh root and threw at run time.

```java
// TODO CUSTOM_REQUIRED: load the StockReservation(s) this transition applies to, e.g. by input.getOrderId()
List<StockReservation> stockReservations = List.of();
stockReservations.forEach(existing -> {
    StockReservationTransitions.releaseStock(existing);          // from-check
    inventoryServiceMapper.update(existing, input);              // when there is an input
    existing.setStatus(ReservationStatus.RELEASED);              // when there is a to-state
});
```

A single or `Optional` return uses `Optional.empty()` and the existing `.map(...)` shape. An
aggregate service uses a lookup that `orElseThrow()`s instead of `new Aggregate()`. Methods with an
id are byte-identical to before.

## Rejected

- **`@listener(..., id: <eventField>)`.** In every current case the event does not carry the target
  id, so the option would only restate the `TODO` in the model. It can be added later.
- **A `{entity}Id` naming convention.** Silently wrong for correlation keys: for `releaseStock`,
  `stockReservationId` does not exist and the real key is `orderId`.

## Open questions

<a id="twi-q1"></a>
**TWI-Q1. `confirmStockReservation(id)`.** Called through `@calls(...)` from `confirmOrder`, it has
the same shape: its `id` is really an `orderId`. Remodelling it is a decision for the Arcadia owner.

<a id="twi-q2"></a>
**TWI-Q2. AsyncAPI adapters.** `BackendApplicationAsyncApiAdaptersGenerator.planOperation` still requires
`paramId == null`. Applying the same classification is optional and was skipped (task 003/3.6).

## Sources

`zenwave-sdk` and `dsl-kotlin` as named above; the change's proposal, design and tasks in git history.
