---
name: testing
description: Testing standards and conventions
recommended-for: [all]
---

# Testing Standards

## When to Write Tests
- New features: always include tests
- Bug fixes: add a test that reproduces the bug before fixing it
- Refactors: ensure existing tests still pass; add tests if coverage is low

## Test Structure
- One concept per test — don't test multiple behaviors in one test case
- Descriptive names: `test_returns_404_when_user_not_found` not `test_get_user_2`
- Arrange-Act-Assert pattern:
  1. Set up test data
  2. Call the function
  3. Check the result

## Test Quality
- Use realistic test data (actual names, emails, IDs — not `foo`, `bar`, `test123`)
- Test edge cases: empty input, null values, boundary conditions, error paths
- Don't test implementation details — test behavior
- Avoid brittle tests that break when unrelated code changes

## Running Tests
- Run the full test suite before committing
- If a test is slow, investigate — don't skip it
- Fix failing tests immediately — never commit with known failures
