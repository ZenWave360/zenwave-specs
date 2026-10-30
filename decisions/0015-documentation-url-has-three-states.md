# 0015. A plugin's documentation location has three states

**Status:** accepted by agent 2026-09-16; owner review pending. **Origin:** change 001 task 3.3. **Used by:** [SPC-R1](../flows/sdk-plugin-catalogue.md#spc-r1)

## Decision

The SDK always writes `documentationUrl` for each plugin. A string is the link. `null` means there is nowhere to link to,
so no link is shown. A missing key means an SDK too old to say: also no link, and no address is worked out from the name.

## Why

A consumer behaves the same whether a plugin has no documentation or never declared any. An annotation cannot tell "left at
default" from "set to empty" without a sentinel, which third-party authors would spell wrong. The distinction a consumer
does act on is between a plugin with no documentation and an SDK that cannot report it, and key presence gives that.
