---
name: fix-issue
description: Fix a GitHub issue by analyzing it, finding relevant code, implementing the fix, and testing
argument-hint: "[issue number or description]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

Fix the issue described by the user.

## Steps
1. Understand the issue:
   - If $ARGUMENTS is a number, fetch with `gh issue view $ARGUMENTS`
   - If it's a description, analyze it directly
2. Find the relevant code:
   - Search for related files, functions, error messages
   - Read the code to understand current behavior
3. Identify the root cause (not just the symptom)
4. Plan the fix — explain what you'll change and why
5. Show the plan to the user for approval
6. Implement the fix with minimal, focused changes
7. Run existing tests to verify nothing broke
8. If the fix addresses a GitHub issue, suggest a commit message referencing it

## Rules
- Understand the code before changing it
- Make the minimum change needed to fix the issue
- Don't refactor surrounding code unless it's part of the bug
- Run tests after fixing
- If unsure about the approach, ask before implementing

$ARGUMENTS
