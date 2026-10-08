# Quick Start — Claude Code Setup in 2 Minutes

## What Is This?

This template helps you set up Claude Code (the AI coding assistant) with a personalized configuration. Think of it as your AI's preferences file — it tells Claude who you are, how you work, and what tools you use.

## The 30-Second Version

1. Open Claude Code in this folder
2. Type: **"Let's prepare a workspace"** (or `/prepare-workspace`)
3. Answer a few questions about your workflow
4. Claude sets everything up for you

That's it. Claude handles the rest.

## What Gets Created

| What | Where | Purpose |
|------|-------|---------|
| Global instructions | `~/.claude/CLAUDE.md` | Your personal preferences — follows you everywhere |
| Global settings | `~/.claude/settings.json` | Permissions and behavior defaults |
| MCP servers | `~/.claude.json` | Connections to GitHub, databases, Slack, etc. |
| Skills | `~/.claude/skills/` | Custom commands like `/smart-commit`, `/explain-code` |
| Agents | `~/.claude/agents/` | Specialized AI assistants (reviewer, tester, etc.) |
| Project template | Your chosen folder | Reusable `.claude/` config for any project |

## After Setup

- Start Claude Code in any project — your global settings apply automatically
- Copy the project template `.claude/` folder into new projects and customize
- Type `/` in Claude Code to see all your custom skills
- Read the `guides/` folder if you want to understand what everything does

## What Else Exists (worth knowing)

This wizard covers the core, but Claude Code has more built in:

- **`/init`** — auto-generates a `CLAUDE.md` for an existing project by reading its code
  (also ingests `AGENTS.md`/`.cursorrules`). Run it inside any repo; it's the fastest way
  to seed a project file.
- **Plan mode** (Shift+Tab) — Claude researches and proposes a plan read-only before
  touching anything. Ideal before a big change.
- **Rewind / checkpoints** (Esc Esc) — jump back to an earlier point in the session.
- **Resume** — `claude --resume` (or `/resume`) picks up a previous conversation.
- **Headless mode** — `claude -p "…"` runs a one-shot prompt for scripts/CI; the Agent SDK
  builds custom agents on the same engine.
- **Plugins & marketplaces** — package agents+skills+hooks into an installable bundle
  (`/plugin`); the idiomatic way to share a setup like this one across a team. Vet
  third-party marketplaces before installing — plugins run code.
- **`!` shell mode** and **extended thinking** — run a raw shell command, or ask Claude to
  think harder on a hard problem.

## File Guide

| Guide | What It Covers |
|-------|---------------|
| [01-file-map.md](01-file-map.md) | Where every config file lives on your system |
| [02-claude-md.md](02-claude-md.md) | How CLAUDE.md instructions work |
| [03-settings-permissions.md](03-settings-permissions.md) | Settings, permissions, and safety |
| [04-mcp-servers.md](04-mcp-servers.md) | Connecting Claude to external tools |
| [05-agents-skills-hooks.md](05-agents-skills-hooks.md) | Custom agents, skills, and automation |
| [06-daily-workflow.md](06-daily-workflow.md) | Day-to-day tips and tricks |
