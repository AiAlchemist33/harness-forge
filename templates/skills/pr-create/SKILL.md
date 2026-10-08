---
name: pr-create
description: Create a well-formed GitHub pull request with summary and test plan
argument-hint: "[optional: base branch]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

Create a GitHub pull request for the current branch.

## Steps
1. Run `git status` and check for uncommitted changes — commit or warn first
2. Identify the base branch (default: main/master, or use $ARGUMENTS if provided)
3. Run `git log $(git merge-base HEAD origin/$BASE)..HEAD --oneline` to see all commits
4. Run `git diff origin/$BASE...HEAD` to see all changes
5. Analyze the changes across ALL commits (not just the last one)
6. Draft the PR:
   - **Title**: Short (under 70 chars), describes the change
   - **Summary**: 2-4 bullet points explaining what and why
   - **Test plan**: How to verify the changes work
7. Show the draft to the user for approval
8. Push the branch and create the PR with `gh pr create`

## PR Body Format
```
## Summary
- [bullet points]

## Test plan
- [ ] [verification steps]
```

$ARGUMENTS
