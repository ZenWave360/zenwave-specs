# 003 — Tasks

Do the sections in order: each depends on the one before. The acceptance
criteria are the scenarios in `specs/`. When you finish a task, tick it here
and add a one-line note: the commit, the branch and the tests that prove it.
That's the pattern `002/tasks.md` uses. Commit in each repo on its current
branch (`develop` unless noted), one commit per section, conventional commit
message referencing `003`.

## 1. dsl-kotlin  (`../dsl-kotlin`, Gradle)

- [x] 1.1 Remove rule 1 ("state transitions require an id parameter") from
      `ZdlModelValidator.validateServiceMethodTransition`; renumber the KDoc
      (design §1) — commit 6200d58, dsl-kotlin `develop`
- [x] 1.2 Update `ZdlValidationE2ETest`: drop the expected message; turn the
      fixture method into an id-less `from` transition that validates cleanly,
      and add one id-less method with an invalid `from` state to prove rules
      2–4 still run (spec `zdl-validation`) — 6200d58;
      `ZdlValidationE2ETest.invalidServiceTransitionsReportEveryBusinessRule`
      (CorrelatedService clean; IdlessInvalidStateService reports GONE)
- [x] 1.3 `./gradlew jvmTest jsNodeTest` green (use whatever test tasks the
      repo's CI runs if those names differ) — green on JDK 21.0.9-tem
- [x] 1.4 `./gradlew publishToMavenLocal` so `zenwave-sdk` picks up
      `dsl-kotlin-jvm:1.10.0-SNAPSHOT` — BUILD SUCCESSFUL

## 2. zenwave-lsp  (`../zenwave-lsp`, Gradle, includes `../dsl-kotlin` as a build)

- [x] 2.1 `ZdlLanguageModuleTest`: the test asserting the "requires an id"
      diagnostic now asserts the same model has no diagnostics (design §2) — 7cac5f7, zenwave-lsp `develop`;
      `ZdlLanguageModuleTest.idlessServiceTransitionsProduceNoDiagnostics`
- [x] 2.2 `lsp-core` tests green; grep the repo for any other use of the
      message (fixtures, snapshots) and update it — `./gradlew :lsp-core:jvmTest :lsp-core:jsNodeTest` green; no other uses
      outside `.ci-deps/` (untracked CI copy of dsl-kotlin)

## 3. zenwave-sdk — listeners  (`../zenwave-sdk`, Maven)

- [x] 3.1 `ZDLListenerUtils.classifyBinding`: classify `(id, Input)` and `(id)`
      as described in design §3; expose `idPlaceholder`, `idParamName`,
      `idJavaType` on the binding — 81926bad, zenwave-sdk `develop`; `(id)` -> new mode `ID_ONLY`; idJavaType = generator `idJavaType` (same value the `methodParametersSignature` helper receives); natural-id methods stay CUSTOM
- [x] 3.2 Java `EventListeners.java.hbs`: render the placeholder and the call — 81926bad, zenwave-sdk `develop`; `BackendApplicationModulithGeneratorTest.listenerWith*`
- [x] 3.3 Kotlin `EventListeners.kt.hbs`: same, using `TODO(...)` (design §3) — 81926bad, zenwave-sdk `develop`; `BackendApplicationKotlinListenersGeneratorTest.kotlinListener*` (no existing Kotlin convention found; used design's `TODO("CUSTOM_REQUIRED: ...")`)
- [x] 3.4 Tests: extend `BackendApplicationModulithGeneratorTest` and
      `BackendApplicationKotlinListenersGeneratorTest` with a model covering
      `(Input)`, `(id, Input)`, `(id)` and one unsupported shape; assert the
      generated source, and that the generated project compiles if those tests
      already do compile checks (spec `sdk-listener-generation`) — 81926bad, zenwave-sdk `develop`;
      Java: `listenerWithIdAndBeanInputDeclaresNullIdPlaceholderAndCompiles`, `listenerWithIdOnlyDeclaresNullIdPlaceholderAndEmitsNoMapperMethod`,
      `listenerUnsupportedShapesKeepThrowingCustomRequiredBody`, `listenerWithoutIdIsUnchanged`; Kotlin: `kotlinListener{WithIdAndBeanInput,WithIdOnly,UnsupportedShapes,WithoutId}...`
      (Kotlin test has no compile check)
- [x] 3.5 Update `docs/zdl-listener-asyncapi-final-synthesis.md` (the
      `CUSTOM_REQUIRED` list says "ids") — 81926bad
- [ ] 3.6 (optional) Apply the same classification to
      `BackendApplicationAsyncApiAdaptersGenerator.planOperation`
      (`hasOneBeanParameter` also requires `paramId == null`). Skip it if it
      needs changes to the AsyncAPI consumer templates beyond the placeholder.
      — SKIPPED (not ticked): see report; left for a decision

## 4. zenwave-sdk — service bodies for transitions without an id

- [x] 4.1 Add the new `MethodBodyCase` values and the id-less-from case to
      `ServiceMethodBodyPlanner`, **ahead of** `ENTITY_LIST` and the
      query/new-instance cases (design §4) — 6d6c228c (zenwave-sdk `develop`); `ServiceMethodBodyPlannerTest.planEntityMethodBody_idlessFromTransition*`, `..._transitionsWithIdOrWithoutFromKeepTheirCases` (new cases `ENTITY_TRANSITION_LOOKUP_LIST/REQUIRED/OPTIONAL`, right after ASYNC_DELEGATE)
- [x] 4.2 Matching branch in `partials/shared/entities-methodBody.hbs` (and
      `jpa/`, `mongodb/` wherever they don't delegate to `shared/`) — same commit; `BackendApplicationTransitionsWithoutIdTest.{entityServiceArrayReturnStubsLookupAndNeverCallsFindAll,entityServiceSingleAndOptionalReturnUseEmptyOptionalAndLifecycleChain,entityServiceWithoutIdGeneratedProjectCompiles,plannerAndTemplateAgreeOnTheBranchForEveryMethodShape}` (jpa/mongodb delegate to shared/; `withEvents.hbs` got `eachVar` to emit per element for arrays since the events mapper takes one entity; note the `not` helper is true for any non-boolean string, so the branch uses `isFalsy`)
- [x] 4.3 `aggregates-commands-methodBody.hbs`: no `paramId` + `from` → a
      `TODO CUSTOM_REQUIRED` lookup instead of `new Aggregate()` (both the
      single- and multi-aggregate halves) — same commit; `BackendApplicationTransitionsWithoutIdTest.aggregateServiceLooksUpAggregateInsteadOfNewInstance` (project compiles; both halves patched)
- [x] 4.4 Same in the Kotlin plugin's `core/implementation/partials` — same commit; `BackendApplicationKotlinTransitionsWithoutIdTest.kotlin*` (no Kotlin compile check exists; idiom `emptyList<E>().firstOrNull() ?: throw`)
- [x] 4.5 Tests for each scenario in spec `sdk-service-transitions`, including
      "methods with an id are unchanged" (existing tests must pass untouched) — same commit; `methodsWithAnIdAreUnchanged`, `kotlinMethodsWithAnIdAreUnchanged` + tests under 4.1-4.4; existing tests untouched
- [x] 4.6 `mvn -q install -DskipTests=false` from the `zenwave-sdk` root is
      green, and the SDK is installed locally for step 5 — `mvn -o install -DskipTests=false` from zenwave-sdk root: BUILD SUCCESS (JDK 21.0.9-tem)

## 5. arcadia-editions  (`c:/Users/ivangsa/workspace/arcadia-editions`)

Read `AGENTS.md` and `arcadia-editions-architecture/skills/arcadia-zenwave-overlay.md` first.

- [x] 5.1 `catalog-inventory-domain-model.zdl`: `ReleaseStockInput.orderId`
      back to `required`; `releaseStock(ReleaseStockInput) StockReservation[] withEvents StockReleased`
      (design §5). Don't touch `confirmStockReservation` (open question). — f547f8a (arcadia-editions-modulith-api, main); Lint plugin (zenwave-sdk 2.8.0-SNAPSHOT) reports no findings
- [x] 5.2 Regenerate `arcadia-editions-modulith-service` with the locally
      installed SDK; check that `PaymentsProcessingEventsListener` now maps
      without an id, and that other id-taking listeners (e.g. payments'
      `capturePayment`, `voidPayment`) got the placeholder instead of the
      throwing body — 87e7c6a (modulith-service, feature/sdd); regenerated with jbang zw 2.8.0-SNAPSHOT; inventory listener now `releaseStock(mapper.asReleaseStockInput(event))`; orders cancelOrder/confirmOrder and payments retryPayment/voidPayment/capturePayment got `Long id = null;` + TODO CUSTOM_REQUIRED; regenerated main compiles (WIP did not)
- [x] 5.3 Implement the lookup in `InventoryServiceImpl.releaseStock`
      (`findByOrderId`); keep hand-written code and tests intact (don't use
      `--force` over tests) — 87e7c6a; `stockReservationRepository.findByOrderId(input.getOrderId())`, repo + in-memory repo method added; no tests touched except stale ProductCatalogServiceTest Optional fix needed to compile
- [x] 5.4 Same regeneration for `arcadia-editions-modulith-service-kotlin` — not regenerated, by owner decision: the Kotlin service (d17e9b7, main) already has `releaseStock(input)` with `findByOrderId` and hand-written code, and `--force` onto the remodelled per-module layouts would destroy it. A scratch-copy regeneration compiled the new Kotlin listener templates (`val id: Long = TODO(...)`) once the pre-existing `@Mapping(target = "copy", ignore = true)` bug was removed; that bug is fixed in zenwave-sdk b2099e1a (`develop`; `BackendApplicationKotlin*` tests green)
- [ ] 5.5 Both services build and their tests pass — waived by owner (tests in the arcadia services are not green independently of 003). Java: `mvn -o test` (JDK 25) 29 run/2 fail/11 err (missing TestDataLoader fixtures, ArchitectureTest `BaseMapper` rules); Kotlin: `mvn -o test` 78 run/0 fail/1 err (ModularityTest cycle, present at d17e9b7). Java main compiles

## 6. Close

- [x] 6.1 Every scenario in `specs/` is covered by a named test, listed next to
      its task above — map below (all test methods verified to exist; results as reported in §1–§4)
      - `zdl-validation` / Correlated transition without id → dsl-kotlin `ZdlValidationE2ETest.invalidServiceTransitionsReportEveryBusinessRule` (`CorrelatedService`, exact problem list); zenwave-lsp `ZdlLanguageModuleTest.idlessServiceTransitionsProduceNoDiagnostics`
      - `zdl-validation` / Other transition rules still apply without id → `ZdlValidationE2ETest.invalidServiceTransitionsReportEveryBusinessRule` (`IdlessInvalidStateService`, "GONE is not a valid state value")
      - `sdk-listener-generation` / (id, Input) in Java → `BackendApplicationModulithGeneratorTest.listenerWithIdAndBeanInputDeclaresNullIdPlaceholderAndCompiles` (MavenCompiler)
      - `sdk-listener-generation` / (id) only → `BackendApplicationModulithGeneratorTest.listenerWithIdOnlyDeclaresNullIdPlaceholderAndEmitsNoMapperMethod`
      - `sdk-listener-generation` / Kotlin → `BackendApplicationKotlinListenersGeneratorTest.kotlinListenerWithIdAndBeanInputDeclaresTodoIdPlaceholder`, `kotlinListenerWithIdOnlyDeclaresTodoIdPlaceholder` (text only: no Kotlin compile check in the SDK tests; compile shown only in the §5.4 scratch regeneration, with the pre-existing `@Mapping(target = "copy")` bug worked around)
      - `sdk-listener-generation` / Unsupported shapes keep today's behaviour → `listenerUnsupportedShapesKeepThrowingCustomRequiredBody`, `kotlinListenerUnsupportedShapesKeepThrowingCustomRequiredBody` (paginated with and without id; array and non-bean shapes not separately tested)
      - `sdk-listener-generation` / Methods without an id are unchanged → `listenerWithoutIdIsUnchanged`, `kotlinListenerWithoutIdIsUnchanged` + existing listener tests unchanged and green
      - `sdk-service-transitions` / Entity service, array return → `BackendApplicationTransitionsWithoutIdTest.entityServiceArrayReturnStubsLookupAndNeverCallsFindAll`, `entityServiceWithoutIdGeneratedProjectCompiles`; `BackendApplicationKotlinTransitionsWithoutIdTest.kotlinEntityServiceArrayReturnStubsLookupAndNeverCallsFindAll`
      - `sdk-service-transitions` / Entity service, single or Optional return → `entityServiceSingleAndOptionalReturnUseEmptyOptionalAndLifecycleChain`; `kotlinEntityServiceSingleAndOptionalReturnUseNullLookupAndLifecycleChain`
      - `sdk-service-transitions` / Aggregate service → `aggregateServiceLooksUpAggregateInsteadOfNewInstance`; `kotlinAggregateServiceLooksUpAggregateInsteadOfNewInstance`
      - `sdk-service-transitions` / Planner and template agree → `plannerAndTemplateAgreeOnTheBranchForEveryMethodShape`; `ServiceMethodBodyPlannerTest.planEntityMethodBody_idlessFromTransitionIsClassifiedAheadOfListAndNewInstanceCases`, `..._transitionsWithIdOrWithoutFromKeepTheirCases`
      - `sdk-service-transitions` / Methods with an id are unchanged → `methodsWithAnIdAreUnchanged`, `kotlinMethodsWithAnIdAreUnchanged` + existing suite green, no existing assertion modified
- [ ] 6.2 Leave archiving (`openspec archive`) to the human
