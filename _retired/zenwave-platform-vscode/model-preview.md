# Model Preview

<a id="model-preview"></a>

**Status:** proposed (change 005-model-preview, never archived; see work/005-model-preview/tasks.md for what is done). Migrated from OpenSpec change 005-model-preview on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Show a ZDL or ZFL model beside its text as the documentation and diagrams it
describes, rendered from what the language server produces, so that the picture a
VS Code user sees is the picture an IntelliJ user sees.

## Rules

<a id="mp-r1"></a>
### MP-R1. A model file can be previewed beside its text

The extension SHALL offer a preview action for ZDL and ZFL documents, from the
editor and from the command palette, through `zenwave.preview.openToSide` and
`zenwave.preview.open`, and SHALL open the preview beside the editor without
taking focus from the text.

**Examples**

- *Opening a preview.* Given a `.zdl` file open in the editor, when the user invokes the ZenWave preview action, then the preview opens in the column beside the editor, and the cursor stays in the text.
- *Previewing a flow.* Given a `.zfl` file open in the editor, when the user invokes the preview action, then the preview opens showing that flow's representations.
- *The action is offered only for model files.* Given an editor holding a file that is neither ZDL nor ZFL, when the user looks for the preview action, then it is not offered.
- *Previewing the same file twice.* Given a preview already open for a document, when the user invokes the preview action again for that document, then the existing preview is revealed rather than a second one opened.

<a id="mp-r2"></a>
### MP-R2. The preview can take the place of the text, and give it back

The extension SHALL let the user show the preview in place of the document's text
in the same editor, and SHALL leave an obvious way back to the text. Opening a
model file SHALL continue to show its text by default.

**Examples**

- *Replacing the text with the preview.* Given a model file open as text, when the user asks to view it as a preview, then the preview is shown in that same editor, in the same position among the tabs, and the text editor is not left open beside it.
- *Going back to the text.* Given a model file being shown as a preview, when the user asks to edit it again, then the text is shown in that same editor, at the position it was left at.
- *Opening a model file normally.* Given a user who has never configured anything, when they open a `.zdl` file from the explorer, then they get the text editor, not the preview.
- *Reloading the window with a preview open.* Given a preview open when VS Code is closed or the window is reloaded, when the editor reopens, then the preview is restored, showing the same document.

<a id="mp-r3"></a>
### MP-R3. A preview belongs to one document

A preview SHALL show the document it was opened for and no other, SHALL name that
document, and SHALL NOT be re-pointed at a different document while it is open.
The extension SHALL NOT move, restore or re-position editors the user has
arranged.

**Examples**

- *Two models previewed at once.* Given previews open for `orders.zdl` and for `customers.zdl`, when the user moves between them, then each keeps showing its own model.
- *Working on something else.* Given a preview open for `orders.zdl`, when the user focuses an editor holding `customers.zdl`, then the preview keeps showing `orders.zdl`.
- *Previewing a second model.* Given a preview open for `orders.zdl`, when the user invokes the preview action from `customers.zdl`, then a preview for `customers.zdl` is opened, leaving the first one alone.
- *The user rearranges their tabs.* Given a preview the user has dragged into another editor group, when the document changes and the preview re-renders, then the preview stays where the user put it.

**Rationale:** a preview here is an editor for its document, not a viewport that
roams. The built-in Markdown preview offers both behaviours and needs a locking
command to reconcile them; binding to the document from the start avoids
inventing that concept.

<a id="mp-r4"></a>
### MP-R4. The preview shows the representations the server provides

The preview SHALL present the representations the language server returns for the
document, in the order given, each under the title the server supplies, and SHALL
start on the representation the server nominates as the default. The extension
SHALL NOT invent, reorder or omit representations.

**Examples**

- *A ZFL flow with several outcomes.* Given a ZFL document whose flow has three end outcomes, when the preview opens, then the flowchart and one representation per outcome are offered, under the titles the server gave them.
- *Landing on the most useful view.* Given a document for which the server nominates a default representation, when the preview opens, then that representation is the one shown first.
- *Choosing another representation.* Given a preview offering several representations, when the user selects a different one, then the preview shows it, and keeps showing it as the document changes.
- *A server that offers one representation.* Given a document for which the server returns a single representation, when the preview opens, then it is shown without a selector cluttering the panel.

<a id="mp-r5"></a>
### MP-R5. The preview keeps step with the document

The preview SHALL re-render as the previewed document changes, without the user
saving the file or re-invoking the action, and SHALL keep the last rendered
content visible while new content is being produced.

**Examples**

- *Adding a field to an entity.* Given a ZDL file open with its preview showing, when the user types a new field into an entity, then the preview reflects the new field without a manual refresh.
- *Typing mid-declaration.* Given a preview open while the user types a declaration that is briefly incomplete, when the document momentarily cannot be read, then the preview keeps showing the last good content rather than blanking on each keystroke.
- *Editing the file outside the editor.* Given a preview open for a document that is changed on disk by another program, such as a branch switch, when the editor picks the change up, then the preview re-renders from the new content rather than keeping the old one.

<a id="mp-r6"></a>
### MP-R6. Diagrams render locally

The preview SHALL render diagrams from resources shipped with the extension, and
SHALL NOT require a network connection, a Java runtime, a remote rendering
service, or another extension to be installed.

**Examples**

- *A diagram on a machine with no network.* Given a machine with no network connection, when the user previews a model containing a diagram, then the diagram renders.
- *A clean VS Code installation.* Given VS Code with only the ZenWave extension installed, when the user previews a model containing a diagram, then the diagram renders, without a prompt to install anything else.
- *The model stays local.* Given a model describing a private domain, when the preview renders its diagrams, then no part of the model leaves the machine.
- *Content that asks to run or to fetch.* Given a representation whose content carries script, or refers to an image or a stylesheet elsewhere on the network, when the preview displays it, then nothing is executed and nothing is fetched, and the rest of the content is still readable.
- *A diagram that cannot be drawn.* Given a representation whose diagram source is malformed, when the preview tries to render it, then the preview reports that the diagram could not be drawn and leaves the rest of the content readable.

<a id="mp-r7"></a>
### MP-R7. The preview reads as part of the editor

The preview SHALL follow the editor's colour theme, including a change of theme
while it is open, and SHALL let the user select and copy its text.

**Examples**

- *Switching to a light theme.* Given a preview open under a dark theme, when the user switches to a light theme, then the preview and its diagrams follow, without being reopened.
- *Copying from the preview.* Given a preview showing rendered documentation, when the user selects a passage, then they can copy it as text.

<a id="mp-r8"></a>
### MP-R8. The preview explains why it has nothing to show

Where the preview cannot show content, it SHALL say which of these is the case:
no language server available, the server does not support previews, or the
document could not be read. The detail SHALL be recorded in the output channel.

**Examples**

- *No language server.* Given a preview opened in a host with no language server, when the preview is displayed, then it states that the preview needs the ZenWave language server, rather than showing an empty page.
- *A server without preview support.* Given a connected language server that does not support previews, when the user opens the preview, then it states that the connected server cannot produce one, and distinguishes this from the server being absent.
- *A file with a syntax error and nothing rendered yet.* Given a model file with a syntax error, previewed before any good render, when the preview is displayed, then it states that the document could not be read, and the detail is available in the output channel.

