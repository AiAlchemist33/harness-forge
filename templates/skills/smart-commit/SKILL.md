---
name: smart-commit
description: Create a well-structured git commit with conventional commit format
argument-hint: "[optional: scope or description]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Grep
---

Create a git commit for the current changes.

## Steps
1. Run `git status` to see what's changed
2. Run `git diff` and `git diff --cached` to understand the changes
3. Run `git log --oneline -5` to see recent commit style
4. Analyze the changes and determine the type:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `refactor:` — restructuring without behavior change
   - `docs:` — documentation only
   - `test:` — adding or fixing tests
   - `chore:` — maintenance, deps, config
   - `style:` — formatting, no logic change
5. Draft a commit message: `type(scope): concise description`
6. Show the message to the user for approval
7. Stage relevant files (not .env or secrets) and commit

If the user provided an argument, use it as guidance for the scope or description.

$ARGUMENTS
