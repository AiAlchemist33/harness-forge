# Changelog

## Unreleased (2.0.0)

Rebuild as **harness-forge**. Design: `docs/superpowers/specs/2026-10-08-harness-forge-v2-design.md`.
Progress: `docs/superpowers/plans/2026-10-08-harness-forge-v2.md`.

- P1 — repo skeleton: stub plugin at `.claude/skills/harness-forge/`, structural validator, CI.

## 1.1.0 (2026-07-05)

Correctness pass — aligned the template and guides with current Claude Code (verified against code.claude.com/docs). No wizard-flow redesign; existing `.wizard-state.json` files still resume.

- **Hooks rewritten** — all four functional hooks (safety-guard, auto-format py/web/go) read the tool call as JSON on **stdin** instead of the non-existent `$CLAUDE_TOOL_INPUT` env var (which made them silently do nothing). Now Node-based, so no `jq`/Git Bash needed on Windows; each was tested end-to-end. Corrected hooks-catalog: hooks on one event run in **parallel**, not sequentially.
- **`.claudeignore` removed** — it is not read by Claude Code and gave false protection for `.env`/keys. Replaced with enforced `permissions.deny` `Read()` rules in the settings templates + guidance in guides 01/03.
- **MCP catalog fixed** — dropped three fabricated `@anthropic/mcp-server-*` packages (all 404), corrected the Slack endpoint (`/mcp`, not `/sse`), and taught the real default scope (**local**, not "global/user") with `--scope user` on personal tools. Fixed the `~/.claude/.mcp.json` path myth (user scope lives in `~/.claude.json`) in guides 01/04.
- **Wizard invocation fixed** — removed `disable-model-invocation: true` from `prepare-workspace` so the advertised "Let's prepare a workspace" phrase actually starts it.
- **reset-setup made safe** — records `created` vs `merged` provenance + a timestamped backup before any merge/overwrite; refuses to delete files it only merged into, and removes only the specific wizard-added hook entries.
- **Subagent format** — templates moved from `agents/<name>/AGENT.md` to the canonical flat `agents/<name>.md`; guides and verification updated.
- **Guides** — added Permission Modes + plan mode + the "Bash deny is not a security boundary" caveat (03), `/init` and a "what else exists" section (00), corrected import depth to four hops (02), fixed the Esc/Shift+Tab shortcuts (06), dropped stale pricing/keybinding and added Haiku (wizard 2d).

## 1.0.0 (2026-03-30)

Initial structured release.

- 7-phase interactive setup wizard via `/prepare-workspace`
- Undo capability via `/reset-setup`
- Templates: 4 agents, 4 skills, 5 hooks, 4 rules
- Settings presets for 7 developer roles
- MCP server catalog with install commands
- Project template variants (Web, Python, Go, General)
- 7 educational guides (00-06)
- Wizard state persistence with resume support
- Cross-platform support (Windows, macOS, Linux)
