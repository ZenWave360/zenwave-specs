# ZFL Language

<a id="zfl-language"></a>

**Status:** 2026-11-05: 7 proposed, 1 exists. Written from the owner's rule for [BUG/2](../work/bugs/bug-2-zfl-on-ends-the-command.md).

## Purpose

Record what ZFL text means, where the meaning is not obvious from the grammar, so that the parser, the validator, the diagrams and the user guide agree. The user guide is `ZenWave360.github.io/src/content/docs/ZenWave360/ZFL-Flow-Language.mdx`.

## Rules

<a id="zfl-r1"></a>
### ZFL-R1 (proposed). An `on` that answers ends the command

Inside a `when … do` block, an `on` line handles a response of the `call` before it. `on X response Y`, `on X emits Y` and `on X emits response Y` are exits: they end the command, as a `return` does. `on X call Z` chains instead: the `on` lines after it handle the responses of `Z`. A response that no `on` handles is the happy path, and the command goes on to the next line.

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
