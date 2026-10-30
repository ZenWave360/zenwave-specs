# 0008. Credentials are handed over per request, and only to authorised origins

**Status:** accepted by agent 2026-09-16; confirmed by owner 2026-10-30, as: credentials are delivered only for each request, and only to servers that were validated or are considered trusted. The authorised origins are that list. The CORS question below stays open. **Origin:** change 001 task 1.4, VS Code change 003. **Used by:** [LVR-R13](../flows/lsp-visualization-requests.md#lvr-r13), [LC-R8](../zenwave-platform-vscode/lsp-client.md#lc-r8), [LC-R9](../zenwave-platform-vscode/lsp-client.md#lc-r9)

**Built:** the VS Code side. **Not built:** nothing in the server sends the request yet.

## Decision

When content resolution meets a location that refuses it, the server asks the client over the LSP
connection with `zenwave/credential`. The client owns identity, matches the origin and releases the
credential. The server applies it to that one fetch and keeps nothing. It is an opt-in: the client
advertises `initializationOptions.zenwave.clientCapabilities.credentialRequest: true`.

```
params: { uri, origin: "scheme://host[:port]", attempt: "initial" | "rejected", status? }
result: { type: "HEADER" | "QUERY", key, value } | null     // null: declined
```

The server fetches without a credential first. On 401, 403, or a 404 from a Git source (GitHub and
GitLab answer 404 for private content) it asks once, retries once with a matcher comparing the exact
origin, and asks once more with `attempt: "rejected"` if refused. A `null` is a failed candidate and
resolution moves on. A credential is never cached, logged, put in an exception, or sent to another
origin, including across a redirect.

## Why

**A manifest is a file in a repository, and opening a repository is not a decision to trust it.** A
manifest naming a source on an attacker's host would otherwise be handed a token. This is a security
boundary, and the rule most worth a test rather than a careful reading.

Tokens expire mid-session, and a server holding secrets makes every crash log a disclosure. The editor
can refresh a session, ask for consent and use the platform's secret store.

In VS Code, secrets come from `vscode.authentication` where it covers the host, otherwise from
`SecretStorage`, and never from settings. `zenwave.credentials.origins` is `application`-scoped, so a
repository cannot authorise an origin for itself.

## Rejected

Handing credentials over at initialise, for the reasons above.

<a id="open"></a>
## Open

**A browser cannot get around CORS.** The default GitHub expression points at `github.com/.../raw/...`,
which sends no CORS headers, so that content is unreachable from a browser with or without a credential.
Until `zenwave-architecture` settles it, a browser reaches private GitHub content only through a manifest
whose expression targets a CORS-enabled endpoint such as `api.github.com/repos/.../contents/...`.
