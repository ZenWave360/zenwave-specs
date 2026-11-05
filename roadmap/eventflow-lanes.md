# EventFlow lanes, analysis for PX/10.4

Codex, read-only, 2026-11-05. The owner decided section 7's questions the same day; see section 8.

**Recommendation:** add `lanes: none | systems` to the existing flow layout, using server-side horizontal bands after ELK. Keep the service map as a separate representation. Defer Services lanes until ownership rules for policies and unassigned nodes are agreed.

This is a static analysis of the checked-out sources. No files were modified; no builds or tests were run.

1. **Current `flow` and `services` behaviour**

   The server does **not** receive a view-mode parameter today. `eventFlowViews` generates both graphs; the page chooses which to display. Variants and saved positions affect only `flowGraph`. See [ModelVisualizations.kt:60](C:/Users/ivangsa/workspace/zenwave/zenwave-lsp/lsp-core/src/commonMain/kotlin/io/zenwave360/lsp/core/visualization/ModelVisualizations.kt:60).

   | Mode | Server computation | Page rendering |
   |---|---|---|
   | `flow` | Command/event/read-model/policy/start graph; flat ELK Layered layout, directed right. | `EventFlowVisualizer` draws positioned nodes and flow edges, including synthetic outcome decorations. |
   | `services`, labelled **Systems** | Separate inventory of commands and their emitted/response outcomes, grouped by system/service path; custom grid layout. | `ServiceMapVisualizer` draws service containers and children, with **no edges**. |

   Evidence: [flow transformation:15](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToFlowViewModelTransformer.kt:15), [service transformation:12](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToServiceViewModelTransformer.kt:12), [service grid:18](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ServiceViewLayoutEngine.kt:18), [page dispatch:290](C:/Users/ivangsa/workspace/zenwave/zenwave-architectural-vistas/packages/eventflow-page/src/EventFlowPage.tsx:290), [service renderer:349](C:/Users/ivangsa/workspace/zenwave/zenwave-architectural-vistas/packages/eventflow/src/ServiceMapVisualizer.tsx:349).

   **The current services mode is a service map, not the same flow grouped by system.** It excludes starts and policies, treats responses as service-map events, and uses group-qualified outcome IDs.

   In the flow layout, `ElkLayoutConstraints.partitions` derives **temporal ranks** from graph edges, breaking/collapsing cycles and assigning longest-path ranks. It does not partition by system. Both ELK implementations put every semantic node directly under the root and assign those ranks as partition IDs. After layout, `systemGroups` are padded bounding rectangles around nodes sharing `node.system`; they impose no separation and can overlap. See [constraints:36](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ElkLayoutConstraints.kt:36), [JVM layout:56](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jvmMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:56), [group bounds:158](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jvmMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:158).

   The current `EventFlowVisualizer` does **not consume `systemGroups`**: its rendered nodes comprise semantic nodes plus synthetic outcomes. An existing `SystemGroupNode` component is therefore only a starting point. See [EventFlowVisualizer.tsx:627](C:/Users/ivangsa/workspace/zenwave/zenwave-architectural-vistas/packages/eventflow/src/EventFlowVisualizer.tsx:627).

2. **Producing Systems lanes**

   Assume “lanes” means horizontal bands, with time flowing left to right.

   | Approach | Assessment |
   |---|---|
   | **ELK partitions by system** | Unsuitable. With rightward layout, increasing partition IDs order nodes **left to right**, producing system columns. This would also replace the temporal partitions already used. [ELK partition semantics](https://eclipse.dev/elk/reference/options/org-eclipse-elk-partitioning-partition.html). |
   | **Compound system parents** | Supported by ELK Layered, including cross-hierarchy edges with `INCLUDE_CHILDREN`. Requires hierarchical graph construction, proper edge containment and recursive conversion of relative coordinates to absolute positions. Compound boxes alone do not guarantee full-width horizontal lanes or globally aligned temporal ranks. [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html), [hierarchy handling](https://eclipse.dev/elk/reference/options/org-eclipse-elk-hierarchyHandling.html). |
   | **Bands after flat ELK** | Best fit for this request. Preserve temporal x positions, pack nodes into disjoint y bands, then compute common-width lane rectangles and overall bounds. Implement packing once in common Kotlin. |

   Compound graphs are representable in [elkjs 0.9.3’s API](https://raw.githubusercontent.com/kieler/elkjs/0.9.3/typings/elk-api.d.ts). However, neither current adapter builds them; the JS result reader only visits root children. See [JS engine:53](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jsMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:53) and [result extraction:111](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jsMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:111).

   Recommended band algorithm: retain ELK x, preserve stable ordering within each lane, resolve overlapping node rectangles, calculate variable lane heights, and stack lanes with padding. Merely drawing today’s system bounds would not create lanes.

   There is an older common `FlowLayoutEngine` with horizontal system lanes, but the active generator uses ELK. Its fixed 200-unit lane spacing is useful precedent, not a sufficient packing algorithm. See [legacy lanes:160](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/FlowLayoutEngine.kt:160) and [active generator:14](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/application/GenerateFlowViewFromZfl.kt:14).

   All positioning must remain upstream under [decision 0001:7](C:/Users/ivangsa/workspace/zenwave/zenwave-specs/decisions/0001-layout-stays-on-the-server.md:7).

3. **Services lanes and available ownership**

   `FlowNode` already carries nullable `system` and `service`; use their **pair**, not service name alone, as the lane identity. See [FlowNode.kt:13](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/FlowNode.kt:13).

   | Node | Ownership available today |
   |---|---|
   | Command | Declared command system/service. Undeclared async-call placeholders inherit the caller’s values. |
   | Event | Publishing command’s system/service; shared event names currently retain the first publisher’s ownership. |
   | Read model | Producing command’s system/service; creation is deduplicated by name. |
   | Policy | Both fields explicitly null. The target command provides a possible inferred lane. |
   | Start | Both explicitly null in the graph. Semantic `@system` exists but is not copied into the flow node; no service ownership exists. |
   | End | No current server `END` node. Terminal labels decorate an event/read model and retain its ownership; a synthesized missing terminal event has null ownership. |

   Evidence: [graph construction:20](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToFlowGraphTransformer.kt:20), [policies:115](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToFlowGraphTransformer.kt:115), [terminal outcomes:158](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToFlowGraphTransformer.kt:158), [read models:387](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/ZflToFlowGraphTransformer.kt:387), [publisher selection:81](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/zfl/semantic/ZflSemanticAnalyzer.kt:81), [start annotation:42](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/zfl/semantic/ZflSemanticAnalyzer.kt:42).

   Services therefore needs little additional layout machinery once generic lanes exist. Its additional cost is semantic decisions and fixtures: unassigned nodes, shared outcomes, service-name collisions, and larger diagrams. These ownership gaps also affect Systems lanes. Recommend an explicit **Unassigned** band initially; any inference should produce presentation membership without changing semantic ownership.

4. **Saved positions**

   **Positions should be independent per lanes value.** Identical node IDs make today’s completeness check accept an unlaned arrangement for Systems, even when its nodes interleave between lanes.

   Today `<name>.zfl.positions.json` contains only `schema: zfl.eventflow.positions@1` and one `flow` position map. The host parses/writes it; `withPositions` first runs automatic layout, replaces every node position, then recomputes graph bounds and padded system bounds. See [positions.ts:24](C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-px10/src/eventflow/positions.ts:24) and [withPositions:43](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/application/GenerateFlowViewFromZfl.kt:43).

   Recommend a versioned schema holding separate `none`, `systems`, and eventually `services` maps in the same file. Read `@1.flow` as the legacy `none` arrangement. Saving one mode must preserve the others.

   With lanes, recomputing today’s padded bounds is insufficient: it can produce overlapping rectangles. Recompute **lane geometry** from final positions and validate lane separation. Prefer constraining dragging to the assigned lane; the server should reject incompatible saved lane arrangements with an explicit fallback reason. Persist semantic node coordinates, not decorative lane rectangles. Existing edges contain no ELK route geometry to invalidate: [FlowEdge.kt:10](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/commonMain/kotlin/io/zenwave360/language/eventflow/view/FlowEdge.kt:10).

5. **Variants**

   Apply lanes **after selecting the variant graph**. Keep variant IDs and semantic node IDs unchanged; only its surviving nodes determine lane contents and bounds.

   EF-R12’s “Flow only, not Systems” distinction refers to the current service map. With lanes, variants remain flow diagrams under every lanes value. They should always use automatic layout, ignore saved positions, and disable saving. Current server behaviour already ignores positions for variants: [ModelVisualizations.kt:73](C:/Users/ivangsa/workspace/zenwave/zenwave-lsp/lsp-core/src/commonMain/kotlin/io/zenwave360/lsp/core/visualization/ModelVisualizations.kt:73).

   Include lanes in canvas framing identity and track requested versus displayed lanes while awaiting the response, as the page already does for variants. Update [EF-R12:124](C:/Users/ivangsa/workspace/zenwave/zenwave-specs/flows/eventflow.md:124).

6. **Wire and repository changes**

   Proposed additive contract:

   - **LSP:** optional `lanes: "none" | "systems" | "services"`, capability advertising supported values, and an echoed effective value. Pass it through full, variant, and `withPositions` paths. Keep `serviceGraph` compatible.
   - **View model:** generic lane descriptors with stable IDs, labels, membership and bounds; `systemGroups` alone cannot describe Services lanes.
   - **Page:** replace Flow/Systems selector with Lanes. Send `lanesChanged`; wait for server-generated `flowGraph`. Include effective lanes in `renderBundle` and save-position context. Minimal-page hosts supply the choice.
   - **Host:** refresh on lane changes, include lanes in refresh deduplication, isolate saved-position slots, and reject stale save messages.

   Current entry points are [JS request handler:96](C:/Users/ivangsa/workspace/zenwave/zenwave-lsp/lsp-js/src/jsMain/kotlin/io/zenwave360/lsp/js/ZenwaveJsLanguageServer.kt:96), [JVM DTO:138](C:/Users/ivangsa/workspace/zenwave/zenwave-lsp/lsp-jvm/src/main/kotlin/io/zenwave360/lsp/jvm/DtoMapper.kt:138), [VS Code request wrapper:189](C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-px10/src/lsp/requests.ts:189), [refresh key:135](C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-px10/src/eventflow/session.ts:135), and [renderBundle:359](C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-px10/src/eventflow/session.ts:359).

   Do not redefine `services` or `viewModeChanged` to mean lanes: that changes existing protocol semantics. Additions can retain protocol v1; removing/reinterpreting existing messages requires a version change. See [protocol.ts:4](C:/Users/ivangsa/workspace/zenwave/zenwave-architectural-vistas/packages/eventflow-page/src/protocol.ts:4).

7. **Effort, risks and owner decisions**

   Estimates cover Systems lanes, per-mode positions, compatibility and focused validation.

   | Repository | Effort | Main work |
   |---|---|---|
   | `dsl-kotlin` | **M** | Shared band packing, membership/bounds, saved-position validation, JVM/JS fixtures. Compound-layout alternative: **L**. |
   | `zenwave-lsp` | **M** | Common API, both transports, capability/validation, wire tests. |
   | `zenwave-architectural-vistas` | **M** | Lane backgrounds, dragging rules, selector/messages, variant framing and save state. |
   | `zenwave-platform-vscode` | **M** | Requests/session, positions migration, commands/settings, page-package update, desktop/browser checks. |
   | `zenwave-specs` | **S** | EF-R3/R12/R14, LSP/page contracts, positions decision and PX/10.4. |

   Services adds approximately **M in DSL** and **S elsewhere** if ownership conventions suffice; explicit new ownership syntax increases scope.

   Principal risks are cross-lane edge readability, excessive height, saved-layout migration, and JVM/JS visual differences. The targets already use different node dimensions, while the renderer enlarges smaller boxes—lane sizing must account for this. See [JVM dimensions:138](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jvmMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:138), [JS dimensions:157](C:/Users/ivangsa/workspace/zenwave/dsl-kotlin/dsl-kotlin/src/jsMain/kotlin/io/zenwave360/language/eventflow/view/ElkFlowLayoutEngine.kt:157), [rendered dimensions:106](C:/Users/ivangsa/workspace/zenwave/zenwave-architectural-vistas/packages/eventflow/src/EventFlowVisualizer.tsx:106).

   Owner decisions needed: confirm full-width horizontal bands and lane order; choose Unassigned versus inferred membership; decide whether to retain the service map through existing palette commands; approve per-mode saved positions and discard scope; decide whether Services ships now or later. Existing `defaultView` explicitly means flow versus service map, so it needs an explicit migration decision: [package.json:953](C:/Users/ivangsa/workspace/zenwave/grok-work/vscode-px10/package.json:953).

   Finally, EF-R3 still describes title-bar controls superseded by EF-R22. PX/10.4 remains the pending lanes analysis/build item: [EF-R3:100](C:/Users/ivangsa/workspace/zenwave/zenwave-specs/flows/eventflow.md:100), [EF-R22:163](C:/Users/ivangsa/workspace/zenwave/zenwave-specs/flows/eventflow.md:163), [backlog:352](C:/Users/ivangsa/workspace/zenwave/zenwave-specs/work/backlog.md:352).

8. **Owner decisions, 2026-11-05**

   - **Bands.** Full-width horizontal bands. The order is the order of the `systems {}` block: systems as declared, and in Services lanes the services of each system as declared. A system or service used but not declared, and a command with no service ([ZFL-R8](../dsl-kotlin/zfl-language.md#zfl-r8) makes that a warning), go after the declared ones in order of first appearance; commands with no service share one last band.
   - **Membership.** A policy, and a start through the policy it triggers, takes the band of the command it calls. A policy that calls nothing, or a start whose policies call commands in different bands, takes the band of the first command in text order. This is presentation only: it never changes what the model says owns them.
   - **Service map.** Kept as it is, behind the existing palette commands and `defaultView`. Lanes are a separate choice on the flow view, so the `services` view mode and `viewModeChanged` keep their meaning and the protocol stays at v1. The owner had no preference; this is the choice with the least work, and removing the service map later is still possible.
   - **Positions.** The positions file holds one map per lanes value (`none`, `systems`, `services`) under a new schema `zfl.eventflow.positions@2`; saving one mode keeps the others. No compatibility is needed yet: an `@1` file is ignored and the flow is laid out automatically, and the next save writes `@2`.
   - **Services now.** `lanes: none | systems | services` ships at once, not Systems first.
