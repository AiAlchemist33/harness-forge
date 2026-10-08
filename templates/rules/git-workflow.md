---
name: git-workflow
description: Git workflow and commit conventions
recommended-for: [all]
---

# Git Workflow

## Branches
- `main` / `master` — production-ready code, always deployable
- Feature branches: `feat/short-description` or `feature/short-description`
- Bug fixes: `fix/short-description`
- Keep branches short-lived — merge within days, not weeks

## Commits
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, refactor, docs, test, chore, style, perf
- Keep the first line under 72 characters
- Write in imperative mood: "Add feature" not "Added feature"
- Reference issue numbers when applicable: `fix(auth): handle expired tokens (#123)`

## Pull Requests
- One logical change per PR — don't mix features with refactors
- Title: concise summary under 70 characters
- Body: what changed, why, and how to test it
- Keep PRs small enough to review in one sitting (under 400 lines when possible)

## Before Committing
- Run tests and ensure they pass
- Run linter/formatter if configured
- Review your own diff before pushing
- Don't commit generated files, build artifacts, or secrets

## Never Do
- Force push to main/master
- Commit directly to main/master (use PRs)
- Rewrite published history
- Leave merge conflicts unresolved
