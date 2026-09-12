# 001 — IDE client contracts

## Why

ZenWave has two IDE clients and they are about to stop agreeing with each other.

Everything the IntelliJ plugin knows about how to get a diagram or a preview out
of the platform, it knows in Kotlin, in-process. `ZenwaveLspProjectService`
constructs the language server inside the same JVM and calls it directly.
`ZflDiagramModelProvider` calls `GenerateFlowViewFromZfl` as a function.
`ZdlPreviewEditor` calls `ZdlToMarkdownPlugin.generatePlantUML` as a function.
None of that is a protocol — it is a classpath.

The VS Code client cannot do any of it. It has to ask over a wire, which means
the wire has to exist, and the first thing the wire needs is agreement about what
is on it.

Three repositories have to agree, and none of them can hold the agreement alone:

- **`zenwave-lsp`** produces the flow view model and the preview representations;
- **`zenwave-architectural-vistas`** owns the webview that renders the flow, and
  the messages it accepts;
- **`ZenWaveDomainModelEditor`** and **`zenwave-platform-vscode`** consume both.

These contracts are written now because the VS Code changes
`004-eventflow-panel` and `005-model-preview` are blocked on them, and because
writing them down is what turns "IntelliJ happens to do it this way" into
something a second client can be built against — and a third can be reviewed
against.

Two integration defects were found simply by writing this down, both in the
EventFlow webview bundle, both invisible while JCEF was the only host. They are
the concrete argument for the contract existing at all.

## What Changes

- **Two new language server requests**, specified rather than implied:
  - the EventFlow view models for a ZFL document — what IntelliJ builds in-process
    today;
  - the rendered preview representations for a ZDL or ZFL document.
- **The conceptual hierarchy request written down**, along with four things an
  adversarial review of the VS Code specs showed were assumed rather than true:
  that a hierarchy can be asked for without opening the document, that a cursor
  position can be resolved into something the reference requests accept, that a
  node in a diagram and a node in a hierarchy can be matched, and that a running
  server takes up a configuration change. Each was specified downstream as though
  it already worked; none of them does.
- **The navigation and authoring requests** the IDE clients drive from editor
  commands — what a concept references, what references it, which concepts cover
  a position, and rewriting a flow's services.
- **Capability advertisement** for all of them, so a client can tell an old server
  from an absent one.
- **Two rules about content that everything visual rests on**: what the editor is
  showing outranks what resolution would find, so a preview stays live; and the
  server asks the client for a credential rather than holding one, so the editor
  keeps owning the user's identity.
- **A record that the SDK's plugin catalogue is a contract.** Nothing about it
  changes; it is written down because two IDE plugins read it and nothing on the
  SDK's side says so.
- **The EventFlow webview message protocol**, written from the bundle's current
  behaviour, plus the two changes a VS Code host needs:
  - the readiness signal must reach a host that is not the parent frame;
  - the page must load under a host-controlled content security policy.

## Capabilities

### New Capabilities

- `lsp-visualization-requests`: the ZenWave-specific language server requests
  that IDE clients use to obtain visual and rendered representations of a model.
- `eventflow-webview-protocol`: the messages exchanged between an embedding IDE
  host and the EventFlow webview bundle, and what the bundle may assume about the
  page it is loaded into.
- `sdk-plugin-catalogue`: that the ZenWave SDK reports its own plugins and their
  options in a machine-readable form, and that the IDE clients build plugin
  authoring on it.

### Modified Capabilities

None — this store starts empty.

## Impact

- **`zenwave-lsp`** implements the two new requests and advertises them — the
  view model and representation generators already exist in `dsl-kotlin`; what is
  missing is exposure over the protocol. It also carries most of the gaps this
  change now records: hierarchy for an unopened document, a position-to-symbol
  step, node identity that a client can match across a hierarchy and a view
  model, hierarchy nodes that point at the document that declares them, and
  configuration changes taken up without a restart.
- **`zenwave-architectural-vistas`** changes how the page signals readiness, and
  stops assuming it may reach `window.parent`. Both are small and neither breaks
  JCEF.
- **`zenwave-sdk`** is asked for one addition: each plugin reporting where its
  documentation lives. Everything else in the catalogue requirement describes what
  it already does, and the obligation that creates is that a future change to that
  surface is taken knowingly. The addition exists because plugins can be written
  by the teams using them, so no naming convention can locate their
  documentation.
- **`ZenWaveDomainModelEditor`** is not required to change. Its in-process route
  stays valid; the contract describes what it already does, so that a second
  client can match it. Moving IntelliJ onto the same requests would remove the
  duplication, and is worth doing eventually, but it is not this change.
- **`zenwave-platform-vscode`** is unblocked: `004` and `005` become
  implementable.
- **Versioning becomes possible.** A synced directory and a classpath have no
  version. Once the protocol is written down, breaking it is something that can
  be noticed.
