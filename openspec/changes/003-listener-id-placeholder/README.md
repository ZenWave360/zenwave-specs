# 003-listener-id-placeholder

A state transition no longer has to take an `id`. The key that locates the
entity it applies to can arrive in the input payload instead, as a correlation
key such as `orderId`. And when a listened-to service method *does* take an
`id`, the generated listener compiles and hands the rest of the mapping to the
generator instead of giving up: it declares a `null` id with a `TODO`.

The `@listener` annotation does not change.

Repositories touched, in order:

1. `dsl-kotlin`: drop the "state transitions require an id parameter" rule
2. `zenwave-lsp`: update the test that asserted that diagnostic
3. `zenwave-sdk`: listener id placeholder, and service bodies for transitions
   without an id (Java + Kotlin)
4. `arcadia-editions`: the consumer that found this; remodel `releaseStock`
   and regenerate

Read in order: `proposal.md` → `design.md` → `specs/` → `tasks.md`.
