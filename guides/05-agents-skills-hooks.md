# Agents, Skills & Hooks

## Agents — Specialized AI Assistants

### What Are Agents?
Agents are specialized versions of Claude with focused roles, restricted tools, and custom instructions. Think of them as team members with specific expertise.

### Example: Code Reviewer Agent
```markdown
---
name: code-reviewer
description: Reviews code for quality, bugs, and security issues
tools: Read, Grep, Glob, Bash
model: sonnet
maxTurns: 15
---

You are a senior code reviewer. Run git diff, review each changed file...
```

### How Claude Uses Agents
Claude automatically delegates to agents based on their `description` field. When you ask "review my code", Claude sees the code-reviewer's description matches and delegates to it.

### Where Agents Live
Subagents are **flat markdown files** named after the agent (identity comes from the
`name` frontmatter, and the filename should match it):
- `~/.claude/agents/<name>.md` — available in all projects
- `.claude/agents/<name>.md` — available in this project only

### Key Frontmatter Fields
| Field | What It Does |
|-------|-------------|
| `name` | Identifier (lowercase, hyphens) |
| `description` | When to use this agent (Claude reads this!) |
| `tools` | What the agent can do (Read, Write, Bash, etc.) |
| `model` | Which AI model: sonnet (fast), opus (smart), haiku (fastest) |
| `maxTurns` | How many steps before stopping |

### Creating an Agent
1. Create the file `~/.claude/agents/my-agent.md` (one flat file, no subfolder)
2. Add frontmatter (`name`, `description`, optional `tools`/`model`/`maxTurns`) + instructions
3. Claude auto-discovers it next session

---

## Skills — Custom Commands

### What Are Skills?
Skills are reusable workflows you trigger with `/command-name`. They're like macros — a single command that expands into detailed instructions.

### Example: Smart Commit Skill
```markdown
---
name: smart-commit
description: Create a conventional commit
disable-model-invocation: true
user-invocable: true
---

1. Run git diff to see changes
2. Determine commit type (feat/fix/refactor/...)
3. Draft a message
4. Show for approval
5. Commit
```

### Using Skills
```
/smart-commit                  # Run the skill
/explain-code src/auth.ts      # Run with arguments
/fix-issue 42                  # Fix GitHub issue #42
```

### Where Skills Live
- `~/.claude/skills/<name>/SKILL.md` — available in all projects
- `.claude/skills/<name>/SKILL.md` — available in this project only

### Key Frontmatter Fields
| Field | What It Does |
|-------|-------------|
| `name` | The /command name |
| `description` | What it does (also used for auto-triggering) |
| `disable-model-invocation` | `true` = only you can trigger it (not Claude automatically) |
| `user-invocable` | `false` = hidden from menu (Claude-only) |
| `argument-hint` | Hint shown in autocomplete: `[file path]` |
| `allowed-tools` | Tools available without permission prompts |

### Skill Arguments
Inside SKILL.md, use `$ARGUMENTS` for user input:
```markdown
Explain the code at: $ARGUMENTS
```
`/explain-code src/auth.ts` → `$ARGUMENTS` becomes `src/auth.ts`

---

## Hooks — Automated Reactions

### What Are Hooks?
Hooks run shell commands automatically when Claude does certain things: before running a command, after editing a file, when a session starts, etc.

### Common Use Cases
- **Auto-format after edits** — Run Prettier/Black after Claude modifies files
- **Validate commands** — Block dangerous shell commands
- **Notifications** — Get notified when Claude needs your input
- **Linting** — Run linter after code changes

### Where to Configure
In `settings.json` (any scope). **A hook receives the tool call as JSON on stdin** —
there is no `$FILE_PATH` / `$CLAUDE_TOOL_INPUT` variable. Read `tool_input.file_path`
(or `tool_input.command`) from stdin. This example uses Node so it works on Windows
without `jq`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const s=require('fs').readFileSync(0,'utf8');let f='';try{f=(JSON.parse(s).tool_input||{}).file_path||''}catch(e){process.exit(0)}if(f.endsWith('.ts')||f.endsWith('.tsx')){const{execFileSync}=require('child_process');const npx=process.platform==='win32'?'npx.cmd':'npx';try{execFileSync(npx,['prettier','--write',f],{stdio:'ignore'})}catch(e){}}process.exit(0)\""
          }
        ]
      }
    ]
  }
}
```
See `templates/hooks/` for ready-made, tested versions.

### Hook Events
Common events (this is a subset — current Claude Code documents 30+, including
`UserPromptSubmit`, `SessionEnd`, `SubagentStop`, `PreCompact`, `PermissionRequest`;
see code.claude.com/docs/en/hooks):

| Event | When It Fires |
|-------|--------------|
| `PreToolUse` | Before Claude uses a tool (can block it) |
| `PostToolUse` | After Claude uses a tool |
| `SessionStart` | When a session begins |
| `Notification` | When Claude needs attention |
| `Stop` | When Claude finishes responding |

> Multiple hooks on one event run **in parallel** — don't rely on ordering. Put
> order-dependent steps in a single command.

### Blocking Actions
A `PreToolUse` hook that exits with code **2** blocks the action. Read the command from
stdin and decide:
```bash
node -e "const s=require('fs').readFileSync(0,'utf8');let c='';try{c=(JSON.parse(s).tool_input||{}).command||''}catch(e){process.exit(0)}if(c.includes('rm -rf /')){console.error('Refusing to delete files');process.exit(2)}"
```

> Custom commands under `.claude/commands/` were unified with skills — a `commands/*.md`
> file still works and is equivalent to a skill. New work should use `skills/`.

### Tips
- Start without hooks — add them when you find repetitive patterns
- Keep hooks fast (under 5 seconds)
- For anything non-trivial, put the logic in a script file under `.claude/hooks/` and call it
- Test hooks manually before deploying (pipe a sample JSON payload into the command)
