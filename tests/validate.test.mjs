import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const VALIDATE = join(HERE, '..', 'tools', 'validate.mjs');
const GOOD = join(HERE, 'fixtures', 'validate', 'good');

function run(root, cwd) {
  const args = [VALIDATE, '--root', root, '--json'];
  try {
    const out = execFileSync(process.execPath, args, { encoding: 'utf8', cwd: cwd ?? tmpdir() });
    return { code: 0, ...JSON.parse(out) };
  } catch (e) {
    if (!e.stdout) throw e;
    return { code: e.status, ...JSON.parse(e.stdout) };
  }
}
const dirs = [];
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
function tree(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'hf-validate-'));
  dirs.push(dir);
  cpSync(GOOD, dir, { recursive: true });
  if (mutate) mutate(dir);
  return dir;
}
const ids = (r) => r.errors.map((e) => e.id);
const wids = (r) => r.warnings.map((w) => w.id);
const skill = (name, desc) => `---\nname: ${name}\ndescription: ${desc}\n---\n\nbody\n`;

test('good tree passes with zero errors', () => {
  const r = run(tree());
  assert.equal(r.code, 0, JSON.stringify(r.errors));
  assert.equal(r.errors.length, 0);
  assert.ok(r.checks > 10);
});

test('runs from any working directory (root derived from --root, not cwd)', () => {
  const r = run(tree(), HERE);
  assert.equal(r.code, 0);
});

test('skill without description fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/skills/fx/skills/start/SKILL.md'), '---\nname: start\n---\nbody\n')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('skill-description'));
});

test('block-scalar description counts as empty', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/skills/fx/skills/start/SKILL.md'), '---\nname: start\ndescription: >\n  Use when starting.\n---\nbody\n')));
  assert.ok(ids(r).includes('skill-description'));
});

test('skill name must match its folder', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/skills/fx/skills/start/SKILL.md'), skill('begin', 'Use when starting.'))));
  assert.ok(ids(r).includes('skill-name'));
});

test('reserved skill folder name fails', () => {
  const r = run(tree((d) => { mkdirSync(join(d, '.claude/skills/fx/skills/doctor'), { recursive: true }); writeFileSync(join(d, '.claude/skills/fx/skills/doctor/SKILL.md'), skill('doctor', 'Use when testing reserved names.')); }));
  assert.ok(ids(r).includes('skill-reserved-name'));
});

test('description over 1024 characters fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/skills/fx/skills/start/SKILL.md'), skill('start', 'Use when ' + 'x'.repeat(1030)))));
  assert.ok(ids(r).includes('skill-description-long'));
});

test('node -e in a hooks file fails twice (eval and shell form)', () => {
  const r = run(tree((d) => { mkdirSync(join(d, '.claude/skills/fx/hooks'), { recursive: true }); writeFileSync(join(d, '.claude/skills/fx/hooks/hooks.json'), JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node -e "process.exit(0)"' }] }] } })); }));
  assert.ok(ids(r).includes('node-eval'));
  assert.ok(ids(r).includes('hook-shell-form'));
});

test('exec form pointing at npx warns hook-exec-shim', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), JSON.stringify({ hooks: { PostToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'npx', args: ['prettier', '--write'] }] }] } }))));
  assert.equal(r.code, 0);
  assert.ok(wids(r).includes('hook-exec-shim'));
});

test('replacement character fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nbroken � here\n')));
  assert.ok(ids(r).includes('replacement-char'));
});

test('CRLF line endings fail', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\r\n\r\n- one\r\n')));
  assert.ok(ids(r).includes('crlf'));
});

test('agent with write tools fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/skills/fx/agents/reviewer.md'), '---\nname: reviewer\ndescription: Reviews code changes for defects and reports them with evidence.\ntools: Read, Write\n---\nYou review.\n')));
  assert.ok(ids(r).includes('agent-can-write'));
});

test('vendored proprietary skill folder fails', () => {
  const r = run(tree((d) => { mkdirSync(join(d, '.claude/skills/fx/skills/pdf'), { recursive: true }); writeFileSync(join(d, '.claude/skills/fx/skills/pdf/SKILL.md'), skill('pdf', 'Use when a PDF is mentioned.')); }));
  assert.ok(ids(r).includes('vendored-proprietary'));
});

test('marketplace source without plugin.json fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude-plugin/marketplace.json'), JSON.stringify({ name: 'fx', owner: { name: 'fx' }, plugins: [{ name: 'fx', source: './nowhere' }] }))));
  assert.ok(ids(r).includes('marketplace-source'));
});

test('CLAUDE.md over 40 lines fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n' + '- line\n'.repeat(45))));
  assert.ok(ids(r).includes('claude-md-too-long'));
});

test('deprecated patterns are reported', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nPut commands in .claude/commands/ and set includeCoAuthoredBy.\nAllow Task(Explore). Use $CLAUDE_TOOL_INPUT. Transport "type": "sse".\n')));
  for (const id of ['legacy-commands', 'include-coauthored', 'task-permission', 'tool-input-env', 'sse-transport']) assert.ok(ids(r).includes(id), id);
});

test('malformed hook entries are reported, not thrown', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), '{"hooks":{"PreToolUse":[null]}}')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('hook-shell-form'));
  // second branch: a matcher group whose own hooks[] holds a non-object entry
  const r2 = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), '{"hooks":{"PreToolUse":[{"matcher":"Bash","hooks":[null]}]}}')));
  assert.equal(r2.code, 1);
  assert.ok(ids(r2).includes('hook-shell-form'));
});

test('null marketplace plugin entry is reported, not thrown', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude-plugin/marketplace.json'), '{"name":"fx","owner":{"name":"fx"},"plugins":[null]}')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('marketplace-shape'));
});

test('CLAUDE.md of exactly 40 lines passes', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n' + '- line\n'.repeat(39))));
  assert.ok(!ids(r).includes('claude-md-too-long'));
});

test('Task(s) in prose is not flagged', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nThe Task(s) remain.\n')));
  assert.ok(!ids(r).includes('task-permission'));
});

test('--root without a value exits 2', () => {
  let status;
  let stderr = '';
  try {
    // stdio 'pipe' keeps the child's usage message out of the test output
    execFileSync(process.execPath, [VALIDATE, '--root', '--json'], { encoding: 'utf8', cwd: tmpdir(), stdio: 'pipe' });
    status = 0;
  } catch (e) {
    status = e.status;
    stderr = String(e.stderr);
  }
  assert.equal(status, 2);
  assert.match(stderr, /--root needs a directory path/);
});
