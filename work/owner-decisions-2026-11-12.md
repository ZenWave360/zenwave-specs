# Owner decisions, 2026-11-12

Answers to the decision list in the backlog triage of 2026-11-12. Each decision document and rule is to be updated to
match (backlog task DEC/1). Numbers are the triage's (D1–D28).

## Accounts and release

- **D1, 008/1.1.** The publisher is `ZenWave360`, already published on the Marketplace and Open VSX; the owner
  (ivangsa) created and owns it. Not an open question.
- **D2, 008/1.2.** Only the owner creates, rotates and uploads publisher tokens to GitHub. Nobody else.
- **D23, REL/6, REL/17.** `vscode-release` runs on tags. Trusted publishing replaces tokens when it is available. The
  named reviewer, where one is required, is the owner (ivangsa).
- **D24, REL/7.** A stable tag waits for the owner's approval in a GitHub environment; a run that fails half way re-runs
  only the failed part, with the same tag.

## Platform and browser

- **D3, 0005.** Confirmed: the VS Code and IntelliJ clients live in separate repositories.
- **D4, 0008 CORS.** Private content in a browser is fetched directly, with CORS.
- **D6, 0013.** Capability discovery is one explicit runtime query.
- **D7, 0014.** The configured manifest wins. Ambiguous candidates are not opened; the user has *Open Architecture
  Manifest* to choose one.
- **D12, kmp/1.1.** Keep the Node filesystem loader out of browser bundles the correct Kotlin way: `expect`/`actual`
  where it works. `expect`/`actual` separates JVM from JS, not Node from browser, so it needs two named JS targets
  (node, browser); if that proves unworkable, a separate Node-only artifact.
- **D13, kmp/1.2.** Node keeps reading the filesystem by default; nothing breaks for current users.
- **D14, kmp/7.2.** The browser consumers in scope are the architectural-vistas components embedded in EventCatalog, the
  website and Astro, in the way the EventFlow test app embeds them.
- **D18, c003/3.6.** Drop `.zenwave/config.yml`. It was meant to be shared with IntelliJ, which is now secondary. The
  manifest is configured in `.vscode/settings.json` or opened explicitly. Activation and manifest resolution change
  accordingly (backlog DEC/2).
- **D19, c003/4.4.** Keep the multi-root selection rule as implemented.

## Language, editor and representation

- **D5, 0009.** ZDL Mermaid output is the diagrams in `dsl-views`; more are added when needed.
- **D8, 0015.** `documentationUrl` (where each SDK plugin's documentation is) becomes an implementation task.
- **D9, 0016.** The safest and most portable option: decimals stay strings.
- **D10, LVR-R11.** The server composes hierarchy labels (IDE-neutral).
- **D11, ZVE/1–3**, tentative, not set in stone:
  - a command created and synchronised into the ZFL file is listed in its service;
  - removing an event from a handler: evaluate a virtual event (`UnknownDeleted`) that keeps the parser working while
    the linter warns; relinking the handler removes it. **To evaluate; a language change, so it comes back to the
    owner before it is built**;
  - annotations and Javadoc go with the policy, as a default rather than a fixed rule.
- **D25, PX/5.4.** The Systems action is implemented in the language server where possible; the client only invokes
  it. By default it only adds; it removes nothing.
- **D26, PX/6.4.** The visual editor first needs a test page, like the viewer's, to try it outside VS Code.

## Reviews and optional scope

- **D20, 002/11.7.** The installed SDK refreshes the catalogue only when the user asks, and persists it globally or per
  workspace, as the user chooses.
- **D21, 004/1.5.** The extension pins an exact lsp-js version and checks the protocol version at connection: accepted.
- **D15, 001/1.1.** The review of the first two visualization requests is superseded: they are built and used. Close.
- **D16, 001/1.2.** Not tried in IntelliJ yet; expected to be JCEF-compatible. Stays a manual check.
- **D17, 003/3.6.** Not needed for now (explained in plain words; the owner did not see a use). Stays skipped.
- **D22, 006/1.6.** Settled by AN/5.3: the Model tree is the outline of the active document.
- **D27, PX/7.1.** Pending: the interview was never held (owner kept it on 2026-11-06). Its script is the
  [navigation brief](../roadmap/navigation-brief.md); run it as a separate grilling session.
- **D28, 001/2.18.** Nothing is in production, so the best long-term contract wins: `zenwave/conceptAt` itself changes
  to return an object (concepts, whether the list is truncated, whether an architecture is resolved), on JVM and JS, and
  the VS Code client moves with it. No second method and no legacy array.
