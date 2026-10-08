# Global CLAUDE.md Generation Guide

This file guides Claude through generating a personalized `~/.claude/CLAUDE.md`.
The global CLAUDE.md applies to ALL projects on the user's machine.
Only put universal preferences here — project-specific stuff goes in project CLAUDE.md.

## Structure to Generate

Generate the file following this skeleton. Fill each section based on wizard answers.
Remove sections that don't apply. Keep total length under 120 lines.

```markdown
# Global Claude Instructions

## About Me
- Role: [their role, e.g., "Full-stack developer at a startup"]
- Primary stack: [languages + frameworks, e.g., "TypeScript, React, Node.js, PostgreSQL"]
- Experience: [level, e.g., "Senior — skip basic explanations"]

## Communication
- Respond in [language, e.g., English / Russian / Spanish]
- [Style preference, e.g., "Be direct and concise. Skip filler."]
- [If applicable: "I'm bilingual English/Russian — match whichever I write in"]
- Don't summarize what you just did — I can read the code
- Ask before making decisions that affect architecture

## Coding Standards
- [Indent style, e.g., "2 spaces for JS/TS, 4 spaces for Python"]
- [Naming convention, e.g., "camelCase for JS, snake_case for Python"]
- Prefer clarity over cleverness
- No dead code, unused imports, or placeholder comments
- [Any other universal preferences they mentioned]

## Workflow
- [Approach, e.g., "Plan before coding. Show me the plan first."]
- [Git style, e.g., "Use conventional commits (feat:, fix:, refactor:, etc.)"]
- [PR style, e.g., "Small, focused PRs with clear descriptions"]
- [Testing, e.g., "Write tests for new features. Run existing tests before committing."]

## Security
- Never commit secrets, API keys, or credentials
- Validate user input at system boundaries
- Flag potential security issues proactively
```

## What NOT to Put Here
- Project-specific build commands (goes in project CLAUDE.md)
- File structure details (goes in project CLAUDE.md)
- Temporary instructions (goes in conversation)
- Things Claude can infer from code (redundant)

## Adaptation Notes
- For beginners: add "Explain your reasoning" and "Suggest simpler alternatives"
- For team leads: add "Consider team impact" and "Note breaking changes"
- For data scientists: emphasize reproducibility, notebook conventions, data handling
- For students: add "Explain concepts as you go" and "Suggest learning resources"
- For devops: add infrastructure-as-code conventions, deployment safety checks
