---
name: safety-guard
description: Blocks extremely dangerous shell commands before they execute
event: PreToolUse
matcher: Bash
platforms: [windows, macos, linux]
prerequisites: Node.js on PATH (Phase 0 already checks this)
recommended-for: everyone
---

# Safety Guard

Blocks destructive commands like `rm -rf /`, `format c:`, and fork bombs before they run. The hook reads the tool call as JSON on **stdin** (there is no `$CLAUDE_TOOL_INPUT` environment variable), and exit code 2 blocks the action.

Implemented in Node so it works identically on Windows, macOS, and Linux without needing `jq` or Git Bash.

> **Not a security boundary.** This is an anti-footgun guard against obvious accidents — it matches a fixed list of dangerous substrings and is trivially bypassed by an adversary (variable expansion, alternate tools, encoding). For real protection use `permissions.deny` rules and run untrusted work in a sandbox/VM.

## Config (cross-platform)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const s=require('fs').readFileSync(0,'utf8');let c='';try{c=(JSON.parse(s).tool_input||{}).command||''}catch(e){process.exit(0)}c=c.toLowerCase().split(' ').filter(w=>w).join(' ');const bad=['rm -rf /','rm -rf ~','rm -rf *','rm -fr /','rm -fr ~','rm --recursive --force','format c:','del /s /q','mkfs','dd if=',':(){:|:&};:'];if(bad.some(b=>c.includes(b))){console.error('BLOCKED: dangerous command — run it yourself if you are sure');process.exit(2)}\""
          }
        ]
      }
    ]
  }
}
```
