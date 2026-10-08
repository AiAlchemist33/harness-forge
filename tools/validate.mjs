#!/usr/bin/env node
// harness-forge structural validator: the repo CLI. Zero dependencies, Node >= 22.
// The checks live in the plugin, .claude/skills/harness-forge/scripts/lib/checks.mjs, so the doctors can reuse them.
// Usage: node tools/validate.mjs [--root <dir> | --root=<dir>] [--json]
// Exit 0 when no errors, 1 otherwise, 2 on a usage error (unknown argument, --root without a path, root not found).
// Error ids are a stable contract (see the P1 plan); validator-crash is emitted (exit 1) if the validator itself throws.
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTree } from '../.claude/skills/harness-forge/scripts/lib/checks.mjs';

const usage = (msg) => { console.error(msg); process.exit(2); };

// Accepts only --json, --root <dir> and --root=<dir>. Anything else is a usage error, never silently ignored.
function parseArgs(argv) {
  const out = { json: false, root: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--root' || a.startsWith('--root=')) {
      const v = a === '--root' ? argv[++i] : a.slice('--root='.length);
      if (v === undefined || v === '' || v.startsWith('--')) usage('--root needs a directory path');
      out.root = v;
    } else usage(`unknown argument: ${a}`);
  }
  return out;
}

const ARGS = parseArgs(process.argv.slice(2));
const ROOT = resolve(ARGS.root ?? join(dirname(fileURLToPath(import.meta.url)), '..'));

// Human report or JSON. `log` is where the human text goes: stdout normally, stderr when the validator itself crashed.
function emit(result, log) {
  if (ARGS.json) { console.log(JSON.stringify(result)); return; }
  log(`harness-forge validate — ${result.checks} checks, ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  for (const w of result.warnings) log(`  ~ [${w.id}] ${w.file}: ${w.msg}`);
  for (const e of result.errors) log(`  x [${e.id}] ${e.file}: ${e.msg}`);
  log(result.errors.length ? 'Verdict: UNSOUND' : 'Verdict: SOUND');
}

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) usage(`root not found: ${ROOT}`);
const result = validateTree(ROOT);
emit(result, result.errors.some((e) => e.id === 'validator-crash') ? console.error : console.log);
process.exitCode = result.ok ? 0 : 1; // not process.exit(): a pipe may still hold unflushed output
