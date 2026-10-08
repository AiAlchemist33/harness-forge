# Hook Presets Catalog

Hooks are configured inside `settings.json` under the `"hooks"` key.
Pick relevant hooks based on the user's stack and preferences, then merge them into their settings.

Each hook preset is in its own file in this folder. Read the relevant ones during Phase 5.

## Available Hooks

| Hook | File | Recommended For | Event |
|------|------|----------------|-------|
| Safety guard | [safety-guard.md](safety-guard.md) | Everyone | PreToolUse |
| Auto-format (Prettier) | [auto-format-web.md](auto-format-web.md) | Web developers | PostToolUse |
| Auto-format (Black+Ruff) | [auto-format-python.md](auto-format-python.md) | Python developers | PostToolUse |
| Auto-format (gofmt) | [auto-format-go.md](auto-format-go.md) | Go developers | PostToolUse |
| Desktop notification | [notify.md](notify.md) | Everyone | Notification |

## Selection Logic

Based on user profile from Phase 1:
- **Everyone**: suggest Safety guard
- **Beginners**: recommend Safety guard strongly
- **Web developers**: suggest Auto-format (Prettier) + Safety guard
- **Python developers**: suggest Auto-format (Black+Ruff) + Safety guard
- **Go developers**: suggest Auto-format (gofmt) + Safety guard
- **All profiles**: offer Notify as optional

## Merging Multiple Hooks

When the user accepts multiple hooks, merge them by combining arrays under each event key:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "...", "hooks": [...] }
    ],
    "PostToolUse": [
      { "matcher": "...", "hooks": [...] }
    ],
    "Notification": [
      { "matcher": "...", "hooks": [...] }
    ]
  }
}
```

Multiple hooks under the same event all fire, and matching hooks run **in parallel** (identical commands are de-duplicated) — do **not** rely on ordering between them. If one step must run after another (e.g. lint after format), put both steps inside a single hook command.

All hook presets here read the tool call as JSON on **stdin** and are implemented in Node (no `jq`/Git Bash needed on Windows). Phase 0 verifies Node is on PATH.
