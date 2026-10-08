# MCP Server Catalog

Use this catalog to suggest relevant MCP servers based on the user's tools.
For each server, show the one-liner description and install command.
Only suggest servers the user actually needs based on Phase 1 answers.

> **Scope matters — pick it deliberately.** `claude mcp add` defaults to **local**
> scope (this project only, saved under the current directory's entry in
> `~/.claude.json`). Because the wizard runs from the template folder, a server added
> with no scope flag would be visible **only there**. For personal tools you want
> everywhere, always pass `--scope user`. See "Scope Guide" at the bottom.
>
> **Verify before trusting.** MCP servers run code / hit endpoints; package names and
> URLs drift. If an install fails, treat it as expected — check the vendor's current
> docs rather than assuming this file is up to date.

## Git & Code Hosting

### GitHub (Official)
Manage PRs, issues, code review, workflows directly from Claude.
```bash
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp/
```
Auth: Run `/mcp` in Claude Code after adding, then authenticate in browser.
Prerequisites: GitHub account.

### GitLab
Manage merge requests, issues, pipelines.
```bash
claude mcp add --scope user --transport http gitlab https://gitlab.com/-/mcp
```
Auth: OAuth via `/mcp`.

## Databases

### PostgreSQL / MySQL / SQL Server / SQLite (via DBHub)
Query databases, inspect schemas, export data. One server covers all four engines —
just change the DSN scheme.
```bash
# Project scope: a project's own DB is a shared, project-specific tool.
claude mcp add --scope project --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://user:pass@host:5432/dbname"
```
DSN by engine: `postgresql://…`, `mysql://…`, `sqlserver://…`, or
`sqlite:///absolute/path/to/database.db`.
Prerequisites: Node.js, a connection string.
> The DSN may contain a password — prefer project scope + a `${ENV}` reference over
> committing a literal credential to `.mcp.json`.

## Productivity

### Slack (Official)
Send messages, browse channels, search conversations.
```bash
claude mcp add --scope user --transport http slack https://mcp.slack.com/mcp
```
Auth: OAuth via `/mcp`.
Prerequisites: Slack workspace access.
Note: use the `/mcp` HTTP endpoint — Slack's MCP server does not support the old `/sse` transport.

### Notion (Official)
Read and write Notion pages, databases, and blocks.
```bash
claude mcp add --scope user --transport http notion https://mcp.notion.com/mcp
```
Auth: OAuth via `/mcp`.

### Linear
Manage issues, projects, and cycles.
```bash
claude mcp add --scope user --transport http linear https://mcp.linear.app/sse
```
Auth: OAuth via `/mcp`.

## Monitoring & DevOps

### Sentry
View error logs, stack traces, deployment tracking.
```bash
claude mcp add --scope user --transport http sentry https://mcp.sentry.dev/mcp
```
Auth: OAuth via `/mcp`.

### Docker
Docker publishes an official **MCP Toolkit** built into Docker Desktop rather than an
npx package. Enable it in Docker Desktop → **MCP Toolkit**, then connect Claude Code
from there. (There is no `@anthropic/mcp-server-docker` package — don't try to `npx` one.)

## Web & APIs

### Playwright (Browser Automation)
Automate browser testing, take screenshots, fill forms.
```bash
claude mcp add --scope user --transport stdio playwright -- npx -y @playwright/mcp@latest
```
Prerequisites: Node.js. Chromium downloads automatically.

> **Fetching web pages / docs needs no MCP server.** Claude Code has built-in
> `WebFetch` and `WebSearch` tools — don't add a separate "fetch" server for that.

## Cloud & Payments

### Stripe
Manage payments, customers, subscriptions.
```bash
claude mcp add --scope user --transport http stripe https://mcp.stripe.com
```
Auth: OAuth via `/mcp`.

## Scope Guide for the Wizard

`claude mcp add` scopes (pick explicitly — the default is **local**, which is rarely what you want for personal tools):

| Scope | Flag | Stored in | Use for |
|-------|------|-----------|---------|
| **local** (default) | *(none)* | current project's entry in `~/.claude.json` | throwaway / experiments in one project |
| **user** | `--scope user` | `~/.claude.json` (applies to all your projects) | personal accounts: GitHub, Slack, Notion, Sentry, Stripe |
| **project** | `--scope project` | `<project>/.mcp.json` (committed, shared with team) | project-specific tools: the project database, project APIs |

```bash
# Personal tool, everywhere → user scope
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp/

# Team tool, this repo → project scope (lands in .mcp.json)
claude mcp add --scope project --transport stdio db -- npx -y @bytebase/dbhub --dsn "..."
```

Manage and verify with `claude mcp list`, `claude mcp get <name>`, `claude mcp remove <name>`.

## Windows Notes
Some stdio MCP servers need a `cmd /c` wrapper on native Windows (not WSL):
```bash
claude mcp add --scope user --transport stdio server -- cmd /c npx -y @some/package
```
If a server fails to start on Windows, try adding the `cmd /c` prefix.
