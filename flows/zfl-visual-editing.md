# Bidirectional ZFL visual editing

<a id="zfl-visual-editing"></a>

A visual editor for valid ZFL flows, built as a reusable React component in the
vistas and embedded in VS Code. Text and canvas edit the same ZFL document.
Delivery is described in the [whiteboard plan](../roadmap/event-storming-whiteboard.md).

**Status:** proposed, 2026-10-31; amended 2026-11-05. The owner confirmed ZFL text
authority, valid models only, single-user VS Code use, and development as a
standalone web component. On 2026-11-05 the owner reviewed an outside architecture
brief against this document: its server-side execution matched what is here, and
its intent queue, retry and pending-feedback ideas became [ZVE-R14](#zve-r14) to
[ZVE-R18](#zve-r18). The same review settled deletion, starts, properties, layout
and the language relaxations in [decision 0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).
Other rules below are implementation proposals, not existing capabilities.
Here, standalone component means reusable React with a browser example; a
standards-based custom element is not assumed.

## Scope

The first release edits flows that already exist in a ZFL document
([ZVE-R25](#zve-r25)). Within one selected flow it adds, removes, renames and
connects starts, events, commands and policies, and edits their properties
([ZVE-R23](#zve-r23)). It supports text-to-canvas refresh, canvas-to-text edits,
native undo and explicit automatic layout. It runs in desktop and browser VS Code
and a standalone browser harness. Creating a flow from the canvas, free-form
workshop notes, incomplete models, simultaneous collaboration, cross-document
mutation, ZDL edits, architecture graph mutation and an editing API for CLI tools or
agents are outside this release.

## Ownership

| Repository | Owns |
| --- | --- |
| `dsl-kotlin` | Edit projection, source targets, operation validation, text edits, KMP layout and the ZFL diagnostics of [decision 0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md) |
| `zenwave-lsp` | Open-document transport, revision checks, re-preparation of stale intents, capability advertisement and diagnostics |
| `zenwave-architectural-vistas` | React editor, the three-column layout, intent queue, pending rendering, browser example and host adapter interface |
| `zenwave-platform-vscode` | Custom editor, guarded document edits, undo/save and embedding in both hosts |

Follow the [world model](../architecture/world-model.md),
[vistas boundary](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) and
[layout decision](../decisions/0001-layout-stays-on-the-server.md). The existing
[webview protocol](eventflow-webview-protocol.md) remains compatible for read-only
consumers; editing requires an explicitly advertised capability.

## Vocabulary

The **edit projection** is what KMP returns for one document revision: the flows,
their declarations, occurrences, relationship origins and allowed operations. An
**intent** is what the canvas sends: one user action, by identity, with the
revision it was made against. An **operation** is KMP's validated answer to an
intent: text edits, diagnostics and identity mappings, or a rejection. A
**revision** identifies one state of the open document. These words are in the
[glossary](../architecture/glossary.md). This document does not use "IR".

## What exists today

<a id="zve-t1"></a>
**ZVE-T1 (exists). The current view is a lossy projection.** Checked 2026-10-31
under `dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/`:
`eventflow/application/GenerateFlowViewFromZfl.kt:16` parses, analyzes, transforms
and lays out the source. `eventflow/view/ZflToFlowGraphTransformer.kt:90` elides
direct actor-start policies; `:294-301` derives node IDs from names and policy
triggers and edge IDs from endpoints. One map covers all flows; relationships are
deduplicated. Distinct retained edges can have the same endpoint-derived ID.

<a id="zve-t2"></a>
**ZVE-T2 (exists). Richer source information does not reach the view.** Checked
2026-10-31 in that tree: `zfl/internal/ZflListenerImpl.kt:186-240` retains trigger
groups while `zfl/semantic/ZflPolicy.kt` exposes a flat list. Command occurrences
retained by `ZflSemanticAnalyzer` are not individually projected by the flow graph.
Policy descriptions, compensation and full ordered command bodies cannot be
recovered from `FlowViewModel`.

<a id="zve-t3"></a>
**ZVE-T3 (exists). Source references and renderer callbacks are not an edit API.**
Checked 2026-10-31: `dsl-kotlin/.../language/source/SourceRef.kt:11` has file, line
and column without end range or revision. The ZFL formatter formats input tokens,
not a graph. In `zenwave-architectural-vistas/packages/eventflow/src/`,
`EventFlowVisualizer.tsx:608` supports dragging but sets `nodesConnectable={false}`.
Its package uses `reactflow` 11. These are source inspections, not runtime tests.

<a id="zve-t4"></a>
**ZVE-T4 (exists). ZFL already has a policy-less action block.** Checked 2026-11-05
in `dsl-kotlin/src/commonMain/antlr/io.zenwave360.language.antlr/Zfl.g4:174-181`:
`when X do Y` takes an optional body, and without one it refers to an action declared
elsewhere; `do Y { … }` is an action with a required body, invoked by `call Y`. In
`zfl/semantic/ZflSemanticAnalyzer.kt`, a missing `completed` end outcome (`:549`)
and a missing service (`:320`) are errors, and nothing reports a `do` that is never
called or a `start` without a policy. An end outcome must name an emitted event or a
response, not a start (`:157`). A document without flows is valid (`Zfl.g4:105`).
No production code in `zenwave-lsp`, the vistas or `zenwave-sdk` depends on
`completed` or on a command's service; the views fall back to the system or the
command name.

## Rules

<a id="zve-r1"></a>
**ZVE-R1 (proposed). ZFL text is authoritative.** Both views use the current open
document, including unsaved edits. The canvas sends intents and receives a fresh
projection after text changes. Saving React Flow state does not save the model.
A standalone host owns an equivalent text document and revision counter. There is
no client-side copy of the model that the canvas edits and later synchronizes, and
no *Apply Changes* step.

<a id="zve-r2"></a>
**ZVE-R2 (proposed). Language semantics stay in KMP.** `dsl-kotlin` resolves and
validates operations over original source. React, LSP and IDE adapters do not infer
ZFL from labels or serialize the display graph back into text, and the page never
replays intents over a projection to predict the next one. Keep read-only
view contracts compatible; provide editing metadata in a versioned companion
projection or explicitly versioned extension, selected before implementation.

<a id="zve-r3"></a>
**ZVE-R3 (proposed). Editable targets are unambiguous.** The projection identifies
revision, flow, declarations, occurrences, relationship origins and allowed
operations. Visual IDs, source targets and architectural identities are separate.
Equal names in different flows never share targets. Parallel edges and policies
with different conditions remain distinguishable. Identity mappings preserve
selection and placement after rename. Source coordinates and list indexes alone
are not persistent visual IDs.

<a id="zve-r4"></a>
**ZVE-R4 (proposed). Changes are atomic and revision checked.** An intent carries
an operation ID, expected document revision, targets and explicit values. KMP
validates candidate text and returns non-overlapping text edits, diagnostics and
identity mappings; it does not mutate the document. The host applies the complete
result only if the revision still matches. When it does not, [ZVE-R15](#zve-r15)
decides. Invalid, stale and unsupported results leave text unchanged and explain
why ([ZVE-R16](#zve-r16)). Retrying an operation cannot insert it twice.
Older asynchronous projections never replace newer ones.

<a id="zve-r5"></a>
**ZVE-R5 (proposed). Accepted operations leave valid ZFL.** Valid means no syntax
errors or error-severity ZFL semantic diagnostics; warnings are displayed. A missing
`completed` end outcome, a command without a service and an action that nothing
triggers or calls are warnings ([decision 0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md)),
so operations may produce them. Adding a command does not ask for its service
([ZVE-Q2](#zve-q2)): it is written as `when E do Y { }` and the service is filled in
from the details panel when the user chooses. A new event is introduced through a
valid construct, such as an emission from a selected command; the grammar has no
disconnected event declaration. Create a policy with triggers and one target
command atomically. No placeholder semantics or grammar changes are required for the
first release. Identifiers stay ASCII, as the ZFL and ZDL grammars define them, by
owner decision of 2026-10-31: an edit that introduces a non-ASCII identifier is
rejected. Unicode is supported in strings and comments.

<a id="zve-r6"></a>
**ZVE-R6 (proposed). Connections express specific relationships.** Initial intents
add/remove a command emission, add/remove a policy trigger, and set a policy's
target command. An event-to-command gesture offers policy creation, never an
implicit call ([ZVE-R21](#zve-r21)). AND/OR trigger grouping is structured data and
survives edits. Synthetic display elements are not declarations. Unsupported
operations are visibly unavailable with a reason supplied by KMP capabilities.

<a id="zve-r7"></a>
**ZVE-R7 (proposed; amended 2026-11-05). Rename and deletion expose their scope,
and deletion never cascades into a body.** Distinguish a flow-local symbol from a
syntactic occurrence. Rename updates relevant references within the document.
Deletion follows [ZVE-R19](#zve-r19) and [ZVE-R20](#zve-r20) and shows its impact
before it is confirmed. Removing a displayed edge removes its selected relationship
only. A merged edge with multiple origins requires origin selection. Symbols owned by
other documents are read-only. The earlier "explicitly selected atomic cascade" is
withdrawn: no deletion removes a policy body as a side effect.

<a id="zve-r8"></a>
**ZVE-R8 (proposed). Untouched source is preserved.** Retain unrelated comments,
annotations, imports, declarations, occurrence bodies, response/emission semantics,
ordered calls and trigger grouping. No-op operations return no edits. Opening the
canvas does not rewrite text; editing one emission does not regenerate the file.
Define deletion of attached comments through explicit fixtures.

<a id="zve-r9"></a>
**ZVE-R9 (proposed; confirmed by the owner 2026-11-05). Invalid text disables
semantic canvas edits.** Keep the last valid diagram with a visible stale indicator
and diagnostics until text is valid again. A document that was never valid shows
diagnostics and an empty state. Warnings never disable editing. Resolves
[ZVE-Q3](#zve-q3).

<a id="zve-r10"></a>
**ZVE-R10 (proposed; amended 2026-11-05). Placement is presentation state.**
Dragging, resizing, selection and viewport changes do not edit ZFL. Positions survive
semantic refresh and rename within a session using identity mappings. A new node is
placed where it was dropped, and existing nodes do not move. During a session the
page keeps every position in memory, including the drop positions, whether or not a
[saved positions file](eventflow.md#ef-r14) applies. The file is written only by the
explicit *Save Positions*, never as a side effect of a semantic edit. Reopening
without saving behaves as [EF-Q9](eventflow.md#ef-q9) answers. Arrange explicitly
requests shared KMP layout; React does not add a competing layout algorithm.
Resolves [ZVE-Q4](#zve-q4).

<a id="zve-r11"></a>
**ZVE-R11 (proposed; amended 2026-11-05). The component works without VS Code, and
there is one undo history.** React accepts the projection, diagnostics,
presentation state and an adapter for semantic intents. It imports neither VS Code
nor Node. A browser harness calls the KMP JS engine; the VS Code adapter uses the
current document and server transport. Each accepted operation is one native undo
step of the document, and that is the only undo history: the canvas keeps none of its
own. Undo and redo pressed in the canvas reach the document's undo. Moves are not
undone, because they are not in ZFL. An intent still waiting in the queue
([ZVE-R14](#zve-r14)) is removed from the queue, not undone. Undo/redo, save and
external changes refresh the same projection path. Standalone undo is supplied by its
host adapter.

<a id="zve-r12"></a>
**ZVE-R12 (proposed). Editing capabilities and versions are explicit.** Document
final wire names, serializable payloads and examples in the LSP and webview
contracts before implementing consumers. Missing support yields a read-only view
with a reason. Desktop and browser use the same semantics. Existing read-only
consumers do not have to adopt mutation support.

<a id="zve-r13"></a>
**ZVE-R13 (proposed; appearance identity confirmed by the owner, 2026-10-31).
A symbol appears once per flow, and an ambiguous relationship selects its origin.**
Each command and event is drawn once within a selected flow, however many times it
occurs in that flow's source. When a displayed relationship could come from more
than one source occurrence, an operation targeting it requires explicit origin
selection before it proceeds; the editor does not guess. Policies stay
occurrence-specific: each policy keeps its own triggers, condition and target
command and is never merged with another by name. For example, a command emitted in
two different `when` blocks shows one command node with one emission edge, but
removing that emission asks which block it came from. This resolves
[ZVE-Q1](#zve-q1) and governs how [ZVE-R3](#zve-r3) freezes editable targets.

<a id="zve-r14"></a>
**ZVE-R14 (proposed). The page queues intents and sends one at a time.** A gesture
made while an operation is in flight is not blocked: the page appends its intent to
a first-in, first-out queue. Only one intent is in flight. The next is sent when the
projection for the previous one arrives, carrying that projection's revision.
Because intents name targets by identity, not by offset, a queued intent stays
meaningful after earlier ones change the text. If an intent is rejected, the intents
queued behind it are cancelled and listed to the user with the rejection; none is
dropped silently. The queue holds and sends intents; it does not interpret them
([ZVE-R2](#zve-r2)).

<a id="zve-r15"></a>
**ZVE-R15 (proposed). A stale intent is prepared again once.** When the document
has changed since the intent's revision, for example by typing in the text editor,
the host asks KMP to prepare the intent again against the current revision, once,
provided every target still resolves by identity. KMP validates the new result as
any other. If a target no longer resolves, or the second preparation is also stale,
the intent is rejected as `stale`. Edits computed for one revision are never applied
to another.

<a id="zve-r16"></a>
**ZVE-R16 (proposed). A rejection keeps what the user asked for.** A result is one
of: applied; `invalid`, with KMP's diagnostics; `unsupported`; `needs-origin`, which
asks for the selection [ZVE-R13](#zve-r13) requires; and `stale`. On anything but
applied, what the user typed or chose stays in the form or on the pending element,
with the reason, until the user corrects and retries it or discards it explicitly.
Nothing appears in the canvas that is not in the text or visibly pending, and
nothing pending disappears on its own.

<a id="zve-r17"></a>
**ZVE-R17 (proposed). Text values are committed on Enter or on leaving the field.**
A name, a title or a service is sent as one intent when the user presses Enter or
the field loses focus; Escape cancels. Nothing is sent per keystroke, so successive
renames are never merged: each committed value is one operation and one undo step.

<a id="zve-r18"></a>
**ZVE-R18 (proposed). Pending work is drawn as pending, and the round trip is
measured.** While an intent is queued or in flight, the element it creates or changes
is drawn as pending: a new node at its drop position, a new edge or a new label in a
muted style. When the projection arrives, the pending element is replaced by the
projected one without remounting the other nodes, keeping selection, focus and
viewport. The time from intent to projection is measured on desktop and in the
browser, and the figures are recorded in the plan's [ES-P6](../roadmap/event-storming-whiteboard.md#es-p6)
evidence. A slow figure opens a question here; it does not by itself justify
predicting projections in the page.

<a id="zve-r19"></a>
**ZVE-R19 (proposed). Removing the last trigger of a policy keeps its body.** When a
policy loses its last trigger, because the trigger was deleted or the user deleted
the policy itself, the `when …` clause goes and the action stays
([ZVE-T4](#zve-t4)):

- `when X do Y { body }` becomes `do Y { body }`, a command with nothing pointing at
  it. Its annotations and javadoc stay, unchanged.
- `when X do Y`, without a body, is removed: its body already lives in a `do Y { … }`.

A policy that still has other triggers only loses the deleted one, and its trigger
grouping keeps its shape. The result is valid ZFL with the warning of
[ZFL-R6](../dsl-kotlin/zfl-language.md#zfl-r6), drawn on the disconnected command.

<a id="zve-r20"></a>
**ZVE-R20 (proposed). Deleting a node lists its impact first, and only deleting a
command removes a body.** Before a deletion is confirmed, the details panel lists
every change it makes. Each is part of one atomic operation.

- **Event:** removed from every trigger ([ZVE-R19](#zve-r19)), from every `emits` and
  response that names it, and from every end outcome. An outcome left empty is
  removed, and an `end { }` left without outcomes is removed, since the grammar needs
  at least one. A flow left without `completed` is valid with the warning of
  [ZFL-R7](../dsl-kotlin/zfl-language.md#zfl-r7).
- **Start:** its declaration is removed, and its policies follow [ZVE-R19](#zve-r19).
- **Command:** its `do` block and the policies that target it are removed, and the
  list shows each body that is lost. It is rejected while another action uses it
  through `call Y` or `on … call Y`, and the rejection lists those calls.

<a id="zve-r21"></a>
**ZVE-R21 (proposed). Connecting an event to a command creates a policy with one
confirmation.** Dropping a connection from an event onto a command opens the policy
form with the trigger, the target and a proposed, editable name filled in; one
confirmation sends one atomic operation. Dropping the connection onto an existing
policy adds a trigger to that policy instead of creating another one. Connecting an
event to a command that nothing triggers ([ZVE-R19](#zve-r19)) adds `when E do Y`
without a body, which refers to the existing `do Y { … }` and leaves it where it is.

<a id="zve-r22"></a>
**ZVE-R22 (proposed). A start is created with its policy and command, and the edge
is the policy.** In ZFL an actor is a `start` with `@actor`. Creating a start is one
atomic operation that writes `start X { }` and `when X do Y { }`, where `Y` is an
existing command or a new one. A start is never created alone. The canvas draws
start → command, as today, without the policy node; that edge is the policy.
Selecting it allows reconnecting its command or deleting it under
[ZVE-R19](#zve-r19). `@actor`, `@timer` and `@title` belong to the start node and are
edited there; the hidden policy has no annotations of its own to edit. Connecting a
start to a second command adds a second hidden policy.

<a id="zve-r23"></a>
**ZVE-R23 (proposed). The details panel edits properties.** In the first release the
panel edits, each as one operation:

- the name of a start, event, command or policy;
- `@actor`, `@timer` and `@title` of a start, and of a visible policy, at most one of
  actor and timer, as [ZFL-R5](../dsl-kotlin/zfl-language.md#zfl-r5) requires and KMP
  validates;
- the service of a command, optional ([ZFL-R8](../dsl-kotlin/zfl-language.md#zfl-r8));
- the end outcomes of an event: marking or unmarking it as `completed`, `cancelled`,
  `suspended` or another outcome.

<a id="zve-r24"></a>
**ZVE-R24 (proposed). The editor has three columns.** Left, the palette of elements
to drag onto the canvas; centre, the canvas; right, the details panel of the element
in focus, with its properties ([ZVE-R23](#zve-r23)), the impact list of a deletion
([ZVE-R20](#zve-r20)) and the input kept by a rejection ([ZVE-R16](#zve-r16)). The
panel is part of the React component, so the harness and VS Code show the same one;
it is not a VS Code view.

<a id="zve-r25"></a>
**ZVE-R25 (proposed). The first release edits existing flows.** The canvas offers no
way to create a flow. A document without flows shows an empty state explaining that a
flow is started in the text, for example `flow Booking { }`; once one exists the
canvas edits it. An empty flow is valid, with the warning of
[ZFL-R7](../dsl-kotlin/zfl-language.md#zfl-r7).

<a id="zve-r26"></a>
**ZVE-R26 (proposed). Connecting an event to a command that already has that policy
does nothing.** Dropping a connection from an event onto a command that a policy
with exactly that trigger already targets is ignored: no edits, no form, no message.
In the text two identical policies are an error
([ZFL-R9](../dsl-kotlin/zfl-language.md#zfl-r9)). Decided by the owner, 2026-11-06.

<a id="zve-r27"></a>
**ZVE-R27 (proposed). A policy keeps its identity when its triggers or its command
change.** A policy is the `when` block in the text. Adding, removing or replacing a
trigger, including when a deleted event or start is removed from it, or reconnecting it
to another command, edits that block, so it is the same policy: the operation returns
an identity mapping from the old key to the new one for every policy whose key changes,
including peers whose `#n` suffix shifts, and the canvas keeps its selection and saved
position. The mappings of one result apply simultaneously: each old key is looked up
in the document before the operation, never in the result of another mapping. Reconnecting a policy that has an inline body
leaves the body with its command ([ZVE-R19](#zve-r19)): `when E do Y { body }`
reconnected to `Z` becomes `do Y { body }` and `when E do Z`, written with an empty
body, as the formatter writes it, if `Z` has no body yet. The policy keeps its identity; the body becomes the command
`Y` with nothing pointing at it, with the warning of
[ZFL-R6](../dsl-kotlin/zfl-language.md#zfl-r6). Decided by the owner, 2026-11-06.

<a id="zve-r28"></a>
**ZVE-R28 (proposed). Inserted and removed text follows the formatter.** Lines an
operation inserts are laid out as the ZFL formatter would lay them out, with its
indentation and spacing, and a deletion leaves no blank line or double space the
formatter would not leave. Only the lines the operation touches follow it: the rest
of the document is not reformatted ([ZVE-R8](#zve-r8)). Decided by the owner,
2026-11-06.

## Open questions

<a id="zve-q1"></a>
**ZVE-Q1.** One command/event appearance per flow, or separate occurrences?
Resolved by the owner, 2026-10-31: one symbol appearance per flow, explicit origin
selection when a relationship is ambiguous, and occurrence-specific policies. The
behaviour is now a rule, [ZVE-R13](#zve-r13).

<a id="zve-q2"></a>
**ZVE-Q2.** Confirm a name-and-service form before inserting a command. Proposed
default: preselect the last chosen service but never invent one.
Resolved by the owner, 2026-11-05, the other way: the service is never asked for.
A new command is created without one, and the user fills it in from the details
panel when they want to. A missing service is a warning
([ZFL-R8](../dsl-kotlin/zfl-language.md#zfl-r8)); see [ZVE-R5](#zve-r5).

<a id="zve-q3"></a>
**ZVE-Q3.** Confirm the last-valid diagram and disabled mutation during invalid
text in ZVE-R9. This does not permit saving incomplete workshop models via canvas.
Resolved by the owner, 2026-11-05: confirmed, with only valid ZFL editable. What was
an error and is now a warning is listed in
[decision 0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).

<a id="zve-q4"></a>
**ZVE-Q4.** Should manual positions survive reopening, and where are they stored?
Proposed first release: session persistence. A later sidecar could store placement
without becoming another semantic source. Do not add layout annotations by default.
Direction from the owner, 2026-11-01: EventFlow variants come first, then a saved positions
file beside the model (EF-R12 and EF-R14 in `flows/eventflow.md`, decision 0022, on branch
`feature/preview-eventflow-storming`). This editor's placement is designed on what those leave.
Resolved by the owner, 2026-11-05: positions are kept in memory for the session and
written only by *Save Positions*; see [ZVE-R10](#zve-r10).

<a id="zve-q5"></a>
**ZVE-Q5.** Choose exact projection/operation schemas after the KMP prototype.
Fix Unicode range encoding, revision tokens, relationship origins and results for
invalid/stale/unsupported operations before the transport milestone. No endpoint
name or payload in this document is claimed to exist. The result kinds are named in
[ZVE-R16](#zve-r16); their wire shape is still open here.

## Sources

Owner answers and source investigation, 2026-10-31, recorded in ZVE-T1 to ZVE-T3;
the owner's review of an outside architecture brief, 2026-11-05, with the source
checks recorded in ZVE-T4; [parser output](dsl-parser-output.md),
[EventFlow](eventflow.md), [visualization requests](lsp-visualization-requests.md),
the [prior board decision](../decisions/0019-event-storming-board-is-a-vistas-app.md)
and [decision 0026](../decisions/0026-deleting-a-trigger-keeps-the-body.md).
No runtime, performance, multi-user or IntelliJ behaviour was tested.
