## Purpose

Record that the ZenWave SDK's machine-readable description of its own plugins is
something the IDE clients build on, so that whoever changes the SDK's command
line knows two editors are reading it.

## ADDED Requirements

### Requirement: The SDK describes its own plugins in a machine-readable form
The SDK SHALL be able to report, without running a generation, which plugins it
offers and what each of them accepts. For each plugin that SHALL be enough to
identify it as it would be written in a model, and where to read more about it;
for each option, enough to present it to someone choosing a value — what it is
for, its type, its default, and the values it allows where it is restricted to
some.

#### Scenario: An editor offering what is actually installed
- **GIVEN** an editor helping someone write a plugin declaration
- **WHEN** it asks the SDK what it offers
- **THEN** it can suggest the plugins that SDK has, and the options each accepts,
  rather than a list built into the editor

#### Scenario: Choosing a value
- **GIVEN** an option whose value is restricted to a set
- **WHEN** an editor presents that option
- **THEN** it can show what the option is for, what type it takes, what it
  defaults to, and which values are allowed

#### Scenario: A plugin a team wrote themselves
- **GIVEN** an SDK offering a plugin that did not ship with it
- **WHEN** an editor asks what is available
- **THEN** that plugin is reported like any other, including where its own
  documentation lives

#### Scenario: Sending a reader to the right page
- **GIVEN** an editor showing what a plugin is for
- **WHEN** it offers the reader somewhere to read more
- **THEN** the destination is one the platform reported, not one the editor
  worked out from the plugin's name

#### Scenario: A plugin with nowhere to send anyone
- **GIVEN** a plugin for which no documentation exists
- **WHEN** an editor presents it
- **THEN** it can tell that there is nowhere to link to

#### Scenario: A different SDK version
- **GIVEN** a workspace configured to use a particular SDK build
- **WHEN** an editor asks it what it offers
- **THEN** what it learns is what that build would actually run

#### Scenario: Asking is cheap and safe
- **GIVEN** an editor asking on the user's behalf, without being asked to
- **WHEN** the SDK answers
- **THEN** nothing is generated, nothing is written, and the workspace is
  unchanged

### Requirement: A consumer that cannot read the answer degrades
Where the SDK cannot be reached, or answers with something a consumer cannot
read, that consumer SHALL carry on without the catalogue rather than failing, and
SHALL make the reason discoverable.

#### Scenario: The SDK is not installed
- **GIVEN** an editor whose configured SDK command does not exist
- **WHEN** it asks for the catalogue
- **THEN** it continues without plugin suggestions, and the user can find out why

#### Scenario: An answer from a newer SDK
- **GIVEN** an SDK reporting more about a plugin than a consumer knows to read
- **WHEN** the consumer reads it
- **THEN** it uses what it understands and ignores the rest

**Rationale:** this contract is written down because it is invisible from the
SDK's side. The shape of that answer has been stable for years, and most of what
is recorded here is that **two IDE plugins depend on it** — so that a future
change to it is a decision taken knowingly rather than a discovery made by users
whose completion went quiet.

The documentation location is the one addition being asked for, and the reason is
that **the set of plugins is open**. A team can add their own, and an editor that
worked out a documentation address from a plugin's name would be right for the
ones that shipped and confidently wrong for the rest — sending a reader to a page
about a different plugin. Only whoever declares the plugin knows where it is
documented.
