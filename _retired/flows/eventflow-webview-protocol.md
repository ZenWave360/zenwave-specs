# Eventflow Webview Protocol

<a id="eventflow-webview-protocol"></a>

**Status:** proposed (change 001-ide-client-contracts, never archived; see work/001-ide-client-contracts/tasks.md for what is done). Migrated from OpenSpec change 001-ide-client-contracts on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Define how an embedding IDE — IntelliJ through JCEF, VS Code through a webview —
drives the EventFlow visualizer bundle, so the same built page works in both
hosts and neither host has to know how a flow is drawn.

## Rules

<a id="ewp-r1"></a>
### EWP-R1. The host renders a model by sending it to the page

The page SHALL accept a message carrying the flow view model, the service view
model, the view to show, and the display settings, and SHALL render what it is
given. It SHALL accept such a message before it has finished loading, and apply
it once it is ready.

**Examples**

- *Rendering a flow.* Given an embedded EventFlow page, when the host sends a view model and asks for the flow view, then the page draws that flow.
- *Sending before the page is ready.* Given a page that has been loaded but whose renderer has not yet started, when the host sends a view model immediately, then the model is drawn when the renderer starts, and the host does not have to wait or resend.
- *Replacing what is shown.* Given a page already showing a flow, when the host sends a different view model, then the page shows the new one.
- *A view the host has no model for.* Given a host that sends only a flow view model, when the user switches to the service view, then the page says it is waiting for that data, rather than showing an empty diagram that reads as a model with nothing in it.

<a id="ewp-r2"></a>
### EWP-R2. The host controls the view, the display settings and the highlight

The page SHALL accept messages that switch between the flow view and the service
view, change display settings such as humanised labels, and highlight a node or
clear the highlight — each without the host resending the view model.

**Examples**

- *Switching views from the host's toolbar.* Given a page showing the flow view, when the host asks for the service view, then the page shows the service map for the model it already has.
- *Turning off humanised labels.* Given a page showing humanised labels, when the host sends display settings turning them off, then labels are shown as written in the model.
- *Changing one display setting.* Given a page with several display settings in effect, when the host sends a message changing one of them, then the others keep their current values.
- *Highlighting a node from the host.* Given a page showing a flow, and a host where the user has selected something that corresponds to a node, when the host asks for that node to be highlighted, then the node is highlighted, and asking to clear the highlight removes it.

<a id="ewp-r3"></a>
### EWP-R3. The page tells the host when it is ready

The page SHALL signal the embedding host once it has loaded, over a channel the
host can receive on. Where the host provides its own messaging channel to the
page, the page SHALL use it in preference to addressing a parent frame.

**Examples**

- *Loading inside a VS Code webview.* Given the page loaded in a VS Code webview, where the extension is not the page's parent frame, when the page finishes loading, then the extension receives the readiness signal.
- *Loading inside a JCEF browser.* Given the page loaded in an IntelliJ JCEF browser, when the page finishes loading, then the host receives the readiness signal as it does today.
- *Telling a slow load from a failed one.* Given a host that has loaded the page and received no readiness signal, when it needs to tell the user what is happening, then the absence of the signal is what distinguishes a page still loading from a page that failed to load.

**Rationale:** this is the defect that makes the bundle unusable in VS Code today.
The page announces itself with `window.parent.postMessage`, which in a VS Code
webview reaches the webview's own frame and not the extension. Without the signal
the host cannot distinguish loading from broken — and that distinction is exactly
what a user staring at a blank panel needs.

<a id="ewp-r4"></a>
### EWP-R4. The page loads under a host-controlled content security policy

The page SHALL load and render with all of its resources served by the embedding
host from host-controlled locations, under a policy that permits no remote
resources and no inline script beyond what the host explicitly allows.

**Examples**

- *Serving the page from an extension.* Given a host that serves the bundle's files from its own location and applies a content security policy, when the page loads, then its scripts and styles load and the visualizer renders.
- *Working offline.* Given a machine with no network connection, when the page loads and renders a model, then nothing is fetched remotely, including fonts and styles.
- *The model stays on the machine.* Given a view model describing a private domain, when the page renders it, then no part of it is sent anywhere.

<a id="ewp-r5"></a>
### EWP-R5. The page states the protocol version it speaks

The page SHALL state the version of the host message protocol it implements, both
where a host can read it without running the page and in its readiness signal. The
version SHALL change only when a change to the protocol is not backwards compatible
for a host; additions a host may ignore SHALL keep it.

**Examples**

- *A host checks the bundle it ships.* Given a host that pins a copy of the page, when it is built or packaged, then it can read the page's protocol version without loading the page, and refuse a version it does not support.
- *A host meets a page with an incompatible protocol.* Given a host that supports one protocol version and a page that speaks another, when the page signals that it is ready, then the signal carries the page's version, and the host can report the mismatch instead of showing a blank or broken diagram.
- *An additive change.* Given a page that gains a new optional payload field or a new message type, when it is released, then its protocol version is unchanged.

**Rationale:** the page and its hosts ship separately, and a synced or packaged
copy of the page has no other version a host can check. Ignoring unknown messages
covers additions; only a stated version makes a breaking change visible.

<a id="ewp-r6"></a>
### EWP-R6. Unknown messages are ignored

The page SHALL ignore messages it does not recognise, and messages that do not
carry a recognisable type, without failing or disturbing what it is showing.

**Examples**

- *A host newer than the page.* Given a page embedded in a host that sends a message type added after the page was built, when the message arrives, then the page ignores it and carries on showing what it was showing.
- *Unrelated traffic on the same channel.* Given a page embedded in a host whose messaging channel also carries messages meant for other parts of the host, when such a message reaches the page, then it is ignored.

**Rationale:** the host and the page are versioned separately and shipped
separately — one synced into a plugin's resources, the other released on its own
schedule. Forward compatibility is the only thing that keeps a version skew from
becoming a blank panel.

