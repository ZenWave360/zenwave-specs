# The ZenWave Platform manual

The one place where the ZenWave platform is described: what it is for, how the pieces fit, what
crosses between repositories, why things are the way they are, and what comes next. It is written to
be read by people first, and it is also the working memory for future work, articles, talks and
agents.

## Read it in this order

New here? Parts I and II are enough to understand the platform. The rest is reference: go to the part
you need.

### Part I. The platform

1. [What it is](architecture/zenwave-platform.md): purpose, lifecycle, capabilities, principles.
2. [The world model](architecture/world-model.md): concept, representation, location, and the rules
   that govern everything else.
3. [The stack](architecture/stack.md): repositories, layers, where each thing runs.
4. [Status](architecture/status.md): what is built, what is not, where documents and code disagreed.
5. [Glossary](architecture/glossary.md).

### Part II. The architecture model

`zenwave-architecture`: from a manifest to a graph an agent can query.

1. [Workspace model](zenwave-architecture/workspace-model.md): semantic IDs, kinds, the Query API.
2. [Source resolution](zenwave-architecture/source-resolution-specification.md): the contract, with
   [a guide](zenwave-architecture/source-resolution-guide.md) of worked examples.
3. [Operation bindings](zenwave-architecture/architecture-operation-bindings.md).
4. [Diagnostics](zenwave-architecture/diagnostics.md).
5. [MCP adapter](zenwave-architecture/mcp-adapter.md): how an agent reaches it.

### Part III. The languages and the server

`dsl-kotlin` and `zenwave-lsp`.

1. [Parser contracts](dsl-kotlin/parser-architecture-and-contracts.md): ZDL, ZFL and what they produce.
2. [`@outcome`](dsl-kotlin/outcome-spec.md) and the [formatter](dsl-kotlin/formatter-spec.md).
3. [Server architecture](zenwave-lsp/server-architecture.md): what is inside the language server.
4. [LSP adapter](zenwave-lsp/lsp-adapter.md): two reference systems, two planes.
5. [Navigation](zenwave-lsp/navigation-spec.md) and [completion](zenwave-lsp/completion-spec.md).

<a id="part-iv-flows-across-repositories"></a>
### Part IV. Flows across repositories

A capability followed end to end. Breaking one of these breaks another repository.

- [EventFlow](flows/eventflow.md): from a ZFL file to an interactive diagram and back to the code.
- [Webview protocol](flows/eventflow-webview-protocol.md): how a host drives the page.
- [Visualization requests](flows/lsp-visualization-requests.md): the `zenwave/*` requests, and their [wire reference](flows/lsp-visualization-requests.md#wire-reference).
- [DSL parser output](flows/dsl-parser-output.md): what a consumer can rely on.
- [KMP browser runtime](flows/kmp-browser-runtime.md): what every library owes a browser.
- [SDK plugin catalogue](flows/sdk-plugin-catalogue.md): how the SDK describes itself to IDEs.
- [Transitions without an id](flows/transitions-without-id.md): from the validator to generated code.

### Part V. Clients and visualisation

- [Vistas scope](zenwave-architectural-vistas/REPOSITORY_SCOPE.md): the renderers and the page.
- [VS Code client architecture](zenwave-platform-vscode/architecture.md), then its capabilities:
  [hosts](zenwave-platform-vscode/host-capabilities.md),
  [languages](zenwave-platform-vscode/languages.md),
  [LSP client](zenwave-platform-vscode/lsp-client.md),
  [SDK runner](zenwave-platform-vscode/sdk-runner.md),
  [EventFlow panel](zenwave-platform-vscode/eventflow-panel.md),
  [model preview](zenwave-platform-vscode/model-preview.md),
  [model explorer](zenwave-platform-vscode/model-explorer.md),
  [model actions](zenwave-platform-vscode/model-actions.md),
  [release](zenwave-platform-vscode/release.md).

<a id="part-vi-what-comes-next"></a>
### Part VI. What comes next

- [Backlog](work/backlog.md): everything still open, by repository.
- [Resource discovery](roadmap/resource-discovery.md): reaching the documents around an architecture.
- [Event Storming whiteboard](roadmap/event-storming-whiteboard.md): from the workshop to ZFL.
- [Web Explorer](roadmap/web-explorer.md).

### Decisions

[One short file per decision](decisions/README.md), with the reason. Read them before changing what
they fix. Those marked "owner review pending" were taken by agents.

## How the folders are organised

```
architecture/     what the platform is and how it fits together
<project>/        what concerns one project; the folder has the project's name
flows/            a capability followed end to end, across repositories
decisions/        one short file per decision, with the reason
roadmap/          designed and not built
work/             the backlog
contracts/        message and data shapes, when one stops moving   (to come)
tools/            check-refs.mjs
```

What stays in each repository: `README`, `CHANGELOG`, `LICENSE`, `CONTRIBUTING`, `RELEASING`, release
notes and publishing procedures, files that are part of a published package, test fixtures and
generated output. Each repository has a `docs/README.md` that points here.

## Writing a document

A document is prose. It has these parts, in this order, and skips any that do not apply:

1. **What it is and its status.** One paragraph, with a date.
2. **Scope.** In and out.
3. **Who owns what.** A table, when more than one repository takes part.
4. **How it works today.** Verified facts, each with where it was checked.
5. **Rules.** The behaviour we want, in plain sentences. Add a short example when it helps. Mark each
   *exists*, *partial*, *proposed* or *superseded*.
6. **Open questions.** Numbered, never deleted: when answered, move the answer into a rule or a
   decision and say so.
7. **Sources.**

Link to the documents it relies on, and say what it does not cover. Not given-when-then. If a rule
needs a scenario to be understood, write the scenario as an example sentence. Rules migrated from
OpenSpec still use `SHALL` and given-when-then; rewrite them when you next edit them.

## Ids

Every rule, fact, question and decision a reader may want to point at has a stable id and an explicit
anchor placed before it:

```
<a id="ef-r4"></a>
**EF-R4 (proposed). The page does not know where code is.** ...
```

Prefixes: `T` today's facts, `R` rules, `Q` open questions. Ids are never reused and never renumbered.
Titles can change freely; the anchor cannot.

Code, tests and other documents cite them as `spec:<document>#<id>`, for example
`spec:eventflow#ef-r4`.

## Keeping citations honest

```bash
node tools/check-refs.mjs                    # scans the sibling repositories
node tools/check-refs.mjs ../zenwave-platform-vscode
```

It fails when a citation names a document or id that no longer exists, and when a relative link between
documents is broken. Run it in each repository's CI.

## Changing a rule that code implements

The spec change and the code change land in different repositories, so they are two commits. Order them so
the spec says what the code is about to do: edit the document first, mark the rule *proposed*, and flip it
to *exists* in the commit that makes it true.

Rules for working here, for people and agents, are in [AGENTS.md](AGENTS.md).
