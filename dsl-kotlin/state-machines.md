# State machines and multi-file linting (experimental)

<a id="state-machines"></a>

**Status:** experimental, decided by the owner 2026-11-22 ([backlog FV](../work/backlog.md), decisions FV-D1 to FV-D7). Like [ZFL-X1 to ZFL-X4](zfl-language.md#zfl-x1), these rules may change or be rolled back, and the user docs do not describe them. Goal: move a flow and its ZDLs towards formal verification. Export to TLA+ or an explorer is later work.

## Vocabulary

| Term | Meaning |
| --- | --- |
| **Lifecycle** | An aggregate's `@lifecycle(field: status, initial: S)`: the states are the values of that field's enum |
| **Transition** | A service method's `@transition(from: …, to: …)`; with no `from` it creates the aggregate |
| **Walk** | Following one variant of a flow ([EF-R25](../flows/eventflow.md#ef-r25)) step by step, applying the transition of each command run on a view member ([ZFL-X1](zfl-language.md#zfl-x1)) |
| **At rest** | The point of a walk where the instance has no pending step for its key ([ZFL-X3](zfl-language.md#zfl-x3)) |

## Multi-file linting

<a id="fv-r1"></a>
### FV-R1 (experimental). The server lints a flow against its ZDLs, and every finding is a warning

The server runs the cross-file checks of [ZFL-X4](zfl-language.md#zfl-x4) on a ZFL, against the winning ZDL of each system ([NAV-R9](../zenwave-lsp/navigation-spec.md#nav-r9)). It adds the checks navigation already resolves: a command, event or service the flow uses that the winning ZDL lacks; a command whose ZDL method has no `@transition` while it runs on a view member with a lifecycle; an event the flow says a command emits that the method does not declare in `withEvents`. Findings are warnings on the ZFL, at the name that fails. A system whose ZDL cannot be read is the existing `zfl.zdl-not-found` warning, and its checks are skipped.

<a id="fv-r2"></a>
### FV-R2 (experimental). A ZDL change re-lints the open flows that link it

When a ZDL opens, changes or closes, the server lints again every open ZFL whose winning ZDL it is, using the link tracking it already keeps. Closed flows are not linted. *Example:* removing `event PaymentVoided` from `payments.zdl` puts a warning on `place-order-flow.zfl`, if it is open, without editing the flow.

## One aggregate's state machine

<a id="fv-r3"></a>
### FV-R3 (experimental). A lifecycle is checked on its own, from the ZDL

For each aggregate with `@lifecycle`, warnings on the ZDL when: the field or its enum does not exist; `initial` is not a value of the enum; a transition's `from` or `to` is not a value of the enum; a state cannot be reached from `initial` through the transitions; a state that is not terminal by intent has no way out (a state with no outgoing transition is reported as an information, *terminal*, not a warning); two transitions of the same method leave the same state. *Example:* `Fulfillment` with `CANCELLED` in no `to` is "state CANCELLED cannot be reached from SCHEDULED".

<a id="fv-r4"></a>
### FV-R4 (experimental). Each variant of a flow is walked over the lifecycles of its view

For a flow with a view, every variant is walked. Each view member starts as *none*; a creating transition makes it its `to`; a command run on a member applies the transition whose `from` holds the member's current state. Warnings on the ZFL, at the command or the `end` line, when:
- a command runs on a member in a state none of its transitions leaves ("authorizePayment runs on Payment in CAPTURED; it leaves only PENDING");
- at rest, a member is not in a state the `end` line expects ([ZFL-X3](zfl-language.md#zfl-x3));
- a member with `[]` ([ZFL-X1](zfl-language.md#zfl-x1)) is checked for every instance, and `none` means no instance exists.

Commands outside the flow that change a member are ignored. Each warning names the variant (its [EF-R20](../flows/eventflow.md#ef-r20) title) so the path can be found.

<a id="fv-r5"></a>
### FV-R5 (experimental). An armed timer may fire before any later step

While a timer ([ZFL-X2](zfl-language.md#zfl-x2)) is armed and not disarmed, the walk also explores the timer firing before each later step of the variant, as extra walks. The number of extra walks per variant is bounded, and the walk says when it stopped at the bound. *Example:* in Arcadia, `expireReservation` firing after `authorizePayment` but before `captureStock` shows whether the order can end CANCELLED with a CAPTURED payment.

<a id="fv-r6"></a>
### FV-R6 (experimental). The checks live in dsl-kotlin, the server shows them

FV-R3 to FV-R5 and the ZFL-X linters are in `dsl-kotlin` (common code, JVM and JS), taking the parsed ZFL and the ZDLs the caller supplies. The server calls them, publishes the warnings ([FV-R1](#fv-r1)), and answers a request with the walk of a flow for the visual rules below.

## Showing it, on top of Problems

<a id="fv-r7"></a>
### FV-R7 (experimental). A state machine diagram shows one aggregate and its problems

The ZDL Diagrams *state machines* kind ([MP-R25](../zenwave-platform-vscode/model-preview.md#mp-r25)) draws an aggregate's lifecycle as a Mermaid `stateDiagram-v2`: transitions labelled with their command, the initial state from `[*]`, terminal states to `[*]`, unreachable states dashed, faulty transitions in red; the FV-R3 findings for that aggregate are listed under the diagram. It is shown on demand, from the preview.

<a id="fv-r8"></a>
### FV-R8 (experimental). The variant tree marks failing paths

In the EventFlow variant dropdown and the Sequence Diagrams selector ([EF-R25](../flows/eventflow.md#ef-r25), [MP-R36](../zenwave-platform-vscode/model-preview.md#mp-r36)), a leaf whose walk has an FV-R4 or FV-R5 finding ends with ✗, and a line with children shows how many of its variants fail, e.g. `authorized (14, 3 ✗)`. The tooltip lists the findings.

<a id="fv-r9"></a>
### FV-R9 (experimental). Inlay hints on `end` lines show what each member reaches

On each `end` line with expected states, an inlay hint per member shows the states the walks reach at rest: `Payment: VOIDED ✓`, or `Payment: expected CAPTURED, reaches VOIDED ✗ (2 variants)`. Hovering it lists the failing variants.

## Not now

Per flow, the state diagram of each view member with the chosen variant's path highlighted (FV-D6 2). Export to TLA+ or an explorer (FV-D3 c). Linting closed flows (FV-D2).
