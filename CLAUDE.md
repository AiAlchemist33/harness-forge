# harness-forge — maintainer rules

The product is the plugin at `.claude/skills/harness-forge/`. When someone says
"Let's prepare a workspace" or "Давай настроим рабочее пространство", run
`/harness-forge:start`.

Working in this repo:

- Read `docs/superpowers/specs/2026-10-08-harness-forge-v2-design.md` before
  changing behaviour; `docs/superpowers/plans/` says what is in progress.
- Scripts under `.claude/skills/harness-forge/scripts/` and `tools/` are Node 22
  ESM with zero dependencies. Hooks are script files called in exec form
  (`"command": "node", "args": [...]`); inline-eval flags (`-e`, `--eval`)
  never appear.
- Every claim about Claude Code, a library, a price or a version carries a date
  and a URL.
- Nothing proprietary is vendored. Anthropic's document skills are installed
  from their marketplace only.
- Never run tests or spikes against the live `~/.claude`. Use the sandbox recipe
  in the master plan (`--plugin-dir`, `--setting-sources project`,
  `--no-session-persistence`, `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1`).
- Create and edit files with the Write/Edit tools: UTF-8, LF.
- `npm run validate` and `npm test` pass before every commit.
