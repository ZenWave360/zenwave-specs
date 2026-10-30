# 0017. One manual replaces OpenSpec and per-repository documents

**Status:** accepted, 2026-10-30.

## Decision

The platform is described in one place, here, including what concerns only one project. Rules live in documents a person can read
from start to finish. A change is an edit to the document and a status flip, not a proposal, design and task folder. OpenSpec, its
store and its tooling are gone. Open work is one [backlog](../work/backlog.md).

## Why

Everything here but two repositories exists to serve the platform, so documentation split by repository was split along a line
readers do not care about. OpenSpec kept a rule, its rationale and its state in three places, and left its specs marked "proposed"
long after the code was finished, because a change had to be archived to say otherwise. Nobody could tell what was true.

## What was kept from the changes

Rules moved into the documents. Decisions with lasting reasons became files here. Open tasks became the backlog. Task histories and
proposals are in git, under each repository's `openspec/`, and in git history. Every original integrated here, including the
drafts that were never committed elsewhere, is under `_retired/` in commit `ab85572` of this repository.
