---
name: auto-format-python
description: Runs Black and Ruff on Python files after Claude edits them
event: PostToolUse
matcher: Edit|Write
platforms: [windows, macos, linux]
recommended-for: python-developer
prerequisites: Node.js on PATH; Black and Ruff installed (pip install black ruff)
---

# Auto-Format (Python / Black + Ruff)

Runs Black formatter and Ruff linter with auto-fix after Claude edits or creates Python files. The hook reads the tool call as JSON on **stdin** (there is no `$CLAUDE_TOOL_INPUT` variable) and is implemented in Node so it needs no `jq`/Git Bash on Windows. If Black or Ruff isn't installed it silently no-ops (never blocks the edit).

## Config

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const s=require('fs').readFileSync(0,'utf8');let f='';try{f=(JSON.parse(s).tool_input||{}).file_path||''}catch(e){process.exit(0)}if([\".py\"].some(x=>f.endsWith(x))){const{execFileSync}=require('child_process');const o={stdio:'ignore'};for(const a of [[\"black\"],[\"ruff\",\"check\",\"--fix\"]]){try{execFileSync(a[0],a.slice(1).concat(f),o)}catch(e){}}}process.exit(0)\""
          }
        ]
      }
    ]
  }
}
```
