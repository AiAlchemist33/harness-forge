# CLAUDE.md — Teaching Claude How to Work With You

## What Is CLAUDE.md?

CLAUDE.md is a markdown file that Claude reads at the start of every session. It's your way of giving Claude persistent instructions — things you'd otherwise repeat in every conversation.

Think of it as a briefing document: "Here's who I am, here's the project, here's how I want you to work."

## Where It Can Live

1. **~/.claude/CLAUDE.md** — Global. Applies to all your projects. Put personal preferences here.
2. **<project>/CLAUDE.md** or **<project>/.claude/CLAUDE.md** — Project-level. Shared with your team.
3. **<project>/src/CLAUDE.md** — Subdirectory. Loaded only when Claude reads files in that directory.

All levels stack — Claude sees all of them at once.

## What to Put In It

### Global CLAUDE.md (about you)
```markdown
# Global Instructions

## About Me
- Senior Python developer, 8 years experience
- Working on backend systems and data pipelines

## Communication
- Respond in English
- Be concise — skip basic explanations
- Don't summarize what you just did

## Coding
- Python: use type hints, 4-space indent, Black formatting
- Prefer functional style when it's clearer
- Run tests before committing
```

### Project CLAUDE.md (about the code)
```markdown
# My App — Claude Instructions

## Overview
E-commerce API built with FastAPI and PostgreSQL.

## Commands
- Dev: `uvicorn app.main:app --reload`
- Test: `pytest`
- Lint: `ruff check .`
- Migrate: `alembic upgrade head`

## Architecture
- app/api/ — Route handlers
- app/models/ — SQLAlchemy models
- app/services/ — Business logic
- app/db/ — Database connection and queries

## Rules
- All endpoints require authentication except /health and /docs
- Use repository pattern for database access
- Never modify migration files — create new ones
```

## Importing Other Files

You can reference other files to keep CLAUDE.md short:

```markdown
# Project Instructions

Build commands: @package.json
API docs: @docs/api-spec.md
Style guide: @.claude/rules/code-style.md
```

Imports work with relative, absolute, or home (`~`) paths, up to a maximum depth of
**four hops** (an imported file can import another, and so on, four deep). Imported files
load on demand, so they don't bloat the session at launch the way inline text does.

## Rules Directory (for larger projects)

Instead of one massive CLAUDE.md, split rules into `.claude/rules/`:

```
.claude/rules/
├── code-style.md      # Always loaded
├── testing.md         # Always loaded
└── frontend/
    └── react.md       # Loaded only for frontend files (with path scope)
```

Path-scoped rules use frontmatter:
```markdown
---
paths:
  - "src/frontend/**/*.tsx"
  - "src/components/**"
---
# React Rules
- Use functional components with hooks
- ...
```

## Tips

- **Keep it under 200 lines** — longer files waste context and reduce adherence
- **Be specific** — "Use 2-space indent" beats "Format code properly"
- **Update it** — Review monthly. Remove outdated rules.
- **Don't repeat the obvious** — If it's in your .eslintrc or pyproject.toml, Claude already sees it
- **Test your instructions** — Start a new session and check if Claude follows them
