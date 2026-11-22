# Navigation

<a id="navigation"></a>

How a user moves from one place in a model to another: by click, Ctrl+click and right click, inside a file, across
files and across languages, in VS Code and IntelliJ.

**Status:** rewritten 2026-11-20 from the owner's interview of 2026-11-19 (backlog PX/7.1), which replaced the first
draft of 2026-10-30. The rules below are *proposed* unless they say otherwise. The facts are code reads, dated, with
file and line; no gesture was run in a real IDE for this document. The frozen rules of the first draft (`@asyncapi`
and REST resolution) are kept as [NAV-R15](#nav-r15) and [NAV-R16](#nav-r16); its open questions keep their numbers
as NAV-Q1 to NAV-Q7.

## Scope

In: Go to Definition, Find References, forward references, related resources, the gestures that reach them on each
surface, and what the server indexes to answer them. The languages are ZDL, ZFL, OpenAPI, AsyncAPI, Avro and the
architecture manifest ([source resolution](../zenwave-architecture/source-resolution-specification.md)).

Out: code actions, rename, completion ([completion](completion-spec.md)), refactoring, and Java or Kotlin source
inferred from a model ([NAV-Q4](#nav-q4), [NAV-Q5](#nav-q5)). Navigation from an OpenAPI or AsyncAPI document back to
the models that use it comes in a later wave ([NAV-Q7](#nav-q7)). Links in preview pages stay in
[MP-R20](../zenwave-platform-vscode/model-preview.md#mp-r20), outside this wave.

**Order of work.** First ZFL to ZDL, then ZDL to AsyncAPI and OpenAPI, then manifest to its artifacts. Then the
reference index for files that are not open, and last the remote documents. The [backlog](../work/backlog.md) has
one task for each.

## Vocabulary

- A **`DocumentSymbolRef`** is a URI, a semantic path and optionally a range, written `uri#<path>`
  ([LS-T3](server-architecture.md#ls-t3)). It is a location, not an identity ([LSP adapter §2](lsp-adapter.md#lsp-2)).
- **Definition** is the one place a name stands for, reached by Ctrl+click or Go to Definition
  (`textDocument/definition`).
- **Find References** is everything that uses a declaration (`textDocument/references`; Find Usages in IntelliJ).
- **Forward references** is everything a concept leads to, `zenwave.model.forwardReferences`
  ([MA-R1](../zenwave-platform-vscode/model-actions.md#ma-r1)). The standard protocol has no equivalent.
- A **related resource** is a document a node is associated with without being its definition, such as the ZDL a
  ZFL system annotates. The Model tree offers it as *Open Related*.
- The **winning ZDL** of a ZFL system is the first location of its `@zdl` that resolves ([NAV-R9](#nav-r9)).
- A **known local file** is a file in the workspace that the manifest declares as an artifact, or that a `@zdl` or an
  `apis` entry names by a local path.

## What exists today

Read 2026-11-19 by a code-reading agent during the interview, at the `develop` heads of that day; not re-run since,
except NAV-T2, checked again 2026-11-20. Paths are under `zenwave-lsp/lsp-core/src/commonMain/kotlin/io/zenwave360/lsp/core/`
unless they say otherwise.

<a id="nav-t1"></a>
**NAV-T1 (exists). ZFL definition answers only for commands, and stays in the file.** `zfl/ZflLanguageModule.kt:84`
returns nothing unless the position is a command. For a command it searches the text for the first line that starts
with `service ` and contains the `when`'s service (`:88-92`, `zfl/ZflModelAccess.kt:245`), so it lands on the service
line of the same ZFL file. Events and system names answer nothing. Nothing follows `@zdl` to the ZDL: `declaredZdlUris`
(`zfl/ZflModelAccess.kt:278`) reads one string per system and is used only by the hierarchy and the reference index.

<a id="nav-t2"></a>
**NAV-T2 (exists). A target without a range is dropped on the wire.** The contract returns a list of targets
(`contracts/LanguageModule.kt:21`), but `lsp-jvm/.../DtoMapper.kt:43-44` and `lsp-js/.../JsInterop.kt:70-71` drop any
target with no range. `zdl/ZdlLanguageModule.kt` `definition` resolves a REST method to its OpenAPI operation with
`range = null`, so the module test passes and the editor does nothing. It also matches any path under
`services.X.methods.Y`, so a parameter type inside such a method goes to the OpenAPI file too (checked 2026-11-20).
`@asyncapi` has no definition; it is reachable only through forward references (`zdl/ZdlCrossReferenceContributor.kt:29-49`).

<a id="nav-t3"></a>
**NAV-T3 (exists). References see open documents only.** The index is fed by open snapshots
(`platform/ZenwaveLanguageServer.kt:667-675`) and loses them on close (`:106`). `textDocument/references` asks the same
reverse index as `zenwave/reverseReferences` (JVM `ZenwaveLspServer.kt:265-275`, JS `ZenwaveJsLanguageServer.kt:365-370`).
A forward reference carries the target range only when the target is open (`:550-563`). Gaps in what is indexed are
backlog PX/9.7.

<a id="nav-t4"></a>
**NAV-T4 (exists). No `documentLink`.** No repository implements it. A `@zdl` path opens only through the Model tree's
*Open Related*; `apis` entries are read by `zdl/ZdlRestNavigation.kt:18` and have no navigation of their own.

<a id="nav-t5"></a>
**NAV-T5 (exists). The clients.** IntelliJ (`ZenWaveDomainModelEditor`) calls the server in process through its own
`GotoDeclarationHandler`, keeps only the first location (`ZenwaveLspProjectService.kt:161`, `firstOrNull()`), and
registers no find usages or structure view. The VS Code Model tree opens a node's source on click; its inline
*Go to Definition* does the same, and *Go to References* runs `zenwave.model.reverseReferences`
(`src/explorer/feature.ts:108-110`, `:363-368`).

## Rules

### Gestures

<a id="nav-r1"></a>
### NAV-R1 (proposed). The same gestures mean the same on every surface

A plain click selects. Ctrl+click (Cmd+click on macOS) goes to the definition. A right click opens the menu of
[NAV-R3](#nav-r3). Each surface's own spec refers to this table rather than defining its gestures again.

| Surface | Click | Ctrl+click | Right click |
| --- | --- | --- | --- |
| Text editor | Moves the cursor ([NAV-R2](#nav-r2)) | Definition | The IDE's menu, with Find References and forward references |
| Model tree | Selects and reveals the source ([ME-R5](../zenwave-platform-vscode/model-explorer.md#me-r5)) | Definition | [NAV-R3](#nav-r3); inline buttons are [ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9) |
| EventFlow diagram | Selects, and tells the host ([EF-R7](../flows/eventflow.md#ef-r7)) | Definition | [NAV-R3](#nav-r3), through [EF-R5](../flows/eventflow.md#ef-r5) |
| Mermaid diagram in a preview | Nothing | Nothing | Copy only ([MP-R19](../zenwave-platform-vscode/model-preview.md#mp-r19)) |
| Markdown preview page | A link, as [MP-R20](../zenwave-platform-vscode/model-preview.md#mp-r20) says | Same | Not defined in this wave |

Definition is the semantic one. In the tree, revealing the source and the definition are the same place for a
declaration; they differ for a node that refers to something else. A Mermaid diagram does not navigate: the client
does not interpret Mermaid ([MP-T1](../zenwave-platform-vscode/model-preview.md#mp-t1)), and the EventFlow diagram is
the diagram that navigates.

**Examples**

- *A command in the tree.* Given the Model tree of a flow showing the command `createOrder`, when the user clicks it, then the ZFL opens at the command; when they Ctrl+click it, then the ZDL method `createOrder` opens ([NAV-R11](#nav-r11)).
- *A Mermaid sequence diagram.* Given a participant name in a sequence diagram, when the user Ctrl+clicks it, then nothing happens.

<a id="nav-r2"></a>
### NAV-R2 (proposed). A plain click in text belongs to the cursor

The server offers no `documentLink`. A path written in a model, in a `@zdl` or in an `apis` entry, navigates by
definition ([NAV-R8](#nav-r8)), so Ctrl+click works on it as on a name, and a plain click only moves the cursor.

**Example:** given `@zdl("../orders/orders.zdl")`, when the user clicks inside the string, then the cursor moves there
and nothing opens.

<a id="nav-r3"></a>
### NAV-R3 (proposed). A node's menu offers the four ways out, and both IDEs offer the same capabilities

The context menu of a tree or diagram node offers *Go to Definition* and *Find References*, and also
*Forward References* and *Open Related* when they apply to that node. VS Code and IntelliJ offer the same
capabilities, each in its own menu form; their entries need not match one for one. Whether the diagram's menu is
native or drawn by the page is [EF-Q6](../flows/eventflow.md#ef-q6).

**Example:** given an event node with no related resource, when the user right-clicks it, then *Open Related* is not
in the menu.

### Definition

<a id="nav-r4"></a>
### NAV-R4 (partial). Definition resolves meaning, not text

Definition resolves through the model to a `DocumentSymbolRef`. Text search is a fallback only where no semantic
binding exists.

*Missing:* ZFL commands are found by text search today ([NAV-T1](#nav-t1)).

<a id="nav-r5"></a>
### NAV-R5 (proposed). A target is never dropped

A target the server resolves reaches the editor. A target with no range opens its document at the start, and both
transports pass it on. This is what makes ZDL to OpenAPI work in the editor ([NAV-T2](#nav-t2)).

**Example:** given a REST method whose OpenAPI operation is found but has no known range, when the user Ctrl+clicks
the method's annotation, then the OpenAPI file opens at its first line.

<a id="nav-r6"></a>
### NAV-R6 (proposed). Several targets are all returned, and both IDEs show a list

When a name still has more than one target after the scoping rules ([NAV-R13](#nav-r13)), the server returns all of
them and both IDEs let the user choose from a list. Nothing picks one arbitrarily: IntelliJ keeping the first
([NAV-T5](#nav-t5)) is a bug. One target opens directly.

**Example:** given a `when` with an unscoped command `cancel` that the ZDLs of two systems both declare, when the user
Ctrl+clicks it, then both methods are offered.

<a id="nav-r7"></a>
### NAV-R7 (proposed). A missing target falls back to its file, or to nothing

Partial checkouts and missing remotes are normal. When the semantic target is not found and its document exists, the
document opens at the start. When the document does not exist or cannot be read, navigation returns nothing, and the
diagnostic at the place of the link says why. There is no modal message, and the server keeps serving.

**Examples**

- *A renamed method.* Given a ZDL that exists but no longer declares the command, when the user Ctrl+clicks the command in the flow, then the ZDL opens at its first line.
- *A missing ZDL.* Given a `@zdl` whose locations all fail, then the `@zdl` has a diagnostic, and Ctrl+click on a command of that system goes to its `systems {}` declaration ([NAV-R11](#nav-r11)).

### Locations written in a model

<a id="nav-r8"></a>
### NAV-R8 (proposed). A location in `@zdl` or `apis` navigates by definition

Ctrl+click on a string in a ZFL `@zdl`, or on the location of a ZDL `apis` entry, opens the document it names. A local
path resolves against the document it is written in. A remote one opens as [NAV-R10](#nav-r10) says.

*Not today:* neither has a definition ([NAV-T4](#nav-t4)).

<a id="nav-r9"></a>
### NAV-R9 (proposed). A `@zdl` may list several locations, tried in order

`@zdl("../orders/orders.zdl", "https://example.com/orders/orders.zdl")` resolves to the first location that exists,
the winning ZDL. The commands and events of that system resolve against the winning ZDL. Ctrl+click on one string opens
that location, even when it is not the winner. When no location resolves, the `@zdl` has a diagnostic and navigation
through that system returns nothing ([NAV-R7](#nav-r7)). The owner decided the list form on 2026-11-19, and confirmed it 2026-11-22.

*Not checked:* the grammar accepts a list as an annotation value (`complex_value`, `Zfl.g4:126`), but
`declaredZdlUris` reads one string ([NAV-T1](#nav-t1)), and the validator was not read.

<a id="nav-r10"></a>
### NAV-R10 (proposed). A remote document opens in the editor, read-only

A remote document reached by navigation opens in the editor, not in a browser, so the user can go on navigating inside
it, and it cannot be saved. A document the manifest declares opens under its `zenwave:` address, with everything
[architecture resources](../flows/architecture-resources.md) says, credentials included
([AR-R7](../flows/architecture-resources.md#ar-r7)). A direct `https://` location in a `@zdl` or an `apis` entry is
fetched with a plain GET by the HTTP client of the source-resolution library, with or without a manifest: there are no
ordered sources and no expressions, because the URL is already absolute. A relative location inside a remote document,
a `$ref` or a relative `@zdl`, resolves against that document's URL. A direct remote that asks for authentication
fails as a missing target does ([NAV-R7](#nav-r7)); credentials for it are [NAV-Q9](#nav-q9), and its address in the
editor is [NAV-Q10](#nav-q10).

**Example:** given a winning `@zdl("https://example.com/orders.zdl")`, when the user Ctrl+clicks a command of that
system, then the remote ZDL opens read-only at the method, and a `$ref` inside an `apis` file it names resolves against
`https://example.com/`.

### ZFL

<a id="nav-r11"></a>
### NAV-R11 (proposed). A ZFL command goes to its ZDL method

From a use in `when` or `call`, or from its declaration in `systems {}`, definition goes to the method of the same name
in the winning ZDL of the command's system. The declaration in `systems {}` is not a second target; it is among the
results of Find References. When the winning ZDL cannot be resolved, definition falls back to that declaration.

**Example:** given `when OrderPlaced do createOrder` in a flow whose `Orders` system has `@zdl("orders.zdl")`, when the
user Ctrl+clicks `createOrder`, then `orders.zdl` opens at `createOrder` in its service.

*Not today:* definition lands on the `service` line of the ZFL ([NAV-T1](#nav-t1)).

<a id="nav-r12"></a>
### NAV-R12 (proposed). A ZFL event goes to its ZDL event, or to its first appearance

An event that the winning ZDL of a system in the file declares goes to that ZDL event. An event no ZDL declares, one of
the flow's own or an end outcome, goes to its first appearance in the ZFL file. What `call`, `on Outcome` and end
outcomes mean for navigation is still open ([NAV-Q1](#nav-q1) to [NAV-Q3](#nav-q3)).

**Example:** given `when PaymentFailed do cancelOrder`, where no ZDL declares `PaymentFailed` and a `start` names it
first, when the user Ctrl+clicks it, then the cursor goes to that `start`.

<a id="nav-r13"></a>
### NAV-R13 (proposed). A name scoped by a service looks only in that system's ZDL

A command or event under a named service is looked up only in the winning ZDL of that service's system. A name with no
service is looked up in every system of the file; when it matches in several, all are returned ([NAV-R6](#nav-r6)).

### ZDL

<a id="nav-r14"></a>
### NAV-R14 (partial). Types and events in a ZDL go to their declarations

A field type goes to its entity, enum, input, output or event. A method's parameter type goes to its entity or input,
its return type to its entity or output, and a `withEvents` entry to its event. Find References on a declaration lists
these uses.

*Missing:* inside a method with a REST target, a parameter type goes to the OpenAPI file ([NAV-T2](#nav-t2)); entity
to entity uses are not indexed (backlog PX/9.7). The rest was described as defined in the first draft, and not
re-checked.

<a id="nav-r15"></a>
### NAV-R15 (proposed). `@asyncapi` goes to its AsyncAPI channel

Definition on an `@asyncapi` annotation of a method or an event goes to the channel it names. The API is the one named
by `api`, an entry of `apis`; without `api`, the `apis` entry named `default`, which must have role `provider`. Then
`channel` names the channel in that document. `topic` is metadata, used for validation and as a fallback match. These
resolution rules were frozen in the first draft.

```zdl
@asyncapi({api: OrdersAsyncAPI, channel: "OrderCreatedChannel"})
createDelivery(DeliveryInput) Delivery withEvents DeliveryStatusUpdated
```

*Not today:* `@asyncapi` has no definition, only forward references ([NAV-T2](#nav-t2)).

<a id="nav-r16"></a>
### NAV-R16 (partial). REST annotations go to their OpenAPI operation

Definition on `@get`, `@post`, `@put`, `@delete` or another HTTP annotation of a method goes to the OpenAPI operation
whose path is the service's `@rest` base path plus the method's relative path, with that verb. The OpenAPI document is
the `apis` entry named `default` with role `provider`, or the first provider OpenAPI when there is no `default`. The
`operationId` defaults to the method name. These resolution rules were frozen in the first draft.

```zdl
@rest("/orders")
service OrdersService for (CustomerOrder) {
    @get("/{orderId}")
    getCustomerOrder(id) CustomerOrder?
}
```

This resolves to `get /orders/{orderId}`, `operationId` `getCustomerOrder`.

*Missing:* the operation is resolved with no range and dropped ([NAV-T2](#nav-t2), [NAV-R5](#nav-r5)).

### APIs and the manifest

<a id="nav-r17"></a>
### NAV-R17 (exists). OpenAPI, AsyncAPI and Avro follow their own references

A `$ref`, local or to another file, goes to the node it names. An AsyncAPI payload goes to its Avro schema. An Avro
field type goes to its record, enum or fixed. Find References answers the reverse within what is indexed
([NAV-R20](#nav-r20)). Each module implements definition and references ([LS-T1](server-architecture.md#ls-t1)); how
complete each is was not checked for this document.

<a id="nav-r18"></a>
### NAV-R18 (proposed). A manifest service leads to its artifacts, repository and docs

From a service in the manifest, whether under a domain or a subdomain, definition or *Open Related* reaches its
`artifacts` (ZDL, OpenAPI, AsyncAPI), its repository and its docs. Navigation from an artifact back to the service that
owns it, and between producers and consumers, is for later ([NAV-Q8](#nav-q8)).

*Not checked:* the manifest module has hover and definition ([LS-T1](server-architecture.md#ls-t1)); what its
definition answers today was not read.

### References

<a id="nav-r19"></a>
### NAV-R19 (proposed). Find References is the only "who uses this"

Find References answers who uses a declaration, in every IDE. The command `zenwave.model.reverseReferences` is retired,
and the Model tree's *Go to References* runs Find References
([ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9)). Forward references stay a command of their own,
because the protocol has nothing for that direction ([MA-R1](../zenwave-platform-vscode/model-actions.md#ma-r1)).
Decided by the owner on 2026-11-19: both already answered from the same index ([NAV-T3](#nav-t3)), so the
separation was a label, not a behaviour.

**Example:** given the cursor on `event OrderCreated` in a ZDL, when the user runs Find References, then the
`withEvents OrderCreated` of the ZDL and the `when OrderCreated` of the flows that link it are listed.

<a id="nav-r20"></a>
### NAV-R20 (proposed). The reference index covers every known local file

The server indexes the known local files in the background when it starts, so that Find References includes uses in
documents that are not open. It does not index remote documents at start. This answers the "documents it knows of" of
[LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9). The rule holds only once its cost on the JS server's single
thread is measured and accepted ([NAV-Q11](#nav-q11), accepted 2026-11-22 with the limits written there).

**Example:** given a closed `checkout.zfl` that the manifest declares and that uses `createOrder`, when the user runs
Find References on the ZDL method, then the use in `checkout.zfl` is listed.

<a id="nav-r21"></a>
### NAV-R21 (proposed). A remote document is indexed when it is opened

When the user opens a remote document, for example by Ctrl+click on a remote `@zdl`, the server indexes it and the
remote documents it names directly (its `@zdl`, `apis` and `$ref`), one level deep, and keeps them for the session.
Find References from a remote document uses that index and the local one. The answer is complete for local uses and
partial for remote ones: a remote document cannot tell who else uses it. Fetching the directly named documents is the
one fetch made without a client asking for that address; [AR-R10](../flows/architecture-resources.md#ar-r10) still
holds for the tree.

### Done

<a id="nav-r22"></a>
### NAV-R22 (proposed). Navigation is done when it works through the transport and in each IDE

The server is tested at the protocol level, through the transport and not only the module, which is where a dropped
range hides ([NAV-T2](#nav-t2)). VS Code has a packaged smoke of Ctrl+click from ZFL to ZDL and of Find References
across files. IntelliJ has a manual checklist with the same cases, until it has UI tests.

## Status by link

What the first draft's matrix listed, with the rule that now owns each link.

| Source | Target | Rule | Status |
| --- | --- | --- | --- |
| ZDL field type, parameter, return type, `withEvents` | ZDL declaration | [NAV-R14](#nav-r14) | partial |
| ZDL `apis` entry | OpenAPI, AsyncAPI or ZDL file | [NAV-R8](#nav-r8) | proposed |
| ZDL `@asyncapi` | AsyncAPI channel | [NAV-R15](#nav-r15) | proposed |
| ZDL REST annotation | OpenAPI operation | [NAV-R16](#nav-r16) | partial |
| ZDL model element | inferred Java or Kotlin source | [NAV-Q4](#nav-q4), [NAV-Q5](#nav-q5) | out |
| ZFL `@zdl` | linked ZDL | [NAV-R8](#nav-r8), [NAV-R9](#nav-r9) | proposed |
| ZFL command | ZDL method | [NAV-R11](#nav-r11), [NAV-R13](#nav-r13) | proposed |
| ZFL event | ZDL event or first appearance | [NAV-R12](#nav-r12), [NAV-R13](#nav-r13) | proposed |
| ZFL command or event | APIs through the ZDL | [NAV-R15](#nav-r15), [NAV-R16](#nav-r16) from the ZDL | after ZFL to ZDL |
| OpenAPI and AsyncAPI `$ref`, AsyncAPI payload, Avro types | referenced node | [NAV-R17](#nav-r17) | exists |
| AsyncAPI channel or message, OpenAPI operation | ZDL method or event | [NAV-Q7](#nav-q7) | later wave |
| AsyncAPI client spec | producer channel | [NAV-Q8](#nav-q8) | later wave |
| Avro schema | ZDL event, input or output | [NAV-Q6](#nav-q6) | open |
| Manifest service | artifacts, repository, docs | [NAV-R18](#nav-r18) | proposed |
| Any declaration | its uses, open or not | [NAV-R19](#nav-r19), [NAV-R20](#nav-r20), [NAV-R21](#nav-r21) | proposed |

## LSP surface

Navigation uses `textDocument/definition`, `textDocument/references`, `textDocument/documentSymbol` and
`textDocument/hover`. `zenwave/forwardReferences` serves forward references, and the hierarchy's `relatedResources`
serve *Open Related* ([LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9)). The semantic resolution lives in
`lsp-core`, not in an IDE client.

## Open questions

<a id="nav-q1"></a>
**NAV-Q1. What does `call` mean for navigation?** Deferred from this wave.

<a id="nav-q2"></a>
**NAV-Q2. What does `on Outcome` mean for navigation?** Deferred from this wave.

<a id="nav-q3"></a>
**NAV-Q3. Is an end outcome always event-like?** Until then, [NAV-R12](#nav-r12) sends one to its first appearance.

<a id="nav-q4"></a>
**NAV-Q4. How is Java or Kotlin source inferred from a model element?** From `basePackage`, repository layout and
language. Out of scope until decided otherwise (owner, 2026-11-19).

<a id="nav-q5"></a>
**NAV-Q5. Which repository holds the inferred source when several could?** Out of scope with NAV-Q4.

<a id="nav-q6"></a>
**NAV-Q6. Do Avro schemas map back to ZDL elements, and how?**

<a id="nav-q7"></a>
**NAV-Q7. What does navigation from OpenAPI or AsyncAPI back to ZDL and ZFL do?** Including the precedence between
`api`, `channel`, `topic` and message. A later wave (owner, 2026-11-19); it needs [NAV-R20](#nav-r20) first.

<a id="nav-q8"></a>
**NAV-Q8. How does a consumer's `asyncapi-client.yml` reach the producer's channels, and an artifact its owning
service?** Deferred since the first draft, with producer and consumer validation.

<a id="nav-q9"></a>
**NAV-Q9. How are credentials given for a direct remote location?** A remote the manifest declares uses
[AR-R7](../flows/architecture-resources.md#ar-r7). A direct URL in `@zdl` or `apis` has no credentials today
([NAV-R10](#nav-r10)).

<a id="nav-q10"></a>
**NAV-Q10. Under what address does a direct remote open?** [AR-R2](../flows/architecture-resources.md#ar-r2) refuses
any `zenwave:` address the manifest does not declare, and a direct URL in a model is not declared. Opening it
read-only in the editor ([NAV-R10](#nav-r10)) needs an address, and a reason that does not reopen what AR-R2 closes.

<a id="nav-q11"></a>
**NAV-Q11. What does background indexing cost on the JS server?** One thread serves every request
([backlog 001/2.17](../work/backlog.md)). To measure on a real architecture before [NAV-R20](#nav-r20) is built. **Answered 2026-11-22:** measured on lsp-js under Node (Arcadia: 11 model files in 0.6 s; synthetic 480 files in 7.2 s, 1920 in 20.6 s; about 10 ms per warm file; about 460 KB retained per file through the open-document path). The owner accepted: index at start, in the background, yielding to requests every 4 ms of work or less, open files first (a single file's parse is not split, so one slow file may delay a request by its parse time); index the local workspace files, skipping dot-directories (the manifest is not the source of the set for now); cap the first pass at about 500 files, beyond which files are indexed on demand and the index reports itself partial; keep only the references of a closed file, not its parse cache. Harness: zenwave-lsp `feature/nav-index-bench` (`lsp-js/bench/`).
