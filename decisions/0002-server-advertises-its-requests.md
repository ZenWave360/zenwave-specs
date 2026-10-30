# 0002. The server advertises its requests at initialise

**Status:** accepted. **Origin:** `openspec/changes/001-ide-client-contracts/design.md`, decision 1.1. **Used by:** [EventFlow](../flows/eventflow.md#ef-t1)

## Decision

Every ZenWave-specific request the server answers is listed in
`capabilities.experimental.customRequests` in the initialize result, and nothing it
does not answer is listed. The list is built from the same place that registers the
handlers, so the two cannot drift. `lsp-js` returns the same list as `lsp-jvm`.

A client checks that list before issuing a request. A request whose parameters ever
change incompatibly gets a new method name, not a version field. Payloads carry a
`schema` string such as `zfl.eventflow.view@1`.

## Why

A client that finds out a request is unsupported by issuing it and catching the
failure cannot tell that failure from a broken document, and the user gets the
wrong message. Three failures need three messages: no server, an old server, a bad
document. Only the first two are knowable before asking.

## Errors

- Unparseable document: `-32803` with `data.kind = "documentUnreadable"`.
- Not open and not readable: `-32803` with `data.kind = "documentNotFound"`.
- A document kind the request does not cover: `-32803` with
  `data.kind = "unsupportedDocument"`.
- `-32601` only ever means the server is too old.
- An empty model is a successful empty result. Errors are never encoded as results.
