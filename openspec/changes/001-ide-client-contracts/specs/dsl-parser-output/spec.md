## Purpose

Record what a consumer of the ZDL and ZFL parsers can rely on in what they
return — the model, and where each part of it came from in the source — so that
an editor can place things in a document without parsing it a second time.

## ADDED Requirements

### Requirement: The parser reports where each declaration came from
Alongside the model, the parsers SHALL report the span of source text each
declaration occupies, addressed by the same path the model uses, and precisely
enough for a consumer to locate it in the document and to recover the text as
written.

#### Scenario: Placing something next to a declaration
- **GIVEN** an editor that wants to put a control beside a declaration in a model
- **WHEN** it reads what the parser reported for that declaration
- **THEN** it can locate the declaration in the document without parsing the
  document itself

#### Scenario: Recovering what was written
- **GIVEN** a value the parser reports in its interpreted form — a string with
  its quotes removed, a number as a number
- **WHEN** a consumer needs the text exactly as the author wrote it
- **THEN** the reported span lets it recover that text from the source

#### Scenario: A declaration inside another
- **GIVEN** a declaration nested inside another, such as an option belonging to a
  plugin
- **WHEN** a consumer asks where it came from
- **THEN** it is reported, as a top-level declaration would be

**Rationale:** the third scenario is the one that is not true today, and it has
already cost something. Plugin configuration options carry no span, while the
options of the enclosing block do. A consumer that needs the source form of a
plugin option has no way back to it, so it must guess from the interpreted value
— and the two IDE clients guess differently, producing different command lines
for the same model. The alternative, parsing ZDL a second time in the client, is
what this whole arrangement exists to prevent.

### Requirement: Interpreted values stay interpreted
The parsers SHALL report values in their interpreted form — quotes removed from
strings, numbers as numbers, booleans as booleans — and SHALL NOT change that in
order to make source text recoverable.

#### Scenario: A quoted string
- **GIVEN** a declaration whose value is written in quotes
- **WHEN** a consumer reads the model
- **THEN** it gets the string without the quote characters

#### Scenario: Both at once
- **GIVEN** a consumer that wants the interpreted value in one place and the
  source text in another
- **WHEN** it reads the model and the reported span
- **THEN** it can have both, without either being derived from the other by
  guesswork

**Rationale:** recorded so the fix to the requirement above is understood as
additive. Interpreted values are what almost every consumer wants, and reverting
them to source form to solve a locating problem would break the majority to serve
the minority.
