import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const VALIDATE = join(HERE, '..', 'tools', 'validate.mjs');
const GOOD = join(HERE, 'fixtures', 'validate', 'good');
const REPO = join(HERE, '..');

// --json run; root undefined omits --root. A usage error (exit 2) prints no JSON: it comes back as code 2 plus stderr.
function run(root, cwd) {
  const args = [VALIDATE, ...(root === undefined ? [] : ['--root', root]), '--json'];
  const res = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: cwd ?? tmpdir() });
  if (res.status === 2) return { code: 2, errors: [], warnings: [], stderr: res.stderr };
  if (!res.stdout) throw res.error ?? new Error(`validator exited ${res.status} without JSON: ${res.stderr}`);
  return { code: res.status, ...JSON.parse(res.stdout) };
}
// Raw CLI call for argument handling: never throws, always returns status, stdout and stderr.
const cli = (args, cwd) => spawnSync(process.execPath, [VALIDATE, ...args], { encoding: 'utf8', cwd: cwd ?? tmpdir() });
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
  assert.equal(r.warnings.length, 0, JSON.stringify(r.warnings));
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
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nbroken \uFFFD here\n')));
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
  assert.ok(ids(r).includes('hooks-shape'));
  // second branch: a matcher group whose own hooks[] holds a non-object entry
  const r2 = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), '{"hooks":{"PreToolUse":[{"matcher":"Bash","hooks":[null]}]}}')));
  assert.equal(r2.code, 1);
  assert.ok(ids(r2).includes('hooks-shape'));
});

test('null marketplace plugin entry is reported, not thrown', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude-plugin/marketplace.json'), '{"name":"fx","owner":{"name":"fx"},"plugins":[null]}')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('marketplace-shape'));
});

test('CLAUDE.md of exactly 40 lines passes', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n' + '- line\n'.repeat(39))));
  assert.equal(r.code, 0, JSON.stringify(r.errors)); // a validator-crash (exit 1) must not satisfy a negative assertion
  assert.ok(!ids(r).includes('claude-md-too-long'));
});

test('Task(s) in prose is not flagged', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nThe Task(s) remain.\n')));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
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

// ---- round 2: review findings ----

const GPL = 'GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007\n\nCopyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>\nEveryone is permitted to copy and distribute verbatim copies\nof this license document, but changing it is not allowed.\n';
const MIT_GRANT = 'Permission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction.\n';
const START_LICENCE = '.claude/skills/fx/skills/start/LICENSE';
const agent = (toolsLine) => `---\nname: reviewer\ndescription: Reviews code changes for defects and reports them with evidence.\n${toolsLine}---\nYou review.\n`;
const withAgent = (text) => tree((d) => writeFileSync(join(d, '.claude/skills/fx/agents/reviewer.md'), text));
const hooksJson = (hooks) => JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks }] } });
// Replace CLAUDE.md with a directory: reading it throws EISDIR inside the validator, which must be reported, not escape.
const crashTree = (more) => tree((d) => { if (more) more(d); rmSync(join(d, 'CLAUDE.md')); mkdirSync(join(d, 'CLAUDE.md')); });

test('a hooks value that is not an array is reported, not iterated', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), hooksJson({}))));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('hooks-shape'));
  assert.ok(!ids(r).includes('validator-crash'));
  // a string must not be walked character by character: exactly one finding
  const r2 = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), hooksJson('abc'))));
  assert.equal(r2.code, 1);
  assert.equal(ids(r2).filter((id) => id === 'hooks-shape').length, 1);
  assert.ok(!ids(r2).includes('validator-crash'));
});

test('"plugins" that is not an array is a shape error, not a crash', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude-plugin/marketplace.json'), '{"name":"fx","owner":{"name":"fx"},"plugins":{}}')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('marketplace-shape'));
  assert.ok(!ids(r).includes('validator-crash'));
});

test('crash net names the file that was being read', () => {
  const r = run(crashTree());
  assert.equal(r.code, 1);
  assert.equal(r.ok, false);
  const crash = r.errors.find((e) => e.id === 'validator-crash');
  assert.ok(crash, JSON.stringify(r.errors));
  assert.ok(crash.file.endsWith('CLAUDE.md'), crash.file);
});

test('crash net keeps the findings collected before the crash', () => {
  const r = run(crashTree((d) => writeFileSync(join(d, 'package.json'), '{"name":"fx"}')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('package-shape'), JSON.stringify(r.errors));
  assert.ok(ids(r).includes('validator-crash'));
});

test('crash in human mode prints the findings and the crash on stderr, nothing on stdout', () => {
  const d = crashTree((x) => writeFileSync(join(x, 'package.json'), '{"name":"fx"}'));
  const res = cli(['--root', d]);
  assert.equal(res.status, 1);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /\[package-shape\]/);
  assert.match(res.stderr, /\[validator-crash\] CLAUDE\.md: /);
  assert.match(res.stderr, /Verdict: UNSOUND/);
});

test('--root=<dir> form is accepted', () => {
  const d = tree();
  const res = cli([`--root=${d}`, '--json']);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(res.stdout).root, d);
});

test('unknown arguments exit 2 and name the argument', () => {
  for (const arg of ['stray', '--frobnicate']) {
    const res = cli([arg]);
    assert.equal(res.status, 2, arg);
    assert.equal(res.stdout, '', arg);
    assert.ok(res.stderr.includes(`unknown argument: ${arg}`), res.stderr);
  }
});

test('nonexistent --root exits 2', () => {
  const res = cli(['--root', join(tree(), 'nope'), '--json']);
  assert.equal(res.status, 2);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /root not found: /);
});

test('--root with a missing, empty or flag-like value exits 2', () => {
  for (const args of [['--root'], ['--root='], ['--root', ''], ['--root', '--json']]) {
    const res = cli(args);
    assert.equal(res.status, 2, JSON.stringify(args));
    assert.match(res.stderr, /--root needs a directory path/, JSON.stringify(args));
  }
});

test('relative --root keeps the validator out of its own scan', () => {
  const r = run('.', REPO);
  assert.equal(r.code, 0, JSON.stringify(r.errors));
  assert.deepEqual([...r.errors, ...r.warnings].filter((x) => x.file === 'tools/validate.mjs'), []);
});

test('licence texts that only contain MIT, MPL or ISC inside ordinary words are rejected', () => {
  for (const text of [GPL, 'Creative Commons CC-BY-NC 4.0 International\n']) {
    const r = run(tree((d) => writeFileSync(join(d, START_LICENCE), text)));
    assert.equal(r.code, 1, text);
    assert.ok(ids(r).includes('unknown-licence'), text);
  }
});

test('untitled MIT grant text is accepted as a licence', () => {
  const r = run(tree((d) => writeFileSync(join(d, START_LICENCE), MIT_GRANT)));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
});

test('named permissive licences are accepted', () => {
  for (const text of ['MIT License\n\nCopyright (c) 2026 fx\n', 'Apache License\nVersion 2.0, January 2004\n', 'BSD 3-Clause License\n\nCopyright (c) 2026 fx\n', 'Mozilla Public License Version 2.0\n', 'ISC License\n\nCopyright (c) 2026 fx\n', 'CC0 1.0 Universal\n']) {
    const r = run(tree((d) => writeFileSync(join(d, START_LICENCE), text)));
    assert.equal(r.code, 0, `${text}: ${JSON.stringify(r.errors)}`);
    assert.ok(!ids(r).includes('unknown-licence'), text);
  }
});

test('COPYING and LICENCE files under a top-level skills/ folder are checked', () => {
  const r = run(tree((d) => {
    mkdirSync(join(d, 'skills/a'), { recursive: true });
    mkdirSync(join(d, 'skills/b'), { recursive: true });
    writeFileSync(join(d, 'skills/a/COPYING'), GPL);
    writeFileSync(join(d, 'skills/b/LICENCE'), GPL);
  }));
  assert.deepEqual(r.errors.filter((e) => e.id === 'unknown-licence').map((e) => e.file).sort(), ['skills/a/COPYING', 'skills/b/LICENCE']);
});

test('inline eval is caught in exec form and for node.exe', () => {
  const hook = (command, args) => hooksJson([{ type: 'command', command, args }]);
  for (const [command, args] of [['node', ['-e', 'process.exit(0)']], ['node.exe', ['--no-warnings', '--eval=process.exit(0)']]]) {
    const r = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), hook(command, args))));
    assert.equal(r.code, 1, command);
    assert.ok(ids(r).includes('node-eval'), command);
    assert.ok(!ids(r).includes('hook-shell-form'), command); // it is exec form; only the eval flag is wrong
  }
  // shell-form text with the .exe spelling
  const r3 = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n\nRun node.exe --eval "1" to test.\n')));
  assert.ok(ids(r3).includes('node-eval'));
});

test('agent without a tools list fails (it would inherit Write and Edit)', () => {
  const r = run(withAgent(agent('')));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('agent-can-write'));
});

test('agent tools given as a flow list are parsed', () => {
  for (const line of ['tools: [Read, Write]\n', 'tools: ["Read", "Write"]\n', 'tools: [Edit]\n']) {
    const r = run(withAgent(agent(line)));
    assert.ok(ids(r).includes('agent-can-write'), line);
  }
  const ok = run(withAgent(agent('tools: [Read, Grep]\n')));
  assert.equal(ok.code, 0, JSON.stringify(ok.errors));
});

test('CLAUDE.md of 41 lines fails', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), '# Rules\n' + '- line\n'.repeat(40))));
  assert.equal(r.code, 1);
  assert.ok(ids(r).includes('claude-md-too-long'));
});

test('comments in .vscode/settings.json are not a json-parse failure', () => {
  const r = run(tree((d) => { mkdirSync(join(d, '.vscode')); writeFileSync(join(d, '.vscode/settings.json'), '// editor prefs\n{ "editor.tabSize": 2 }\n'); }));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
  assert.ok(!ids(r).includes('json-parse'));
});

test('invalid settings under .claude and hooks/hooks.json still fail json-parse; a stray hooks.json is not a hooks file', () => {
  const r = run(tree((d) => writeFileSync(join(d, '.claude/settings.json'), '{ not json')));
  assert.ok(ids(r).includes('json-parse'));
  const r2 = run(tree((d) => { mkdirSync(join(d, '.claude/skills/fx/hooks'), { recursive: true }); writeFileSync(join(d, '.claude/skills/fx/hooks/hooks.json'), '{ not json'); }));
  assert.ok(ids(r2).includes('json-parse'));
  const r3 = run(tree((d) => writeFileSync(join(d, 'hooks.json'), '{ not json')));
  assert.equal(r3.code, 0, JSON.stringify(r3.errors));
  assert.ok(!ids(r3).includes('json-parse'));
});

test('Windows path and env-var spellings of deprecated patterns are reported', () => {
  const cases = [
    ['legacy-commands', 'Put files in .claude/commands (no trailing slash).'],
    ['legacy-commands', 'Put files in .claude\\commands on Windows.'],
    ['tool-input-env', 'Read $env:CLAUDE_TOOL_INPUT in PowerShell.'],
    ['tool-input-env', 'Read process.env.CLAUDE_TOOL_INPUT in Node.'],
    ['tool-input-env', 'Read $CLAUDE_TOOL_INPUT in bash.'],
  ];
  for (const [id, line] of cases) {
    const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), `# Rules\n\n${line}\n`)));
    assert.ok(ids(r).includes(id), line);
  }
});

test('top-level null JSON is a json-parse error', () => {
  for (const file of ['.claude-plugin/marketplace.json', 'package.json', '.claude/skills/fx/.claude-plugin/plugin.json']) {
    const r = run(tree((d) => writeFileSync(join(d, file), 'null\n')));
    assert.equal(r.code, 1, file);
    assert.ok(r.errors.some((e) => e.id === 'json-parse' && /top-level null/.test(e.msg)), file);
  }
});

test('UTF-16 byte order mark is reported once per file', () => {
  const r = run(tree((d) => writeFileSync(join(d, 'CLAUDE.md'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('# Rules\n', 'utf16le')]))));
  assert.equal(r.errors.filter((e) => e.id === 'encoding-utf16' && e.file === 'CLAUDE.md').length, 1);
});

// Guard for setting process.exitCode instead of calling process.exit() after console.log: a report bigger than a pipe
// buffer (64 KiB) must arrive complete. It cannot fail on Windows (blocking pipes); it protects POSIX/CI.
test('a report larger than a pipe buffer arrives complete', () => {
  const r = run(tree((d) => {
    mkdirSync(join(d, 'bulk'));
    for (let i = 0; i < 1200; i++) writeFileSync(join(d, 'bulk', `f${i}.md`), `# f${i}\r\n`);
  }));
  assert.equal(r.code, 1);
  assert.equal(r.errors.filter((e) => e.id === 'crlf').length, 1200);
});

test('source files use escape sequences, not literal BOM or replacement characters', () => {
  for (const f of [VALIDATE, fileURLToPath(import.meta.url)]) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!text.includes(String.fromCharCode(0xfeff)), `${f}: literal U+FEFF`);
    assert.ok(!text.includes(String.fromCharCode(0xfffd)), `${f}: literal U+FFFD`);
  }
});

// ---- final review: plugin-scoped rules, personal settings, hooks-shape, text coverage, test gaps ----

const FFFD = String.fromCharCode(0xfffd);
const HARNESS = '.claude/skills/fx/templates/harness';
const put = (d, file, text) => { mkdirSync(join(d, file, '..'), { recursive: true }); writeFileSync(join(d, file), text); };
const found = (list, id) => list.filter((x) => x.id === id).map((x) => x.file).sort();

test('templates/harness rules apply wherever the plugin keeps its templates, and only there', () => {
  const longAgent = `---\nname: helper\ndescription: Use when ${'x'.repeat(300)}\ntools: Read, Grep\n---\nYou help.\n`;
  const r = run(tree((d) => {
    put(d, `${HARNESS}/skills/demo/SKILL.md`, skill('demo', 'Use when ' + 'x'.repeat(266))); // 275 characters
    put(d, `${HARNESS}/settings.fragment.json`, '{ "effortLevel": "high" }\n');
    put(d, `${HARNESS}/agents/helper.md`, longAgent);
    // the same content outside templates/harness raises nothing
    put(d, '.claude/skills/fx/skills/start/SKILL.md', skill('start', 'Use when ' + 'x'.repeat(266)));
    put(d, '.claude/skills/fx/settings.fragment.json', '{ "effortLevel": "high" }\n');
    put(d, '.claude/skills/fx/agents/helper.md', longAgent);
  }));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
  assert.deepEqual(r.warnings.map((w) => [w.id, w.file]).sort(), [
    ['agent-description-300', `${HARNESS}/agents/helper.md`],
    ['skill-description-250', `${HARNESS}/skills/demo/SKILL.md`],
    ['user-effort-level', `${HARNESS}/settings.fragment.json`],
  ]);
});

test('docs, tests and examples are skipped only at the root; .git, node_modules and .superpowers at any depth', () => {
  const scanned = [`${HARNESS}/docs/x.md`, '.claude/skills/fx/tests/x.md', '.claude/skills/fx/examples/x.md'];
  const skipped = ['docs/x.md', 'tests/x.md', 'examples/x.md', '.claude/skills/fx/.git/x.md', '.claude/skills/fx/node_modules/x.md', '.claude/skills/fx/.superpowers/x.md'];
  const r = run(tree((d) => { for (const f of [...scanned, ...skipped]) put(d, f, `# Notes\n\nbroken ${FFFD} text; run node -e "1"\n`); }));
  for (const id of ['replacement-char', 'node-eval']) assert.deepEqual(found(r.errors, id), [...scanned].sort(), id);
});

test('the root CHANGELOG.md is exempt from the deprecated-pattern scan only', () => {
  const r = run(tree((d) => {
    put(d, 'CHANGELOG.md', '# Changelog\r\n\r\n- Dropped the node -e hooks.\r\n');
    put(d, '.claude/skills/fx/CHANGELOG.md', '# Changelog\n\n- Dropped the node -e hooks.\n');
  }));
  assert.deepEqual(found(r.errors, 'crlf'), ['CHANGELOG.md']);
  assert.deepEqual(found(r.errors, 'node-eval'), ['.claude/skills/fx/CHANGELOG.md']);
});

test('personal .claude/settings.local.json is never parsed or linted', () => {
  const r = run(tree((d) => put(d, '.claude/settings.local.json', '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"node -e 1"}]}]}}')));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
  assert.deepEqual([...r.errors, ...r.warnings], []);
});

test('an event value that is not an array is a hooks-shape error', () => {
  const r = run(tree((d) => put(d, '.claude/settings.json', '{"hooks":{"PreToolUse":{"matcher":"Bash"}}}')));
  assert.equal(r.code, 1);
  assert.deepEqual(ids(r), ['hooks-shape']);
});

test('extensionless NOTICE and VERSION files get the encoding checks but not the pattern scan', () => {
  const r = run(tree((d) => {
    put(d, 'NOTICE', `Notice\n\nbroken ${FFFD} text; run node -e "1"\n`);
    put(d, 'VERSION', '1.0.0\r\n');
  }));
  assert.deepEqual(r.errors.map((e) => [e.id, e.file]).sort(), [['crlf', 'VERSION'], ['replacement-char', 'NOTICE']]);
});

test('a skill file spelled other than SKILL.md inside a skills folder fails skill-file-case', () => {
  const r = run(tree((d) => {
    put(d, '.claude/skills/fx/skills/other/skill.md', skill('other', 'Use when the file name has the wrong case.'));
    put(d, 'skill.md', '# Notes on skills\n'); // not inside a skills folder
    put(d, '.claude/skills/fx/skills/start/references/skill.md', '# Reference\n'); // a document inside a skill, not a skill file
  }));
  assert.equal(r.code, 1);
  assert.deepEqual(r.errors.map((e) => [e.id, e.file]), [['skill-file-case', '.claude/skills/fx/skills/other/skill.md']]);
});

test('each manifest, skill and agent id fires on its own defect', () => {
  const start = '.claude/skills/fx/skills/start/SKILL.md';
  const reviewer = '.claude/skills/fx/agents/reviewer.md';
  const cases = [
    ['plugin-manifest', '.claude/skills/fx/.claude-plugin/plugin.json', '{ "name": "fx", "version": "0.1.0", "description": "fixture plugin", "license": "MIT" }\n'],
    ['skill-frontmatter', start, 'Use when starting the fixture flow.\n'],
    ['agent-frontmatter', reviewer, 'You review.\n'],
    ['agent-name', reviewer, agent('tools: Read\n').replace('name: reviewer', 'name: critic')],
    ['agent-description', reviewer, '---\nname: reviewer\ndescription: Reviews code.\ntools: Read\n---\nYou review.\n'],
  ];
  for (const [id, file, text] of cases) {
    const r = run(tree((d) => put(d, file, text)));
    assert.equal(r.code, 1, id);
    assert.ok(ids(r).includes(id), `${id}: ${JSON.stringify(r.errors)}`);
  }
  const pinned = run(withAgent(agent('tools: Read, Grep\nmodel: sonnet\n')));
  assert.equal(pinned.code, 0, JSON.stringify(pinned.errors));
  assert.deepEqual(wids(pinned), ['agent-model-pinned']);
});

test('CRLF passes in a .cmd file and fails in a .md file', () => {
  const r = run(tree((d) => {
    put(d, 'bin/run.cmd', '@echo off\r\necho run\r\n');
    put(d, 'bin/README.md', '# bin\r\n');
  }));
  assert.deepEqual(r.errors.map((e) => [e.id, e.file]), [['crlf', 'bin/README.md']]);
});

test('run() returns a usage error as code 2 with the reason instead of parsing empty stdout', () => {
  const r = run(join(tree(), 'nope'));
  assert.equal(r.code, 2);
  assert.deepEqual([r.errors, r.warnings], [[], []]);
  assert.match(r.stderr, /root not found: /);
});

test('without --root the validator checks the repo it lives in, whatever the working directory', () => {
  const r = run(undefined, tmpdir());
  assert.equal(r.root, resolve(dirname(VALIDATE), '..'));
  assert.equal(r.code, 0, JSON.stringify(r.errors));
});

test('the plugin ships a byte-identical copy of the root LICENSE', () => {
  assert.deepEqual(readFileSync(join(REPO, '.claude/skills/harness-forge/LICENSE')), readFileSync(join(REPO, 'LICENSE')));
});
