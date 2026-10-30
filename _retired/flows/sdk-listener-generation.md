# SDK Listener Generation

<a id="sdk-listener-generation"></a>

**Status:** proposed (change 003-listener-id-placeholder, never archived; see work/003-listener-id-placeholder/tasks.md for what is done). Migrated from OpenSpec change 003-listener-id-placeholder on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

What the SDK generates for a `@listener` binding whose target service method
takes an `id`.

## Rules

<a id="slg-r1"></a>
### SLG-R1. Listeners delegate to id-taking methods with a marked placeholder

When a `@listener` targets a service method with an `id` parameter and at most
one bean input, the generated listener SHALL compile, SHALL map the event to the
input exactly as it would for a method without an id, and SHALL pass the id
from a local placeholder marked `TODO CUSTOM_REQUIRED` that names the event.

**Examples**

- *(id, Input) in Java.* Given `@listener(zdl: PaymentsProcessingZdl, event: FulfillmentScheduled) capturePayment(id, CapturePaymentInput) Payment`, when the Spring Modulith Java backend is generated, then `onFulfillmentScheduled` declares the id with the service signature's id type, initialised to `null`, preceded by a `// TODO CUSTOM_REQUIRED` comment naming `FulfillmentScheduled`, and it calls `paymentsProcessingService.capturePayment(id, mapper.asCapturePaymentInput(event))`, and the listener mapper declares `asCapturePaymentInput(FulfillmentScheduled)`, and the generated project compiles.
- *(id) only.* Given a listened-to method `confirmOrder(id) Order`, when the backend is generated, then the listener calls `ordersService.confirmOrder(id)` with the same placeholder, and no mapper method is emitted for it.
- *Kotlin.* Given either shape above, when the Kotlin backend is generated, then the id is declared non-null and initialised with `TODO("CUSTOM_REQUIRED: ...")` naming the event (or the Kotlin generator's existing convention for unfinished bodies), and the project compiles.
- *Unsupported shapes keep today's behaviour.* Given a listened-to method that is paginated, takes an array, or takes a non-bean input, with or without an id, when the backend is generated, then the listener is still the `CUSTOM_REQUIRED` body that throws `UnsupportedOperationException`.
- *Methods without an id are unchanged.* Given a listened-to method `(Input)` with a bean input, when the backend is generated, then the output is byte-identical to before this change.

