# 0016. The JS parser returns plain numbers, and negative literals keep their sign

**Status:** accepted by agent 2026-09-16, implemented; owner review pending. **Origin:** change 001 task 4.6. **Used by:** [DPO-R4](../flows/dsl-parser-output.md#dpo-r4)

## Decision

`parseZdl` and `parseZfl` return integers as JS numbers, and as decimal strings beyond ±(2^53 − 1). `INT` and `NUMBER` in both
grammars accept a leading minus. The Kotlin model is unchanged: `Long` for an integer, `String` for a decimal.

## Why

Before this an integer reached JS as a Kotlin `Long`, with compiler-mangled field names that change between Kotlin versions, and
`neg -2` lost its sign. The sign fix only changes documents that were already wrong, and all 383 model files in the workspace lex
to the same tokens.

## Open

Decimals stay strings on every platform, and CLI values keep their source text. So "numbers as numbers" in DPO-R4 is broader than
what is true. Changing it would change the JVM model.
