---
name: prepare-workspace
description: Interactive setup wizard that configures Claude Code for your system and workflow. Use when the user asks to set up, prepare, or personalize their Claude Code environment, or says "Let's prepare a workspace".
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Workspace Setup Wizard

You are now running the Claude Code setup wizard.

Introduce yourself:

"Welcome! I'll help you set up Claude Code for your system. Takes about 10-15 minutes.

By the end, you'll have:
- Personalized AI instructions that follow you across all projects
- Smart permissions tuned to your role and tools
- Connections to your services (GitHub, databases, Slack...)
- Custom commands like /smart-commit, /explain-code, /fix-issue
- Specialized AI agents (code reviewer, test writer...)
- Auto-formatting and safety hooks
- A reusable project template for any new repo

Let me first check your system, then we'll get started..."

---

## Resume Support

Before starting Phase 0, check if `.wizard-state.json` exists in the project folder. If it does, read it — it contains the user's profile and which phases are completed.

Also read `VERSION` from the project root. If the state file's `version` is older than `VERSION`, inform the user: "The template has been updated since your last run. You can resume where you left off — new features will apply to remaining phases." Then offer to resume or start fresh.

Offer to resume from where they left off instead of starting over.

After completing each phase, update `.wizard-state.json` with results. Use this schema:

```json
{
  "version": "1.0.0",
  "started_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:00:00Z",
  "completed_phases": [0, 1],
  "current_phase": 2,
  "profile": {
    "os": "windows",
    "role": "",
    "stack": [],
    "tools": [],
    "projects_path": "",
    "language": "",
    "style": "",
    "experience": ""
  },
  "prerequisites": {
    "node": { "installed": true, "version": "20.11.0" },
    "git": { "installed": true, "version": "2.43.0" },
    "gh": { "installed": false, "version": null }
  },
  "installed": {
    "global_claude_md": { "done": false, "mode": null, "backup": null },
    "global_settings":  { "done": false, "mode": null, "backup": null },
    "mcp_servers": [],
    "agents": [],
    "skills": [],
    "hooks": [],
    "project_template": false,
    "project_template_path": ""
  }
}
```

For every item the wizard writes to a file that may already exist (`global_claude_md`,
`global_settings`), record **provenance** so `reset-setup` can undo safely:
- `mode` — `"created"` (the file did not exist; the wizard made it) or `"merged"` (the
  file pre-existed and the wizard added to it).
- `backup` — path to the timestamped copy taken **before** any merge/overwrite (see
  Phase 2), or `null` if the file was newly created.

`reset-setup` uses these: a `"created"` item is safe to delete; a `"merged"` item must
**never** be deleted — offer to restore its `backup` instead.

---

## Phase 0: Prerequisites Check

Run these checks silently, then report results:
```
node --version        # Need Node.js for MCP servers
git --version         # Need Git for version control features
gh --version          # Optional — needed for GitHub MCP & skills
```

If Node.js or Git is missing, tell the user:
- **Node.js**: "Download from https://nodejs.org (LTS version). Needed for tool connections."
- **Git**: "Download from https://git-scm.com. Needed for version control features."
- **gh CLI**: "Optional but recommended. Install from https://cli.github.com for GitHub features."

If critical tools are missing, help them install but don't block the entire wizard — skip phases that need the missing tool and mark them for later in `.wizard-state.json`.

Save prerequisites results to `.wizard-state.json`. Proceed.

---

## Phase 1: Discovery (Conversational)

Auto-detect the OS. Then have a CONVERSATION, not an interrogation. Group questions naturally.

### Language adaptation
After Round 3, once the user states their preferred language, **switch all remaining wizard output to that language**. If the user writes in a non-English language from the start, match it immediately and confirm in Round 3. Technical terms (file names, commands, tool names) stay in English regardless.

**Round 1 — Who are you?**
"First, tell me a bit about yourself — what's your role and what languages/frameworks do you work with most?"
(This covers: role, languages, experience level — infer experience from how they answer)

**Round 2 — Your tools**
"What tools and services do you use day-to-day? Things like GitHub, Slack, databases, Docker, CI/CD..."
(This covers: tools, work style solo/team)

**Round 3 — Your setup**
"Last few questions: Where do you keep your projects on this machine? And what language should I respond in? Any strong preferences for how I should work — concise vs detailed, plan-first vs dive-in?"
(This covers: project organization, language, response style, workflow preferences)

After collecting answers, build a profile summary:
```
Your profile:
  Role:       Full-stack developer
  Stack:      TypeScript, React, Node.js, PostgreSQL
  Tools:      GitHub, Docker, Slack
  Projects:   C:\Projects\
  Language:   English
  Style:      Concise, plan-first, conventional commits
  Experience: Intermediate
```

Confirm with user. Save profile to `.wizard-state.json`. Then proceed.

---

## Phase 2: Global Setup (~/.claude/)

**2a: Check for existing config**
If `~/.claude/CLAUDE.md` or `~/.claude/settings.json` already exists, show the user and ask:
- "Keep existing and skip this step" → record `done: false` (nothing installed).
- "Back up existing and create new" → record `mode: "created"` after backup.
- "Merge — I'll add to your existing config" → record `mode: "merged"` after backup.

**Whichever write path is chosen (overwrite OR merge), always take a timestamped backup
FIRST** — never modify an existing file without one:
```bash
cp ~/.claude/CLAUDE.md ~/.claude/CLAUDE.md.bak-$(date +%Y%m%d-%H%M%S)
```
Record that backup path in `.wizard-state.json` under the item's `backup` field. This is
what lets `reset-setup` restore the user's pre-wizard content instead of destroying it.

**2b: Generate CLAUDE.md**
Read `templates/global-claude-md.md` for the structure guide.
Generate personalized `~/.claude/CLAUDE.md` based on Phase 1 profile.
Show to user, get confirmation, then write. Record `done`, `mode`, and `backup`.

**2c: Generate settings.json**
Read `templates/settings-presets.md` for role-specific presets.
Pick the preset matching their role, customize based on their languages/tools.
Show to user, get confirmation, then write. Record `done`, `mode`, and `backup`.

**2d: Model recommendation**
Based on their profile, recommend a default model:
- **Budget / speed / high volume**: Haiku — cheapest and fastest, good for routine edits.
- **Everyday development**: Sonnet — strong default balance of speed and capability.
- **Hardest reasoning / architecture**: Opus — top reasoning, highest cost.

Explain: "You can switch anytime with `/model` (or cycle with Alt/Option+P). Pricing
changes over time — check the current rates at the Claude pricing page or with `/cost`
rather than trusting a number hardcoded here." Do NOT quote specific per-token prices.

Save to `.wizard-state.json`. Proceed.

---

## Phase 3: MCP Servers

Read `templates/mcp-catalog.md` for the full catalog.
Based on their tools from Phase 1, suggest ONLY relevant servers.

Present as a checklist (only what matches their Phase 1 tools; do NOT recommend a
"Fetch" server — web fetch/search is a built-in tool):
```
Based on your tools, I recommend these connections:
  [x] GitHub — manage PRs, issues, code review (you mentioned GitHub)
  [ ] PostgreSQL — query your database directly (you mentioned PostgreSQL)
  [ ] Slack — send messages, browse channels (you mentioned Slack)

Which ones should I install? (type numbers, "all", or "skip")
```

Scope: add personal tools (GitHub, Slack, Notion) with `--scope user` so they work in
every project — the default `local` scope would trap them in this template folder.
Project databases go in with `--scope project`.

For each accepted server, run the install command. Handle errors gracefully — if one
fails, continue with the others and report what happened. Note that `claude mcp add`
writing the config succeeds even for a bad package; the failure surfaces later when the
server tries to launch, so after installing, run `claude mcp list` and tell the user to
verify with `/mcp`.

On Windows, auto-detect if `cmd /c` wrapper is needed for stdio servers.

Save installed servers to `.wizard-state.json`. Proceed.

---

## Phase 4: Skills & Agents

Read templates from `templates/agents/` and `templates/skills/`.

Present available agents and skills grouped by relevance:

```
AGENTS (specialized AI assistants that work autonomously):
  [x] code-reviewer — reviews your code for bugs and quality
  [x] test-writer — generates tests for your code
  [ ] doc-writer — writes documentation
  [ ] explorer — deep-dives into unfamiliar codebases

SKILLS (custom /commands you type):
  [x] /smart-commit — create clean git commits
  [x] /pr-create — create well-formed pull requests
  [ ] /explain-code — explain how code works
  [ ] /fix-issue — fix a GitHub issue end-to-end

Recommended ones are pre-checked. Which do you want? (numbers, "all", or "skip")
```

For accepted ones: copy each agent as a flat file `~/.claude/agents/<name>.md`, and each
skill as a directory `~/.claude/skills/<name>/SKILL.md`.

Save installed agents/skills to `.wizard-state.json`. Proceed.

---

## Phase 5: Hooks & Automation

Read `templates/hooks/hooks-catalog.md` for available hook presets.

Explain briefly: "Hooks run automatically when certain things happen — like auto-formatting your code after I edit it, or notifying you when I need input."

Present relevant hooks based on their stack:
```
HOOKS (automatic actions):
  [ ] Auto-format — run Prettier/Black after code edits
  [ ] Safety guard — block dangerous commands (rm -rf, force push)
  [ ] Notify — desktop notification when I need your attention

Want any of these? (numbers, "all", or "skip")
```

For beginners, recommend "Safety guard" at minimum.
For each accepted hook, add to `~/.claude/settings.json` under the hooks key.

Save installed hooks to `.wizard-state.json`. Proceed.

---

## Phase 6: Project Template

Ask where they keep projects (or use the path from Phase 1). Create a reusable template folder:
`<their-projects-path>/.claude-project-template/`

Read `templates/project-variants.md` to pick the right variant:
- **Web project** (JS/TS) — includes npm commands, frontend rules
- **Python project** — includes pytest, pip, Python conventions
- **General project** — minimal, language-agnostic

Generate:
- `.claude/CLAUDE.md` — project instructions skeleton (with TODO placeholders)
- `.claude/settings.json` — project permissions (includes `deny` Read rules for `.env`/keys/`secrets/**` — the enforced way to keep Claude out of secrets)
- `.claude/rules/` — relevant rules based on their stack

Do **not** create a `.claudeignore` — current Claude Code does not read one, so it gives no protection. Junk (deps, build output, media) is already excluded via the project's `.gitignore`; secrets are blocked by the `deny` rules above.

Explain: "When you start a new project, copy this template folder into it. Then fill in the TODOs in CLAUDE.md with your project-specific details."

Save template path to `.wizard-state.json`. Proceed.

---

## Phase 7: First Task & Verification

**7a: Verify installation**
Read `.wizard-state.json` and cross-check every item in `installed` against the actual file system:

```bash
# Global config
test -f ~/.claude/CLAUDE.md && echo "OK: Global instructions" || echo "MISSING: Global instructions"
test -f ~/.claude/settings.json && echo "OK: Global settings" || echo "MISSING: Global settings"

# MCP servers
claude mcp list 2>/dev/null

# Agents — flat <name>.md files
for agent in $(cat .wizard-state.json | jq -r '.installed.agents[]' 2>/dev/null); do
  test -f ~/.claude/agents/$agent.md && echo "OK: Agent $agent" || echo "MISSING: Agent $agent"
done

# Skills — check each one listed in state
for skill in $(cat .wizard-state.json | jq -r '.installed.skills[]' 2>/dev/null); do
  test -f ~/.claude/skills/$skill/SKILL.md && echo "OK: Skill $skill" || echo "MISSING: Skill $skill"
done

# Project template
TMPL=$(cat .wizard-state.json | jq -r '.installed.project_template_path' 2>/dev/null)
test -d "$TMPL" && echo "OK: Project template at $TMPL" || echo "MISSING: Project template"
```

Present results as a clean table. If anything is MISSING, offer to re-install just that component.

**7b: First task**
Give them an immediate win to try. Based on their profile:
- If they code: "Open Claude Code in one of your projects and try: `/explain-code` on any file"
- If they use GitHub: "Try asking me: 'Show me my open PRs'"
- If they write code daily: "Try `/smart-commit` after making a small change"
- Universal: "Start a new Claude Code session in any project — notice how it already knows your preferences!"

**7c: Cheat sheet**
Print a compact reference card:
```
YOUR SETUP — CHEAT SHEET
─────────────────────────────
/smart-commit     Smart git commits
/pr-create        Create GitHub PRs
/explain-code     Explain any code
/fix-issue        Fix a GitHub issue
/compact          Free up context space
/mcp              Manage tool connections
/memory           View what Claude remembers

Keyboard:
  Ctrl+C   Interrupt Claude
  Ctrl+R   Search history
  Ctrl+T   Show tasks
  Ctrl+O   Show transcript

Guides: [path-to-this-folder]/guides/
```

Mark wizard as complete in `.wizard-state.json`.

---

## Rules (apply to ALL phases)

- Always show file contents before writing. Get confirmation.
- Never overwrite existing configs silently — offer to merge or back up first.
- Adapt language and complexity to user's experience level.
- If something fails, explain why and offer alternatives — don't stop the whole wizard.
- Reference guides from `guides/` when user needs more context.
- Keep each phase focused — one thing at a time, confirm, move on.
- Save progress after every phase so the wizard can resume.
- On Windows, use forward slashes in display but actual OS paths for file operations.

$ARGUMENTS
