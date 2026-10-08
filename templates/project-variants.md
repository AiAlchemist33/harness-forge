# Project Template Variants

Pick the variant closest to the user's primary stack. Generate the files accordingly.

## Web Project (JavaScript / TypeScript)

### CLAUDE.md
```markdown
# [Project Name] — Claude Instructions

## Overview
<!-- TODO: Describe what this project does in one line -->

## Stack
<!-- TODO: List your stack, e.g.: Next.js 14, TypeScript, Tailwind, Prisma, PostgreSQL -->

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`

## Architecture
<!-- TODO: Describe your folder structure -->
<!-- Example:
- src/app/ — Next.js app router pages
- src/components/ — React components
- src/lib/ — Shared utilities
- src/api/ — API route handlers
- prisma/ — Database schema
-->

## Conventions
- Components: PascalCase files (Button.tsx)
- Utilities: camelCase files (formatDate.ts)
- Use named exports, not default exports
- API responses: `{ data, error }` format

## Rules
- Run `npm test` before committing
- No `any` types — use proper TypeScript types
- Environment variables validated in src/config.ts
```

### settings.json
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

### Recommended rules
- code-style.md
- testing.md
- security.md
- git-workflow.md

---

## Python Project

### CLAUDE.md
```markdown
# [Project Name] — Claude Instructions

## Overview
<!-- TODO: Describe what this project does in one line -->

## Stack
<!-- TODO: List your stack, e.g.: FastAPI, SQLAlchemy, PostgreSQL, Celery -->

## Commands
- Install: `pip install -e ".[dev]"`
- Dev: `uvicorn app.main:app --reload`
- Test: `pytest`
- Lint: `ruff check .`
- Format: `black .`
- Type check: `mypy .`

## Architecture
<!-- TODO: Describe your folder structure -->
<!-- Example:
- app/ — Application package
- app/api/ — API endpoint handlers
- app/models/ — SQLAlchemy/Pydantic models
- app/services/ — Business logic
- app/db/ — Database connection and queries
- tests/ — Test files mirroring app/ structure
- alembic/ — Database migrations
-->

## Conventions
- Modules: snake_case files (user_service.py)
- Classes: PascalCase (UserService)
- Use type hints on all function signatures
- Docstrings: Google style
- Tests mirror source structure: app/services/auth.py → tests/services/test_auth.py

## Rules
- Run `pytest` before committing
- Never modify migration files — create new ones with `alembic revision`
- Use repository pattern for database access
- All endpoints require authentication unless explicitly public
```

### settings.json
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pip *)",
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

### Recommended rules
- code-style.md
- testing.md
- security.md
- git-workflow.md

---

## General Project (Language-Agnostic)

### CLAUDE.md
```markdown
# [Project Name] — Claude Instructions

## Overview
<!-- TODO: Describe what this project does in one line -->

## Stack
<!-- TODO: List languages, frameworks, and tools -->

## Commands
<!-- TODO: Fill in your project's commands -->
- Install: `...`
- Build: `...`
- Test: `...`
- Lint: `...`

## Architecture
<!-- TODO: Describe your folder structure -->

## Conventions
<!-- TODO: List naming conventions, patterns, and style rules -->

## Rules
<!-- TODO: List things Claude must always/never do in this project -->
```

### settings.json
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

### Recommended rules
- code-style.md
- security.md
- git-workflow.md

---

## Go Project

### CLAUDE.md
```markdown
# [Project Name] — Claude Instructions

## Overview
<!-- TODO: Describe what this project does -->

## Stack
<!-- TODO: e.g.: Go 1.22, Chi router, PostgreSQL, gRPC -->

## Commands
- Build: `go build ./...`
- Test: `go test ./...`
- Lint: `golangci-lint run`
- Run: `go run ./cmd/server`

## Architecture
<!-- TODO: Describe structure -->
<!-- Example:
- cmd/ — Application entry points
- internal/ — Private packages
- pkg/ — Public packages
- api/ — Proto/OpenAPI definitions
-->

## Conventions
- Follow standard Go project layout
- Exported names: PascalCase. Unexported: camelCase.
- Errors: return error as last value, handle immediately
- Interfaces: define where used, not where implemented

## Rules
- Run `go test ./...` before committing
- No `panic()` in library code
- All exported functions need doc comments
```

---

## Generating the Template

For each variant, the wizard should:
1. Create `<target-path>/.claude-project-template/` with:
   - `.claude/CLAUDE.md` — from the variant above
   - `.claude/settings.json` — from the variant above (carries `deny` Read rules for secrets)
   - `.claude/rules/` — copy recommended rules from `templates/rules/`
   - (No `.claudeignore` — it is not read by Claude Code; `.gitignore` + `deny` rules replace it.)
2. Replace `[Project Name]` with a placeholder the user will fill in
3. Keep TODO comments — they're intentional markers for the user to customize later
4. Explain that `.claude/settings.local.json` is personal and should be gitignored
