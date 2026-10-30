# SDK Plugin Catalogue

<a id="sdk-plugin-catalogue"></a>

**Status:** 2026-10-30: 2 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Record that the ZenWave SDK's machine-readable description of its own plugins is
something the IDE clients build on, so that whoever changes the SDK's command
line knows two editors are reading it.

## Rules

<a id="spc-r1"></a>
### SPC-R1 (exists). The SDK describes its own plugins in a machine-readable form

*Note: See [decision 0015](../decisions/0015-documentation-url-has-three-states.md).*

The SDK SHALL be able to report, without running a generation, which plugins it
offers and what each of them accepts. For each plugin that SHALL be enough to
identify it as it would be written in a model, and where to read more about it;
for each option, enough to present it to someone choosing a value — what it is
for, its type, its default, and the values it allows where it is restricted to
some.

**Examples**

- *An editor offering what is actually installed.* Given an editor helping someone write a plugin declaration, when it asks the SDK what it offers, then it can suggest the plugins that SDK has, and the options each accepts, rather than a list built into the editor.
- *Choosing a value.* Given an option whose value is restricted to a set, when an editor presents that option, then it can show what the option is for, what type it takes, what it defaults to, and which values are allowed.
- *A plugin a team wrote themselves.* Given an SDK offering a plugin that did not ship with it, when an editor asks what is available, then that plugin is reported like any other, including where its own documentation lives.
- *Sending a reader to the right page.* Given an editor showing what a plugin is for, when it offers the reader somewhere to read more, then the destination is one the platform reported, not one the editor worked out from the plugin's name.
- *A plugin with nowhere to send anyone.* Given a plugin for which no documentation exists, when an editor presents it, then it can tell that there is nowhere to link to.
- *A different SDK version.* Given a workspace configured to use a particular SDK build, when an editor asks it what it offers, then what it learns is what that build would actually run.
- *Asking is cheap and safe.* Given an editor asking on the user's behalf, without being asked to, when the SDK answers, then nothing is generated, nothing is written, and the workspace is unchanged.

<a id="spc-r2"></a>
### SPC-R2 (exists). A consumer that cannot read the answer degrades

*Note: The VS Code client reads a shipped copy and does not ask the SDK. See [decision 0012](../decisions/0012-plugin-catalogue-is-shipped.md).*

Where the SDK cannot be reached, or answers with something a consumer cannot
read, that consumer SHALL carry on without the catalogue rather than failing, and
SHALL make the reason discoverable.

**Examples**

- *The SDK is not installed.* Given an editor whose configured SDK command does not exist, when it asks for the catalogue, then it continues without plugin suggestions, and the user can find out why.
- *An answer from a newer SDK.* Given an SDK reporting more about a plugin than a consumer knows to read, when the consumer reads it, then it uses what it understands and ignores the rest.

**Why:** this contract is written down because it is invisible from the
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
