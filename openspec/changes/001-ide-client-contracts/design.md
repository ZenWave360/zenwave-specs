# 001 — Design

## Context

Both contracts already exist as running code. Neither exists as an agreement.

**The view model and the representations** are produced in `dsl-kotlin` and
consumed in-process by the IntelliJ plugin:

```
GenerateFlowViewFromZfl().execute(text)      → FlowViewModel
GenerateServiceViewFromZfl().execute(text)   → ServiceViewModel
GenerateMermaidFromZfl().execute(text, mode) → MermaidDiagramsView
ZdlToMarkdownPlugin.generatePlantUML(text)   → PlantUML
```

`ZflDiagramModelProvider` serialises the first two into
`{"flowGraph": …, "serviceGraph": …}` and posts that JSON into the webview.
`ZdlPreviewEditor` and `ZflPreviewEditor` wrap the others into
`MarkdownPreviewRepresentation(id, title, content, format)`.

The language server already carries six custom requests — `zenwave/hierarchy`,
`zenwave/forwardReferences`, `zenwave/reverseReferences`,
`zenwave/organizeZflServices`, `zenwave/conceptAt`, `zenwave/workspaceStatus` —
and lists them in its initialize result. So there is an established place for
these to go, and an established way to advertise them.

**The webview protocol** is defined by the bundle's own `index.html` and
`main.tsx`: four inbound message types, a pending-message queue for messages that
arrive before React mounts, and one outbound `webviewReady`.

The spec deltas describe what these do, in the vocabulary of the people using
them, and deliberately do not name methods, fields or JSON shapes. That is not
vagueness — it is where the boundary between this store and the implementing
repositories falls. See below.

## Goals / Non-Goals

**Goals:**

- Make the existing behaviour something a second client can be built against.
- Name the three failure modes — absent, too old, bad document — and require them
  to stay distinguishable, because that is what users actually experience.
- Fix the two things that stop the EventFlow bundle from working in VS Code.

**Non-Goals:**

- **Migrating IntelliJ onto these requests.** Its in-process route stays valid.
  Duplication between "called as a function" and "called over a wire" is real
  debt, but converting IntelliJ is a separate change with its own risk.
- **Editing a model from a diagram.** The renderer accepts `editable`, and a
  round trip back into ZFL is a contract of its own.
- **Node-to-source navigation from the webview.** The view model already carries
  source references, so the data is there — but the page has no outbound message
  for a selection, and adding one is a design question about what a host does
  with it. Worth doing next; not smuggled in here.
- **Pinning exact JSON field names.** See the decision below.

## Decisions

### These are contracts of behaviour, not schemas

The spec says a node "carries the position and dimensions to draw it at". It does
not say `position: {x, y}`.

That is deliberate, and it is the same rule the product repos follow: a spec owns
what a neighbouring system can *notice*, and the implementation owns how it is
expressed. A client notices that it did not have to compute a layout. It does not
notice whether the field is called `position` or `at`.

The practical benefit is that the schema can evolve — the view models already
carry a `schema` field for exactly that — without every evolution being a spec
change and therefore a lie waiting to happen. The cost is that this store cannot
be used to generate types. That is the right trade for contracts between repos
that are all still moving: the generated-type version of this document would be
stale within a month, and a stale schema is worse than none.

Where a wire name genuinely is the contract — a request method, a message type —
the implementing repository owns it and the client follows the server's
advertisement.

### Capability advertisement is a requirement, not an implementation detail

It is tempting to leave "what if the server is old" to error handling. But a
client that discovers unsupportedness by issuing a request and catching a failure
cannot distinguish that failure from a broken document, and the user gets the
wrong message.

So: advertised at initialise, checkable before asking. The server already lists
its custom requests in the initialize result, so this is formalising something
that exists rather than inventing a mechanism.

### Layout stays on the server

The flow view model is returned already positioned. The alternative — each client
running its own layout — is how two IDEs end up drawing the same file differently,
and the difference is invisible until someone puts two screenshots side by side.

It also keeps the layout engine (ELK, in `dsl-kotlin`) in one place, where it is
already multiplatform.

### The readiness signal changes; the queue stays

The page's pending-message queue means a host can send a view model immediately
after loading and have it applied on mount. That is good design and the spec
preserves it — it is why "send before ready" is a scenario rather than a bug.

What changes is only the outbound signal: prefer the host-provided channel,
fall back to the parent frame. JCEF keeps working unchanged; VS Code starts
working. A few lines in `index.html`.

### The host serves the assets

The built page references `./assets/index-*.js`. Rather than asking the bundle to
accommodate every host's URI scheme, the host serves the files and rewrites the
references. The contract asks only that the page *tolerate* being served that way
— no absolute paths, no assumptions about origin, nothing loaded remotely.

This keeps host-specific knowledge in the hosts, which is where it can be fixed
without a release of the visualization package.

## Risks / Trade-offs

- **A behavioural contract cannot be mechanically verified.** Nothing fails a
  build when a server stops returning positions. The mitigation is that each
  requirement has scenarios a test can be written from, in each repository — but
  those tests have to be written there, and this store cannot make anyone write
  them.
- **Two producers of the same thing, for now.** IntelliJ in-process, the server
  over the wire. They can drift, and the contract is what makes the drift a
  reportable bug rather than a puzzle. Converting IntelliJ closes it properly.
- **ZDL previews are PlantUML today**, and the VS Code client renders Mermaid.
  This contract does not settle which formats a server may return — it says the
  format is declared. That is enough for a client to refuse gracefully, but the
  underlying question, whether ZDL diagrams become Mermaid upstream, is a real
  decision waiting in `zenwave-lsp` / `dsl-kotlin`.
- **The bundle is distributed by a sync script**, and a synced directory has no
  version. Writing down the protocol makes a skew diagnosable; it does not make
  it detectable. Publishing the bundle as a versioned package would, and is worth
  doing separately.
