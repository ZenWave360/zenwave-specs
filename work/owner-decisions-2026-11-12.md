# Owner decisions, 2026-11-12

Answers to the decision list in the backlog triage of 2026-11-12. Each decision document and rule is to be updated to
match (backlog task DEC/1). Numbers are the triage's (D1–D28).

## Accounts and release

- **D1, 008/1.1.** The publisher is `ZenWave360`, already published on the Marketplace and Open VSX; the owner
  (ivangsa) created and owns it. Not an open question.
- **D2, 008/1.2.** Only the owner creates, rotates and uploads publisher tokens to GitHub. Nobody else.
- **D23, REL/6, REL/17.** `vscode-release` runs on tags. Trusted publishing replaces tokens when it is available. The
  named reviewer, where one is required, is the owner (ivangsa).
- **D24, REL/7.** Asked again in plain words (pending).

## Platform and browser

- **D3, 0005.** Confirmed: the VS Code and IntelliJ clients live in separate repositories.
- **D4, 0008 CORS.** Private content in a browser is fetched directly, with CORS.
- **D6, 0013.** Capability discovery: the most efficient and maintainable option. Agent proposal: one explicit runtime
  query (pending owner nod).
- **D7, 0014.** The configured manifest wins. Ambiguous candidates are not opened; the user has *Open Architecture
  Manifest* to choose one.
- **D12, D13, D14, D18.** Asked again in plain words (pending).
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
  it. Additive or full removal by default: pending.
- **D26, PX/6.4.** The visual editor first needs a test page, like the viewer's, to try it outside VS Code.

## Reviews and optional scope

- **D20, 002/11.7.** The installed SDK refreshes the catalogue only when the user asks, and persists it globally or per
  workspace, as the user chooses.
- **D15, D16, D17, D21, D22, D27, D28.** Pending.
