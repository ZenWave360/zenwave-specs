# Event Storming whiteboard: visual ZFL editor delivery plan

<a id="event-storming-whiteboard"></a>

A reusable React editor for valid ZFL models, developed in a standalone browser
harness and embedded in VS Code for single-user use. ZFL text is authoritative;
canvas actions produce validated text edits. Behaviour is specified in
[bidirectional ZFL visual editing](../flows/zfl-visual-editing.md).

**Status:** planned, 2026-10-31; not implemented. The owner selected text authority,
valid models only and a standalone component on this date. This replaces the
2026-10-18 free-form JSON board and one-way export brief, retained in git history.
[Decision 0021](../decisions/0021-zfl-text-owns-visual-editing.md) supersedes the
export-only consequence of 0019 while retaining vistas UI ownership.

## Scope

Edit one selected flow in a ZFL document while preserving other flows and
unsupported constructs. Desktop and web VS Code use the same component and KMP
semantics as the browser harness. React Flow is interaction, not saved semantics.

Free-form notes, hot spots, aggregates, read models, collaboration, ZDL mutation,
cross-document edits and a separate authoritative board JSON are outside v1.
Single-user describes editing, not the number of workshop observers.

## Build order and acceptance gates

Each milestone depends on the previous gate. Tasks are in the
[backlog](../work/backlog.md). No calendar estimate has been validated.

<a id="es-p1"></a>
### ES-P1. Prove the edit model in KMP

**Owners:** `dsl-kotlin`, `zenwave-specs`.

Resolve [ZVE-Q1](../flows/zfl-visual-editing.md#zve-q1) and prototype source targets
and operations over original parsed text. Preserve declaration, occurrence and
relationship origins. Keep trigger grouping; do not reverse the view transformer.
Start with adding an emission, changing a policy trigger and renaming a command.

Fixtures cover equal names in two flows, repeated command bodies, equal policy
endpoints with different conditions, mixed trigger groups, actor starts, ordered
calls and handlers, response/emits/emits-response, comments and annotations,
parallel edges, CRLF and Unicode.

**Exit:** minimal edits produce valid ZFL; unrelated text remains byte-for-byte
unchanged; identity reconciliation preserves rename continuity. Record unsupported
operations. Resolve targeting problems before UI work.

<a id="es-p2"></a>
### ES-P2. Complete operations and publish the editing contract

**Owners:** `dsl-kotlin`, `zenwave-specs`.

Add command creation with required service selection, event creation through an
emission, atomic policy creation, connection changes, scoped renames and deletion
with reference checks. Define cascades and attached-comment deletion. Return
capabilities and invalid/stale/unsupported results. Preserve read-only consumers.

**Exit:** supported gestures and rejection paths have operation tests. Publish
versioned projection and operation examples, source range encoding, revision and
idempotency rules. Verify JVM/JS serialization parity and browser imports without
Node. Confirm ZVE-Q2 through ZVE-Q4 or retain their proposed status explicitly.

<a id="es-p3"></a>
### ES-P3. Build the standalone React editor

**Owner:** `zenwave-architectural-vistas`.

Build the reusable component and a browser harness with ZFL text, canvas and
diagnostics. Its adapter calls KMP JS and applies revision-checked edits. Reuse
existing node components/styles; extract shared code only when both consumers need
it. Declare the React Flow version used; migrating the library is not a prerequisite.

Add palette/forms, explicit connection intents, deletion impact, selection,
session placement and Arrange. Show policies explicitly in the editing projection.
Invalid text leaves a visibly stale, non-editable last-valid diagram.

**Prerequisites available to this consumer:**

- [ ] KMP JS exposes the versioned edit projection and validated operations.
- [ ] Shared KMP layout can be requested independently of every semantic edit.

**Exit:** in a real browser create a command and event, create/reconnect a policy,
rename, delete, undo/redo and edit text. Rejections and delayed responses never
overwrite newer text. Existing manually placed nodes do not move after an edit.

<a id="es-p4"></a>
### ES-P4. Add LSP and webview transport

**Owners:** `zenwave-lsp`, `zenwave-architectural-vistas`, `zenwave-specs`.

Expose projection and edit preparation against current unsaved snapshots.
Advertise capabilities. Document wire names, examples, stale versions, page
intents and host acknowledgements in the LSP and webview contracts. The server
prepares edits; the host applies them. Do not apply through both a response and a
server callback.

**Prerequisite available to this consumer:**

- [ ] KMP operations and revision contracts are stable and tested.

**Exit:** Node IPC and Web Worker transport tests cover unsaved text, delayed
responses, rejection, stale revisions, duplicate IDs and unavailable capabilities.
Read-only pages remain compatible. Test JVM serialization/adapter behaviour where
exposed; IntelliJ hosting is outside v1.

<a id="es-p5"></a>
### ES-P5. Embed in VS Code

**Owner:** `zenwave-platform-vscode`.

Host the component as an optional custom text editor over `.zfl`. Apply each
accepted operation as one guarded document edit. Serialize mutation handling to
avoid a gap between revision comparison and application. Refresh from document
changes. Integrate native undo/redo, save, switching views and multiple open views.

**Prerequisites available to this consumer:**

- [ ] Editing requests over current documents are advertised in both JS hosts.
- [ ] Vistas publishes an embeddable editor page with the editing protocol.

**Exit:** desktop and web tests cover create/connect/delete, unsaved changes,
one-step undo, redo, save/reopen, external changes, hidden/recreated webviews and
stale edits from another view. Missing support produces a read-only explanation.
No Node API enters shared or browser code.

<a id="es-p6"></a>
### ES-P6. Verify a complete modelling session

**Owners:** all delivery repositories.

Alternate text and canvas editing on representative fixtures and a real process.
Inspect diffs for unrelated changes. Test the browser harness and both VS Code
hosts. Record package versions, actual results and unsupported operations. Run
each repository's required checks and the spec reference checker. Flip rules to
*exists* only for demonstrated behaviour; update backlog and platform status.

**Exit:** each supported action yields valid ZFL, undo restores prior text,
save/reopen preserves semantics, and both VS Code hosts match the harness.
Cross-reopen manual layout is assessed against the answer to ZVE-Q4.

## Questions retained from the original brief

Question IDs remain permanent. Workshop/export assumptions are superseded.

<a id="es-q1"></a>**ES-Q1.** Palette/detail-panel layout remains open; decide in
ES-P3 after testing creation workflows.

<a id="es-q2"></a>**ES-Q2.** Answered by
[ZVE-R6](../flows/zfl-visual-editing.md#zve-r6): gestures submit explicit semantic
operations, including trigger grouping.

<a id="es-q3"></a>**ES-Q3.** Hot-spot export is outside the revised v1.

<a id="es-q4"></a>**ES-Q4.** Use existing ZFL documents; select one flow without
changing unrelated flows.

<a id="es-q5"></a>**ES-Q5.** The semantic file is `.zfl`; no board JSON extension
is needed. Durable placement is [ZVE-Q4](../flows/zfl-visual-editing.md#zve-q4).

<a id="es-q6"></a>**ES-Q6.** UI ownership remains in the vistas under
[0019](../decisions/0019-event-storming-board-is-a-vistas-app.md), refined by
[0021](../decisions/0021-zfl-text-owns-visual-editing.md).

<a id="es-q7"></a>**ES-Q7.** Reuse note components and styles initially. Determine
the final package boundary in ES-P3; read-only consumers gain no language semantics.

<a id="es-q8"></a>**ES-Q8.** One-way export is superseded. KMP owns semantic text
operations under [ZVE-R2](../flows/zfl-visual-editing.md#zve-r2).

<a id="es-q9"></a>**ES-Q9.** IntelliJ hosting is outside v1; the component and
semantic operations remain host independent.

## Sources

Owner clarification and source investigation, 2026-10-31, recorded in the
[specification](../flows/zfl-visual-editing.md). The old brief remains in git history.
No implementation or runtime validation is claimed by this plan.
