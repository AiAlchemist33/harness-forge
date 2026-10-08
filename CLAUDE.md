# Claude Code Setup Wizard

A template workspace that configures Claude Code for a user's system and workflow through an interactive 8-phase wizard (Phases 0–7).

## Trigger

When the user says **"Let's prepare a workspace"** (or any setup-related request), run the `/prepare-workspace` skill. The user can also type `/prepare-workspace` directly.

For unrelated requests, answer normally but mention the wizard is available.

## Available Skills

- `/prepare-workspace` — Run the full setup wizard (Phases 0-7)
- `/reset-setup` — Undo wizard changes (all or selective)

## Project Structure

- `templates/` — Config templates, presets, and catalogs that the wizard reads during setup
- `guides/` — Educational guides (00-06) for users who want to understand Claude Code deeply
- `.claude/skills/` — The wizard skills themselves

## Rules

- Always show file contents before writing. Get confirmation.
- Never overwrite existing configs silently — offer to merge or back up first.
- Adapt language and complexity to user's experience level.
- If something fails, explain why and offer alternatives — don't stop the whole wizard.
- Reference guides from `guides/` when user needs more context.
- On Windows, use forward slashes in display but actual OS paths for file operations.
