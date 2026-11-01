# Model Actions

<a id="model-actions"></a>

**Status:** 2026-11-01: 1 partial, 2 proposed, 2 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Put the things the language server knows about a model — what a concept connects
to, what it belongs to, and how a flow's services ought to be arranged — within
reach of someone editing that model, as ordinary editor commands.

## Rules

<a id="ma-r1"></a>
### MA-R1 (partial). The user can follow what a concept connects to

*State: Both commands exist. Reverse references are always empty until [LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9) is met, and forward references open a document at its first line.*

The extension SHALL offer, for the concept under the cursor in a model document,
`zenwave.model.forwardReferences` to see what it references and
`zenwave.model.reverseReferences` to see what references it. Results
SHALL be navigable, and SHALL include matches in documents other than the one
being edited.

**Examples**

- *What this command leads to.* Given the cursor on a command declared in a ZFL flow, when the user asks what it references, then the concepts it leads to are listed, and choosing one opens it where it is declared.
- *What uses this entity.* Given the cursor on an entity declared in a ZDL model, when the user asks what references it, then the places that use it are listed, including uses in other documents of the same architecture.
- *A single result.* Given a concept with exactly one match, when the user follows it, then they arrive at it directly, without being asked to choose from a list of one.
- *Nothing to show.* Given a concept the server reports no references for, when the user asks, then they are told there are none, rather than being shown an empty list with no explanation.
- *The cursor is not on a concept.* Given the cursor in whitespace or in a comment, when the user invokes the command, then nothing happens and nothing reports an error.

<a id="ma-r2"></a>
### MA-R2 (proposed). The user can see which concepts a position belongs to

*State: Not implemented in the client; `zenwave/conceptAt` is not on `lsp-js`.*

The extension SHALL report, through `zenwave.model.conceptsAt`, the architectural
concepts that the position in the document belongs to, where the server can
identify any.

**Examples**

- *Locating yourself in an architecture.* Given the cursor inside a service declaration in a large model, when the user asks which concepts this belongs to, then the concepts covering that position are shown, named as the server identifies them.
- *A position that belongs to nothing identifiable.* Given the cursor somewhere the server can identify no concept, when the user asks, then they are told so, rather than shown an empty result.
- *A workspace with no architecture.* Given a model opened with no architecture manifest resolved, when the user asks which concepts a position belongs to, then they are told that this needs an architecture, and how to configure one.

<a id="ma-r3"></a>
### MA-R3 (exists). The user can organise a flow's services

The extension SHALL offer, for a ZFL document, `zenwave.zfl.organizeServices`,
which replaces its services with the arrangement the server produces. The replacement SHALL be a
single undoable edit, and SHALL leave the document untouched if it fails.

That arrangement is destructive, which its name doesn't say: checked 2026-11-01 in `ZflSystemsOrganizer` and `organizeSystems_rebuilds_systems_from_policy_services`, it rebuilds the block from the flows, so systems, services,
commands and aggregates that no flow uses are removed. IntelliJ's action calls the same `organizeZflServices` through its LSP service. [MA-R5](#ma-r5) adds the mode that only adds.

**Examples**

- *Organising a flow.* Given a `.zfl` document whose services are declared in the order they were written, when the user invokes the organise command, then the document is rewritten with the server's arrangement.
- *Undoing it.* Given a document that has just been organised, when the user undoes, then the document returns to exactly what it was, in one step.
- *A document that cannot be organised.* Given a ZFL document the server cannot process, such as one with a syntax error, when the user invokes the command, then the document is left exactly as it was, and the user is told why.
- *Nothing to change.* Given a document whose services are already arranged as the server would arrange them, when the user invokes the command, then the document is not modified, and its undo history is not disturbed.
- *The command is offered where it applies.* Given a `.zdl` file or a file that is not a model, when the user looks for the organise command, then it is not offered.

<a id="ma-r4"></a>
### MA-R4 (exists). These commands are absent without a connected server

The extension SHALL NOT offer these commands when no language server is
connected, or when the connected server does not support the request behind
them, and SHALL say which of those is the case if one is invoked anyway.

**Examples**

- *No server.* Given a host with no language server, when the user looks for these commands, then they are not offered.
- *A server that does not support one of them.* Given a connected server that supports some ZenWave requests and not others, when the user looks for these commands, then only those the server supports are offered.
- *Invoked anyway.* Given a command invoked programmatically while the server is unavailable, when it runs, then it changes nothing and reports that the feature needs the ZenWave language server.

<a id="ma-r5"></a>
### MA-R5 (proposed). The systems block can be reconciled by adding or in full, from above it

The editor SHALL show two CodeLens actions above a ZFL document's `systems` block. *Add missing* adds what the flows use and the block lacks, and removes nothing. *Full* also removes what no flow uses, which is what
[MA-R3](#ma-r3) does today, and SHALL ask for confirmation first. Neither SHALL change a Javadoc comment of anything that stays, and every other rule of MA-R3 applies to both. The palette keeps both as commands, which also serve a document with no `systems` block yet.

**Examples**

- *A new command.* Given a flow calling `cancelOrder` that the block doesn't list, and a listed command that no flow uses, when the user chooses *Add missing*, then `cancelOrder` is added and the other stays.
- *Comments stay.* Given a service with a Javadoc comment, when either action runs and the service stays, then the comment is byte for byte what it was.
- *Comments inside a service's body may go.* Comments before an element are kept, and comments inside a service's body are not, by reading `renderService` on 2026-11-01. The owner accepted that on 2026-11-01, as those are mostly `//` comments and not Javadoc.

The wire change is [LVR-R19](../flows/lsp-visualization-requests.md#lvr-r19). What IntelliJ's action does by default is its own choice to make, now that it can have both.

## Design notes

**These are not Go to Definition or Find References.** Those come through standard LSP. These commands are the architectural relations,
across documents and repositories.

**Position to symbol, and `conceptAt` is not it.** Reference requests take a document symbol, `uri#path`, from `zenwave/symbolAt`.
`conceptAt` answers with architecture identities, a different and legitimate question ([LVR-R7](../flows/lsp-visualization-requests.md#lvr-r7),
[LVR-R8](../flows/lsp-visualization-requests.md#lvr-r8)).

**Organise is the only feature where the server changes the user's file.** That is why untouched on failure and not modified when unchanged are
rules. The edit is applied only after a result arrives, never optimistically.
