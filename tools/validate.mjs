#!/usr/bin/env node
// harness-forge structural validator. Zero dependencies, Node >= 22.
// Usage: node tools/validate.mjs [--root <dir>] [--json]
// Exit 0 when no errors, 1 otherwise, 2 on a usage error. Error ids are a stable contract (see the P1 plan);
// validator-crash is emitted (exit 1) if the validator itself throws.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (v === undefined || v.startsWith('--')) { console.error(`${n} needs a directory path`); process.exit(2); }
  return v;
};
const SELF = fileURLToPath(import.meta.url);
const ROOT = opt('--root') ?? join(dirname(SELF), '..');
const JSON_OUT = flag('--json');

const errors = [];
const warnings = [];
let checks = 0;
const rel = (f) => (f ? relative(ROOT, f).split(sep).join('/') : '');
const err = (id, file, msg) => { checks++; errors.push({ id, file: rel(file), msg }); };
const warn = (id, file, msg) => { checks++; warnings.push({ id, file: rel(file), msg }); };
const ok = () => { checks++; };
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'examples', 'tests', '.superpowers']);
const SKIP_FILES = new Set(['CHANGELOG.md']);
const TEXT_EXT = new Set(['.md', '.json', '.mjs', '.js', '.cjs', '.yml', '.yaml', '.txt', '.html', '.css', '.ps1', '.sh', '.cmd', '.bat', '.svg']);
const CRLF_OK = new Set(['.cmd', '.bat']);
const RESERVED = new Set(['synced', 'anthropic-skills', 'batch', 'claude-api', 'claude-in-chrome', 'code-review', 'review', 'dataviz', 'debug', 'design', 'design-sync', 'doctor', 'checkup', 'fewer-permission-prompts', 'loop', 'proactive', 'run', 'run-skill-generator', 'simplify', 'slides', 'update-config', 'verify', 'workflow-authoring', 'artifact-capabilities', 'artifact-diagramming', 'deep-research', 'plugin-authoring', 'init', 'memory', 'config', 'help']);
const PROPRIETARY_SKILLS = new Set(['pdf', 'docx', 'xlsx', 'pptx']);
const WRITE_TOOLS = ['Write', 'Edit', 'NotebookEdit'];
const SHIMS = new Set(['npx', 'npm', 'pnpm', 'yarn', 'npx.cmd', 'npm.cmd']);
const DEPRECATED = [
  ['node-eval', /\bnode\s+(?:-e|--eval)\b/],
  ['legacy-commands', /\.claude\/commands\//],
  ['task-permission', /\bTask\((?!s\))/],
  ['include-coauthored', /includeCoAuthoredBy/],
  ['sse-transport', /"type"\s*:\s*"sse"|\/sse\b/],
  ['tool-input-env', /\$CLAUDE_TOOL_INPUT/],
];

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(p); }
    else yield p;
  }
}

function readText(p) {
  const buf = readFileSync(p);
  if ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff)) err('encoding-utf16', p, 'UTF-16 byte order mark');
  return buf.toString('utf8').replace(/^﻿/, '');
}

function readJson(p) {
  try { const v = JSON.parse(readText(p)); ok(); return v; }
  catch (e) { err('json-parse', p, e.message); return null; }
}

// Minimal frontmatter: `key: value` lines only. A block scalar (`>` or `|`) yields an empty value on purpose.
function frontmatter(text, p, kind) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { err(`${kind}-frontmatter`, p, 'missing frontmatter block'); return null; }
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v === '>' || v === '|' || v === '>-' || v === '|-') v = '';
    fm[kv[1]] = v.replace(/^["']|["']$/g, '');
  }
  return fm;
}

function checkTextFile(p) {
  const ext = extname(p);
  if (!TEXT_EXT.has(ext) || SKIP_FILES.has(basename(p)) || p === SELF) return;
  const text = readText(p);
  if (text.includes('�')) err('replacement-char', p, 'contains U+FFFD (encoding corruption)');
  if (!CRLF_OK.has(ext) && text.includes('\r\n')) err('crlf', p, 'CRLF line endings');
  for (const [id, re] of DEPRECATED) if (re.test(text)) err(id, p, `deprecated pattern ${re}`);
  if (rel(p).startsWith('templates/') && /"effortLevel"\s*:/.test(text)) warn('user-effort-level', p, 'top-level effortLevel is ignored by Opus 5.5+; use modelSettings');
  ok();
}

function checkSkill(p) {
  const dir = dirname(p);
  const text = readText(p);
  const fm = frontmatter(text, p, 'skill');
  if (!fm) return;
  const isPluginRoot = existsSync(join(dir, '.claude-plugin', 'plugin.json'));
  const folder = basename(dir);
  if (!fm.name) err('skill-name', p, 'missing name');
  else if (!isPluginRoot && fm.name !== folder) err('skill-name', p, `name '${fm.name}' != folder '${folder}'`);
  if (!isPluginRoot && RESERVED.has(folder)) err('skill-reserved-name', p, `'${folder}' is a reserved or bundled skill name`);
  if (!isPluginRoot && PROPRIETARY_SKILLS.has(folder) && basename(dirname(dir)) === 'skills') err('vendored-proprietary', p, `'${folder}' matches Anthropic's proprietary document skills; install them from the marketplace instead`);
  if (!fm.description) err('skill-description', p, 'missing or block-scalar description');
  else {
    if (fm.description.length > 1024) err('skill-description-long', p, `${fm.description.length} chars > 1024`);
    else if (rel(p).startsWith('templates/harness/') && fm.description.length > 250) warn('skill-description-250', p, `${fm.description.length} chars > 250 for a generated-harness skill`);
  }
  ok();
}

function checkAgent(p) {
  const text = readText(p);
  const fm = frontmatter(text, p, 'agent');
  if (!fm) return;
  const file = basename(p, '.md');
  if (!fm.name) err('agent-name', p, 'missing name');
  else if (fm.name !== file) err('agent-name', p, `name '${fm.name}' != filename '${file}'`);
  if (!fm.description || fm.description.length < 40) err('agent-description', p, 'description missing or under 40 chars (weak delegation trigger)');
  const tools = (fm.tools ?? '').split(/[,\s]+/).filter(Boolean);
  const bad = tools.filter((t) => WRITE_TOOLS.includes(t));
  if (bad.length) err('agent-can-write', p, `advisory agents never carry ${bad.join(', ')}`);
  if (fm.model && fm.model !== 'inherit') warn('agent-model-pinned', p, `model '${fm.model}' pinned; harness agents inherit`);
  ok();
}

function checkHooks(p, json) {
  const hooks = json?.hooks;
  if (!hooks || typeof hooks !== 'object') return;
  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) { err('hook-shell-form', p, `${event}: expected an array of matcher groups`); continue; }
    for (const g of groups) {
      if (!isObj(g)) { err('hook-shell-form', p, `${event}: matcher group is not an object`); continue; }
      for (const h of g.hooks ?? []) {
        if (!isObj(h)) { err('hook-shell-form', p, `${event}: hook entry is not an object`); continue; }
        if (h.type !== 'command') continue;
        if (!Array.isArray(h.args)) err('hook-shell-form', p, `${event}: command hook without 'args' (exec form required): ${String(h.command).slice(0, 60)}`);
        else if (SHIMS.has(basename(String(h.command)))) warn('hook-exec-shim', p, `${event}: '${h.command}' is a shim; exec form on Windows needs a real executable (node, powershell.exe)`);
      }
    }
  }
  ok();
}

function checkManifests() {
  const mk = join(ROOT, '.claude-plugin', 'marketplace.json');
  if (existsSync(mk)) {
    const m = readJson(mk);
    if (m) {
      if (typeof m.name !== 'string' || !m.owner?.name || !Array.isArray(m.plugins) || m.plugins.length === 0) err('marketplace-shape', mk, 'needs name, owner.name, non-empty plugins[]');
      for (const pl of m.plugins ?? []) {
        if (!isObj(pl)) { err('marketplace-shape', mk, 'plugin entry is not an object'); continue; }
        if (!pl.name || typeof pl.source !== 'string') { err('marketplace-shape', mk, 'plugin entry needs name and source'); continue; }
        const src = join(ROOT, pl.source);
        if (!pl.source.startsWith('./') || !existsSync(join(src, '.claude-plugin', 'plugin.json'))) err('marketplace-source', mk, `source '${pl.source}' has no .claude-plugin/plugin.json`);
        else ok();
      }
    }
  }
  const pkg = join(ROOT, 'package.json');
  if (existsSync(pkg)) {
    const j = readJson(pkg);
    if (j && (j.type !== 'module' || !j.engines?.node)) err('package-shape', pkg, 'needs "type": "module" and engines.node');
  }
  const cm = join(ROOT, 'CLAUDE.md');
  if (existsSync(cm)) {
    const lines = readText(cm).replace(/\r?\n$/, '').split(/\r?\n/).length;
    if (lines > 40) err('claude-md-too-long', cm, `${lines} lines > 40`); else ok();
  }
}

function checkPluginManifest(p) {
  const j = readJson(p);
  if (!j) return;
  const problems = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(j.name ?? '')) problems.push('name must be kebab-case');
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(j.version ?? '')) problems.push('version must be semver');
  if (!j.description) problems.push('description missing');
  if (!j.author?.name) problems.push('author.name missing (validate --strict requires it)');
  if (!j.license) problems.push('license missing');
  if (problems.length) err('plugin-manifest', p, problems.join('; ')); else ok();
}

function checkLicence(p) {
  const head = readText(p).slice(0, 400);
  if (!/MIT|Apache|BSD|CC0|MPL|ISC|Unlicense|CC-BY/i.test(head)) err('unknown-licence', p, 'licence text is not a recognised permissive licence');
  else ok();
}

// ---- run ----
if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) { console.error(`root not found: ${ROOT}`); process.exit(1); }
try {
  checkManifests();
  for (const p of walk(ROOT)) {
    const name = basename(p);
    const parent = basename(dirname(p));
    checkTextFile(p);
    if (name === 'SKILL.md') checkSkill(p);
    else if (parent === 'agents' && name.endsWith('.md')) checkAgent(p);
    else if (name === 'plugin.json' && parent === '.claude-plugin') checkPluginManifest(p);
    else if (name === 'hooks.json' || name === 'settings.json' || name === 'settings.local.json') { const j = readJson(p); if (j) checkHooks(p, j); }
    else if (/^LICENSE(\.txt|\.md)?$/i.test(name) && rel(p).includes('/skills/')) checkLicence(p);
  }

  const result = { ok: errors.length === 0, root: ROOT, checks, errors, warnings };
  if (JSON_OUT) console.log(JSON.stringify(result));
  else {
    console.log(`harness-forge validate — ${checks} checks, ${errors.length} error(s), ${warnings.length} warning(s)`);
    for (const w of warnings) console.log(`  ~ [${w.id}] ${w.file}: ${w.msg}`);
    for (const e of errors) console.log(`  x [${e.id}] ${e.file}: ${e.msg}`);
    console.log(errors.length ? 'Verdict: UNSOUND' : 'Verdict: SOUND');
  }
  process.exit(errors.length ? 1 : 0);
} catch (e) {
  // Unexpected exception: still produce a machine-readable verdict instead of a bare stack trace.
  const msg = String(e && e.stack || e);
  if (JSON_OUT) console.log(JSON.stringify({ ok: false, root: ROOT, checks, errors: [{ id: 'validator-crash', file: '', msg }], warnings }));
  else console.error(`validator-crash: ${msg}`);
  process.exit(1);
}
