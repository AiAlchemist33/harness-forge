---
name: auto-format-go
description: Runs gofmt on Go files after Claude edits them
event: PostToolUse
matcher: Edit|Write
platforms: [windows, macos, linux]
recommended-for: go-developer
prerequisites: Node.js on PATH; Go toolchain installed (gofmt)
---

# Auto-Format (Go / gofmt)

Runs gofmt after Claude edits or creates Go files. The hook reads the tool call as JSON on **stdin** (there is no `$CLAUDE_TOOL_INPUT` variable) and is implemented in Node so it needs no `jq`/Git Bash on Windows. If gofmt isn't installed it silently no-ops (never blocks the edit).

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
            "command": "node -e \"const s=require('fs').readFileSync(0,'utf8');let f='';try{f=(JSON.parse(s).tool_input||{}).file_path||''}catch(e){process.exit(0)}if([\".go\"].some(x=>f.endsWith(x))){const{execFileSync}=require('child_process');const o={stdio:'ignore'};for(const a of [[\"gofmt\",\"-w\"]]){try{execFileSync(a[0],a.slice(1).concat(f),o)}catch(e){}}}process.exit(0)\""
          }
        ]
      }
    ]
  }
}
```
