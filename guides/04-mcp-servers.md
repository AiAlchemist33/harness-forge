# MCP Servers — Connecting Claude to Your Tools

## What Is MCP?

MCP (Model Context Protocol) lets Claude talk to external tools: GitHub, databases, Slack, browsers, and more. Each "MCP server" is a bridge between Claude and a specific service.

Without MCP: "Claude, check if there are any open PRs" → Claude can't do this.
With GitHub MCP: Claude directly queries GitHub and gives you the answer.

## How It Works

```
You (Claude Code) ←→ MCP Server ←→ External Service
                     (bridge)        (GitHub, DB, etc.)
```

MCP servers run locally on your machine (or connect to remote endpoints). Claude sends requests through them.

## Installing MCP Servers

### Method 1: CLI Command (Recommended)
```bash
# Personal cloud tool, available in every project → user scope
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp/

# A project's own database → project scope (lands in <project>/.mcp.json)
claude mcp add --scope project --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://..."
```
The CLI is strongly preferred — it writes the config to the right place for the scope
you choose and handles OAuth setup. **The default scope is `local`** (current project
only), so pass `--scope user` for anything you want everywhere.

### Method 2: Edit a Config File
Only **project-scope** servers live in a hand-editable file: `<project>/.mcp.json`
(project root). User-scope servers are stored in `~/.claude.json` and are meant to be
managed with `claude mcp add --scope user`, **not** hand-edited — and there is no
`~/.claude/.mcp.json` file.

```jsonc
// <project>/.mcp.json  — committed with the repo, shared with the team
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

## Authentication

Most cloud MCP servers use OAuth. After adding them:
1. Open Claude Code
2. Type `/mcp`
3. Select the server
4. Your browser opens for login
5. Tokens refresh automatically after that

## Managing Servers

```bash
claude mcp list              # See all configured servers
claude mcp get github        # Details for one server
claude mcp remove github     # Remove a server
```

In Claude Code: type `/mcp` for interactive management.

## Most Useful MCP Servers

### For Almost Everyone
- **GitHub** — PRs, issues, code review, workflows

> Fetching/searching the web needs **no** MCP server — Claude Code has built-in
> `WebFetch` and `WebSearch` tools.

### For Backend Developers
- **PostgreSQL/MySQL** — Query databases from Claude
- **Docker** — Manage containers

### For Frontend Developers
- **Playwright** — Browser automation and testing

### For Teams
- **Slack** — Messages and channels
- **Linear** — Issue tracking
- **Notion** — Documentation

See `templates/mcp-catalog.md` for the full catalog with install commands.

## Scope: local vs user vs project

`claude mcp add` has three scopes. The **default is `local`** (current project only) —
not global — so choose deliberately:

- **local** (default) — saved to the current project's entry in `~/.claude.json`; only you, only this project. Fine for experiments.
- **user** (`--scope user`) — saved to `~/.claude.json`; available in **all** your projects. Use for personal tools: GitHub, Slack, Notion.
- **project** (`--scope project`) — saved to `<project>/.mcp.json`, committed and shared with the team. Use for project-specific tools: the project database.

```bash
# Personal tool, everywhere → user scope
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp/

# Team tool, this repo → project scope
claude mcp add --scope project --transport http db https://my-db-mcp.internal/
```

## Tips

- **Start with GitHub** — the most universally useful server (web fetch/search is built in)
- **Don't over-install** — each server consumes context. Only add what you use.
- **Windows note** — some stdio servers need `cmd /c` prefix: `-- cmd /c npx -y @some/package`
- **Check prerequisites** — most servers need Node.js installed (`npx` commands)
- **Environment variables** — use `${VAR_NAME}` in config for secrets (resolved from your shell)
