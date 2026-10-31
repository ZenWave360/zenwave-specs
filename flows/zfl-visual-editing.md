# Bidirectional ZFL visual editing

<a id="zfl-visual-editing"></a>

A visual editor for valid ZFL flows, built as a reusable React component in the
vistas and embedded in VS Code. Text and canvas edit the same ZFL document.
Delivery is described in the [whiteboard plan](../roadmap/event-storming-whiteboard.md).

**Status:** proposed, 2026-10-31. The owner confirmed ZFL text authority, valid
models only, single-user VS Code use, and development as a standalone web component.
Other rules below are implementation proposals, not existing capabilities.
Here, standalone component means reusable React with a browser example; a
standards-based custom element is not assumed.

## Scope

The first release adds, removes, renames and connects events, commands and policies
within one selected flow. It supports text-to-canvas refresh, canvas-to-text edits,
native undo and explicit automatic layout. It runs in desktop and browser VS Code
and a standalone browser harness. Free-form workshop notes, incomplete models,
simultaneous collaboration, cross-document mutation, ZDL edits and architecture
graph mutation are outside this release.

## Ownership

| Repository | Owns |
| --- | --- |
| `dsl-kotlin` | Edit projection, source targets, operation validation, text edits and KMP layout |
| `zenwave-lsp` | Open-document transport, revision checks, capability advertisement and diagnostics |
| `zenwave-architectural-vistas` | React editor, interaction state, browser example and host adapter interface |
| `zenwave-platform-vscode` | Custom editor, guarded document edits, undo/save and embedding in both hosts |

Follow the [world model](../architecture/world-model.md),
[vistas boundary](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) and
[layout decision](../decisions/0001-layout-stays-on-the-server.md). The existing
[webview protocol](eventflow-webview-protocol.md) remains compatible for read-only
consumers; editing requires an explicitly advertised capability.

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

## Rules

<a id="zve-r1"></a>
**ZVE-R1 (proposed). ZFL text is authoritative.** Both views use the current open
document, including unsaved edits. The canvas sends intents and receives a fresh
projection after text changes. Saving React Flow state does not save the model.
A standalone host owns an equivalent text document and revision counter.

<a id="zve-r2"></a>
**ZVE-R2 (proposed). Language semantics stay in KMP.** `dsl-kotlin` resolves and
validates operations over original source. React, LSP and IDE adapters do not infer
ZFL from labels or serialize the display graph back into text. Keep read-only
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
result only if the revision still matches. Invalid, stale and unsupported results
leave text unchanged and explain why. Retrying an operation cannot insert it twice.
Older asynchronous projections never replace newer ones.

<a id="zve-r5"></a>
**ZVE-R5 (proposed). Accepted operations leave valid ZFL.** Valid means no syntax
errors or error-severity ZFL semantic diagnostics; warnings are displayed. Gather
required information before insertion. Adding a command asks for its service
rather than inventing one. A new event is introduced through a valid construct,
such as an emission from a selected command; the grammar has no disconnected
event declaration. Create a policy with triggers and one target command atomically.
No placeholder semantics or grammar changes are required for the first release.
Identifiers stay ASCII, as the ZFL and ZDL grammars define them, by owner decision
of 2026-10-31: an edit that introduces a non-ASCII identifier is rejected. Unicode
is supported in strings and comments.

<a id="zve-r6"></a>
**ZVE-R6 (proposed). Connections express specific relationships.** Initial intents
add/remove a command emission, add/remove a policy trigger, and set a policy's
target command. An event-to-command gesture offers policy creation, never an
implicit call. AND/OR trigger grouping is structured data and survives edits.
Synthetic display elements are not declarations. Unsupported operations are
visibly unavailable with a reason supplied by KMP capabilities.

<a id="zve-r7"></a>
**ZVE-R7 (proposed). Rename and deletion expose their scope.** Distinguish a
flow-local symbol from a syntactic occurrence. Rename updates relevant references
within the document. Deletion reports affected references and either performs an
explicitly selected atomic cascade or rejects the operation. Removing a displayed
edge removes its selected relationship only. A merged edge with multiple origins
requires origin selection. Symbols owned by other documents are read-only.

<a id="zve-r8"></a>
**ZVE-R8 (proposed). Untouched source is preserved.** Retain unrelated comments,
annotations, imports, declarations, occurrence bodies, response/emission semantics,
ordered calls and trigger grouping. No-op operations return no edits. Opening the
canvas does not rewrite text; editing one emission does not regenerate the file.
Define deletion of attached comments through explicit fixtures.

<a id="zve-r9"></a>
**ZVE-R9 (proposed). Invalid text disables semantic canvas edits.** Keep the last
valid diagram with a visible stale indicator and diagnostics until text is valid
again. A document that was never valid shows diagnostics and an empty state.
This proposed default awaits confirmation in ZVE-Q3.

<a id="zve-r10"></a>
**ZVE-R10 (proposed). Placement is presentation state.** Dragging, resizing,
selection and viewport changes do not edit ZFL. Positions survive semantic refresh
and rename within a session using identity mappings. New nodes receive an initial
placement without moving existing nodes. Arrange explicitly requests shared KMP
layout; React does not add a competing layout algorithm. Reopen persistence is
pending ZVE-Q4.

<a id="zve-r11"></a>
**ZVE-R11 (proposed). The component works without VS Code.** React accepts the
projection, diagnostics, presentation state and an adapter for semantic intents.
It imports neither VS Code nor Node. A browser harness calls the KMP JS engine;
the VS Code adapter uses the current document and server transport. Each accepted
operation is one native undo step. Undo/redo, save and external changes refresh
the same projection path. Standalone undo is supplied by its host adapter.

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

## Open questions

<a id="zve-q1"></a>
**ZVE-Q1.** One command/event appearance per flow, or separate occurrences?
Resolved by the owner, 2026-10-31: one symbol appearance per flow, explicit origin
selection when a relationship is ambiguous, and occurrence-specific policies. The
behaviour is now a rule, [ZVE-R13](#zve-r13).

<a id="zve-q2"></a>
**ZVE-Q2.** Confirm a name-and-service form before inserting a command. Proposed
default: preselect the last chosen service but never invent one.

<a id="zve-q3"></a>
**ZVE-Q3.** Confirm the last-valid diagram and disabled mutation during invalid
text in ZVE-R9. This does not permit saving incomplete workshop models via canvas.

<a id="zve-q4"></a>
**ZVE-Q4.** Should manual positions survive reopening, and where are they stored?
Proposed first release: session persistence. A later sidecar could store placement
without becoming another semantic source. Do not add layout annotations by default.

<a id="zve-q5"></a>
**ZVE-Q5.** Choose exact projection/operation schemas after the KMP prototype.
Fix Unicode range encoding, revision tokens, relationship origins and results for
invalid/stale/unsupported operations before the transport milestone. No endpoint
name or payload in this document is claimed to exist.

## Sources

Owner answers and source investigation, 2026-10-31, recorded in ZVE-T1 to ZVE-T3;
[parser output](dsl-parser-output.md), [EventFlow](eventflow.md),
[visualization requests](lsp-visualization-requests.md), and the
[prior board decision](../decisions/0019-event-storming-board-is-a-vistas-app.md).
No runtime, performance, multi-user or IntelliJ behaviour was tested.
