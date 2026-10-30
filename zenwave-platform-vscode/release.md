# Release

<a id="release"></a>

**Status:** 2026-10-30: 4 partial, 2 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Describe how a commit becomes an extension somebody can install — what the
package contains, how its version identifies it, which registries carry it, and
what is checked before any of that is irreversible.

## Rules

<a id="r-r1"></a>
### R-R1 (partial). The extension is installable from both registries

*State: Automated in CI and dry-run. Accounts and tokens are not set up, and nothing has been published.*

The extension SHALL be published to the VS Code Marketplace and to Open VSX, from
the same build, under the same version.

**Examples**

- *Installing in VS Code.* Given a user of Microsoft's VS Code, when they search the marketplace for ZenWave, then the extension is offered and installs.
- *Installing in an editor that cannot reach the marketplace.* Given a user of VSCodium, Cursor, Gitpod or another editor served by Open VSX, when they search their registry for ZenWave, then the same version is offered and installs.
- *One registry refuses a publish.* Given a release where publishing to one registry fails, when the release finishes, then it is reported as failed rather than as successful, and it is recorded which registry carries that version and which does not.

**Note:** a published version cannot be withdrawn, only superseded, so a partial
release cannot be undone. What this requires is that it is never reported as a
success, and that the gap is known — the remedy is a follow-up version, and
someone has to know to cut one.

<a id="r-r2"></a>
### R-R2 (partial). A release is produced by CI from a tagged commit

*State: As R-R1.*

Releases SHALL be built and published by the project's automation, from a commit
that carries a release tag, and SHALL NOT depend on a contributor's machine.

**Examples**

- *Cutting a release.* Given a maintainer who tags a commit for release, when the automation runs, then the extension is built, verified and published without anyone packaging it locally.
- *An ordinary commit.* Given a commit pushed without a release tag, when the automation runs, then the extension is built and verified, and nothing is published.
- *Verification fails.* Given a tagged commit whose build or checks fail, when the automation runs, then nothing is published.

<a id="r-r3"></a>
### R-R3 (exists). A published version identifies what it was built from

Every published version SHALL be traceable to the exact commit it was built from,
and SHALL carry a record of what changed in it.

**Examples**

- *Diagnosing a report.* Given a user reporting a problem with a specific installed version, when a maintainer looks that version up, then they can identify the commit it was built from.
- *Reading what changed.* Given a user looking at the extension's listing before upgrading, when they read its release notes, then they see what changed in that version.
- *Two builds of one commit.* Given the same tagged commit built twice, when the two packages are compared, then they contain the same set of files, and each file that is not a build timestamp or signature has the same content.

<a id="r-r4"></a>
### R-R4 (partial). Willing users can get a version before everyone does

*State: Built; never published.*

The extension SHALL offer a pre-release channel, distinguishable from the stable
one, so that work whose dependencies are still moving can be exercised by users
who opt in.

**Examples**

- *Opting in.* Given a user who wants to try unreleased work, when they switch the extension to its pre-release version, then they receive it, and can go back to the stable one.
- *Not opting in.* Given a user who has done nothing, when a pre-release is published, then they are not moved onto it.
- *Telling them apart.* Given a user looking at which version they have, when they compare it to what is published, then it is evident whether they are on a pre-release.

<a id="r-r5"></a>
### R-R5 (exists). The package contains what it should and nothing else

The published package SHALL contain everything the extension needs to run in both
hosts, and SHALL NOT contain sources, tests, fixtures, development configuration
or build intermediates.

**Examples**

- *Running from the published package.* Given the extension installed from a registry, when a user opens a ZDL file, then it activates, is highlighted, and its icons are shown.
- *Weight.* Given a published package, when its contents are listed, then it carries no source, no test, no fixture and no development configuration.
- *A new asset.* Given a change that adds an asset the extension needs at runtime, such as a bundled renderer, when that asset is removed from the build and a release is attempted, then the release fails.

<a id="r-r6"></a>
### R-R6 (partial). What is published has been exercised in both hosts

*State: CI builds both hosts; launching them before publishing is still open.*

Before a version is published, it SHALL be verified to activate and work in the
desktop host and in the browser host.

**Examples**

- *A desktop regression.* Given a change that breaks activation on the desktop, when the release automation runs, then it fails before publishing.
- *A browser regression.* Given a change that reaches a Node API from code the browser bundle loads, when the release automation runs, then it fails before publishing, rather than reaching users of vscode.dev.

**Why:** the browser failure mode is the one this project has warned about
from the start — it does not break a build, it breaks inside a Web Worker at a
user's keyboard. A release is the last place it can still be caught cheaply.
