# The world model

<a id="world-model"></a>

The rules that define what the platform is: what a concept is, what identity means,
what must never leak into what. Every other document in this manual is governed by
this one, and when one of them conflicts with it, that document is wrong.

**Status:** 2026-10-30. Moved unchanged from Part I of the original workspace
specification. Implementation state is in [status](status.md); the concrete graph and
API are in the [workspace model](../zenwave-architecture/workspace-model.md).

These rules are meant to be hard to change. Changing one is a redesign, not a
revision.

---

<a id="wm-1"></a>
## 1. What ZenWave Platform is

ZenWave Platform is a semantic architecture runtime.

It makes the architecture of a software system directly navigable by humans and
agents, without either party reconstructing that architecture from raw files.

What it is not:

- Not an IDE.
- Not a RAG system.
- Not a source-code search platform.
- Not a graph database product.
- Not a documentation generator.

Each of these is a plausible drift direction. Each would consume the project.

<a id="wm-2"></a>
## 2. The problem

Architects, developers, domain experts and agents need to understand systems
whose knowledge is distributed across many repositories and artifacts.

Today those questions are answered by locating and opening files. That does not
scale, it is expensive for agents, and it is fragile under refactoring because
paths and repository structures change.

<a id="wm-3"></a>
## 3. Concept, representation, location

This is the central distinction in ZenWave Platform. Everything else follows from it.

```
semantic identity  !=  representation  !=  source location
```

<a id="wm-3-1"></a>
### 3.1 Concepts

A concept is an architectural thing that exists independently of how it is
written down. A domain. A service. A command. An event. A flow. A capability.

`OrderPlaced` is one concept.

<a id="wm-3-2"></a>
### 3.2 Representations

A representation is a concrete expression of a concept in some formalism.

```
ZDL:      event OrderPlaced
AsyncAPI: #/components/messages/OrderPlaced
Java:     com.example.orders.events.OrderPlaced
Kafka:    sales.orders.order-placed
```

Four representations. One concept.

<a id="wm-3-3"></a>
### 3.3 Locations

A location is where a representation physically lives. Repository, path,
pointer, symbol, line.

Locations are the most volatile layer. They change on every refactor.

<a id="wm-3-4"></a>
### 3.4 The rule

Concepts carry canonical semantic identity.

Representations may be graph nodes when they are architecturally meaningful in
their own right, such as an API operation or a channel. When they are, they link
to their concept with a `REPRESENTS` edge. They are never siblings of the
concept they represent.

Locations are never nodes. They are provenance.

```
zw:sales/ordering/order-service/event/OrderPlaced        concept
        ^
        | REPRESENTS
        |
zw:sales/ordering/order-service/channel/order-created    representation
        |
        +-- provenance: asyncapi.yaml #/channels/order-created   location
```

This rule exists because a taxonomy that lists `event` and `message` as peer
kinds will produce a graph where nobody can tell which node is the thing and
which is a description of the thing. That confusion is not recoverable once
agents have been trained on the output.

<a id="wm-4"></a>
## 4. Identity invariants

<a id="wm-4-1"></a>
### 4.1 Identity is not location

A semantic ID must not depend on repository URL, branch, filesystem path,
document path, JSON or YAML pointer, source line number, or artifact version.

<a id="wm-4-2"></a>
### 4.2 Identity survives physical change

A semantic ID does not change when a file moves, a repository is renamed, a Git
host changes, an artifact is split across files, line numbers change, an API
document is versioned, or generated source is regenerated.

<a id="wm-4-3"></a>
### 4.3 Identity may change on a semantic move

Semantic IDs contain architectural hierarchy. That is deliberate: it makes them
readable, browsable, scopeable and meaningful in a log or a conversation.

The cost is that a genuine architectural move changes the canonical ID.

```
zw:sales/ordering/order-service/event/OrderPlaced
        becomes
zw:sales/fulfilment/fulfilment-service/event/OrderPlaced
```

This is accepted. Continuity is provided by aliases.

ZenWave Platform does not replace meaningful IDs with opaque UUIDs to make semantic moves
invisible. Readability is worth more than move-transparency, given that aliases
solve the continuity problem.

<a id="wm-4-4"></a>
### 4.4 Aliases are part of identity, not an add-on

Semantic IDs escape into diagnostics, CI logs, bookmarks, Web Explorer URLs, MCP
conversations, documentation, IDE navigation and stored agent context.

An identity model without aliases is an identity model that breaks all of those
on the first rename. Aliases are v1 and are never deferred.

Aliases are append-only. Removing a published alias is a breaking change.

<a id="wm-4-5"></a>
### 4.5 Resolution is deterministic and singular

There is exactly one semantic ID resolver in the KMP core. MCP, Web Explorer,
diagnostics, CLI and future LSP navigation all delegate to it.

Multiple resolvers are forbidden. They drift.

Resolution never falls back to fuzzy matching. Identity resolution and human
discovery are different operations with different failure modes. Mixing them
lets ambiguity contaminate identity semantics.

<a id="wm-5"></a>
## 5. Knowledge invariants

<a id="wm-5-1"></a>
### 5.1 Sources remain authoritative

The graph is derived. It is not the primary source of truth.

```
Manifest / APIs / DSLs / repositories / registries
                    |
                    v
            Workspace Runtime
                    |
                    v
           Architecture Graph
```

Indexes and caches may be persisted. They must remain rebuildable.

<a id="wm-5-2"></a>
### 5.2 Provenance answers why, not just where

Provenance is not a file pointer. It is the justification for a piece of
knowledge.

The question it answers is: *why does ZenWave Platform believe this?*

This applies to relationships as much as nodes. `OrderService PRODUCES
OrderPlaced` may exist because AsyncAPI declares it, or because a Spring Cloud
Stream indexer inferred it. Those are different facts about the same edge, and
an agent reasoning about risk needs to tell them apart.

<a id="wm-5-3"></a>
### 5.3 Confidence is what makes inference safe

Every relationship records how ZenWave Platform knows it.

```
DECLARED            stated by an architectural source
RESOLVED            deterministically dereferenced
INFERRED_EXACT      deterministic integration rule
INFERRED_HEURISTIC  convention, naming, probabilistic match
```

Heuristic inference must never silently become architectural truth.

Confidence is therefore both returned and queryable. Without a filter, one loose
resolver degrades every answer in the graph, and there is no way to ask what the
architecture actually states.

Every resolver declares the maximum confidence it may emit. A naming-convention
resolver may not produce `DECLARED`.

<a id="wm-5-4"></a>
### 5.4 Structured knowledge before retrieval

Deterministic graph queries come before embedding-based retrieval. Semantic
search may complement the graph for fuzzy discovery. It is not the source of
architectural truth.

<a id="wm-5-5"></a>
### 5.5 Progressive enrichment

ZenWave Platform must be useful without ZenWave-specific DSLs.

```
Level 1   domains, services, repositories, OpenAPI, AsyncAPI
Level 2   producers, consumers, topology, infrastructure
Level 3   aggregates, commands, events, policies
Level 4   business and event flows
Level 5   implementation traceability
```

No level is a prerequisite for the levels below it. ZDL, ZFL and Event Storming
are enrichment layers.

This is not a marketing position. It is a constraint on the graph model, and it
is validated by a mandatory test workspace ([workspace model §16.2](../zenwave-architecture/workspace-model.md#wmodel-16-2)).

<a id="wm-6"></a>
## 6. Boundary invariants

<a id="wm-6-1"></a>
### 6.1 The Workspace Query API exposes projections, not screens

```
getDetailPanel
getSidebarTree
getGraphView
```

None of these belong in the Workspace Query API. A projection that serves only
one screen or one adapter is not a projection.

<a id="wm-6-2"></a>
### 6.2 Adapters add no graph semantics

```
MCP        Web Explorer        LSP
 |              |               |
 +--------------+---------------+
                |
                v
      Workspace Query API
                |
                v
       Architecture Graph
```

MCP adds protocol mapping, argument validation, result bounds and readable
summaries. It adds no query logic. Neither does the Web Explorer, and neither
does the LSP.

If an adapter needs graph semantics that do not exist in the Query API, either
the Query API is wrong or the adapter is overreaching. Resolve that question,
do not route around it.

Every adapter feature must be expressible as a Query API call. An adapter
specification that cannot write that mapping down has not found the boundary
yet.

<a id="wm-6-3"></a>
### 6.3 The visualization model is not the architecture model

Architectural Vistas are projections of the graph. Layout, grouping and visual
affordances belong to the Web Explorer. They must not flow back into the graph.

<a id="wm-6-4"></a>
### 6.4 The document model is not the architecture model

LSP concepts, URI, line, position, range, document symbol, must never become
foundational to the architecture graph. LSP is an adapter that projects the
graph into a document-centric view.

A document reference is a location, in the sense of section 3.3. It is never
called a semantic ID, never stored by a client as an identity, and never used
as a graph key. Two things named `SemanticId`, one of which is a URI plus a
document path, is section 4.5 already violated.

[LSP adapter §2 and §9](../zenwave-lsp/lsp-adapter.md#lsp-2) hold the adapter side of this boundary.

<a id="wm-6-5"></a>
### 6.5 ZenWave Platform is not a code intelligence tool

```
              Agent
             /     \
    ZenWave MCP   Code MCP
         |             |
  architecture       code
```

ZenWave Platform answers questions about domains, services, repositories, APIs,
operations, events, messages, flows, contracts and architectural relationships.

A code intelligence tool such as Serena answers questions about classes,
methods, symbols, call hierarchies and method bodies.

They are peers. ZenWave Platform may know:

```
OrderPlaced IMPLEMENTED_BY repository X, symbol Y
```

without indexing the body of symbol Y. The agent takes those coordinates to a
code tool.

This boundary is what keeps the project finishable.

---

## Where to go next

- [The stack](stack.md): the repositories and runtimes that implement this.
- [Workspace model](../zenwave-architecture/workspace-model.md): IDs, kinds, the Query API.
- [Glossary](glossary.md): the vocabulary in one place.
