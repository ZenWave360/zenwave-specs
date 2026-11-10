# 0027. Remote documents open under a `zenwave:` scheme that the server owns

**Status:** accepted by owner, 2026-11-10; not built. **Used by:**
[AR-R1 to AR-R12](../flows/architecture-resources.md),
[LC-R6](../zenwave-platform-vscode/lsp-client.md#lc-r6),
[ME-R2](../zenwave-platform-vscode/model-explorer.md#me-r2),
[resource discovery](../roadmap/resource-discovery.md)

## Decision

1. A document that the architecture manifest declares and that is not a local file opens in VS Code as a **read-only virtual
   document** under the scheme `zenwave:`, addressed `zenwave:/<owner.id>/<version>/<content.path>`.
2. **The server is the source of truth for the scheme.** It resolves, caches and serves the address
   (`zenwave/readResource`, `zenwave/statResource`), and it reads such addresses itself when a model imports another. The
   extension registers a `FileSystemProvider` that is a facade over those requests and has no resolution logic.
3. Only owner and version pairs that the manifest declares are served. A relative reference inside a declared artifact stays
   with the same owner and version. Nothing else is served.
4. An entry that resolves through the `workspace` source to a local file opens as that `file:`, not through the scheme.
5. OpenAPI, AsyncAPI and Markdown documents under the scheme are never sent to the language server, and open with their own
   language ids for installed extensions.
6. One architecture manifest per workspace stays ([decision 0014](0014-one-manifest-per-workspace.md)), and it may now be an
   `http(s)` address.

## Why

**Installed tooling works on a virtual document and does not on a webview.** The goal is to browse the APIs, models and
documents of an architecture with the tools the user already has, which is the portal [decision 0018](0018-vscode-web-mode-is-the-web-explorer.md)
chose not to build separately.

**The server, not the extension, because the server already needs the same bytes.** A ZDL or ZFL file imports others, and
the parser must read them whether or not an editor has them open. If the extension owned the scheme, the server would ask it
for every import, or there would be two resolvers. Resolution is model semantics and lives in Kotlin
([world model](../architecture/world-model.md)); the library has no `@JsExport`, so JavaScript reaches it only through
`lsp-js`, and a TypeScript copy in the extension is excluded. [Decision 0014](0014-one-manifest-per-workspace.md) already
says the client never second-guesses resolution.

**Declared only, because the server holds credentials.** A scheme that read any path of a repository would turn an
authorised origin into a general reader ([decision 0008](0008-credentials-are-handed-over-per-request.md)).

**Owner and version in the address, because tabs and links need to tell things apart.** Two services both have an
`openapi.yml`. The original path and extension stay last, so the language is detected and relative links resolve against
the address.

## Rejected

- **A `TextDocumentContentProvider` in the extension that fetches with `fetch`.** Duplicates resolution in TypeScript, and
  the server could not read an import.
- **Opening remote files in a webview or a rendered tree.** No installed tooling would apply.
- **Serving any path of an owner's repository.** See above.

## Consequences

- Some third-party extensions accept only `file:` and will ignore these documents: accepted, and the ones tried are recorded
  ([AR-Q6](../flows/architecture-resources.md#ar-q6)).
- In a browser the server reaches only `http(s)`, so CORS decides what works
  ([AR-Q5](../flows/architecture-resources.md#ar-q5)).
- The server's document reader grows a scheme, and `lsp-js` must still not be sent unrelated YAML
  ([LVR-R15](../flows/lsp-visualization-requests.md#lvr-r15)).
