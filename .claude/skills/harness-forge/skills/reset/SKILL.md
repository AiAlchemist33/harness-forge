---
name: reset
description: Undo what harness-forge installed, using its provenance manifest. Use only when the user asks to remove or roll back the harness.
disable-model-invocation: true
argument-hint: "[all | config | skills | plugins]"
---

Reset is not implemented yet in this build. Tell the user that nothing has been
installed by this version, and that `/harness-forge:reset` will restore the
journaled state once the wizard ships. Reply with exactly one line that starts
with `HARNESS-FORGE-RESET-STUB:`.
