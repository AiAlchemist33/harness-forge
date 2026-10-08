# Project CLAUDE.md Generation Guide

This file guides Claude through generating a `.claude/CLAUDE.md` (or `CLAUDE.md` at project root).
This file is project-specific and should be checked into version control.
Team members share it — keep it factual and objective.

## Structure to Generate

```markdown
# [Project Name] — Claude Instructions

## Project Overview
- [One-line description of what this project does]
- Stack: [e.g., "Next.js 14, TypeScript, Prisma, PostgreSQL"]
- [If monorepo: "Monorepo with packages: api, web, shared"]

## Commands
- Install: `[e.g., npm install]`
- Dev: `[e.g., npm run dev]`
- Build: `[e.g., npm run build]`
- Test: `[e.g., npm test]`
- Lint: `[e.g., npm run lint]`
- Type check: `[e.g., npx tsc --noEmit]`
- Deploy: `[e.g., npm run deploy]` [if applicable]

## Architecture
- [Brief description of folder structure]
- [e.g., "src/api/ — API route handlers"]
- [e.g., "src/components/ — React components"]
- [e.g., "src/lib/ — Shared utilities"]
- [e.g., "prisma/ — Database schema and migrations"]

## Conventions
- [e.g., "Components use PascalCase files, utilities use camelCase"]
- [e.g., "API routes return { data, error } format"]
- [e.g., "All database queries go through the repository pattern in src/db/"]
- [e.g., "Environment variables are validated in src/config.ts"]

## Rules
- [e.g., "Run `npm test` before committing"]
- [e.g., "Never modify migration files — create new migrations instead"]
- [e.g., "All API endpoints require authentication unless in PUBLIC_ROUTES"]
```

## Tips for the Wizard
- If the user doesn't have a project yet, generate a minimal skeleton they can fill in later
- Read their existing package.json / pyproject.toml / go.mod to auto-detect stack and commands
- If they have an existing CLAUDE.md, offer to enhance it rather than replace it
- For monorepos, suggest using `.claude/rules/` with path-scoped rules instead of one large file
- Keep it under 80 lines — teams shouldn't have to read a novel
