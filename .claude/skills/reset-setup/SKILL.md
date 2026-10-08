---
name: reset-setup
description: Undo the workspace setup wizard — removes installed configs, agents, skills, and MCP servers
argument-hint: "[all | global | mcp | agents | skills | hooks]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Bash, Glob
---

# Reset Setup Wizard

The user wants to undo some or all of the setup wizard's changes.

## Steps

1. **Read state**: Check if `.wizard-state.json` exists in this folder. If it does, use its `installed` section to know exactly what was set up. If it doesn't, scan the file system manually.

2. **Scope from arguments**: If $ARGUMENTS specifies a scope, only reset that:
   - `all` — everything below
   - `global` — `~/.claude/CLAUDE.md` and `~/.claude/settings.json`, honoring provenance (see below)
   - `mcp` — remove ONLY the servers listed in `.wizard-state.json` installed.mcp_servers (via `claude mcp remove <name>`)
   - `agents` — remove ONLY the agents listed in `.wizard-state.json` installed.agents from `~/.claude/agents/`
   - `skills` — remove ONLY the skills listed in `.wizard-state.json` installed.skills from `~/.claude/skills/`
   - `hooks` — remove ONLY the specific hook entries listed in `.wizard-state.json` installed.hooks from the `~/.claude/settings.json` hooks key; **never delete the whole hooks key** (the user may have added their own hooks after setup)

3. **No argument — interactive**: Show what exists and ask:
   ```
   Found these wizard-installed items:
     [1] Global CLAUDE.md (~/.claude/CLAUDE.md)
     [2] Global settings (~/.claude/settings.json)
     [3] MCP servers: github, slack
     [4] Agents: code-reviewer, test-writer
     [5] Skills: smart-commit, pr-create
     [6] Hooks in settings.json
     [7] Project template at C:\Projects\.claude-project-template
     [8] Everything above

   What should I remove? (numbers, "all", or "cancel")
   ```

4. **For each file-based item (global CLAUDE.md / settings.json)** — respect provenance
   from `.wizard-state.json`:
   - `mode: "merged"` — the wizard added to a file the user already had. **Do NOT delete
     it.** Offer to restore the recorded `backup` (which is the pre-wizard content), or
     to show a diff so the user can hand-remove only the wizard's additions. Deleting the
     whole file here would destroy the user's own content.
   - `mode: "created"` — the wizard made the file from scratch. Safe to delete after
     confirmation (offer the `backup` first if one exists).
   - If provenance is missing (older state file or a manual scan), treat the item as
     `"merged"` and refuse to delete — restore-or-diff only. Err on the side of not
     destroying data.
   - For MCP servers, use `claude mcp remove <name>` for each name in state.

5. **Update state**: After removal, update `.wizard-state.json` to reflect what was
   removed (set `installed` fields back to their empty/`done: false` form). Delete
   `.wizard-state.json` entirely only on a full reset.

## Rules
- Always confirm before deleting anything, and show exactly what will be removed.
- Never delete a file the wizard only *merged* into — restore its backup or diff instead.
- Only remove the specific MCP servers / agents / skills / hook entries recorded in
  `.wizard-state.json` — never blanket-delete a directory or a whole settings key.
- If backups exist, offer to restore them.
- Never delete the wizard template itself (this folder).
- After reset, tell the user they can re-run with `/prepare-workspace`.

$ARGUMENTS
