# Templates Index

Everything the wizard reads during setup. Organized by what it configures.

## Global Config Generation
| File | Used In | Purpose |
|------|---------|---------|
| `global-claude-md.md` | Phase 2 | Structure guide for generating `~/.claude/CLAUDE.md` |
| `global-settings.json` | Phase 2 | Base template for `~/.claude/settings.json` |
| `settings-presets.md` | Phase 2 | Role-specific permission presets (7 roles) |

## MCP Servers
| File | Used In | Purpose |
|------|---------|---------|
| `mcp-catalog.md` | Phase 3 | MCP server catalog with install commands |

## Agents & Skills
| Directory | Used In | Purpose |
|-----------|---------|---------|
| `agents/` | Phase 4 | 4 agent templates (code-reviewer, doc-writer, explorer, test-writer) |
| `skills/` | Phase 4 | 4 skill templates (smart-commit, pr-create, explain-code, fix-issue) |

## Hooks
| Directory | Used In | Purpose |
|-----------|---------|---------|
| `hooks/` | Phase 5 | 5 hook presets + catalog index |

## Project Templates
| File | Used In | Purpose |
|------|---------|---------|
| `project-variants.md` | Phase 6 | Project template variants (Web, Python, Go, General) |
| `project-claude-md.md` | Phase 6 | Guide for generating project CLAUDE.md |
| `project-settings.json` | Phase 6 | Base project settings template (incl. secret `deny` rules) |
| `project-settings-local.json` | Phase 6 | Example local settings (gitignored, with env vars) |

## Rules
| Directory | Used In | Purpose |
|-----------|---------|---------|
| `rules/` | Phase 6 | 4 rule templates (code-style, git-workflow, security, testing) |
