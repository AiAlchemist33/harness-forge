---
name: start
description: Use when the user wants to set up, prepare, or personalize their Claude Code environment, says "Let's prepare a workspace" or "Давай настроим рабочее пространство", or asks for a personal harness.
argument-hint: "[resume]"
---

harness-forge v2 is under construction. Tell the user, in the language of
their message:

- The wizard (interview → prompting profile → blueprint → install → verify →
  HTML page) is being built on branch `v2`; progress is in
  `docs/superpowers/plans/2026-10-08-harness-forge-v2.md`.
- The previous developer-only wizard is available at git tag `v1.1.0`.

Reply with exactly one line that starts with `HARNESS-FORGE-STUB:` followed by
the sentence above in the user's language, then stop.
