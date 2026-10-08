---
name: auto-format-web
description: Runs Prettier on JS/TS/CSS/HTML files after Claude edits them
event: PostToolUse
matcher: Edit|Write
platforms: [windows, macos, linux]
recommended-for: web-developer
prerequisites: Node.js on PATH; Prettier resolvable via npx (project or global)
---

# Auto-Format (Web / Prettier)

Runs Prettier after Claude edits or creates web files (.js, .jsx, .ts, .tsx, .css, .json, .md, .html). The hook reads the tool call as JSON on **stdin** (there is no `$CLAUDE_TOOL_INPUT` variable) and is implemented in Node so it needs no `jq`/Git Bash on Windows. If Prettier can't be resolved it silently no-ops (never blocks the edit).

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
            "command": "node -e \"const s=require('fs').readFileSync(0,'utf8');let f='';try{f=(JSON.parse(s).tool_input||{}).file_path||''}catch(e){process.exit(0)}if([\".js\",\".jsx\",\".ts\",\".tsx\",\".css\",\".json\",\".md\",\".html\"].some(x=>f.endsWith(x))){const{execFileSync}=require('child_process');const npx=process.platform==='win32'?'npx.cmd':'npx';try{execFileSync(npx,['prettier','--write',f],{stdio:'ignore'})}catch(e){}}process.exit(0)\""
          }
        ]
      }
    ]
  }
}
```
