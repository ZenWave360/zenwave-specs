## Purpose

What the SDK generates for a `@listener` binding whose target service method
takes an `id`.

## ADDED Requirements

### Requirement: Listeners delegate to id-taking methods with a marked placeholder
When a `@listener` targets a service method with an `id` parameter and at most
one bean input, the generated listener SHALL compile, SHALL map the event to the
input exactly as it would for a method without an id, and SHALL pass the id
from a local placeholder marked `TODO CUSTOM_REQUIRED` that names the event.

#### Scenario: (id, Input) in Java
- **GIVEN** `@listener(zdl: PaymentsProcessingZdl, event: FulfillmentScheduled) capturePayment(id, CapturePaymentInput) Payment`
- **WHEN** the Spring Modulith Java backend is generated
- **THEN** `onFulfillmentScheduled` declares the id with the service
  signature's id type, initialised to `null`, preceded by a
  `// TODO CUSTOM_REQUIRED` comment naming `FulfillmentScheduled`
- **AND** it calls `paymentsProcessingService.capturePayment(id, mapper.asCapturePaymentInput(event))`
- **AND** the listener mapper declares `asCapturePaymentInput(FulfillmentScheduled)`
- **AND** the generated project compiles

#### Scenario: (id) only
- **GIVEN** a listened-to method `confirmOrder(id) Order`
- **WHEN** the backend is generated
- **THEN** the listener calls `ordersService.confirmOrder(id)` with the same
  placeholder, and no mapper method is emitted for it

#### Scenario: Kotlin
- **GIVEN** either shape above
- **WHEN** the Kotlin backend is generated
- **THEN** the id is declared non-null and initialised with
  `TODO("CUSTOM_REQUIRED: ...")` naming the event (or the Kotlin generator's
  existing convention for unfinished bodies), and the project compiles

#### Scenario: Unsupported shapes keep today's behaviour
- **GIVEN** a listened-to method that is paginated, takes an array, or takes a
  non-bean input, with or without an id
- **WHEN** the backend is generated
- **THEN** the listener is still the `CUSTOM_REQUIRED` body that throws
  `UnsupportedOperationException`

#### Scenario: Methods without an id are unchanged
- **GIVEN** a listened-to method `(Input)` with a bean input
- **WHEN** the backend is generated
- **THEN** the output is byte-identical to before this change
