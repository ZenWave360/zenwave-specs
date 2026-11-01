# Navigation brief

<a id="navigation-brief"></a>

Input for an interview with the owner about in-file and cross-file navigation. It collects what exists and what has to be decided. Its answers become rules in [navigation](../zenwave-lsp/navigation-spec.md), and then this page goes.

**Status:** written 2026-11-01. Nothing here is a rule. Facts come from the specs and the files named. No gesture was run in a real IDE for this brief.

## What the owner asked for

Navigation inside a file and across files, by click, Ctrl+click and right click, and buttons for Go to Definition and Go to References on outline items ([ME-R9](../zenwave-platform-vscode/model-explorer.md#me-r9)).

## What exists

**Server.** Hover, definition and references are implemented per module: ZDL, ZFL, OpenAPI, AsyncAPI and Avro have all three, and the manifest has hover and definition only ([LS-T1](../zenwave-lsp/server-architecture.md#ls-t1)). That table says a module implements a feature, not how complete it is.

**Across documents.** Reverse references from other documents are always empty, and results carry no range in the target ([LVR-R9](../flows/lsp-visualization-requests.md#lvr-r9)).

**VS Code.** Go to Definition comes from standard LSP ([lsp-client](../zenwave-platform-vscode/lsp-client.md)). `zenwave.model.forwardReferences` and `reverseReferences` are separate: they are architectural relations, on the editor's context menu ([MA-R1](../zenwave-platform-vscode/model-actions.md#ma-r1)). Selecting a Model tree node reveals its source ([ME-R5](../zenwave-platform-vscode/model-explorer.md#me-r5)).

**IntelliJ.** `plugin.xml` registers `ZenwaveGotoDeclarationHandler`. Its find-usages and how it compares with VS Code were not checked.

**Diagrams.** A click on a node sends nothing to the host today ([EF-T6](../flows/eventflow.md#ef-t6)). What it should do is proposed in [EF-R5](../flows/eventflow.md#ef-r5) and [EF-R7](../flows/eventflow.md#ef-r7).

**Preview pages.** Only `#fragment` links work today. [MP-R20](../zenwave-platform-vscode/model-preview.md#mp-r20) proposes the rest.

**The map.** [navigation](../zenwave-lsp/navigation-spec.md) section 13 lists intended links, with these still not settled:

| Source | Target | Status there |
| --- | --- | --- |
| ZFL command | linked ZDL service method | partially defined |
| ZFL event | linked ZDL event | partially defined |
| ZFL command or event | linked external APIs through ZDL | deferred |
| AsyncAPI channel or message | ZDL method or event | partially defined |
| ZDL model element | inferred Java or Kotlin source | to be decided |

## What each gesture can be

In a text editor, Ctrl+click and the right-click menu already follow the standard requests, so those are mostly about what the server answers. A plain click in text has no language-server meaning and belongs to the cursor. It only navigates if something on top makes it a link. The other surfaces are ours to define.

| Surface | Click | Ctrl+click | Right click |
| --- | --- | --- | --- |
| Text editor | Cursor | Definition, standard | Standard menu, plus MA-R1 |
| Model tree | Reveals source (ME-R5) | Undefined | Undefined; buttons are ME-R9 |
| EventFlow diagram | Selects (EF-R7, proposed) | Undefined | Actions (EF-R4, proposed) |
| Mermaid diagram in a preview | Nothing | Nothing | Copy only (MP-R19) |
| Markdown preview page | Link (MP-R20) | Same | Undefined |

## Questions for the interview

**Gestures**

1. Should a plain click do anything beyond moving the cursor in text, such as a link on `@zdl("...")` or `apis` entries through `documentLink`?
2. Should Ctrl+click on a diagram node or a tree item go straight to the definition, as in text, while a plain click only selects?
3. What must the right-click menu offer on a node, and do VS Code and IntelliJ have to match item by item? See [EF-Q6](../flows/eventflow.md#ef-q6).
4. Can a name inside a Mermaid diagram navigate at all? It would mean interpreting a rendered SVG or sending a map with it, and MP-T1 keeps the client from interpreting Mermaid.

**Definition and references**

5. When Go to Definition has several targets, such as a ZFL command matching two systems, does the IDE show a list? Navigation section 14 says to return several, and leaves scoping open.
6. A ZFL command: does definition go to its declaration in the ZFL `systems` block, or to the ZDL method? Is the other one a reference, or a second target?
7. Should standard Find References and MA-R1's reverse references become one thing for the user? [Their design note](../zenwave-platform-vscode/model-actions.md) keeps them apart on purpose.
8. How much of a reference search must reach documents that are not open? LVR-R9 is the gap, and its cost on the JS server's single thread was not measured.

**Scope and order**

9. Which row of the map must work first? This brief suggests ZFL to ZDL, then ZDL to AsyncAPI and OpenAPI, as what a user of these files meets first.
10. Reverse navigation, from AsyncAPI and OpenAPI back to models: first wave or later? It is navigation's open question 7.
11. Inferred Java or Kotlin source: in or out for now? Questions 4 and 5 of that document depend on it.
12. What does a missing target show in a partial checkout? Navigation section 15 allows falling back to a file link; is that what a user should see, or a message?

**Shape**

13. The navigation spec is a draft with stale names, listed in its own status note. Rewrite it with rules as we answer these, or keep it as a map and write rules beside it?
14. What is the test of done on each IDE, given that comparing IDEs has been a manual check ([backlog](../work/backlog.md))?
