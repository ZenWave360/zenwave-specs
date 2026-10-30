# Workspace model

<a id="workspace-model"></a>

How the [world model](../architecture/world-model.md) becomes a graph and an API: the
manifest as anchor, semantic IDs, node and edge kinds, the Workspace Query API,
diagnostics and how all of it is validated. Implemented in `zenwave-architecture`
(`architecture-graph`, `workspace-runtime`, `workspace-cli`).

**Status:** draft, 2026-10-30. Moved from Part II of the original workspace
specification, which expected to change as Arcadia Editions teaches things. Part II
never overrides the world model.

## How this document relates to the code

Verified on 2026-10-30 against `zenwave-architecture`
(`architecture-graph`, `workspace-runtime`, the 1.0 manifest schema). The sections
below keep the original design. Where the code has moved on, these facts win:

<a id="wmodel-t1"></a>
**WMODEL-T1. Manifest shape.** There is no `workspace:` block. A manifest has `config`
and `domains` (`subdomains` optional), services declare `artifacts` with a required
`version`, and `aliases` exist in the schema. The authoritative description is
[source resolution](source-resolution-specification.md). The example in section 7 is
illustrative only.

<a id="wmodel-t2"></a>
**WMODEL-T2. Kinds.** `ArchitectureNodeKind` and `ArchitectureEdgeKind` in
`ArchitectureGraph.kt` are the current list. They add ZDL and ZFL representation kinds
(`ZDL_METHOD`, `ZFL_OPERATION`, `ZFL_STEP`, ...) and edges such as `RESOLVES_TO`,
`OCCURRENCE_OF` and `BINDS_TO`, explained in
[operation bindings](architecture-operation-bindings.md). The lists in section 9 are
the original taxonomy.

<a id="wmodel-t3"></a>
**WMODEL-T3. Query API.** `WorkspaceQueryApi` has one operation more than section 12
shows: `at(location, limit)`, the reverse-provenance lookup. That answers the open
question about it in section 22: it is a Query API operation. Results are wrapped
(`PageResult`, `SearchResult`) and carry `truncated`; kinds are strings.

<a id="wmodel-t4"></a>
**WMODEL-T4. Diagnostic codes.** Codes are kebab-case strings such as
`duplicate-graph-node`, not `ZW1042`. The catalogue is [diagnostics](diagnostics.md).

<a id="wmodel-t5"></a>
**WMODEL-T5. Not built.** The MCP tools exist without a runnable server (see the
[MCP adapter](mcp-adapter.md)), `zenwave validate` exists as `workspace-cli`, and the
Web Explorer is VS Code in web mode, not a separate site (see
[decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md)). The
`ArtifactIndexer` / `RelationshipResolver` split in section 17 was not checked.


<a id="wmodel-7"></a>
## 7. Workspace descriptor

A Workspace is anchored by one Master YAML manifest and may span multiple
repositories and remote sources. It is not equivalent to a Git repository or a
local directory.

```yaml
workspace:
  id: arcadia-editions
  name: Arcadia Editions

domains:
  sales:
    subdomains:
      ordering:
        services:
          order-service:
            aliases:
              - orders-service
              - legacy-order-api
            repository: https://example.org/arcadia/orders.git
            artifacts:
              - type: asyncapi
                path: asyncapi.yaml
              - type: zdl
                path: model/orders.zdl
```

The existing manifest schema remains authoritative. This spec adds `aliases`.

<a id="wmodel-8"></a>
## 8. Semantic ID grammar

```
zw:<domain>[/<subdomain>[/<service>[/<concept-type>/<concept-name>]]]
```

```
zw:sales
zw:sales/ordering
zw:sales/ordering/order-service
zw:sales/ordering/order-service/event/OrderPlaced
zw:sales/ordering/order-service/command/PlaceOrder
zw:sales/ordering/order-service/flow/PlaceOrder
zw:sales/ordering/order-service/api/orders
```

Artifacts get identity when the artifact is itself a first-class concept:

```
zw:sales/ordering/order-service/artifact/asyncapi/orders
```

Rules:

- A prefix of a valid ID is a valid ID where the hierarchy exists.
- Structural segments are lowercase kebab-case.
- Concept names preserve the casing of the authoritative source.
- Canonicalization is deterministic and implemented once in the KMP core.
- Artifact-internal pointers are never part of an ID.

Version is a resolution coordinate, not identity:

```
zw:sales/ordering/order-service/artifact/asyncapi/orders@1.4.0
```

Absent version means Workspace resolution order: workspace, Apicurio,
Artifactory, git.

<a id="wmodel-9"></a>
## 9. Node and edge kinds

Concept kinds:

```
workspace | domain | subdomain | service
aggregate | entity | command | event | policy
flow | step
capability
```

Representation kinds:

```
artifact | api | operation | channel | message | schema
source-symbol | topic | queue | subscription
repository | infrastructure-resource
```

Representation nodes link to their concept with `REPRESENTS`. Where no concept
exists yet, a representation may stand alone. It does not become one by default.

Edge kinds:

```
owns | contains | references
represents
publishes | subscribes
calls | implements | implemented-by
emits | handles | triggers
uses-schema | transported-by
compensates | depends-on
```

Both sets are additive. Consumers tolerate unknown kinds.

<a id="wmodel-10"></a>
## 10. Core shapes

Every element response carries `id`, `kind` and `name`. No exceptions. Agents
branch on `kind`. The UI picks an icon from it.

```json
{
  "id": "zw:sales/ordering/order-service",
  "kind": "service",
  "name": "Order Service",
  "identityOrigin": "explicit"
}
```

Provenance:

```json
{
  "id": "zw:sales/ordering/order-service/event/OrderPlaced",
  "kind": "event",
  "name": "OrderPlaced",
  "provenance": [
    { "kind": "zdl", "repository": "orders", "path": "model/orders.zdl", "symbol": "OrderPlaced" },
    { "kind": "asyncapi", "repository": "orders", "path": "asyncapi.yaml", "pointer": "/components/messages/OrderPlaced" },
    { "kind": "java", "repository": "orders", "path": "src/main/java/com/example/orders/events/OrderPlaced.java", "symbol": "com.example.orders.events.OrderPlaced" }
  ]
}
```

Relationship with provenance and confidence:

```json
{
  "from": "zw:sales/ordering/order-service",
  "to": "zw:sales/ordering/order-service/event/OrderPlaced",
  "kind": "publishes",
  "confidence": "DECLARED",
  "provenance": [
    { "kind": "asyncapi", "path": "asyncapi.yaml", "pointer": "/channels/order-created" }
  ]
}
```

Line numbers are navigation hints. They are never part of identity.

<a id="wmodel-11"></a>
## 11. Resolution

```kotlin
sealed interface ResolutionResult {

    data class Resolved(
        val node: Node,
        val redirectedFrom: SemanticId? = null
    ) : ResolutionResult

    data class NotFound(
        val candidates: List<NodeRef>
    ) : ResolutionResult
}
```

A nullable `Node?` cannot carry a redirect or candidates. Both are needed.

An alias hit is successful resolution:

```json
{
  "node": { "id": "zw:sales/ordering/order-service", "kind": "service", "name": "Order Service" },
  "redirectedFrom": "zw:sales/ordering/orders-service"
}
```

Clients update stored links when they choose. ZenWave Platform rewrites nothing on their
behalf.

An alias that collides with a live canonical ID is a diagnostic error.

<a id="wmodel-12"></a>
## 12. Workspace Query API

```kotlin
interface WorkspaceQueryApi {

    suspend fun overview(): WorkspaceOverview

    suspend fun resolve(id: SemanticId): ResolutionResult

    suspend fun children(
        id: SemanticId,
        kinds: List<NodeKind> = emptyList(),
        page: Page? = null
    ): List<NodeRef>

    suspend fun search(
        query: String,
        kinds: List<NodeKind> = emptyList(),
        scope: SemanticId? = null,
        limit: Int = 20
    ): List<NodeRef>

    suspend fun related(
        id: SemanticId,
        direction: Direction = BOTH,
        edgeKinds: List<EdgeKind> = emptyList(),
        depth: Int = 1,
        confidence: List<Confidence> = Confidence.all,
        origin: List<IdentityOrigin> = IdentityOrigin.all,
        maxNodes: Int = 100
    ): Subgraph

    suspend fun sources(id: SemanticId): List<Provenance>

    suspend fun diagnostics(
        scope: SemanticId? = null,
        severity: Severity? = null
    ): List<Diagnostic>
}
```

Ordering from `children` is deterministic and follows manifest order where
available. The tree must not jump between refreshes.

<a id="wmodel-12-1"></a>
### 12.1 Traversal contract

`related` is the operation that tests whether the abstraction is right.

```json
{
  "id": "zw:sales/ordering/order-service",
  "direction": "outgoing",
  "edgeKinds": ["publishes", "calls"],
  "confidence": ["DECLARED", "RESOLVED"],
  "depth": 2,
  "maxNodes": 100
}
```

A Vistas diagram and an agent asking about impact are the same call with
different arguments. If the Web Explorer needs a traversal operation purely
because it is graphical, reconsider the abstraction.

Response separates nodes from edges so clients do not de-duplicate a nested
tree:

```json
{
  "nodes": [
    { "id": "zw:sales/ordering/order-service/event/OrderPlaced", "kind": "event", "name": "OrderPlaced" }
  ],
  "edges": [
    {
      "from": "zw:sales/ordering/order-service",
      "to": "zw:sales/ordering/order-service/event/OrderPlaced",
      "kind": "publishes",
      "confidence": "DECLARED"
    }
  ],
  "truncated": false
}
```

`truncated` is present whenever bounds can apply. An agent must be able to tell
a complete answer from a bounded one.

<a id="wmodel-12-2"></a>
### 12.2 Deferred operations

`impact`, `trace` and `findPath` are not in v1. They may be added if real usage
shows they are genuine domain-level queries rather than adapter conveniences.

`dependencies` and `dependents` are not operations. They are `related` with a
direction.

<a id="wmodel-13"></a>
## 13. Diagnostics

Diagnostics belong to the Workspace Runtime, not to any adapter. The graph
builder emits them keyed by semantic ID.

```json
{
  "id": "zw:sales/ordering/order-service/command/PlaceOrder",
  "severity": "error",
  "code": "ZW1042",
  "message": "Command target service not found in workspace",
  "provenance": { "repository": "orders", "path": "model/orders.zfl", "line": 34 }
}
```

Severity is `error`, `warning` or `info`. Codes are stable and documented in
[diagnostics](diagnostics.md). CI gates on `error`.

Adapters republish these diagnostics with their `code`, `severity` and
`semanticId` unchanged. An adapter that renames a code or downgrades a severity
has forked the catalogue.

Initial checks:

- Unresolvable reference from any artifact.
- Alias colliding with a live canonical ID.
- Duplicate derived ID.
- Declared artifact missing from its repository.
- Relationship pointing at an unknown node.
- Representation node with no `REPRESENTS` edge where a concept was expected.

`zenwave validate` exposes these before MCP or Web consumers exist. This is
deliberate. It tests the identity scheme against real data while changing it is
still cheap.

<a id="wmodel-15"></a>
## 15. Error semantics

| Condition | Behaviour |
|---|---|
| Unknown semantic ID | Not-found with closest candidates |
| Ambiguous search | Return candidates, never guess |
| Alias hit | Canonical node plus `redirectedFrom` |
| Unresolvable remote source | Keep the node, report unresolved provenance |
| Traversal bound exceeded | Partial subgraph with `truncated: true` |
| Unknown kind | Consumers tolerate additive values |

A remote source failure degrades available knowledge. It does not fail unrelated
queries. Local architectural work must not depend on Apicurio, Artifactory or a
Git host being reachable.

<a id="wmodel-16"></a>
## 16. Validation

<a id="wmodel-16-1"></a>
### 16.1 Arcadia Editions

Primary rich Workspace. A new agent session should answer:

- What domains and services exist?
- Explain how ordering works.
- What produces OrderPlaced? What consumes it?
- Which API exposes the ordering capability?
- Where is OrderPlaced represented?
- What depends on the Orders API?
- Which of those relationships are declared, and which are inferred?

The last question is the confidence model earning its place.

<a id="wmodel-16-2"></a>
### 16.2 API-only Workspace

Mandatory, not optional.

Contains only Master YAML, Git repositories, OpenAPI and AsyncAPI. No ZDL. No
ZFL. No Event Storming.

This is the test that stops ZenWave-native DSLs from becoming accidental
prerequisites for the world model. Section 5.5 is a claim until this passes.

<a id="wmodel-16-3"></a>
### 16.3 Rename scenario

Move a service between domains, add the alias, and confirm every previously
stored ID still resolves with `redirectedFrom`.

An alias mechanism nobody has exercised is not shipped.

<a id="wmodel-17"></a>
## 17. Extensibility

New sources enrich the graph without MCP changes.

```kotlin
interface ArtifactIndexer {
    fun supports(artifact: Artifact): Boolean
    suspend fun index(workspace: Workspace, artifact: Artifact): GraphFragment
}

interface RelationshipResolver {
    val maxConfidence: Confidence
    suspend fun resolve(workspace: Workspace, graph: ArchitectureGraph): List<ArchitectureRelationship>
}
```

Indexers: Manifest, OpenApi, AsyncApi, Zdl, Zfl, JavaMetadata, Terraform,
ArchiMate.

Resolvers: SpringMvc, SpringCloudStream, KafkaTopic, ZenWaveGeneratedCode,
NamingConvention.

```
SpringCloudStreamResolver   -> INFERRED_EXACT
NamingConventionResolver    -> INFERRED_HEURISTIC
```

`maxConfidence` is declared, not chosen per edge. One loose resolver must not be
able to claim `DECLARED`.

<a id="wmodel-18"></a>
## 18. Build order

```
 1  Semantic ID model, concept vs representation
 2  Aliases and canonical resolve in the KMP core
 3  Provenance model
 4  Confidence model
 5  Diagnostics keyed by semantic ID
 6  zenwave validate
 7  Workspace Query API
 8  Minimal MCP adapter
 9  Validate against Arcadia Editions
10  Validate against the API-only Workspace
11  Rename scenario
12  Web Explorer (VS Code web mode) over the same Query API
13  Richer traversal, only if usage demands it
14  LSP adapter                                     LSP adapter, section 14
15  Thin IntelliJ and VS Code integrations          LSP adapter, section 10
```

MCP comes before the Web Explorer on purpose. An agent consumer forces the Query
API to become a real architecture contract instead of whatever one screen
happened to need. The LSP adapter follows both for the same reason: an editor
screen would shape the Query API into whatever that screen needed.

Steps 14 and 15 have their own build order in [LSP adapter](../zenwave-lsp/lsp-adapter.md), because the LSP
adapter is a convergence with an existing document language server rather than a
greenfield surface.

<a id="wmodel-19"></a>
## 19. Success criterion

An agent connects to a ZenWave Platform Workspace and meaningfully navigates and explains
the system through semantic architecture queries, without reconstructing the
architecture from raw repository files.

Desirable:

```
workspace -> search("ordering") -> resolve(order-service)
  -> related(order-service) -> related(OrderPlaced)
  -> sources(relevant concepts)
  -> read implementation only where necessary
  -> answer
```

Undesirable:

```
clone everything -> grep everything -> read hundreds of files
  -> infer architecture probabilistically
```

<a id="wmodel-22"></a>
## 22. Open questions

- Exact artifact semantic-ID grammar.
- Namespace rules for colliding concept names within one service.
- Alias interaction with version coordinates.
- Cross-Workspace semantic references.
- Whether Workspace IDs require global uniqueness.
- Persistent graph and index storage.
- Server-side maximum traversal depth and node count.
- Whether documentation artifacts participate in traversal or stay leaf
  provenance.
- Semantic and vector search implementation.
- Mutation and editing APIs.
- Source linkage for non-ZenWave-generated applications.
- Remote Workspace hosting and authorization.
- Architecture-drift diagnostics beyond structural validation.
- Whether a shared Workspace daemon serves MCP, the Web Explorer and the LSP
  from one graph, or each adapter builds its own.
- Whether reverse provenance, "which element claims this file and position",
  is a Query API operation. Raised by [LSP adapter](../zenwave-lsp/lsp-adapter.md) section 2.3; the Web
  Explorer will ask the same question.

Aliases, diagnostics, confidence filtering and the concept/representation
distinction are not open. They are Part I.

Adapter-local open questions live in the adapter specification, not here.
