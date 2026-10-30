# DSL Parser Output

<a id="dsl-parser-output"></a>

**Status:** 2026-10-30: 3 exists, 1 partial. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Record what a consumer of the ZDL and ZFL parsers can rely on in what they
return — the model, and where each part of it came from in the source — so that
an editor can place things in a document without parsing it a second time.

## Rules

<a id="dpo-r1"></a>
### DPO-R1 (exists). The parser reports where each declaration came from

Alongside the model, the parsers SHALL report the span of source text each
declaration occupies, addressed by the same path the model uses, and precisely
enough for a consumer to locate it in the document and to recover the text as
written.

**Examples**

- *Placing something next to a declaration.* Given an editor that wants to put a control beside a declaration in a model, when it reads what the parser reported for that declaration, then it can locate the declaration in the document without parsing the document itself.
- *Recovering what was written.* Given a value the parser reports in its interpreted form — a string with its quotes removed, a number as a number, when a consumer needs the text exactly as the author wrote it, then the reported span lets it recover that text from the source.
- *A declaration inside another.* Given a declaration nested inside another, such as an option belonging to a plugin, when a consumer asks where it came from, then it is reported, as a top-level declaration would be.

**Why:** the third scenario is the one that is not true today, and it has
already cost something. Plugin configuration options carry no span, while the
options of the enclosing block do. A consumer that needs the source form of a
plugin option has no way back to it, so it must guess from the interpreted value
— and the two IDE clients guess differently, producing different command lines
for the same model. The alternative, parsing ZDL a second time in the client, is
what this whole arrangement exists to prevent.

<a id="dpo-r2"></a>
### DPO-R2 (exists). Repeated plugin declarations remain distinct

The ZDL parser SHALL report every plugin declaration, including when several
share a type name, each with its own configuration and source span.

**Examples**

- *Two plugins of the same type.* Given a model that declares the same plugin type twice with different options, when a consumer reads the parsed model, then it can locate both declarations and read each declaration's own options.

**Why:** a model often runs the same generator against different modules.
Each declaration is a separate run, so a consumer must see all of them.

<a id="dpo-r3"></a>
### DPO-R3 (exists). Configuration-level CLI options are parser output

The ZDL grammar SHALL accept CLI options directly inside the enclosing `config`
block, before its `plugins` block, and the parser SHALL report them separately
from configuration properties as the top-level `cliOptions` map. It SHALL use
the same option names and source-form values as CLI options declared inside a
plugin, and SHALL report declaration and value spans under
`cliOptions.<option>` and `cliOptions.<option>.value`. A valueless flag SHALL
have no value span.

**Examples**

- *A shared valueless flag.* Given a `config` block containing `--force` before its `plugins` block, when a consumer reads the parsed model, then `cliOptions.force` is present with no value and the parser reports no syntax problem.
- *A shared CLI option with a value.* Given a `config` block containing `--profile="local build"`, when a consumer reads the parsed model and its locations, then `cliOptions.profile` preserves the source-form value `"local build"` and its value span selects that text including the quotes.
- *Configuration after a shared flag.* Given a normal configuration property following a configuration-level CLI option, when the parser reads the model, then the property retains its own name and interpreted value rather than being consumed during error recovery.

**Why:** configuration properties already provide shared defaults for all
plugin declarations. Shared CLI options are the equivalent for flags such as
`--force`; exposing them in parser output lets each host apply one consistent
inheritance policy without parsing ZDL again.

<a id="dpo-r4"></a>
### DPO-R4 (partial). Interpreted values stay interpreted

*State: Decimals remain strings and CLI values keep their source text. See [decision 0016](../decisions/0016-numbers-from-the-js-parser.md).*

The parsers SHALL report values in their interpreted form — quotes removed from
strings, numbers as numbers, booleans as booleans — and SHALL NOT change that in
order to make source text recoverable.

**Examples**

- *A quoted string.* Given a declaration whose value is written in quotes, when a consumer reads the model, then it gets the string without the quote characters.
- *Both at once.* Given a consumer that wants the interpreted value in one place and the source text in another, when it reads the model and the reported span, then it can have both, without either being derived from the other by guesswork.

**Why:** recorded so the fix to the requirement above is understood as
additive. Interpreted values are what almost every consumer wants, and reverting
them to source form to solve a locating problem would break the majority to serve
the minority.
