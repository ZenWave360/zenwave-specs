# 0025. Stable versions come from the commits, and a milestone is a trailer

**Status:** decided by the owner, 2026-11-05; not built. **Used by:** [R-R14](../zenwave-platform-vscode/release.md#r-r14), [R-R15](../zenwave-platform-vscode/release.md#r-r15)

## Decision

The next stable version is computed from the conventional commits on `main` since the last stable tag: `feat` is a minor, `fix` a patch, and a range of only `chore`, `docs`, `test` and similar types releases nothing. A major, or any exact version, is asked for with a `Release: major` or `Release: vX.Y.Z` footer on a commit. `BREAKING CHANGE` and `!` have no effect.

A push to `main` runs one workflow that prepares the release through a pull request, tags it, publishes through the approval of [R-R11](../zenwave-platform-vscode/release.md#r-r11), creates the GitHub release and syncs `develop`. `package.json` holds the last stable version on `main` and, after the sync, on `develop`; a pre-release stays stamped by CI and is never committed.

## Why

A hand-edited `major.minor` is easy to forget, and the owner already runs this scheme for `asyncapi-vscode-preview-studio`. This is not an API: a major is a milestone the owner chooses, so tying it to "breaking" would give either accidental majors or none. Conventional Commits relates `BREAKING CHANGE` to a major, but nothing makes a tool follow that, and an explicit footer is visible in history and reviewable. Committing every pre-release would add one bot commit per push to a branch the owner also pushes to. The stable version is committed before it is tagged, so the tag always names a commit whose manifest says the same version and the checks of R-R11 stay as they are.

The release pull request follows `release-gradle.yml` in `release-workflows`: `main` requires pull requests, and a bypass is given to an identity, not to a job. The chain runs in one workflow because a tag or release created with the workflow's token starts no other workflow.

## Consequences

- Commit messages on `main` decide the version, so `develop` is merged to `main` with a merge commit or a fast-forward, never squashed: a squash leaves one title and loses the `feat` inside it.
- Release notes stay files kept by hand in `next.md`; a releasable range with empty or draft notes fails in the plan.
- A version is committed before it is approved. A refused approval leaves a version commit and a tag with nothing published; the failed jobs can be run again.
- The first run needs the bot to be allowed to open and merge pull requests to `main` and `develop`.
