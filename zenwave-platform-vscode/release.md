# Release

<a id="release"></a>

**Status:** 2026-11-01: 11 partial, 2 exists. Each rule says which. *exists* comes from the original task lists and a spot check of the code; it does not mean every example was re-run. Manual checks still to do are in the [backlog](../work/backlog.md).

## Purpose

Describe how a commit becomes an extension somebody can install — what the
package contains, how its version identifies it, which registries carry it, and
what is checked before any of that is irreversible.

## Rules

<a id="r-r1"></a>
### R-R1 (partial). The extension is installable from both registries

*State: Automated, never run. The Marketplace publisher and the first tokens exist; nothing has been published.*

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
- *An ordinary commit.* Given a commit pushed without a release tag, when the automation runs, then the extension is built and verified, and nothing is published. The exception is a commit that reaches `develop`, which publishes a pre-release under [R-R7](#r-r7); that pre-release also needs no contributor's machine.
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

## The two pipelines

Asked for by the owner and built 2026-11-01; never run on GitHub. [Decision 0023](../decisions/0023-pre-releases-pin-next-kotlin-moves-on-git-snapshots.md) says why. The owner then changed how versions and notes work, [decision 0024](../decisions/0024-pre-releases-follow-the-last-release.md): [R-R8](#r-r8), the notes in [R-R10](#r-r10) and the tag and notes of [R-R11](#r-r11) describe that change, which is not built yet.

| | Pre-release | Stable |
|---|---|---|
| Starts on | a push to `develop` | a tag `vX.Y.Z` on a commit of `main` |
| Version | `X.Y.<run number>` of the last release, stamped by CI, not committed | the version committed in the manifest on `main` |
| `@zenwave360/*` dependencies | exact versions, `next` allowed | exact versions, stable only |
| Approval | none | required reviewer |
| Registries | Marketplace and Open VSX, as pre-release | Marketplace and Open VSX |

<a id="r-r7"></a>
### R-R7 (partial). A merge to develop publishes a pre-release

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

Every push to `develop` that changes the extension SHALL run the same checks as a stable release ([R-R5](#r-r5), [R-R6](#r-r6)) and, when they pass, SHALL publish that verified VSIX as a pre-release to both registries ([R-R1](#r-r1)), with no approval. A pull request into `develop` is its dry run: it goes through the same checks and stamp, with no credential, and its patch is the run number of `ci.yml`, not of `pre-release.yml`.

**Examples**

- *A merged feature.* Given a merge to `develop` that changes the extension, when the pipeline finishes, then both registries offer a new pre-release built from that commit.
- *Only documentation.* Given a push that changes only `docs/`, `.claude/`, `.github/` other than the workflows of this pipeline, or Markdown at the repository root (Markdown in `packages/extension/` is part of the listing, and does publish), when it reaches `develop`, then no version is published.
- *A failing check.* Given a browser smoke test that fails, when the pipeline runs, then nothing is published, and the previous pre-release stays the current one.
- *Two quick merges.* Given two merges close together, when both pipelines run, then they do not publish at the same time, and the newest commit ends up as the highest version. A commit in between may be skipped.

<a id="r-r8"></a>
### R-R8 (partial). A pre-release version is stamped by CI and always above stable

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

The Marketplace accepts only `major.minor.patch`, with no pre-release suffix and no leading zeros (`vsce` refuses `0.0.0057`). A pre-release is therefore the patch of the last release: the manifest on `develop` SHALL hold the `major.minor` of the last stable release, `0.0` before the first one. CI SHALL replace the patch with the workflow's run number in its own checkout, before building, and SHALL NOT commit the result. The version is raised only for a stable release, on `main`, and `develop` gets it by merging `main` back. The stamped version SHALL be above the highest stable tag, so a user who opted in is not moved back.

A user on a pre-release moves to a stable release when it is published, because its minor is higher, and stays eligible for the pre-releases that follow it.

**Examples**

- *Before the first stable.* Given `0.0.0` in the manifest and run 57, when the pipeline runs, then the extension is `0.0.57`, and its package and `build-info.json` both say so.
- *After a stable release.* Given `0.1.0` on `main` and merged back, and run 58, when the pipeline runs, then the extension is `0.1.58`.
- *Not merged back.* Given a tag `v0.1.0` and `0.0.0` still on `develop`, when the pipeline runs, then it fails before building, and says to merge `main` back.
- *A hotfix.* Given `0.1.0` and pre-releases up to `0.1.70`, when `v0.1.1` is released from `main`, then users on stable get it and users on pre-releases stay on `0.1.70`, which is newer. A hotfix numbered above the run number, such as `v0.1.1057`, would make every later pre-release of that minor lower than stable, so the pipeline fails until the next minor.
- *No commit from CI.* Given any pre-release, when it finishes, then `develop` has no new commit from the pipeline.

**Note:** "above stable" is checked against the stable-shaped `v*` tags of the repository, not against what the registries hold. The date in the notes is the date of the commit, not of the run, so running the build again gives the same content. The first run of the workflow gives `0.0.1`. The run number restarts if the workflow file is renamed. Do not rename it; if it ever has to be, raise the minor in the same commit.

<a id="r-r9"></a>
### R-R9 (partial). A pre-release may ship `next` packages, pinned exactly

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

A pre-release MAY depend on `next` versions of the `@zenwave360/*` packages. Each SHALL be an exact version committed on `develop`, in `package.json`, the lockfile and the `zenwaveLanguageServer` and `zenwaveEventFlowWebview` blocks of the manifest. The build SHALL NOT resolve the `next` tag, a range or `latest`, and SHALL refuse linked sibling builds, as packaging already does for a tag. The pipeline's summary SHALL name each `@zenwave360/*` version the VSIX ships.

Raising a pin is an ordinary commit. A repository script SHALL read each package's current `next` version and write it to all of those places, and the commit that results is what starts the pipeline. The script removes the old lockfile entries first: otherwise npm can nest the new prerelease and hide a linked sibling from the lockfile check. It leaves `@zenwave360/dsl` alone unless asked.

**Examples**

- *A new server.* Given a new `@zenwave360/lsp-js` on `next`, when a maintainer runs the script and merges the result, then the next pre-release ships exactly that version, and the same commit always builds the same server.
- *A moving tag.* Given `"@zenwave360/lsp-js": "next"` in the manifest, when the pipeline runs, then it fails and names the dependency.
- *Blocks that disagree.* Given a `package.json` pin that differs from the `zenwaveLanguageServer` version, when the pipeline runs, then it fails and names both.
- *An unpublished version.* Given a pin to a version that is not on npm, when the pipeline runs, then `npm ci` fails and nothing is published.

<a id="r-r10"></a>
### R-R10 (partial). A pre-release can be traced and has release notes

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

Once the registries have been tried, the pipeline SHALL create the tag `vX.Y.Z-pre` on the built commit and a GitHub pre-release with the VSIX attached ([R-R3](#r-r3)).

Release notes live in `packages/extension/release-notes/`, as in `zenwave-sdk`: `next.md` for what is on `develop`, and `release-notes.vX.Y.Z.md` for each stable release. `CHANGELOG.md` SHALL be generated from those files when packaging, with their full content, newest first, and SHALL NOT be committed, so the listing and the files cannot disagree. In a pre-release, `next.md` is the section of the stamped version and date, and the GitHub pre-release has the same text. Looking the tag up SHALL tell an absent tag from a failed request: only the first goes on to create it. A tag created this way does not start a publication, and packaging does not accept a `-pre` tag: the channel comes from `ZENWAVE_RELEASE_CHANNEL`.

**Examples**

- *Diagnosing a report.* Given a report from `0.1.57`, when a maintainer looks it up, then the tag `v0.1.57-pre` and the GitHub pre-release name the commit, and the VSIX is there to install.
- *A manual tag.* Given someone pushing `v0.1.99-pre` by hand, when GitHub runs the workflows, then nothing is published: pre-releases come only from `develop`.
- *No notes file.* Given no `release-notes/next.md`, when the pipeline runs, then it fails before publishing. An empty one is allowed: right after a stable release there is nothing to say yet.

<a id="r-r11"></a>
### R-R11 (partial). A stable release needs a version tag, an approval and stable dependencies

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

A tag `vX.Y.Z` SHALL publish a stable release only when the tag's commit is on `main`, the tag matches the manifest, `release-notes.vX.Y.Z.md` exists, has content and is not marked as a draft, no pre-release tag `vX.Y.Z-pre` exists, the SDK catalogue is current, every `@zenwave360/*` dependency is a stable version, and a reviewer approves. Creating a GitHub release that creates this tag counts as creating it. A pre-release never becomes a stable release; a stable release is a new build from its own tag. To prepare one on `main`, a repository script SHALL set the manifest version, rename `next.md` to `release-notes.vX.Y.Z.md` and leave an empty `next.md`.

**Examples**

- *Cutting a release.* Given `0.2.0` in the manifest on `main`, stable pins and its notes file, when `v0.2.0` is created and approved, then both registries carry `0.2.0` as stable.
- *A `next` pin left behind.* Given `@zenwave360/lsp-js` still at `0.1.0-next.14.1`, when `v0.2.0` is created, then the release fails before publishing and names the package.
- *A tag off main.* Given `v0.2.0` on a commit that is not on `main`, when the pipeline runs, then nothing is published.
- *The catalogue.* Given a pre-release whose SDK catalogue is out of date, when it runs, then the summary warns and it goes on; the same state fails a stable release.

<a id="r-r12"></a>
### R-R12 (partial). A run that half published can be finished by running it again

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

A registry failure SHALL NOT stop the attempt at the other registry, and the run SHALL be reported as failed, with what each registry did ([R-R1](#r-r1)). Re-running the same run SHALL publish the same version to the registry still missing it, and SHALL treat a registry that already has that version as done. Both tools do this with `--skip-duplicate`; `vsce` reads the list of versions, and `ovsx` matches the text of the registry's error, so a change of wording there would show up as a failed re-run.

**Examples**

- *Open VSX is down.* Given the Marketplace accepted `0.1.57` and Open VSX refused it, when the run ends, then it is failed and its summary says so. When Open VSX is back and the run is re-run, then Open VSX gets `0.1.57` and the Marketplace step passes without publishing again.
- *Tag already there.* Given a re-run after the tag and GitHub pre-release exist, when it finishes, then there is still one tag and one GitHub pre-release.

<a id="r-r13"></a>
### R-R13 (partial). Publishing credentials reach only the publishing step

*State: Built on `zenwave-platform-vscode` `feature/release-pipelines`, 2026-11-01, not reviewed; no workflow has run on GitHub.*

The build and test job SHALL run with no registry credential. A separate job SHALL download the verified VSIX, run nothing from the repository's dependencies, and publish it. Publishing SHALL run in GitHub environments of this repository, `vscode-prerelease` limited to `develop` and `vscode-release` limited to `v*` tags with a required reviewer. Third-party actions in these workflows SHALL be pinned by commit hash, as [`release-workflows`](https://github.com/ZenWave360/release-workflows) does.

Both registries SHALL be reached through trusted publishing (`vsce publish --oidc`, `ovsx publish --trusted-publishing`) as soon as they accept it, and no long-lived token SHALL stay in the repository after that. Until then a token MAY be held in those environments, for the first version only. Azure DevOps retires global personal access tokens on 2026-12-01, and Open VSX requires an owned namespace and one active version before it accepts a trusted publisher. The publishing step uses the token when its secret is present and trusted publishing when it is not, so deleting the secret is the whole migration and neither falls back to the other. `--oidc` needs `vsce` 4.1.0 or later.

The publishing tools come from `packages/extension/publish-tools`, a private package with a lockfile, because an exact version in `npx` still leaves its dependencies floating, with the token in the environment. The publishing job takes that package from the built commit with a sparse checkout and no persisted credentials, before any step that holds a secret, and installs it with `--ignore-scripts`. It never installs or runs anything the verifying job produced: that job ran build dependencies, so its artifact is read only as data (the VSIX, `release-info.json`, the notes). `@vscode/vsce-sign` is the one dependency with an install script, and it is not needed because the pipeline does not sign. A job with `id-token: write` exposes its OIDC request variables to every step, this one too, so after the move to trusted publishing what that step can reach is a short-lived credential.

**Examples**

- *First publication.* Given an extension with no version on Open VSX, when the first pre-release runs, then it publishes with `OVSX_PAT`. Once the namespace is owned and the trusted publisher registered, the secret is deleted, because a token takes priority over trusted publishing while it is there.
- *Failing to fall back.* Given `--oidc` that cannot get or exchange its token, when the job runs, then it fails, rather than trying a stored token.

- *A hostile dependency.* Given a compromised build dependency that reads the environment during tests, when the pipeline runs, then it finds no registry token.
- *What gets published.* Given a verified VSIX, when the publishing job runs, then it publishes those exact bytes rather than building again.
- *A feature branch.* Given a workflow on a feature branch that names `vscode-prerelease`, when it runs, then GitHub does not give it the environment.

<a id="packages-a-pre-release-needs"></a>
## Packages a pre-release needs

Checked 2026-11-01. The extension depends on three `@zenwave360` npm packages. `lsp-js` and `vistas-eventflow-webview` declare no dependencies of their own on npm, so no other package of ours has to be published to npm for them.

| npm package | Why | Pinned today | `next` today | Publishes from | Needed for this pre-release |
|---|---|---|---|---|---|
| `@zenwave360/lsp-js` | The language server, both hosts | `0.1.0-next.13.1` on `feature/release-pipelines` | `0.1.0-next.13.1` | `zenwave-lsp` `publish-npm-snapshots.yml`, on a push to `develop` | **Yes**, published 2026-11-01 |
| `@zenwave360/vistas-eventflow-webview` | The EventFlow page with its selector | `0.0.0-next-20261101112236` on `feature/release-pipelines` | `0.0.0-next-20261101112236`, which semver sorts below the stable `0.1.0`: fine for an exact pin | `zenwave-architectural-vistas` `publish-npm-snapshots.yml`, on a push to `develop` with a pending Changeset | **Yes**, published 2026-11-01 |
| `@zenwave360/dsl` | `parseZdl` in `src/sdk/model.ts`, used by the SDK runner | `1.10.0` | `1.11.0-next.13.1` | `dsl-kotlin`, only on a manual run with `publish-snapshots` on | No, stable `1.10.0` stays, as long as the pipeline's checks pass with it |

The other packages are not npm dependencies of the extension. `@zenwave360/lsp-js` is built by Gradle from Maven snapshots in [`zenwave360/maven-snapshots`](https://www.zenwave360.io/maven-snapshots/), so these must be there first, in this order:

1. `dsl-kotlin` (`dsl-kotlin`, `dsl-views`, `dsl-docs`) and `json-schema-ref-parser-kmp`: a push to `develop` publishes them.
2. `zenwave-architecture` (`architecture-manifest`, `workspace-runtime`): the same, needed only when it changed.
3. `zenwave-lsp`: a push to `develop` builds with `--refresh-dependencies` and publishes `@zenwave360/lsp-js` on `next`.

A push to `dsl-kotlin` does not start `zenwave-lsp`: its run has to come after the snapshot is published. None of this uses a Maven Central release.

## Open questions

<a id="r-q1"></a>
**R-Q1. What does the first stable release need from upstream?** Open, and it decides when [R-R11](#r-r11) can first succeed. `@zenwave360/lsp-js` has never had a stable version (npm `latest` is `0.1.0-next.0`), and `zenwave-lsp` depends on `-SNAPSHOT` versions of three Kotlin projects. A stable server may therefore use up to four Maven Central releases at once (`json-schema-ref-parser-kmp`, `dsl-kotlin`, `zenwave-architecture`, `zenwave-lsp`) out of the eight the owner can publish in a month. Decide this before the first stable, not for each one.

<a id="r-q2"></a>
**R-Q2. Does a trusted publisher accept two workflows?** Open. Open VSX matches a workflow by file name and environment, and its documentation does not say whether one extension can have two registrations, or how a reusable workflow is matched. If it allows only one, `pre-release.yml` and `release.yml` become one workflow file with two triggers, keeping the environment per channel if the registration allows it. Find out in the registry's Trusted Publishers dialog. The same applies to a Marketplace policy. The first versions go with tokens, so this no longer blocks REL/4: it has to be answered before the first token is deleted. `verify.yml` holds no credential and needs no registration, so only `pre-release.yml` and `release.yml` are candidates.
