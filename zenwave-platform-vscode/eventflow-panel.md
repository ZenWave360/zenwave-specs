# Eventflow Panel

<a id="eventflow-panel"></a>

**Status:** 2026-10-30: 7 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Show a ZFL flow as the diagram it describes, inside VS Code, using the same
EventFlow renderer the IntelliJ plugin embeds — and relay data and controls
between the editor and that renderer without interpreting the model.

## Rules

<a id="ep-r1"></a>
### EP-R1 (exists). A ZFL file can be opened as a flow diagram

The extension SHALL offer to view a ZFL document as a diagram, both beside its
text and in place of it, through `zenwave.eventflow.openToSide` and
`zenwave.eventflow.open`, and SHALL leave the text editor as what a ZFL file
opens as by default.

**Examples**

- *Opening the diagram beside the text.* Given a `.zfl` file open in the editor, when the user invokes the ZenWave EventFlow action, then the diagram opens in the column beside the text, and the cursor stays in the text.
- *Replacing the text with the diagram.* Given a `.zfl` file open as text, when the user asks to view it as a diagram in place, then the diagram is shown in that same editor, in the same position among the tabs.
- *Going back to the text.* Given a `.zfl` file being shown as a diagram, when the user asks to edit it again, then the text is shown in that same editor.
- *Opening a flow file normally.* Given a user who has never configured anything, when they open a `.zfl` file from the explorer, then they get the text editor, not the diagram.
- *The action is offered only where it means something.* Given a `.zdl` file or a plain text file in the active editor, when the user looks for the EventFlow action, then it is not offered for that file.
- *Finding the ways to view a flow.* Given a ZFL document, which can be shown as text, as a preview, or as a diagram, when the user looks for those actions in the editor, then they are reachable together from one place, rather than each occupying its own control in the editor's title area.

A button inside the text editor, as a further route, is an idea to review later: [MP-R13](model-preview.md#mp-r13).

<a id="ep-r2"></a>
### EP-R2 (exists). A diagram editor belongs to one document

A diagram editor SHALL show the document it was opened for and no other, SHALL
name that document, and SHALL be restored showing the same document when the
window is reloaded.

**Examples**

- *Two flows open at once.* Given diagrams open for `place-order.zfl` and for `cancel-order.zfl`, when the user moves between them, then each keeps showing its own flow.
- *Working on something else.* Given a diagram open for a flow, when the user focuses an editor holding a different file, then the diagram keeps showing the flow it was opened for.
- *Reloading the window.* Given a diagram open when VS Code is closed or the window is reloaded, when the editor reopens, then the diagram is restored, showing the same document.
- *The user rearranges their tabs.* Given a diagram the user has dragged into another editor group, when the document changes and the diagram re-renders, then the diagram stays where the user put it.

**Why:** IntelliJ's tool window needs a file selector because a tool window
is not attached to anything. An editor is, so the selector disappears — the tab
is the selection.

<a id="ep-r3"></a>
### EP-R3 (exists). The diagram tracks edits to its document

The diagram SHALL re-render as its document changes, without the user saving the
file or re-invoking the action, and SHALL keep showing the last good diagram
while a new one is being produced.

**Examples**

- *Adding a command to a flow.* Given a diagram open beside its ZFL text, when the user types a new command into the flow, then the diagram shows the new node without a manual refresh.
- *Typing mid-edit.* Given a diagram open and the user typing a declaration that is briefly incomplete, when the document cannot be read at that moment, then the diagram keeps the previous rendering visible rather than flashing an empty state on each keystroke.
- *A sustained burst of edits.* Given a diagram open while the user types continuously, when the document changes many times per second, then the diagram is produced for some of those changes and not for every one, and the last one typed is always the one finally shown.
- *The document changes on disk.* Given a diagram open for a document that is changed outside the editor, such as by a branch switch, when the editor picks the change up, then the diagram re-renders from the new content.

<a id="ep-r4"></a>
### EP-R4 (exists). The user can choose what the diagram shows

The extension SHALL let the user switch a diagram between the flow view and the
service view, and toggle humanised labels, from the diagram's own editor. Each
diagram SHALL keep its own choices for as long as it is open, and SHALL show
which view it is currently displaying.

**Examples**

- *Switching to the service view.* Given a diagram showing the flow view, when the user switches to the service view, then the same model is shown as a service map, and the editor indicates that the service view is the one being shown.
- *Turning off humanised labels.* Given a diagram showing humanised labels, when the user turns the option off, then labels are shown as written in the model.
- *A choice survives a re-render.* Given a diagram showing the service view, when the user edits the document and the diagram re-renders, then it is still showing the service view.
- *Which view a diagram opens on.* Given a user who has set which view diagrams should open on, when they open a diagram, then it opens on that view, and they can still switch it afterwards.
- *Two diagrams, two choices.* Given two flows open as diagrams, when the user switches one of them to the service view, then the other keeps showing whatever it was showing.

<a id="ep-r5"></a>
### EP-R5 (exists). The view model passes through the extension untouched

The extension SHALL forward the view model it receives for a document to the
renderer as received, and SHALL NOT read, reshape, validate, supplement or
reorder it. Deciding what a flow contains, and how it is laid out, belongs
upstream.

**Examples**

- *The model gains a node type the extension has never heard of.* Given a language server that returns a view model containing a node type released after the installed extension, when the diagram renders it, then what reaches the renderer is what the server sent, node for node and field for field — comparable against the server's own answer.
- *Layout comes from upstream.* Given a view model carrying node positions and dimensions, when the diagram renders it, then it is laid out as the view model describes, with no positioning applied by the extension.

**Why:** IntelliJ produces this JSON in Kotlin and hands it straight to the
same renderer. Mirroring that means both IDEs show the same picture and only one
implementation decides what a flow looks like. A transformation here would be a
second opinion, and the first thing to diverge.

<a id="ep-r6"></a>
### EP-R6 (exists). The diagram explains why it is not showing anything

Where a diagram editor has nothing to render, it SHALL say which of these is the
case: no language server available, the server does not support flow views, or
the document could not be read. The detail SHALL be recorded in the output
channel.

**Examples**

- *No language server.* Given a diagram opened in a host with no language server, when it is displayed, then it states that the diagram needs the ZenWave language server, rather than showing an empty canvas.
- *A server without flow-view support.* Given a connected language server that does not support flow views, when the user opens a diagram, then it states that the connected server cannot produce one, and distinguishes this from the server being absent.
- *A file with a syntax error.* Given a ZFL file with a syntax error and no previously rendered diagram, when the diagram is displayed, then it states that the document could not be read, and the underlying detail is available in the output channel.
- *Waiting for a diagram.* Given a document whose diagram is being produced, when the user is waiting, then the editor shows that it is working, rather than appearing broken.

<a id="ep-r7"></a>
### EP-R7 (exists). The diagram loads no remote content

A diagram SHALL render entirely from resources shipped with the extension, and
SHALL NOT load code, styles, fonts or data over the network.

**Examples**

- *Working offline.* Given a machine with no network connection, when the user opens a diagram, then it renders normally.
- *The model stays local.* Given a ZFL file describing a private domain, when the diagram renders it, then no part of the model leaves the machine.

## Design notes

Why it is an editor is [decision 0010](../decisions/0010-rendered-views-are-custom-editors.md).

**The rule most likely to be broken by accident.** The first "just read `nodes.length` to decide whether to show the
empty state" is how a TypeScript model of a flow gets born. So the view model crosses the extension as opaque JSON, and
the empty state keys on what happened during the request, never on the result.

**The bundle is pinned at three points**, so a protocol change breaks visibly at the earliest one it reaches: an exact
package version in `package.json` under `zenwaveEventFlowWebview`, the protocol version at build time, and the protocol
version on `webviewReady`, where a mismatch is a load failure naming both versions. See
[decision 0003](../decisions/0003-protocol-version-is-separate-from-package-version.md). The bytes are copied from the package
at build time and never committed here.

**Host additions.** The editor adds one nonce'd script and style to the page, setting `window.__zenwaveVsCodeApi` before the
page's module runs. It reports asset load failures and draws the explained states: an overlay when nothing is shown, a banner
above the last diagram when something is. These `zenwave.host.*` messages belong to this extension, and the page ignores them.

**CSP.** `default-src 'none'; script-src <cspSource> 'nonce-…'; style-src <cspSource> 'nonce-…'; img-src <cspSource> data:;
font-src <cspSource>`. Nothing remote, no `unsafe-inline`.

**Send after ready.** `renderBundle` is posted after `webviewReady`, since messages posted before the module script evaluates
can be lost. A page that does not report ready within 30 seconds while visible is a load failure.

**In place** means opening the diagram in the text tab's group, closing the text tab unless it has unsaved changes, and moving
the diagram to the index the text had. The document stays open as text, so a server that reads only open documents still has it.

**The shared submenu** is `zenwave.modelViews` in `editor/title`.

**Known gaps.** Clicking a node does nothing yet, because the page sends nothing ([EF-R5](../flows/eventflow.md#ef-r5)).
