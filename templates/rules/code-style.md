---
name: code-style
description: Code style and formatting conventions
recommended-for: [all]
---

# Code Style

## Naming
- Variables and functions: use the language's idiomatic convention
  - JavaScript/TypeScript: camelCase
  - Python: snake_case
  - Go: camelCase (exported: PascalCase)
  - Rust: snake_case
- Constants: UPPER_SNAKE_CASE
- Classes/types: PascalCase
- Files: match the language convention (kebab-case for JS, snake_case for Python)

## Formatting
- Use the project's configured formatter (Prettier, Black, gofmt, rustfmt)
- If no formatter is configured, follow the existing style in the file
- Consistent indentation throughout the project

## Principles
- Prefer clarity over cleverness — code is read far more than written
- No dead code — delete unused functions, imports, and variables
- No commented-out code — that's what git history is for
- Keep functions short and focused — if it needs a comment block explaining what it does, it should be split
- Avoid deep nesting — early returns are preferred
