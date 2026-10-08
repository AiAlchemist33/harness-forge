---
name: explain-code
description: Explains code clearly with examples and diagrams. Use when you need to understand unfamiliar code.
argument-hint: "[file path or function name]"
user-invocable: true
allowed-tools: Read, Grep, Glob
---

Explain the code specified by the user's argument.

## Steps
1. Find and read the target code ($ARGUMENTS — could be a file path, function name, or class)
2. If it's a function name or class, search for it in the codebase
3. Understand:
   - What does it do? (purpose)
   - What are its inputs and outputs?
   - What other code calls it? What does it call?
   - Are there edge cases or gotchas?
4. Explain it clearly:
   - Start with a one-sentence summary
   - Walk through the logic step by step
   - Use a simple analogy if the concept is complex
   - Show a usage example
   - Note any non-obvious behavior

## Rules
- Adapt complexity to the user's level (check CLAUDE.md for experience info)
- If the code is simple, keep the explanation short
- If the code is complex, use numbered steps and diagrams
- Reference actual line numbers so the user can follow along

$ARGUMENTS
