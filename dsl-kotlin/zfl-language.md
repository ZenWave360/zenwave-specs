# ZFL Language

<a id="zfl-language"></a>

**Status:** 2026-11-05: 7 proposed, 1 exists. 2026-11-18: ZFL-R11 and ZFL-R12 (`rules`) added, proposed. Written from the owner's rule for [BUG/2](../work/bugs/bug-2-zfl-on-ends-the-command.md).

## Purpose

Record what ZFL text means, where the meaning is not obvious from the grammar, so that the parser, the validator, the diagrams and the user guide agree. The user guide is `ZenWave360.github.io/src/content/docs/ZenWave360/ZFL-Flow-Language.mdx`.

## Rules

<a id="zfl-r1"></a>
### ZFL-R1 (proposed). An `on` that answers ends the command

Inside a `when … do` block, an `on` line handles a response of the `call` before it. `on X response Y`, `on X emits Y` and `on X emits response Y` are exits: they end the command, as a `return` does. An `on X emits Y` is also an exit of the command that emits `Y`, so the EventFlow graph draws a command → event `Y` edge for it, with the response `X` as the outcome, even when the command has no `emits Y` line of its own ([EF-R19](../flows/eventflow.md#ef-r19)). `on X call Z` chains instead: the `on` lines after it handle the responses of `Z`. A response that no `on` handles is the happy path, and the command goes on to the next line.

It reads as plain language: "call getBookingTerms; if the slot cannot be booked, answer SlotNotBookable". Nobody reads that as going on after the answer.

**Examples**

- *An early exit.* Given `call getBookingTerms` followed by `on SlotNotBookable response SlotNotBookable`, when `getBookingTerms` answers `SlotNotBookable`, then the command answers `SlotNotBookable` and ends; `call checkBookingHolder` does not run.
- *The happy path.* Given the same block, when `getBookingTerms` answers `BookingTermsResult`, which no `on` handles, then the command goes on to `call checkBookingHolder`.
- *A chain.* Given `on X call Z` followed by `on W response V`, then `W` is a response of `Z`, not of the call before `X`.

<a id="zfl-r2"></a>
### ZFL-R2 (proposed). One `on` can handle several responses

`on` takes a list of events, so responses that lead to the same exit share one line: `on SlotNotBookable, HolderNotEligible response BookingRejected`. Annotations before `on` apply to it, so `@outcome("holder-rejected")` names an early exit. Grammar: `flow_do_on: annotations ON flow_event_list (CALL flow_command_name | flow_signal_body);`.

<a id="zfl-r3"></a>
### ZFL-R3 (proposed). The editor shows which call an `on` belongs to

It is an error when an event in an `on` is not a declared response of the `call` it follows: `SlotNotBookable` must be a `response` of `do getBookingTerms`. It is a warning when the `on` lines after a call handle every response it declares and lines follow them, because those lines cannot run.

<a id="zfl-r4"></a>
### ZFL-R4 (proposed). Exits are marked in the model, and diagrams draw them as exits

The parser marks the steps of an `on` that answers with `terminal: true`. The flowchart, the sequence diagrams and the EventFlow view draw them as an exit of the block, not as one more step. See [BUG/1](../work/bugs/bug-1-zfl-flowchart-starts-skip-policy.md), defect 4.

**Example**

```zfl
when RequestBooking, RequestAssistedBooking do bookSlot {
    service Bookings.BookingService

    call getBookingTerms
    on SlotNotBookable response SlotNotBookable

    call checkBookingHolder
    @outcome("holder-rejected")
    on SlotNotBookable, HolderNotEligible response BookingRejected

    @outcome(confirmed)
    emits response BookingConfirmed
    @outcome("policy-violated")
    response BookingRejected
    @outcome("slot-full")
    response SlotFull
}
```

<a id="zfl-r5"></a>
### ZFL-R5 (exists). A policy can carry a title, an actor or a timer

A `when X do Y` takes the annotations that `start` takes, read the same way:

- `@title("…")`: the text drawn for the policy everywhere it is drawn (the EventFlow, the flowchart, the sequence diagrams, Model Docs). Without it, the policy is drawn as today.
- `@actor(Name)`: a person acts on the event. This is how a step reads when someone does something after the event, rather than the system reacting on its own.
- `@timer("…")`, or `@time("…")` as on `start`: the policy runs when the time comes, not immediately.

A policy has at most one of `@actor` and `@timer`/`@time`, and each annotation at most once. The analyser reports a second one as it does for `start`. The owner asked for it on 2026-11-05 (PX/10.5).

**Example**

```zfl
/** The facility staff note that they have called that person. */
@actor(FacilityStaff)
@title("Staff call the guest")
when PendingGuestCallRecorded do recordGuestCall {
    service Bookings.SlotBlockService
    emits GuestCallCompleted
}
```

<a id="zfl-r6"></a>
### ZFL-R6 (proposed). An action nothing triggers or calls is a warning

The analyser reports a warning, not an error, for a `do Y { … }` that no `when … do Y` triggers and no `call Y` or `on … call Y` calls, in its flow: "Action 'Y' is never triggered nor called." Such an action is valid. The visual editor leaves one behind when a policy loses its last trigger ([ZVE-R19](../flows/zfl-visual-editing.md#zve-r19)), and the warning is how the user sees it. Decided in [0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).

**Example**

```zfl
// warning: Action 'recordGuestCall' is never triggered nor called.
do recordGuestCall {
    service Bookings.SlotBlockService
    emits GuestCallCompleted
}
```

<a id="zfl-r7"></a>
### ZFL-R7 (proposed). A flow without a `completed` outcome is a warning

A flow with no `end` block, or with an `end` block that has no `completed` outcome, is valid, and the analyser reports a warning where it reported an error. An outcome that names an unknown event is still an error. `flow Booking { }` is therefore a valid, empty flow. Decided in [0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).

<a id="zfl-r8"></a>
### ZFL-R8 (proposed). A command without a service is a warning

A `when … do Y { … }` or `do Y { … }` without a `service` line is valid, and the analyser reports a warning where it reported an error. Diagrams draw such a command by its system or its name, as they already do. The owner holds that the service was always meant to be optional. Decided in [0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).

**Example**

```zfl
// warning: Action 'bookSlot' does not declare a service.
when RequestBooking do bookSlot {
    emits SlotBooked
}
```

<a id="zfl-r9"></a>
### ZFL-R9 (proposed). Two identical policies are an error

Two `when … do Y` blocks in the same flow with the same triggers, grouped the same way, the same command and the same condition (`@if`, or none) are an error on the second one. The text allows writing them, but they describe one policy twice. The visual editor never creates the second one ([ZVE-R26](../flows/zfl-visual-editing.md#zve-r26)). Policies that differ only by `@if` are distinct. Decided by the owner, 2026-11-06.

**Example**

```zfl
when SlotRequested do bookSlot
// error: Policy 'when SlotRequested do bookSlot' is already declared in flow 'Booking'.
when SlotRequested do bookSlot
```

<a id="zfl-r10"></a>
### ZFL-R10 (exists). The `for` before a service's aggregates is optional

A service header takes its aggregate list with or without the `for` keyword, in both languages. In ZDL the aggregates are still required: `service S for (A, B) {` and `service S (A, B) {` are both valid. In a ZFL `systems` block they were already optional: `service S for (A)`, `service S (A)` and `service S` are all valid. The `service` line inside a `do` is unchanged. The formatters keep the `for` when the source has it, leave it out when the source does not, and write one space between `for` and `(` ([formatter](formatter-spec.md#horizontal-spacing)).

**Example**

```zdl
service OrdersService for (CustomerOrder, Payment) {
}
service InventoryService (StockReservation) {
}
```

<a id="zfl-r11"></a>
### ZFL-R11 (proposed). Business rules are written in a `rules` block, in ZDL and in a ZFL flow

A `rules` block lists named business rules, each a name and a text value: `rules (Aggregate)? { name "text" … }`. The grammar is the one ZDL `policies` has today ([Zdl.g4](https://github.com/ZenWave360/dsl-kotlin/blob/develop/dsl-kotlin/src/commonMain/antlr/io.zenwave360.language.antlr/Zdl.g4) `policies`, `policie_body`): a rule name may contain `-`, and the value is a string, single-line or multi-line. Decided by the owner, 2026-11-18.

- **ZDL:** `rules` is a top-level block, as `policies` is. The aggregate in parentheses is optional and is not validated, as today. `policies` stays as a deprecated alias: it parses the same, and the server warns on the keyword with a quick fix that renames it to `rules`. Both keywords fill the same model object, under the `rules` key. Until zenwave-sdk reads `rules` ([RU/9](../work/backlog.md)), the model also exposes that object as `policies`, which the SDK reads today (`BackendApplicationDefaultHelpers.java:433`). The docs show only `rules`.
- **ZFL:** `rules` goes inside a `flow`, anywhere among `start`, `when`, `do` and `end`, and a flow may have several. The aggregate in parentheses is optional and, for now, is not validated against the flow's services. ZFL never had a `policies` keyword, so it has no alias.
- **Names:** in ZFL, `when … do …` is still called a policy in the code, the specs and EventFlow. A rule is a different thing: a statement of business logic, not a link between an event and a command. The [glossary](../architecture/glossary.md) says so.
- **Where they show:** the generated docs list a flow's rules on the flow page, and a ZDL's rules in the module page as policies are today; the editor gives highlighting, hover and outline in VS Code and IntelliJ.
- **Annotations:** a rule may carry annotations and a javadoc, as other ZDL elements do: `@invariant noBookingWithoutSeats "…"`. Annotations are free, like any `@option`; no fixed set of kinds. The model keeps them in `rules.<name>.options` and the javadoc in `rules.<name>.javadoc`. The generated docs and the hover show them; the Mermaid `%% rules:` comment does not. Decided by the owner, 2026-11-22 ([RU/10](../work/backlog.md)).

**Example**

```zfl
flow PlaceOrder {
  rules (Order) {
    minimumAmount "An order total must be at least 10 EUR"
    stock-first "Stock is reserved before payment is taken"
  }
  start PlaceOrderRequested { }
  when PlaceOrderRequested do placeOrder
}
```

<a id="zfl-r12"></a>
### ZFL-R12 (proposed). A command names the rules it applies with `@rules(…)`

A ZFL `when … do` or `do` block, and a ZDL service method, may carry `@rules(name, …)` listing the rules it applies. This is an annotation, so the grammar does not change. A name that has no rule in the same flow (ZFL) or file (ZDL) is a warning on that name. Hover on a name shows the rule's text, and go to definition opens it. The generated docs and the sequence diagrams list, for each command, the rules it applies; in a Mermaid diagram this is a `%%` comment, so the copied source carries it ([variant title comment](https://github.com/ZenWave360/dsl-kotlin/commit/b3c5ad9)). Decided by the owner, 2026-11-18.

In ZDL, the older method annotation `@policy(name)` is a deprecated alias of `@rules(name)`: it resolves the same way, and the server warns on it with a quick fix to `@rules`. zenwave-sdk reads `@policy` today (`BackendApplicationDefaultHelpers.java:432`); the docs show only `@rules`. Decided by the owner, 2026-11-20.

A rule name with `-` lexes as a different token from a plain identifier, so inside `@rules(…)` it is written quoted: `@rules(minimumAmount, "stock-first")`. Both forms resolve to the same rule.

**Example**

```zfl
@rules(minimumAmount, "stock-first")
when PlaceOrderRequested do placeOrder
```

## Experimental: instance view, timers and expected end states

These rules are **experimental** (owner, 2026-11-22). They are merged so they can be tried on real flows, but they may be changed or rolled back. The user docs do not describe them. Goal: a flow says which aggregates take part and how they correlate, its timers, and the expected state of each aggregate at each end, so it can be translated to a state model (TLA+ or an explorer) without inventing anything. Context: the formal-verification report on PlaceOrderFlow (ivangsa.com, sections 1.7, 1.10, C3, C4). Example: `arcadia-editions-architecture/business-flows/place-order-flow.experimental.zfl`.

<a id="zfl-x1"></a>
### ZFL-X1 (experimental). A flow may declare one instance view, as its first block

`view PlaceOrderView by Order.id { Order  StockReservation.orderId  Payment.orderId  Fulfillment.order.id  Notification[].orderId }`. `by` names the instance key: one instance per `Order`. Each member is an aggregate of the flow's `systems` with the path of a field that points to the key; the root (the one in `by`) has no path; `[]` means several instances per key; paths may be nested. An event correlates when it carries the key or a member's key; `<member>Id` resolves through `<Member>.id` and then the member's path. `start` fields are part of the instance context. `rules (PlaceOrderView) { … }` holds rules across the view's aggregates.

<a id="zfl-x2"></a>
### ZFL-X2 (experimental). A timer is a step of the flow

`timer after OrderCreated "10 minutes" unless PaymentAuthorized, PaymentDeclined do releaseStock` and `timer at Booking.endsAt unless BookingCancelled do completeBooking`. `after` arms it when the event is emitted (the duration is free text for now); `at` arms it at the instant a view field holds; `unless` disarms it when any of those events is emitted for the same instance. Firing and disarming are atomic. A timer's body is read as a `when` body. The old `@time("…")` is just an annotation and stays valid. Diagrams draw a timer as a timer policy: a ⏳ hexagon in the flowchart and a `Note over …: ⏳ …` in sequences; a `timer at …` has no arming event, so it appears in no sequence.

<a id="zfl-x3"></a>
### ZFL-X3 (experimental). An end outcome may state the expected state of each aggregate

`completed: OrderConfirmationSent, OrderConfirmationSkipped { Order: CONFIRMED, Payment: CAPTURED }`. A comma between events means "or". The same outcome name may appear on several lines with different events and states: it is still one outcome, with several variants of final states, and the diagrams are unchanged. Keys are view members; values are states of that aggregate's `@lifecycle`, `none` (does not exist) or a list `[A, B]` (any of them); an absent aggregate is not checked. The state is evaluated when the instance is at rest, not when the event is emitted.

<a id="zfl-x4"></a>
### ZFL-X4 (experimental). Two linters check them, and their findings are warnings

`view` and `timer` are keywords; `by`, `after`, `at` and `unless` are contextual words and stay usable as names; `none` is an identifier. A single-file linter checks what the ZFL alone can say (one view and first; root without path; members listed once; timer events and commands exist; end keys are view members; an event ends one outcome only; a failure event has a consumer or is an end). A cross-file linter also reads the ZDLs of `systems`, supplied by the caller (members and paths exist and match the key's type; every event correlates; `start` fields reach the commands that need them; `at` fields are dates or times; expected states belong to the lifecycle and some command reaches them). All findings are warnings. The editor shows the single-file ones; the cross-file linter is not wired into the server yet. Open, for the owner: a variant keyed by its end event cannot express two state variants for one event (Arcadia `orderCancelled`); the Arcadia expiry timer has no `unless`.
