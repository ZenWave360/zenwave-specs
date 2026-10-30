# Architecture Explorer and remote resource discovery

<a id="resource-discovery"></a>

**Status:** brief; nothing built, 2026-10-30. The current client already has the structured half (the [Architecture tree](../zenwave-platform-vscode/model-explorer.md#me-r2)).
Discovery, the DSL and virtual documents are new. Its direction, VS Code as the host instead of separate portals, was confirmed by [decision 0018](../decisions/0018-vscode-web-mode-is-the-web-explorer.md). Open items are at the end of this document.

## Purpose

This document is a product and engineering brief for implementing the first increment of **ZenWave Platform** as a connected architecture workspace. It captures the decisions made so far, the intended user experience, architectural boundaries, and a practical starting scope. It deliberately avoids low-level implementation prescriptions.

**Positioning:** *Your Software Architecture. Connected. Navigable. Alive.*

ZenWave Platform turns distributed architecture artifacts into a connected, navigable workspace for exploring APIs, events, services, and business flows, directly in an IDE or browser.

## Context and reference

The Arcadia Editions architecture manifest is the reference scenario:

https://github.com/arcadia-editions/arcadia-editions-architecture/blob/main/zenwave-architecture.yml

The manifest is a compact, structured entry point for building an architecture graph. It references architecture artifacts through configurable URL templates and authenticated HTTP retrieval. These artifacts may live in GitHub, GitLab, Bitbucket, Artifactory, Apicurio Registry, or other HTTP-accessible systems, potentially mixed within one architecture. **Do not assume Git protocol access, a single repository, or a single hosting provider.**

The existing ZenWave codebase uses **Kotlin Multiplatform**. VS Code integrations use the VS Code extension APIs and may be written in TypeScript, while reusable domain logic should remain independent of VS Code where practical.

## Product direction

Instead of first building separate architecture, API, and event portals, use **VS Code as a host for architecture exploration**:

- Run the experience in VS Code Desktop and compatible VS Code Web environments.
- Where feasible, let users open a repository in a hosted browser IDE and use the ZenWave extension.
- For enterprise installations that cannot use hosted IDEs, evaluate a self-hosted browser-accessible VS Code-compatible distribution with ZenWave and complementary visualization extensions available.
- Offer a portal-like, primarily read-only experience for browsing architecture, APIs, events, documentation, and business flows.
- Reuse existing local or web-compatible extensions for Markdown, Mermaid, schema formats, and other supported documents rather than building custom viewers unnecessarily.

**Important:** Compatibility and extension-installation behavior vary across github.dev, vscode.dev, GitLab's Web IDE, and self-hosted distributions. Treat support for each host as something to validate, not a blanket guarantee. Enterprise read-only enforcement must happen at the resource/access layer, not merely through hidden editing controls. A shared web deployment must preserve per-user authentication and session isolation even if it stores no persistent user workspace.

## Fundamental separation of concerns

### 1. Architecture graph: explicit and bounded

The main `zenwave-architecture.yml` manifest declares the structured architectural resources and relationships required to construct the architecture graph. Keep it small and manageable. Do **not** turn it into an exhaustive index of Markdown files, ADRs, changelogs, or arbitrary repository contents.

### 2. Resource resolution: existing HTTP-oriented capability

Resource resolution turns a known artifact reference into a URL, applies the configured authentication, and fetches its contents. Preserve the existing provider-neutral URL templating approach. A service might resolve API definitions from Artifactory and documentation from Git, without requiring either to be accessed through the Git protocol.

### 3. Resource discovery: new, optional capability

Resource discovery finds *additional* relevant documents associated with a domain, subdomain, service, or other architecture element. It is not required to construct the core graph. Discovered resources are contextual documents, **not automatically graph nodes**.

### 4. Presentation: VS Code is a host, not the core

The VS Code explorer and document views consume the architecture model and resource discovery capabilities. Keep parsing, resolution, discovery, and reusable visualization logic independent of the VS Code UI where feasible, so a future standalone/static web portal remains possible.

## Intended navigation experience

Provide an architecture tree organized around domains, subdomains, services, APIs, events, and other structured elements. Offer previews and cross-navigation between related elements and their source artifacts.

For an element such as a service, include a distinct **Discover Documentation** node/action. Expanding it starts remote discovery asynchronously. Until then, do not enumerate its associated remote document collections.

Example:

```text
Commerce
  Orders
    Order Service
      Orders API
      Order Events
      Discover Documentation
        README.md
        architecture.md
        ADRs/
          001-event-driven-orders.md
          002-idempotency.md
        CONTRIBUTING.md
```

Discovery should be lazy, nonblocking, cached appropriately, refreshable, and able to communicate loading, empty results, authentication failures, and network errors. Avoid uncontrolled requests: provide bounded pagination, cancellation/concurrency management, and potentially a **Load more** action for large collections.

## Documentation discovery rules

Support two complementary approaches:

1. **Known-document conventions:** configurable conventional names/paths such as `README.md`, `docs/index.md`, `architecture.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and technical-debt documentation. These can be probed using known URLs without listing a remote collection.
2. **Dynamic discovery:** enumerate matching resources such as `docs/adr/**/*.md` through a provider's HTTP listing/search API, when one exists.

Allow organizations/architectures to configure include/exclude patterns. Prefer familiar glob patterns for file paths, with regex support only if justified by real requirements. Make filtering semantics and precedence clear. Do not require authors to update a secondary per-repository manifest whenever a document is added.

The relationship between a discovered document and its architecture element is contextual. Do not infer a formal architectural dependency merely because a Markdown file was discovered.

## Declarative HTTP discovery DSL

Build a **small, purpose-specific YAML DSL** for resource discovery rather than adopting Arazzo or building a generic workflow engine.

The DSL should describe:

- How to construct an HTTP request using existing URL templating and authentication facilities.
- How to enumerate paginated results (for example page, offset, cursor, or link-based pagination as required).
- How to extract candidate entries from JSON responses.
- How to map each entry to a common discovered-resource model (such as display name, virtual path, fetchable resource reference/URL, and media type).
- How to apply include/exclude filtering and reasonable limits.

The DSL must remain **declarative**. No `eval`, downloaded executable scripts, embedded arbitrary code, general-purpose loops, or workflow orchestration. Avoid duplicating the existing resource-resolution and authentication configuration.

Package built-in provider definitions as YAML, interpreted by one Kotlin Multiplatform discovery engine. Initial target definitions:

- GitHub (hosted and enterprise variants as applicable)
- GitLab (hosted and self-managed)
- Bitbucket Cloud
- Bitbucket Data Center / Server-compatible APIs as applicable
- Artifactory
- Apicurio Registry

GitHub, GitLab, and Bitbucket are the initial priority; Bitbucket Cloud and Data Center require separate definitions where their APIs differ. Artifactory and Apicurio are subsequent validation targets. These are **targets, not a claim that all API differences are already covered by the DSL**.

Organizations should be able to override or supply their own declarative provider definitions without compiling or publishing private VS Code extensions. Provider definitions may be packaged or retrieved from an approved configuration location. For unusual integrations that cannot fit a bounded DSL, a separately hosted HTTP discovery service can be considered later as an escape hatch, not a first-phase requirement.

**Design guardrail:** If a provider needs special behavior, first decide whether it is a generally useful HTTP discovery primitive. Do not keep extending the DSL with one-off constructs until it becomes a programming language. A narrow code-based exception may be preferable to an overcomplicated DSL.

## Virtual documents and reuse of IDE tooling

Remote artifacts discovered or referenced by ZenWave should open as **read-only virtual documents** in VS Code, preserving the original file format and language association wherever possible. The goal is to reuse installed tooling:

- Markdown preview, including links and relative images.
- Mermaid rendering where supported by the Markdown preview.
- PlantUML rendering through a compatible extension where available.
- YAML, Avro, OpenAPI, AsyncAPI, and other file-type tooling available in the host.

Investigate a **read-only VS Code FileSystemProvider** with a custom ZenWave URI scheme. This is not intended to be a full Git filesystem or remote repository browser. Its responsibility is to expose known or resolvable HTTP resources as documents that VS Code and compatible extensions can open.

### Relative links are a first-class requirement

Preserve a stable, hierarchical virtual path for documents sharing a logical resource location. A Markdown document such as:

```text
zenwave://<source>/<scope>/docs/architecture.md
```

should be able to link relatively to:

```markdown
[ADR 001](adr/001.md)
![Architecture](images/architecture.png)
```

The linked targets should resolve within the same virtual resource namespace and be fetched on demand, **even if they were not returned by the discovery listing**. Virtual path-to-HTTP mapping must be well defined and safe, including normalization and prevention of escaping an authorized scope. Preserve distinct identities across sources, branches/versions, and paths.

Do not assume every extension handles custom URI schemes or virtual workspaces. Explicitly validate the built-in Markdown preview, relative Markdown links, relative images, Mermaid, PlantUML, and relevant file-type extensions in both Desktop and Web. The custom scheme and virtual filesystem are an integration strategy to validate, not proof of universal compatibility.

## Web, authentication, and security constraints

- Browser execution and VS Code web extensions must not require Node.js-only APIs or local processes.
- HTTP access from a browser may be blocked by CORS or authentication constraints. Some enterprise systems may need an approved proxy/gateway; do not silently assume direct browser fetch works everywhere.
- Do not place credentials in discovery YAML or expose secrets through virtual document URIs.
- Treat remote provider configuration as untrusted input: constrain allowed endpoints, redirects, resource scope, and request volume according to the deployment's security model.
- Read-only must be enforced by underlying permissions/provider behavior, not merely by UI affordances.
- Keep per-user identity and credentials isolated in multi-user web access, even if the deployment is stateless.
- Do not automatically index or replicate all remote documents. Fetch content only when necessary.

## Performance and maintenance principles

The dominant cost is expected to be remote HTTP latency, listing size, pagination, and authentication rather than YAML interpretation. Parse/cache provider definitions and reusable selectors as appropriate. Use bounded requests, on-demand content fetching, and cache policies mindful of remote updates and access permissions.

Favor one tested KMP engine with versioned YAML provider definitions over separately maintained Kotlin implementations for each common provider, **provided the DSL remains small**. Test provider definitions against representative HTTP fixtures, including pagination, errors, and hosted/enterprise API differences.

## Initial implementation milestone / proof of concept

Build the smallest vertical slice that proves the approach using Arcadia Editions:

1. Open and navigate the existing structured architecture graph in ZenWave Platform.
2. Expose a `Discover Documentation` action for one service, without changing the main manifest into a documentation index.
3. Use one declarative GitHub HTTP discovery definition to enumerate Markdown documents with include/exclude rules.
4. Display discovered resources asynchronously in the VS Code tree; support loading, refresh, and errors.
5. Open a remote Markdown file as a read-only virtual document.
6. Verify that a relative Markdown link opens another remote virtual document, even if not previously discovered.
7. Verify a relative image and Mermaid preview in a supported VS Code host.
8. Repeat critical document/navigation checks in VS Code Web; record any host-specific limitations.

Then add GitLab and Bitbucket variants, followed by Artifactory and Apicurio. Validate whether the same DSL handles them without growing into a general-purpose workflow language.

## Explicit non-goals for the first increment

- A standalone architecture portal or full custom web frontend.
- A complete virtual Git checkout, filesystem synchronization, or general remote file browser.
- Making all documentation an explicit part of the architecture manifest or graph.
- Requiring per-repository documentation manifests.
- A generic Arazzo interpreter or general workflow orchestration runtime.
- Arbitrary user-provided executable code or dynamically loaded Kotlin/JS plugins.
- Private VS Code extensions as the primary customization mechanism.
- Universal compatibility with all IDE extensions without testing.
- Full enterprise deployment, multi-user infrastructure, and every provider integration before the core proof of concept.

## Decisions to validate, not prematurely freeze

- Exact discovery DSL syntax, versioning, and whether any optional regex support is needed.
- How provider definitions are associated with architecture elements without bloating the main manifest.
- How to map remote HTTP locations to stable virtual URI namespaces and resolve relative links across multiple resource hosts.
- Whether the Markdown preview and other extensions behave correctly on custom virtual URIs in each target host.
- Browser-side CORS/authentication requirements and when an enterprise proxy becomes necessary.
- Which VS Code-compatible self-hosted distribution best supports the intended stateless, read-only enterprise experience.
- Limits, caching/invalidation, pagination UX, and handling very large documentation sets.

## Guiding principle

**The architecture manifest defines the structured system. Resource discovery reveals its surrounding documentation. ZenWave Platform connects both into one navigable workspace without requiring a separate catalog or portal backend.**
