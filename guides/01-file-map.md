# File Map — Where Everything Lives

Claude Code reads config from multiple locations. Understanding where files go is the key to using it well.

## The Three Scopes

```
GLOBAL (you, everywhere)        PROJECT (shared with team)       LOCAL (you, this project only)
~/.claude/                      <project>/.claude/               <project>/.claude/
├── CLAUDE.md                   ├── CLAUDE.md                    └── settings.local.json
├── settings.json               ├── settings.json
├── keybindings.json            ├── rules/
├── rules/                      │   └── *.md
│   └── *.md                    ├── agents/
├── agents/                     │   └── <name>.md
│   └── <name>.md               ├── skills/
└── skills/                     │   └── <name>/SKILL.md
    └── <name>/SKILL.md         └── .mcp.json (at project root)
```

> **MCP config is not a file inside `~/.claude/`.** User-scope MCP servers live in
> `~/.claude.json` (the home-directory file) and are managed with
> `claude mcp add --scope user` — you don't hand-edit them. Project-scope servers
> live in `<project>/.mcp.json`. See guide 04.
>
> **Subagents are flat files:** `agents/<name>.md` with YAML frontmatter, not
> `agents/<name>/AGENT.md`. **Skills are directories:** `skills/<name>/SKILL.md`.

## What Goes Where

| File | Global (~/.claude/) | Project (.claude/) | When to Use |
|------|--------------------|--------------------|-------------|
| **CLAUDE.md** | Your role, language, style preferences | Project description, commands, conventions | Global = about YOU. Project = about the CODE |
| **settings.json** | Default permissions for all projects | Team permissions and tool rules | Global = your baseline. Project = team standards |
| **settings.local.json** | N/A | Personal overrides for this project | When you need different settings than the team |
| **agents/** | Agents you use everywhere | Project-specific agents | Global = general-purpose. Project = specialized (flat `<name>.md` files) |
| **skills/** | Skills you use everywhere | Project-specific workflows | Global = universal. Project = project-specific (`<name>/SKILL.md` dirs) |
| **rules/** | `~/.claude/rules/` for all projects | Scoped coding rules | When different parts of a project (or all projects) need different rules |
| **MCP servers** | `~/.claude.json` via `claude mcp add --scope user` | `<project>/.mcp.json` | Global = your accounts. Project = shared resources |
| **secret exclusion** | `permissions.deny` Read rules in settings.json | same | Block reads of `.env`, keys, `secrets/**` — see guide 03 |

## Paths by Operating System

### Windows
```
Global:    C:\Users\<you>\.claude\
Project:   <project-root>\.claude\
MCP:       C:\Users\<you>\.claude.json          (user scope — managed by `claude mcp add --scope user`)
           <project-root>\.mcp.json             (project scope)
```

### macOS
```
Global:    ~/.claude/
Project:   <project-root>/.claude/
MCP:       ~/.claude.json                        (user scope — managed by `claude mcp add --scope user`)
           <project-root>/.mcp.json              (project scope)
```

### Linux
```
Global:    ~/.claude/
Project:   <project-root>/.claude/
MCP:       ~/.claude.json                        (user scope — managed by `claude mcp add --scope user`)
           <project-root>/.mcp.json              (project scope)
```

## Priority Order (Who Wins?)

When the same setting exists at multiple levels:

```
1. Managed policy        ← Organization enforced (can't override)
2. CLI flags             ← claude --model opus
3. Local settings        ← .claude/settings.local.json
4. Project settings      ← .claude/settings.json
5. User settings         ← ~/.claude/settings.json
6. Defaults              ← Built into Claude Code
```

Lower numbers win. **Exception**: `deny` rules ALWAYS win regardless of level.

## Version Control

| File | Commit to Git? | Why |
|------|---------------|-----|
| `.claude/CLAUDE.md` | Yes | Team should share project instructions |
| `.claude/settings.json` | Yes | Team should share permissions |
| `.claude/settings.local.json` | **No** (gitignore it) | Personal overrides |
| `.claude/agents/` | Yes | Team should share agents |
| `.claude/skills/` | Yes | Team should share skills |
| `.claude/rules/` | Yes | Team should share coding rules |
| `<project>/.mcp.json` | Depends | Yes if it uses `${ENV}` refs; **No** if it embeds keys/connection strings |

> **There is no `.claudeignore`.** Current Claude Code does not read a `.claudeignore`
> file, so it cannot protect secrets — an entry for `.env` there does nothing. Two real
> mechanisms replace it: `.gitignore` already keeps ignored junk (deps, build output,
> media) out of Claude's search/context, and **`permissions.deny` Read rules** in
> `settings.json` are the enforced way to stop Claude from reading sensitive files
> (`.env`, `*.pem`, `*.key`, `secrets/**`). See guide 03.
