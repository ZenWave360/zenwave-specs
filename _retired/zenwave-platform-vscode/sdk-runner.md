# SDK Runner

<a id="sdk-runner"></a>

**Status:** proposed (change 002-sdk-runner, never archived; see work/002-sdk-runner/tasks.md for what is done). Migrated from OpenSpec change 002-sdk-runner on 2026-10-29; the wording of each rule is the original. Scenarios are now examples under their rule.

## Purpose

Turn a plugin declaration in a ZDL model into something the user can run without
leaving the editor: a Run affordance on the declaration, a command line assembled
from what the declaration actually says, and a terminal to run it in.

## Rules

<a id="sr-r1"></a>
### SR-R1. Every runnable plugin declaration offers a Run action

The extension SHALL present a Run action directly above each plugin declaration
inside a `config { plugins { … } }` block of a ZDL document. A plugin declared
`disabled` SHALL NOT offer one.

**Examples**

- *A file with several plugins.* Given a `.zdl` file whose `config { plugins { … } }` block declares three plugins, each with its own braced body, when the file is open in the editor, then a Run action appears above each of the three plugin declarations.
- *Several plugins of the same type.* Given a `.zdl` file whose `config { plugins { … } }` block declares the same plugin type more than once, each with its own braced body and options, when the file is open in the editor, then a Run action appears above each declaration, and triggering one runs that declaration's options.
- *A disabled plugin.* Given a plugin declaration marked `disabled`, when the file is open in the editor, then no Run action appears for that plugin, while the other plugins keep theirs.
- *A model with no plugins.* Given a `.zdl` file with entities and services but no `config` block, when the file is open in the editor, then no Run action appears anywhere in the file.
- *A file that does not parse.* Given a `.zdl` file the user is midway through typing, with an unbalanced brace, when the file is open in the editor, then Run actions for the parts that could not be read are simply absent, and no error is shown to the user.

**Rationale:** a half-typed file is the normal state of an editor. A lens that
throws, or an error notification on every keystroke, would make the feature worse
than not having it.

<a id="sr-r2"></a>
### SR-R2. The command line reflects the whole plugin declaration

The Run action SHALL assemble the command from the plugin declaration and the
model file that contains it, using these rules:

- the plugin name is passed as the plugin to run, as the value of the SDK's
  plugin option (`-p`), not as a positional argument;
- the plugin's own config options are passed as `name=value` pairs using the
  value the ZDL parser reports — a string without its quotes, a number as its
  digits — rather than as spelled in the source;
- the enclosing `config` block's options are inherited and passed the same way,
  unless the plugin opts out with `(inherit false)` after its name;
- an option declared on the plugin overrides an inherited option of the same name;
- CLI options declared directly in the enclosing `config` block are inherited
  unless the plugin opts out with `(inherit false)`;
- the effective CLI options are passed in declaration order, with a plugin-local
  CLI option replacing an inherited CLI option of the same name;
- every value that comes from the model or from settings is quoted for the shell
  the command runs in, so that it reaches the SDK as one literal argument and is
  never interpreted by the shell;
- imports that are Maven coordinates (`groupId:artifactId:version`) are collected
  into a single `--deps` argument;
- `zdlFile` defaults to the path of the containing file, unless the declaration
  already sets `zdlFile` or `zdlFiles`;
- `${this.file.path}`, where it appears in any value, is replaced with the path
  of the containing file.

**Examples**

- *Inheriting an option from the config block.* Given a `config` block declaring `basePackage io.example.orders` and a plugin declaring only `targetFolder .`, when the user triggers the plugin's Run action, then the command carries both `basePackage=io.example.orders` and `targetFolder=.`.
- *Opting out of inheritance.* Given a plugin declared as `MyPlugin (inherit false) { … }` alongside a `config` block that sets `basePackage`, when the user triggers that plugin's Run action, then the command carries the plugin's own options only, and no `basePackage`.
- *Not opting out.* Given a plugin declared without an inherit clause, and one declared `(inherit true)`, when the user triggers either Run action, then both inherit the enclosing `config` block's options.
- *A plugin option shadowing an inherited one.* Given a `config` block setting `targetFolder .` and a plugin setting `targetFolder build/generated`, when the user triggers the plugin's Run action, then the command carries `targetFolder=build/generated` once, and not the inherited value.
- *Inheriting a CLI flag from the config block.* Given a `config` block declaring `--force` before two plugin declarations, when the user triggers either plugin's Run action, then each command carries `--force` once.
- *Opting out of inherited CLI options.* Given a `config` block declaring `--force` and a plugin declared as `MyPlugin (inherit false) { … }`, when the user triggers that plugin's Run action, then its command does not carry `--force`.
- *A plugin CLI option shadowing an inherited one.* Given a `config` block declaring `--profile=local` and a plugin declaring `--profile=test`, when the user triggers that plugin's Run action, then the command carries `--profile=test` once and does not carry `--profile=local`.
- *The model file is passed automatically.* Given a plugin declaration that mentions neither `zdlFile` nor `zdlFiles`, when the user triggers its Run action, then the command carries `zdlFile=` followed by the path of the file the declaration is in.
- *The model file is already named.* Given a plugin declaring `zdlFiles orders.zdl,customers.zdl`, when the user triggers its Run action, then the command carries that declaration unchanged and no added `zdlFile`.
- *Maven coordinate imports become dependencies.* Given a model importing both `./shared/common.zdl` and `io.example:my-plugin:1.2.3`, when the user triggers a Run action in that model, then the command carries `--deps io.example:my-plugin:1.2.3`, and the relative file import is not passed as a dependency.
- *Referring to the current file inside a value.* Given a plugin option whose value contains `${this.file.path}`, when the user triggers its Run action, then the command carries the path of the containing file in place of that placeholder.
- *A quoted option value containing spaces.* Given a plugin option declared as `displayName "Orders API"`, when the user inspects or runs its command, then the command carries `displayName="Orders API"`, preserving the parsed value even though the parser does not expose which quote delimiter was used in the source.
- *A numeric option value.* Given a plugin option declared as `maxDepth 3`, when the user inspects or runs its command, then the command carries `maxDepth=3`.
- *A value that looks like shell syntax.* Given a plugin config option or CLI option whose value is `$(touch generated.txt); echo done`, when the user runs the plugin, then the SDK receives that text as the option's value, and no other command runs.

**Rationale:** a model file is shared through a repository, and trusting a
workspace to run code generation is not the same as trusting every value in it to
be a shell command. Quoting everything makes Run do what its tooltip says.

<a id="sr-r3"></a>
### SR-R3. The user can read the command before running it

The Run action SHALL make the full command line visible without running it, and
the command line SHALL be echoed where the command runs.

**Examples**

- *Inspecting before running.* Given a Run action displayed above a plugin declaration, when the user hovers it, then the complete command line that would be executed is shown.
- *Seeing what ran.* Given a plugin that has just been run, when the user looks at the terminal it ran in, then the command line that was executed is visible there, in a form they can copy and re-run by hand.
- *A model in a directory whose name has a space.* Given a model file whose path contains a space, when the user triggers a Run action, then the command runs against that file, and the command line shown is one that would still work if the user pasted it into a shell themselves.

<a id="sr-r4"></a>
### SR-R4. Running a plugin runs it in a terminal in the workspace

Triggering a Run action SHALL execute the assembled command in a terminal, with
the directory containing the model file as the working directory. The run SHALL
be cancellable, SHALL report a non-zero exit status to the user, and SHALL be
re-runnable without returning to the model file. A later Run SHALL reuse that
terminal when the assembled command is the same, and SHALL use a new terminal
when the command differs, including two declarations of the same plugin type.
Several different commands SHALL be able to run at the same time.

**Examples**

- *Running a plugin.* Given a model file at `src/main/resources/model/orders.zdl`, when the user triggers a Run action in it, then the command runs in a terminal whose working directory is `src/main/resources/model`.
- *Running the same command again.* Given a plugin that has already been run, with its declaration unchanged, when the user runs it again, then it runs in the terminal its previous run used.
- *Running again after editing the declaration.* Given a plugin that has already been run, whose options the user has since changed, when the user runs it again, then it runs with the changed options, in a new terminal.
- *Two declarations of the same plugin type.* Given two runnable declarations of the same plugin type, with different options, when the user runs both, then each runs in its own terminal, and both run at the same time.
- *Running plugins from two different models.* Given plugins run from model files in two different directories, when both have been run, then each ran with its own file's directory as the working directory.
- *A terminal the user is working in.* Given a user with their own terminal open, in the same directory as the model, when they trigger a Run action, then the command does not run in their terminal.
- *The SDK fails.* Given a plugin whose options are rejected by `zenwave-sdk`, when the user runs it, then the failure is visible as a failed run, not reported as success, and the SDK's own output remains readable in the terminal.
- *Seeing what was generated.* Given a plugin run that writes files into the workspace, when it finishes, then those files are visible in the workspace without the user reloading the window, and a generated file already open in an editor shows its new content.
- *Re-running the last generation.* Given a plugin that was run a moment ago, when the user re-runs the last task from the command palette, then the same command runs again, without reopening the model file.

<a id="sr-r5"></a>
### SR-R5. A plugin runs only through a shell its command can be quoted for

The extension SHALL run a plugin only through a POSIX shell (such as bash, zsh or
sh) or PowerShell, whether that is the shell VS Code runs tasks in or the login
shell the user chose. For any other shell, and for a value no quoting can deliver
to the SDK intact in the shell being used, it SHALL refuse to run and say why and
what to change.

**Examples**

- *Tasks run in bash or PowerShell.* Given VS Code runs tasks in bash, zsh or PowerShell, when the user triggers a Run action, then the plugin runs.
- *Tasks run in cmd.* Given VS Code runs tasks in `cmd.exe`, and no login shell is selected, when the user triggers a Run action, then nothing is executed, and the user is told that the SDK runs only through a POSIX shell or PowerShell and which setting selects one.
- *A value PowerShell cannot pass intact.* Given tasks run in PowerShell, and a plugin option whose value contains a double quote, when the user triggers its Run action, then nothing is executed, and the user is told which value cannot be passed and how to run it instead.

**Rationale:** `cmd.exe` has no quoting that reliably keeps a value from being
interpreted, and Windows PowerShell drops double quotes inside arguments to native
commands — which, when the SDK is started through a batch file such as
`jbang.cmd`, hands the rest back to `cmd.exe`. Refusing is the only way to keep
the guarantee that a model value is never run as a command.

<a id="sr-r6"></a>
### SR-R6. The user can make the SDK run with their shell's environment

The extension SHALL run the SDK with the environment it inherits from the editor
by default, and SHALL let the user choose instead to run it through a shell that
loads their own profile. An explicitly configured login shell SHALL take
precedence; otherwise the extension SHALL use VS Code's preferred terminal shell
and the login/command arguments appropriate to that shell family. It SHALL report
a configuration error only when neither shell is usable.

**Examples**

- *A tool on the system path.* Given a user whose SDK command is on the path their editor was started with, when they run a plugin, then it is found, with nothing configured.
- *A tool installed by a shell version manager.* Given a user whose SDK command exists only because their shell profile puts it on the path — a version manager, or a shell-specific installation, when they turn on running through their shell, then running a plugin finds the command.
- *Reusing the preferred terminal shell.* Given a user who selects login-shell execution, has a preferred terminal profile in VS Code, and does not configure `zenwave.sdk.loginShell`, when the extension runs a plugin, then it invokes VS Code's preferred terminal shell using that shell family's login/command convention.
- *Overriding the preferred terminal shell.* Given a user whose preferred terminal shell differs from the executable configured in `zenwave.sdk.loginShell`, when the extension runs a plugin, then the explicitly configured shell is used.
- *No usable login shell.* Given login-shell execution is selected, the explicit shell setting is empty, and VS Code reports no preferred shell, when the extension tries to run the SDK, then it reports that no usable login shell is available.

<a id="sr-r7"></a>
### SR-R7. A missing SDK command is diagnosed, not silent

Where the configured SDK command cannot be found, the extension SHALL say so, and
SHALL report what it tried to run and where it looked. It SHALL find this out
without starting the SDK.

**Examples**

- *The SDK is not installed.* Given a user who has not installed the SDK command, when they trigger a Run action, then they are told the command could not be found, and what was tried, rather than being left with a shell error they have to interpret.
- *Installed somewhere the editor cannot see.* Given a user whose SDK command works in their own terminal but is not on the path the editor inherited, when they trigger a Run action, then what they are told is enough to recognise that as the problem, and points them at running through their shell.
- *Not found by the login shell.* Given login-shell execution is selected, and the shell cannot find the SDK command, when the run ends, then the user is told the command was not found through that shell.
- *Starting a run is not delayed.* Given an SDK that takes several seconds to start, when the user triggers a Run action, then the terminal opens and the SDK starts once, without a hidden run of the SDK before it.

<a id="sr-r8"></a>
### SR-R8. The SDK command line is configurable

The extension SHALL let the user configure the command used to invoke
`zenwave-sdk` through the `zenwave.sdk.cliCommand` setting, defaulting to
`jbang zw`, and SHALL let the user append arguments to every run through
`zenwave.sdk.extraArgs`. Both SHALL be overridable per workspace.

**Examples**

- *A locally installed CLI.* Given a user who has `zw` on their `PATH` and sets `zenwave.sdk.cliCommand` to `zw` in their own settings, when they trigger a Run action in any workspace, then the command begins with `zw` and not with `jbang zw`.
- *One project that needs a different SDK.* Given a user with a personal default, working in a project that pins a different SDK command in its workspace settings, when they trigger a Run action there, then the project's command is used, and their default still applies everywhere else.
- *A project-wide extra argument.* Given a workspace setting adding an extra argument, when the user triggers any Run action in that workspace, then that argument is present in the command line.

<a id="sr-r9"></a>
### SR-R9. Plugin declarations are completed from the shipped catalogue

The extension SHALL offer completion for plugin names where a plugin may be
declared, and for the configuration options of the plugin being declared, taken
from the plugin catalogue shipped with the extension.

**Examples**

- *Naming a plugin.* Given the cursor inside a `config { plugins { … } }` block, where a plugin name may be written, when the user asks for completion, then the plugins of the shipped catalogue are suggested, and accepting one leaves the cursor ready to write its options.
- *Setting an option on a plugin.* Given the cursor where an option of a declared plugin may be written, when the user asks for completion, then the options that plugin accepts are suggested, each showing what it is for, its type, its default, and the values it allows where it is restricted to some.
- *Options belong to their plugin.* Given two plugins declared in the same block, each accepting different options, when the user asks for completion inside one of them, then only that plugin's options are suggested.

**Note:** the installed SDK could report plugins of a workspace's own and the
exact options of the version in use, but asking it means starting a JVM, which
takes seconds. When — if ever — that is worth doing is an open question, recorded
in the design; until it is answered, the shipped catalogue is the only source.

<a id="sr-r10"></a>
### SR-R10. A plugin declaration explains itself where it is written

The extension SHALL show, for a plugin name and for a plugin option in a model,
what the shipped catalogue reports about it, together with a way to reach its
documentation.

**Examples**

- *Meeting an unfamiliar plugin.* Given a model declaring a plugin the reader has not used, when they ask the editor about it, then they learn what the catalogue says it is, and can reach its documentation without leaving the editor to search for it.
- *Understanding an option.* Given the cursor on an option inside a plugin declaration, when the user asks the editor about it, then they see what it is for, what type it takes, what it defaults to, and which values it allows where it is restricted to some.
- *Something the catalogue does not describe.* Given an option the catalogue reports without a description, when the user asks about it, then they are shown what is known, and nothing is invented to fill the gap.
- *Nothing to link to.* Given a plugin for which the catalogue reports no documentation, when the user asks about it, then what is known is shown and no link is offered, rather than a link being constructed that may go nowhere.
- *Something the catalogue does not know.* Given a plugin absent from the shipped catalogue, such as one a workspace's own team wrote, when the user asks about it, then nothing is explained and nothing is invented.

**Rationale:** the gap this closes is the one a newcomer hits first — knowing that
a plugin declaration is where generation is configured, and having no idea which
plugin they need or what it accepts. Completion helps someone who already knows
what they are looking for; this helps someone who does not.

The explanation and the link are both things the catalogue reports, never things
the extension works out. The set of plugins is open, so an editor that guessed
where documentation lives would be right only for the ones that shipped with the
SDK, and confidently wrong for everything else.

<a id="sr-r11"></a>
### SR-R11. Authoring help works on every host, without the SDK

The extension SHALL carry a plugin catalogue generated from a named ZenWave SDK
build by its release automation, and SHALL use it to complete and explain plugin
declarations on every host. The user SHALL be able to tell which SDK build it
describes.

**Examples**

- *Authoring a model in the browser.* Given a `.zdl` file open in a browser-based VS Code, where the SDK can never run, when the user writes a plugin declaration, then the plugins and options of the catalogue are suggested and explained, so the file can be authored.
- *Knowing what you are looking at.* Given a suggestion or an explanation from the catalogue, when the user considers it, then it is evident that it comes from the catalogue shipped with the extension, and which SDK version that describes.
- *A workspace with plugins of its own.* Given a workspace using plugins that did not ship with the SDK, when the user asks for completion, then those plugins are absent, and this is not presented as their SDK being incomplete.

<a id="sr-r12"></a>
### SR-R12. Authoring never starts the SDK

The extension SHALL NOT start the SDK, or any other process, to complete or
explain a model.

**Examples**

- *Typing through a plugins block.* Given a user writing several plugin declarations, asking for completion and hovering repeatedly, when they work through the block, then no process is started, and every request is answered immediately.
- *A first run that would download the world.* Given an SDK command that has never run on this machine, when the user opens a model and asks for completion, then they are answered from the shipped catalogue, and nothing is downloaded or started on their behalf.

**Rationale:** `jbang zw -h json` took 8–12 seconds per invocation when measured,
and started a JVM the user never asked for. Authoring help that costs that much
would be worse than help that is a release behind.

<a id="sr-r13"></a>
### SR-R13. The Run action is absent where the SDK cannot run

The extension SHALL NOT present a Run action in a host that cannot spawn
processes, and SHALL NOT run a plugin in a workspace the user has not trusted.
In both cases the reason SHALL be discoverable.

**Examples**

- *A model opened in vscode.dev.* Given a `.zdl` file with plugin declarations, open in a browser-based VS Code, when the file is displayed, then it is syntax highlighted as usual and no Run action appears.
- *Running a plugin where the SDK cannot run.* Given a browser-based VS Code, where the SDK can never run, when the user works in a plugins block, then they can write and understand the declaration, and nothing offers to run it.
- *A model in a restricted workspace.* Given a workspace the user has opened in Restricted Mode, when the user triggers a Run action, then nothing is executed, and the user is told the workspace must be trusted to run code generation.
- *Finding out why the Run action is missing.* Given a user who expected a Run action and does not see one, when they open the ZenWave output channel, then they can see whether this host can run the SDK at all.

