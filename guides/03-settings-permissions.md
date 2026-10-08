# Settings & Permissions

## What Are Settings?

Settings control Claude Code's behavior: which tools it can use without asking, what's forbidden, environment variables, and more. They're JSON files at various scopes.

## Permission Levels

Claude Code has a permission system that controls what Claude can do:

- **allow** — Claude can use this tool without asking you
- **ask** (default) — Claude asks before using the tool
- **deny** — Claude cannot use this tool at all

## Settings File

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(npm test)",
      "Bash(npm run lint)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/secrets/**)"
    ]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

The `Read(...)` deny rules above are the **enforced** way to keep Claude out of secret
files — this is what replaces the old (non-functional) `.claudeignore`. `deny` always
wins over `allow`, even the blanket `Read` allow.

## Tool Names for Permissions

| Tool | Permission String | What It Does |
|------|------------------|--------------|
| Read files | `Read` | Read any file |
| Find files | `Glob` | Search file names by pattern |
| Search content | `Grep` | Search inside files |
| Run commands | `Bash(command pattern)` | Execute shell commands |
| Edit files | `Edit` | Modify existing files |
| Create files | `Write` | Create new files |
| Web fetch | `WebFetch` | Fetch URLs |
| Web search | `WebSearch` | Search the web |
| Sub-agents | `Agent(type)` | Spawn specialized agents |
| MCP tools | `mcp__server__tool` | Use MCP server tools |

## Wildcard Patterns

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(python -m pytest *)",
      "WebFetch(domain:docs.python.org)"
    ]
  }
}
```

`*` matches anything. Use it to allow categories of commands.

## Common Setups by Role

### Web Developer
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

### Python Developer
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(python *)",
      "Bash(pip *)",
      "Bash(pytest *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

### DevOps / Infrastructure
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(terraform plan *)",
      "Bash(kubectl get *)",
      "Bash(docker ps *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(terraform apply *)",
      "Bash(kubectl delete *)"
    ]
  }
}
```

## Permission Modes

Beyond per-tool rules, Claude Code has session-wide **modes** you cycle with
**Shift+Tab** (or set a default via `defaultMode` in settings.json):

| Mode | What it does |
|------|--------------|
| **default** | Ask for anything not explicitly allowed |
| **acceptEdits** | Auto-accept file edits (still asks for other tools) |
| **plan** | Read-only: Claude researches and proposes a plan but makes **no** changes until you approve — great before a big task |
| **bypassPermissions** | No prompts at all — only inside a disposable sandbox/VM |

Plan mode pairs perfectly with the "ask Claude to plan first" habit in guide 06.

## Environment Variables

Pass **non-secret** environment variables to Claude's tool execution in shared settings:

```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "true"
  }
}
```

**Never put secrets in a shared `settings.json`.** Real secrets belong in the app's own
`.env` (blocked from Claude by the `Read` deny rules above) or an OS secret store. If you
must set a secret env var for tooling, put it in `.claude/settings.local.json`
(gitignored), not in the committed file.

## A Caveat: Bash `deny` Is Not a Security Boundary

`Bash(...)` rules are string/prefix matches, not a sandbox. `Bash(rm -rf *)` does **not**
catch `rm -fr`, `rm --recursive --force`, an absolute path, a chained command
(`true; rm -rf x`), or the same deletion done via `python -c "..."`/`node -e "..."`. Treat
the Bash deny-list as an **anti-accident guard**, not protection against a malicious or
prompt-injected command. Real isolation comes from *not* auto-allowing execution
primitives (`npx`, `python`, `node`, `curl`) and from running untrusted input in a
sandbox/VM. `Read(...)` deny rules, by contrast, are enforced by the file-access layer and
are the right tool for protecting secret files.

## Key Rules

1. **deny always wins** — If something is denied at any level, no other level can allow it
2. **Lower scope overrides higher** — Project settings override global settings
3. **When in doubt, leave it as ask** — You can always approve one-time actions
4. **Start restrictive, loosen as needed** — Easier than the reverse
5. **Don't rely on Bash deny for safety** — it stops accidents, not adversaries (see above)
