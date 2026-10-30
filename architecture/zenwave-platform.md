# ZenWave Platform

<a id="zenwave-platform"></a>

What the platform is, what it is for, and how the repositories described here fit
into it. Start here.

**Status:** 2026-10-30. Purpose and capabilities follow the public descriptions
linked below; when they change, this document follows them. What is finished is in
[status](status.md).

## Public descriptions

- **zenwave360.io**, section *What ZenWave Platform Is*:
  [www.zenwave360.io](https://www.zenwave360.io/#platform-title)
  (source: [`src/pages/index.astro`](https://github.com/ZenWave360/ZenWave360.github.io/blob/main/src/pages/index.astro)).
- **ivangsa.com**, *Projects*, group *ZenWave Platform*:
  [ivangsa.com/projects](https://ivangsa.com/projects/)
  (source: [`src/pages/projects/index.astro`](https://github.com/ivangsa/ivangsa/blob/main/src/pages/projects/index.astro)).

## Purpose

<a id="zp-purpose"></a>
ZenWave started as **ZenWave SDK**: a way to think about software, talk about it and
validate it before writing code, and then generate the parts that are already
present in the model. **ZDL** compresses the design of a service so it fits in your
head; the SDK turns it into a Spring Boot backend, API contracts, tests and
infrastructure that stay aligned with the model. It has been in production since
2022 and open source from the start.

<a id="zp-goal"></a>
**ZenWave Platform** takes that further. Its goal is to make the big picture of a
software system **explicit, connected and navigable**, for people and for agents:
an *architectural world model* that links business flows, domain models, API and
event contracts, schemas, source code and repositories, so that you can move from
any of them to the others.

The model is shared by three kinds of consumer:

- **humans explore** it, in the IDE and in documentation;
- **tools connect** to it, to generate, validate and publish;
- **AI understands** it, through the language server and MCP, so an agent works
  from the same architecture a person sees.

What that model is, precisely, and what it must never become is the
[world model](world-model.md).

## The lifecycle it supports

<a id="zp-lifecycle"></a>
The platform follows a system from the first workshop to running code, iteratively
and with AI assistance at each step:

| Stage | What happens | With |
| --- | --- | --- |
| **Discover** | Domain experts and engineers find the business events and flows | Event Storming ([whiteboard, planned](../roadmap/event-storming-whiteboard.md)) |
| **Shape** | The findings become models and contracts | ZFL flows, ZDL domain models, OpenAPI, AsyncAPI |
| **Generate & implement** | The models produce what they already imply | APIs, services, tests, infrastructure |
| **Navigate** | The result stays explorable as one architecture | IDE, MCP, documentation |

## Capabilities

| Capability | What it is | Maturity |
| --- | --- | --- |
| **ZenWave SDK** | Generates Spring Boot services from ZDL, OpenAPI and AsyncAPI | Production ready |
| **AsyncAPI and Avro generator** | Typed Spring Kafka and Spring Cloud Stream producers and consumers | Production ready |
| **ZDL** | Bounded contexts, aggregates, entities, commands, events and services as structured artefacts | Production ready |
| **ZFL** | Business flows as policies connecting commands and events, linked to APIs, schemas and domain models | Building in public |
| **IDE and MCP** | Architecture navigation and context for IDEs and AI agents, from a Kotlin Multiplatform language server: IntelliJ first, VS Code next, MCP for agent workflows | Building in public |
| **EventCatalog generator** | Publish OpenAPI, AsyncAPI and ZenWave models as EventCatalog documentation | Coming soon |
| **asyncapi-ops** | Kafka topics, ACLs and Schema Registry provisioned from AsyncAPI | Beta |

Supporting open source: Spring Modulith Events for Spring Cloud Stream, and the JSON
Schema reference parsers for JVM and Kotlin Multiplatform.

The IDE experience connects domain models, business flows, APIs, source code, local
folders, Git repositories and schema registries (Apicurio).

## The working example

<a id="zp-arcadia"></a>
**Arcadia Editions** is a fictional publisher used as the reference for the platform
idea: from Event Storming to ZFL flows, contracts, services, events and AI-assisted
delivery. Articles: [ivangsa.com/articles/arcadia](https://ivangsa.com/articles/arcadia/).
Code: [github.com/arcadia-editions](https://github.com/arcadia-editions).

## Repositories described here

These specs cover the repositories of the platform's language and IDE stack. Almost
all of them exist to serve the platform; only `dsl-kotlin` and
`json-schema-ref-parser-kmp` are also used outside it. ZenWave MCP will come out of
this stack too. Today it is a set of tools with
[no server yet](../zenwave-architecture/mcp-adapter.md#mcp-t2).

| Repository | Role | Start at |
| --- | --- | --- |
| `dsl-kotlin` | ZDL and ZFL parsers, view models, layout, Mermaid generation; Kotlin Multiplatform | [parser contracts](../dsl-kotlin/parser-architecture-and-contracts.md) |
| `zenwave-architecture` | Architecture manifest and graph, workspace runtime, source resolution, MCP tools; all architectural semantics | [workspace model](../zenwave-architecture/workspace-model.md) |
| `zenwave-lsp` | Language server over the above, JVM and JS transports | [server architecture](../zenwave-lsp/server-architecture.md) |
| `zenwave-architectural-vistas` | Visualisations: EventFlow, Service Map, EventCatalog components, the webview both IDEs embed | [scope](../zenwave-architectural-vistas/REPOSITORY_SCOPE.md) |
| `zenwave-platform-vscode` | The VS Code client, desktop and web | [client architecture](../zenwave-platform-vscode/architecture.md) |
| `json-schema-ref-parser-kmp` | JSON Schema reference parsing, used across the stack | none yet |

How they fit together is [the stack](stack.md). What crosses between them is in
[flows/](../README.md#part-iv-flows-across-repositories), and why things are the way
they are is in [decisions/](../decisions/README.md).

Not described here, although part of the platform: `zenwave-sdk` and the IntelliJ
plugin `ZenWaveDomainModelEditor`. Documents here mention them where a flow reaches
them.

## Principles that follow from the purpose

<a id="zp-principles"></a>
- **The meaning of a model lives in one place.** Parsing, semantics and layout are
  implemented once, in Kotlin Multiplatform, and every client consumes them. A client
  that reinterprets a model is a client that disagrees with the others.
- **Every client shows the same architecture.** IntelliJ, VS Code and agents read the
  same answers from the same server, and embed the same visualisations.
- **Local first, browser included.** Models, diagrams and navigation work without a
  remote service, and in browser-based editors where the platform allows it. What
  cannot run in a host (the JVM-based SDK in a browser) is hidden, not broken.
- **The model stays private.** Nothing renders by sending a model to a third party.
