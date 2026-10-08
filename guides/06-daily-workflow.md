# Daily Workflow — Getting the Most Out of Claude Code

## Starting a Session

When you open Claude Code in a project, it automatically loads:
1. Your global `~/.claude/CLAUDE.md` (who you are)
2. The project's `.claude/CLAUDE.md` (what the project is)
3. Any `.claude/rules/*.md` files (coding standards)
4. Your auto-memory from previous sessions

You don't need to re-explain yourself every time.

## Useful Built-in Commands

| Command | What It Does |
|---------|-------------|
| `/help` | Show available commands and help |
| `/compact` | Compress conversation history (frees context) |
| `/context` | Check how much context window is used |
| `/cost` | See session costs |
| `/mcp` | Manage MCP server connections |
| `/memory` | View and edit your auto-memory |
| `/clear` | Clear conversation and start fresh |

## Working Patterns

### Ask Claude to Plan First
Instead of: "Build me an auth system"
Say: "Plan an auth system for this project. Show me the approach before coding."

Claude produces a structured plan. Review it. Then say "Go ahead with phase 1."

Even better, press **Shift+Tab** to enter **plan mode** — Claude works read-only and
proposes a plan without changing any files until you approve it. (Shift+Tab cycles
default → acceptEdits → plan; see guide 03.)

### Use @ References
Reference files directly in your messages:
```
Look at @src/auth/middleware.ts and fix the token expiration bug
```

### Iterate in Phases
```
You: "Add user registration — just the API endpoint, no frontend yet"
Claude: [implements]
You: "Now add validation and error handling"
Claude: [implements]
You: "Now add tests"
Claude: [implements]
```

Small, verifiable steps > one big dump.

### Let Claude Read Before Writing
Before asking Claude to change code, let it read the file first:
```
Read src/database.ts and then refactor the connection pooling
```

This prevents Claude from making assumptions.

## Working with Git

```
You: "What changed since yesterday?"
Claude: [runs git log, summarizes]

You: /smart-commit
Claude: [analyzes diff, drafts message, you approve]

You: /pr-create
Claude: [creates PR with summary and test plan]
```

## Keyboard Shortcuts

| Shortcut | What It Does |
|----------|-------------|
| `Enter` | Send message |
| `Ctrl+C` | Interrupt Claude (stop what it's doing) |
| `Ctrl+D` | Exit Claude Code |
| `Ctrl+R` | Search conversation history |
| `Ctrl+T` | Toggle todo/task list |
| `Ctrl+O` | Toggle transcript (see all tool calls) |
| `Esc` | Interrupt Claude (stop what it's doing) |
| `Esc` `Esc` | Rewind — jump back to an earlier point in the session |
| `Shift+Tab` | Cycle permission mode (default → acceptEdits → plan) |

## Context Management

Claude has a limited context window. As conversations get long:
- Use `/compact` to compress history (Claude summarizes and continues)
- Start new sessions for unrelated tasks
- Let Claude use sub-agents for research (keeps main context clean)

## Auto-Memory

Claude remembers things across sessions automatically:
- Build commands it discovered
- Patterns it learned about your codebase
- Corrections you gave it

You can also tell it explicitly:
```
Remember that we use Bun instead of npm in this project
```

Check what it remembers: `/memory`

## Troubleshooting

### Claude Ignores My Instructions
- Check `/context` — if usage is high, instructions may have been compressed
- Run `/compact` to free space and reload instructions
- Verify your CLAUDE.md is being loaded (check for typos in file path)

### Claude Asks Too Many Permissions
- Add frequently-approved tools to `settings.json` `allow` list
- See [03-settings-permissions.md](03-settings-permissions.md)

### MCP Server Not Working
- Run `/mcp` to check status
- Run `claude mcp list` to verify configuration
- Check if prerequisites are installed (Node.js, Python, etc.)
- On Windows, try adding `cmd /c` prefix for stdio servers

### Slow Responses
- Use `/compact` to reduce context size
- Close unused MCP servers
- Use `sonnet` model for faster responses, `opus` for complex reasoning
