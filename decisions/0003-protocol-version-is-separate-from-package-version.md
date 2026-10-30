# 0003. The page's protocol version is separate from its package version

**Status:** accepted. **Origin:** `openspec/changes/001-ide-client-contracts/design.md`, decision 5.5. **Used by:** [EventFlow](../flows/eventflow.md#ef-r2)

## Decision

The built page is published as `@zenwave360/vistas-eventflow-webview`. It carries a
protocol version, an integer (1 today), stated in four places: `webview/protocol.json`,
a `<meta name="zenwave-webview-protocol-version">` tag, the exported constant
`EVENTFLOW_WEBVIEW_PROTOCOL_VERSION`, and the payload of `webviewReady`.

It changes only when a host cannot ignore the change: a message removed or renamed,
or a payload field changing meaning. New optional fields and new message types keep
it, because the page and hosts ignore what they do not know.

A host pins an exact package version, checks the protocol version at build time and
on `webviewReady`, and shows an error naming the mismatch instead of a blank panel.
A ready message without a payload comes from a page that predates versioning.

## Why

The page and its hosts ship separately. A synced directory has no version a host can
check, and ignoring unknown messages covers additions only.

## Rejected

- Using the npm version as the protocol version: every renderer fix would look like a
  protocol change.
- A version query message: a page too old to answer would look the same as a page
  still loading.
