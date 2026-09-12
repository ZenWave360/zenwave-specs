## Purpose

Define how an embedding IDE — IntelliJ through JCEF, VS Code through a webview —
drives the EventFlow visualizer bundle, so the same built page works in both
hosts and neither host has to know how a flow is drawn.

## ADDED Requirements

### Requirement: The host renders a model by sending it to the page
The page SHALL accept a message carrying the flow view model, the service view
model, the view to show, and the display settings, and SHALL render what it is
given. It SHALL accept such a message before it has finished loading, and apply
it once it is ready.

#### Scenario: Rendering a flow
- **GIVEN** an embedded EventFlow page
- **WHEN** the host sends a view model and asks for the flow view
- **THEN** the page draws that flow

#### Scenario: Sending before the page is ready
- **GIVEN** a page that has been loaded but whose renderer has not yet started
- **WHEN** the host sends a view model immediately
- **THEN** the model is drawn when the renderer starts, and the host does not
  have to wait or resend

#### Scenario: Replacing what is shown
- **GIVEN** a page already showing a flow
- **WHEN** the host sends a different view model
- **THEN** the page shows the new one

#### Scenario: A view the host has no model for
- **GIVEN** a host that sends only a flow view model
- **WHEN** the user switches to the service view
- **THEN** the page says it is waiting for that data, rather than showing an
  empty diagram that reads as a model with nothing in it

### Requirement: The host controls the view, the display settings and the highlight
The page SHALL accept messages that switch between the flow view and the service
view, change display settings such as humanised labels, and highlight a node or
clear the highlight — each without the host resending the view model.

#### Scenario: Switching views from the host's toolbar
- **GIVEN** a page showing the flow view
- **WHEN** the host asks for the service view
- **THEN** the page shows the service map for the model it already has

#### Scenario: Turning off humanised labels
- **GIVEN** a page showing humanised labels
- **WHEN** the host sends display settings turning them off
- **THEN** labels are shown as written in the model

#### Scenario: Changing one display setting
- **GIVEN** a page with several display settings in effect
- **WHEN** the host sends a message changing one of them
- **THEN** the others keep their current values

#### Scenario: Highlighting a node from the host
- **GIVEN** a page showing a flow, and a host where the user has selected
  something that corresponds to a node
- **WHEN** the host asks for that node to be highlighted
- **THEN** the node is highlighted, and asking to clear the highlight removes it

### Requirement: The page tells the host when it is ready
The page SHALL signal the embedding host once it has loaded, over a channel the
host can receive on. Where the host provides its own messaging channel to the
page, the page SHALL use it in preference to addressing a parent frame.

#### Scenario: Loading inside a VS Code webview
- **GIVEN** the page loaded in a VS Code webview, where the extension is not the
  page's parent frame
- **WHEN** the page finishes loading
- **THEN** the extension receives the readiness signal

#### Scenario: Loading inside a JCEF browser
- **GIVEN** the page loaded in an IntelliJ JCEF browser
- **WHEN** the page finishes loading
- **THEN** the host receives the readiness signal as it does today

#### Scenario: Telling a slow load from a failed one
- **GIVEN** a host that has loaded the page and received no readiness signal
- **WHEN** it needs to tell the user what is happening
- **THEN** the absence of the signal is what distinguishes a page still loading
  from a page that failed to load

**Rationale:** this is the defect that makes the bundle unusable in VS Code today.
The page announces itself with `window.parent.postMessage`, which in a VS Code
webview reaches the webview's own frame and not the extension. Without the signal
the host cannot distinguish loading from broken — and that distinction is exactly
what a user staring at a blank panel needs.

### Requirement: The page loads under a host-controlled content security policy
The page SHALL load and render with all of its resources served by the embedding
host from host-controlled locations, under a policy that permits no remote
resources and no inline script beyond what the host explicitly allows.

#### Scenario: Serving the page from an extension
- **GIVEN** a host that serves the bundle's files from its own location and
  applies a content security policy
- **WHEN** the page loads
- **THEN** its scripts and styles load and the visualizer renders

#### Scenario: Working offline
- **GIVEN** a machine with no network connection
- **WHEN** the page loads and renders a model
- **THEN** nothing is fetched remotely, including fonts and styles

#### Scenario: The model stays on the machine
- **GIVEN** a view model describing a private domain
- **WHEN** the page renders it
- **THEN** no part of it is sent anywhere

### Requirement: Unknown messages are ignored
The page SHALL ignore messages it does not recognise, and messages that do not
carry a recognisable type, without failing or disturbing what it is showing.

#### Scenario: A host newer than the page
- **GIVEN** a page embedded in a host that sends a message type added after the
  page was built
- **WHEN** the message arrives
- **THEN** the page ignores it and carries on showing what it was showing

#### Scenario: Unrelated traffic on the same channel
- **GIVEN** a page embedded in a host whose messaging channel also carries
  messages meant for other parts of the host
- **WHEN** such a message reaches the page
- **THEN** it is ignored

**Rationale:** the host and the page are versioned separately and shipped
separately — one synced into a plugin's resources, the other released on its own
schedule. Forward compatibility is the only thing that keeps a version skew from
becoming a blank panel.
