# 0011. The SDK runner is a VS Code task, and every value is quoted

**Status:** accepted. **Origin:** VS Code project decisions and change 002. **Used by:** [SDK runner](../zenwave-platform-vscode/sdk-runner.md#sr-r2)

## Decision

A Run is a `ShellExecution` task of type `zenwave-sdk`, with a dedicated panel per command line. Every value
from a model or from settings (config options, CLI options, injected paths, extra arguments, the configured
command itself) is quoted so it reaches the SDK as one literal argument. Only POSIX shells and PowerShell are
supported. Any other shell, `cmd.exe` included, is refused with an explanation.

## Why

- **Task, not `terminal.sendText`.** A task gives the real terminal users expect plus exit codes, cancellation,
  problem matchers and re-running. Raw `sendText` gives no way to know whether generation succeeded.
- **The identity is the command line.** VS Code derives a task's identity from its definition, so the same
  command reuses a terminal and a changed option opens another, and two declarations of one plugin can run at
  the same time. IntelliJ's terminal search is not ported: it works around a problem VS Code does not have.
- **Quoting.** Trusting a repository to run code generation is not trusting every value in it to be a shell
  command, and a user who clicks Run without hovering has inspected nothing. An earlier draft trusted workspace
  trust; that was reversed.
- **`cmd.exe`** has no quoting that keeps `%`, `&` and `^` reliably literal. Windows PowerShell drops double
  quotes in native arguments, and `jbang.cmd` re-parses what is left, so a value containing `"` is refused there.

## Consequences

- There is no success notification. A zero exit in the terminal is all of it. What a successful generation should
  give the user is an unanswered question, and a notification invented now would have to be unpicked.
- The command stays one string, so what the terminal echoes is what the tooltip showed and can be pasted back.
- Command assembly exists in both Kotlin and TypeScript, and two implementations of one contract will drift. The
  language server owning it is the long-term answer.
