# Working in the ZenWave specs

Applies to humans and coding agents alike, in this repository and in every
ZenWave repository that points here.

This repository describes the ZenWave platform: how the pieces fit, what crosses
between repositories, and why. The code lives in the other repositories. Read
[README.md](README.md) for the layout and how a document is written.

## Spec and code are jointly authoritative

The spec owns what a user or a neighbouring system can notice: a command id, an
activation condition, rendered output, a settings key, a message between two
repositories, a fallback when a dependency is missing.

The code owns how it is done: class structure, bundler, memoisation.

When the two disagree, one of them is wrong, and the fix is a decision. Sometimes
the code learned something the spec did not know. Do not rewrite either to match
the other without deciding which is right.

**The test for what belongs in a spec:** could a user or a neighbouring system
notice it? If not, leave it to the code.

## Where a document goes

| It concerns | It goes in |
| --- | --- |
| One project only | `<project>/`, a folder with the project's name |
| Several repositories | `flows/` |
| A choice and its reason | `decisions/`, one short file |
| A message or data shape | `contracts/`, schema plus example files |
| The platform as a whole | `architecture/` |
| A plan or the history of a change | `work/<name>/` or `<project>/work/<name>/` |

The test for "several repositories": would breaking it break another repo? If yes,
it is a flow or a contract, not a project document.

Before creating a document, look for one that already covers the topic. Add to it
or split it, rather than adding a near-duplicate beside it.

## Changing behaviour

1. **Edit the document first**, in this repository. Say what the behaviour should
   be, mark the rule *proposed*, and open questions as numbered questions.
2. **Implement in the owning repository.** The commit message cites the rule it
   implements, as `spec:<document>#<id>`.
3. **Flip the rule to *exists*** in the commit that makes it true, or in the next
   one in this repository. A rule is not done when the code merges; it is done when
   the document says so.

That is two commits in two repositories, on purpose. It is the price of having the
whole platform described in one place.

Existing documents migrated from OpenSpec keep their original wording and ids. They
are the current spec, not history; edit them like any other. What is under `work/`
is history and plans: tick tasks there, do not rewrite it.

## When the blocker is upstream, write it down where the owner will read it

Most of what blocks a repository is in another one. Writing "blocked on X" in a run
report leaves a person to carry the message, which is how a blocker sits for a
month.

1. Record the need in the relevant document, as a rule or a numbered open question:
   what a consumer must be able to rely on, in the platform's vocabulary, not as a
   patch for one client.
2. Add the work to the document's task list under the repository that owns it, with
   the evidence: the file, the line, and what breaks without it.
3. In the blocked repository, phrase the prerequisite as *"this is available to
   me"*, and tick it when it is, not when someone says they did it.

An upstream repository's agent reads its own section, does the work, and ticks it
there. Nobody carries anything between repositories by hand.

**Small additive upstream fixes may be made directly.** If it mirrors a pattern that
already exists in that repository, has a test, and changes nothing an existing
consumer sees, it is cheaper to do than to file. Anything that changes a shape
another consumer reads is not small: an agent that knows only one client will design
for that client, and the other IDE finds out when it breaks.

## Writing rules

- **Prose, not given-when-then.** A rule is a plain sentence. If it is not obvious,
  follow it with an example sentence. A rule you cannot illustrate is usually vague.
- **Every id is permanent.** Never reuse or renumber one. Titles may change; the
  anchor `<a id="...">` may not.
- **Mark the status of every rule:** *exists*, *proposed* or *superseded*. A document
  that mixes intent and reality without saying which is worse than none.
- **Verified facts say where they were checked.** A date and a source. "I read it
  somewhere" is not a source.
- **Say what you did not check.** An unverified claim written as fact is the
  expensive kind.
- **Questions are numbered and never deleted.** When one is answered, move the answer
  into a rule or a decision and leave the question pointing at it.

## Checking

```bash
node tools/check-refs.mjs                          # scans the sibling repositories
node tools/check-refs.mjs ../zenwave-platform-vscode
```

It fails when a `spec:<document>#<id>` citation names something that no longer
exists, and when a relative link between documents is broken. Run it before you
finish, and in CI in each repository.
