// harness-forge structural checks, shared by tools/validate.mjs (the repo CLI), scripts/doctor.mjs and the generated
// harness's bin/doctor.mjs. Zero dependencies, Node >= 22. Checks report into a collector from createCollector() and
// keep no module state. Error and warning ids are a stable contract (see the P1 plan): existing ids never change meaning.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// This file spells out the deprecated patterns, so it is exempt from that scan (not from the encoding checks).
const SELF = fileURLToPath(import.meta.url);
// U+FFFD built from its code point, so no literal replacement character can end up in this source.
const FFFD = String.fromCharCode(0xfffd);

export const TEXT_EXT = new Set(['.md', '.json', '.mjs', '.js', '.cjs', '.yml', '.yaml', '.txt', '.html', '.css', '.ps1', '.sh', '.cmd', '.bat', '.svg']);
export const CRLF_OK = new Set(['.cmd', '.bat']);
export const RESERVED = new Set(['synced', 'anthropic-skills', 'batch', 'claude-api', 'claude-in-chrome', 'code-review', 'review', 'dataviz', 'debug', 'design', 'design-sync', 'doctor', 'checkup', 'fewer-permission-prompts', 'loop', 'proactive', 'run', 'run-skill-generator', 'simplify', 'slides', 'update-config', 'verify', 'workflow-authoring', 'artifact-capabilities', 'artifact-diagramming', 'deep-research', 'plugin-authoring', 'init', 'memory', 'config', 'help']);
export const PROPRIETARY_SKILLS = new Set(['pdf', 'docx', 'xlsx', 'pptx']);
export const WRITE_TOOLS = ['Write', 'Edit', 'NotebookEdit'];
export const SHIMS = new Set(['npx', 'npm', 'pnpm', 'yarn', 'npx.cmd', 'npm.cmd']);
export const NODE_BINS = new Set(['node', 'node.exe']);
export const EVAL_FLAG = /^(?:-e|--eval)(?:=|$)/;
// Word-bounded and case-sensitive on purpose: a case-insensitive substring test matches "permitted" (MIT),
// "implied" (MPL) and "disclaim" (ISC), so GPL text would pass.
export const LICENCE_TITLE = /\b(MIT License|Apache License|BSD \d-Clause|CC0|Mozilla Public License|ISC License|Unlicense|CC-BY(?!-NC))\b/;
export const MIT_GRANT = /Permission is hereby granted, free of charge/;
export const LICENCE_FILE = /^(LICENSE|LICENCE|COPYING)(\.txt|\.md)?$/i;
export const DEPRECATED = [
  ['node-eval', /\bnode(?:\.exe)?\s+(?:-e|--eval)\b/],
  ['legacy-commands', /\.claude[\\/]commands\b/],
  ['task-permission', /\bTask\((?!s\))/],
  ['include-coauthored', /includeCoAuthoredBy/],
  ['sse-transport', /"type"\s*:\s*"sse"|\/sse\b/],
  ['tool-input-env', /(\$env:|process\.env\.|\$)CLAUDE_TOOL_INPUT/],
];

const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'examples', 'tests', '.superpowers']);
const SKIP_FILES = new Set(['CHANGELOG.md']);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Findings sink. rel() makes a path root-relative with forward slashes; lastFile is the file read last (it names the
// culprit if a check throws); first() is true once per (id, file), for checks that run on every read of a file.
export function createCollector({ root }) {
  const base = resolve(root);
  const errors = [];
  const warnings = [];
  const seen = new Set();
  let checks = 0;
  const rel = (f) => (f ? relative(base, f).split(sep).join('/') : '');
  return {
    root: base,
    errors,
    warnings,
    lastFile: '',
    rel,
    err(id, file, msg) { checks++; errors.push({ id, file: rel(file), msg }); },
    warn(id, file, msg) { checks++; warnings.push({ id, file: rel(file), msg }); },
    ok() { checks++; },
    first(id, file) {
      const key = `${id}|${rel(file)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
    get checks() { return checks; },
  };
}

// The file as UTF-8 text without a byte order mark. A UTF-16 BOM is an error and a UTF-8 BOM a warning, each reported
// once per file however often the file is read.
export function readText(p, c) {
  c.lastFile = p;
  const buf = readFileSync(p);
  const utf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  if (utf16 && c.first('encoding-utf16', p)) c.err('encoding-utf16', p, 'UTF-16 byte order mark');
  const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  if (bom && c.first('utf8-bom', p)) c.warn('utf8-bom', p, 'UTF-8 byte order mark; save as UTF-8 without a BOM');
  return buf.toString('utf8', bom ? 3 : 0);
}

export function readJson(p, c) {
  try {
    const v = JSON.parse(readText(p, c));
    if (v === null) { c.err('json-parse', p, 'top-level null'); return null; }
    c.ok();
    return v;
  } catch (e) { c.err('json-parse', p, e.message); return null; }
}

// Minimal frontmatter: `key: value` lines only. A block scalar (`>` or `|`) yields an empty value on purpose.
export function frontmatter(text, p, c, kind) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { c.err(`${kind}-frontmatter`, p, 'missing frontmatter block'); return null; }
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

// Encoding checks for every text file, then the content scan (deprecated patterns, template rules) unless exempt.
export function checkTextFile(p, c, { exempt = false } = {}) {
  const ext = extname(p);
  if (!TEXT_EXT.has(ext) || SKIP_FILES.has(basename(p))) return;
  const text = readText(p, c);
  if (text.includes(FFFD)) c.err('replacement-char', p, 'contains U+FFFD (encoding corruption)');
  if (!CRLF_OK.has(ext) && text.includes('\r\n')) c.err('crlf', p, 'CRLF line endings');
  if (!exempt) {
    for (const [id, re] of DEPRECATED) if (re.test(text)) c.err(id, p, `deprecated pattern ${re}`);
    if (c.rel(p).startsWith('templates/') && /"effortLevel"\s*:/.test(text)) c.warn('user-effort-level', p, 'top-level effortLevel is ignored by Opus 5.5+; use modelSettings');
  }
  c.ok();
}

export function checkSkill(p, c) {
  const dir = dirname(p);
  const fm = frontmatter(readText(p, c), p, c, 'skill');
  if (!fm) return;
  const isPluginRoot = existsSync(join(dir, '.claude-plugin', 'plugin.json'));
  const folder = basename(dir);
  if (!fm.name) c.err('skill-name', p, 'missing name');
  else if (!isPluginRoot && fm.name !== folder) c.err('skill-name', p, `name '${fm.name}' != folder '${folder}'`);
  if (!isPluginRoot && RESERVED.has(folder)) c.err('skill-reserved-name', p, `'${folder}' is a reserved or bundled skill name`);
  if (!isPluginRoot && PROPRIETARY_SKILLS.has(folder) && basename(dirname(dir)) === 'skills') c.err('vendored-proprietary', p, `'${folder}' matches Anthropic's proprietary document skills; install them from the marketplace instead`);
  if (!fm.description) c.err('skill-description', p, 'missing or block-scalar description');
  else if (fm.description.length > 1024) c.err('skill-description-long', p, `${fm.description.length} chars > 1024`);
  else if (c.rel(p).startsWith('templates/harness/') && fm.description.length > 250) c.warn('skill-description-250', p, `${fm.description.length} chars > 250 for a generated-harness skill`);
  c.ok();
}

export function checkAgent(p, c) {
  const fm = frontmatter(readText(p, c), p, c, 'agent');
  if (!fm) return;
  const file = basename(p, '.md');
  if (!fm.name) c.err('agent-name', p, 'missing name');
  else if (fm.name !== file) c.err('agent-name', p, `name '${fm.name}' != filename '${file}'`);
  if (!fm.description || fm.description.length < 40) c.err('agent-description', p, 'description missing or under 40 chars (weak delegation trigger)');
  // Comma lists and YAML flow lists ([A, B], quoted or not) are parsed. A YAML block sequence under `tools:` is not,
  // so it counts as missing. An agent with no tools line inherits every tool, Write and Edit included.
  const tools = (fm.tools ?? '').replace(/^\[|\]$/g, '').split(/[,\s]+/).map((t) => t.replace(/^["']|["']$/g, '')).filter(Boolean);
  if (tools.length === 0) c.err('agent-can-write', p, 'no tools list: the agent inherits Write/Edit; list read-only tools explicitly');
  const bad = tools.filter((t) => WRITE_TOOLS.includes(t));
  if (bad.length) c.err('agent-can-write', p, `advisory agents never carry ${bad.join(', ')}`);
  if (fm.model && fm.model !== 'inherit') c.warn('agent-model-pinned', p, `model '${fm.model}' pinned; harness agents inherit`);
  c.ok();
}

// A hooks document: a .claude settings file or a plugin's hooks/hooks.json.
export function checkHooks(p, json, c) {
  const hooks = json?.hooks;
  if (!hooks || typeof hooks !== 'object') return;
  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) { c.err('hook-shell-form', p, `${event}: expected an array of matcher groups`); continue; }
    for (const g of groups) {
      if (!isObj(g)) { c.err('hook-shell-form', p, `${event}: matcher group is not an object`); continue; }
      if (!Array.isArray(g.hooks ?? [])) { c.err('hook-shell-form', p, `${event}: 'hooks' must be an array`); continue; }
      for (const h of g.hooks ?? []) checkHook(p, event, h, c);
    }
  }
  c.ok();
}

function checkHook(p, event, h, c) {
  if (!isObj(h)) { c.err('hook-shell-form', p, `${event}: hook entry is not an object`); return; }
  if (h.type !== 'command') return;
  if (!Array.isArray(h.args)) { c.err('hook-shell-form', p, `${event}: command hook without 'args' (exec form required): ${String(h.command).slice(0, 60)}`); return; }
  const bin = basename(String(h.command));
  if (SHIMS.has(bin)) c.warn('hook-exec-shim', p, `${event}: '${h.command}' is a shim; exec form on Windows needs a real executable (node, powershell.exe)`);
  if (NODE_BINS.has(bin.toLowerCase()) && h.args.some((a) => typeof a === 'string' && EVAL_FLAG.test(a))) c.err('node-eval', p, `${event}: inline eval in hook args`);
}

// Root-level files: the marketplace, package.json and the CLAUDE.md length.
export function checkManifests(root, c) {
  const mk = join(root, '.claude-plugin', 'marketplace.json');
  if (existsSync(mk)) checkMarketplace(mk, root, c);
  const pkg = join(root, 'package.json');
  if (existsSync(pkg)) {
    const j = readJson(pkg, c);
    if (j && (j.type !== 'module' || !j.engines?.node)) c.err('package-shape', pkg, 'needs "type": "module" and engines.node');
  }
  const cm = join(root, 'CLAUDE.md');
  if (existsSync(cm)) {
    const lines = readText(cm, c).replace(/\r?\n$/, '').split(/\r?\n/).length;
    if (lines > 40) c.err('claude-md-too-long', cm, `${lines} lines > 40`); else c.ok();
  }
}

function checkMarketplace(mk, root, c) {
  const m = readJson(mk, c);
  if (!m) return;
  if (typeof m.name !== 'string' || !m.owner?.name || !Array.isArray(m.plugins) || m.plugins.length === 0) c.err('marketplace-shape', mk, 'needs name, owner.name, non-empty plugins[]');
  for (const pl of Array.isArray(m.plugins) ? m.plugins : []) {
    if (!isObj(pl)) { c.err('marketplace-shape', mk, 'plugin entry is not an object'); continue; }
    if (!pl.name || typeof pl.source !== 'string') { c.err('marketplace-shape', mk, 'plugin entry needs name and source'); continue; }
    if (!pl.source.startsWith('./') || !existsSync(join(root, pl.source, '.claude-plugin', 'plugin.json'))) c.err('marketplace-source', mk, `source '${pl.source}' has no .claude-plugin/plugin.json`);
    else c.ok();
  }
}

export function checkPluginManifest(p, c) {
  const j = readJson(p, c);
  if (!j) return;
  const problems = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(j.name ?? '')) problems.push('name must be kebab-case');
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(j.version ?? '')) problems.push('version must be semver');
  if (!j.description) problems.push('description missing');
  if (!j.author?.name) problems.push('author.name missing (validate --strict requires it)');
  if (!j.license) problems.push('license missing');
  if (problems.length) c.err('plugin-manifest', p, problems.join('; ')); else c.ok();
}

export function checkLicence(p, c) {
  const head = readText(p, c).slice(0, 600);
  if (!LICENCE_TITLE.test(head) && !MIT_GRANT.test(head)) c.err('unknown-licence', p, 'licence text is not a recognised permissive licence');
  else c.ok();
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(p); }
    else yield p;
  }
}

// One file: the text checks, then the structural check its name and place call for. Settings files count only inside
// a .claude directory (a .vscode/settings.json may legally hold comments), hooks.json only inside a hooks directory.
function checkFile(p, c, exempt) {
  const name = basename(p);
  const parent = basename(dirname(p));
  const dirs = c.rel(p).split('/').slice(0, -1);
  checkTextFile(p, c, { exempt });
  if (name === 'SKILL.md') checkSkill(p, c);
  else if (parent === 'agents' && name.endsWith('.md')) checkAgent(p, c);
  else if (name === 'plugin.json' && parent === '.claude-plugin') checkPluginManifest(p, c);
  else if (((name === 'settings.json' || name === 'settings.local.json') && dirs.includes('.claude')) || (name === 'hooks.json' && parent === 'hooks')) {
    const j = readJson(p, c);
    if (j) checkHooks(p, j, c);
  } else if (LICENCE_FILE.test(name) && dirs.includes('skills')) checkLicence(p, c);
}

// Validates the tree under root. exemptions: files (absolute, or relative to root) that may quote the deprecated
// patterns; this file always may. An exception inside a check becomes a validator-crash error that keeps the findings
// collected so far and names the file being read.
export function validateTree(root, { exemptions = [] } = {}) {
  const base = resolve(root);
  const c = createCollector({ root: base });
  const exempt = [SELF, ...exemptions].map((f) => resolve(base, f));
  try {
    checkManifests(base, c);
    for (const p of walk(base)) checkFile(p, c, exempt.some((f) => relative(f, p) === ''));
  } catch (e) {
    c.errors.push({ id: 'validator-crash', file: c.rel(c.lastFile), msg: String((e && e.stack) || e) });
  }
  return { ok: c.errors.length === 0, root: base, checks: c.checks, errors: c.errors, warnings: c.warnings };
}
