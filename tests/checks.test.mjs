import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createCollector, readText, validateTree } from '../.claude/skills/harness-forge/scripts/lib/checks.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const GOOD = join(HERE, 'fixtures', 'validate', 'good');
const LIB = join(HERE, '..', '.claude', 'skills', 'harness-forge', 'scripts', 'lib', 'checks.mjs');
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const dirs = [];
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
const scratch = () => { const d = mkdtempSync(join(tmpdir(), 'hf-checks-')); dirs.push(d); return d; };
const tree = (mutate) => { const d = scratch(); cpSync(GOOD, d, { recursive: true }); if (mutate) mutate(d); return d; };
const pairs = (list) => list.map((x) => [x.id, x.file]);

test('validateTree passes the good fixture with no findings, in the shape the CLI prints', () => {
  const r = validateTree(GOOD);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.root, resolve(GOOD));
  assert.ok(r.checks > 10);
  assert.deepEqual(Object.keys(r), ['ok', 'root', 'checks', 'errors', 'warnings']);
});

test('createCollector rel() gives root-relative paths with forward slashes', () => {
  const root = join(tmpdir(), 'hf-rel-root');
  const c = createCollector({ root });
  assert.equal(c.rel(join(root, 'a', 'b', 'c.md')), 'a/b/c.md'); // native separators: backslashes on Windows
  assert.equal(c.rel(`${root}/a/b.md`), 'a/b.md');
  assert.equal(c.rel(''), '');
  c.err('x-err', join(root, 'a', 'f.md'), 'm1');
  c.warn('x-warn', join(root, 'g.md'), 'm2');
  c.ok();
  assert.deepEqual(c.errors, [{ id: 'x-err', file: 'a/f.md', msg: 'm1' }]);
  assert.deepEqual(c.warnings, [{ id: 'x-warn', file: 'g.md', msg: 'm2' }]);
  assert.equal(c.checks, 3);
});

test('readText reports a UTF-8 byte order mark once per file and returns the text without it', () => {
  const d = scratch();
  const f = join(d, 'bom.md');
  writeFileSync(f, Buffer.concat([BOM, Buffer.from('# Title\n')]));
  const c = createCollector({ root: d });
  assert.equal(readText(f, c), '# Title\n');
  assert.equal(readText(f, c), '# Title\n');
  assert.deepEqual(pairs(c.warnings), [['utf8-bom', 'bom.md']]);
  assert.deepEqual(c.errors, []);
  assert.equal(c.lastFile, f);
});

test('a BOM in a JSON settings file is one warning and the file still parses', () => {
  const settings = join(GOOD, '.claude', 'settings.json');
  const d = tree((x) => writeFileSync(join(x, '.claude', 'settings.json'), Buffer.concat([BOM, readFileSync(settings)])));
  const r = validateTree(d);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(pairs(r.warnings), [['utf8-bom', '.claude/settings.json']]);
});

test('exemptions skip the deprecated-pattern scan only, never the encoding checks', () => {
  const d = tree((x) => {
    writeFileSync(join(x, 'QUOTES.md'), '# Quotes\r\n\r\nnode -e "1"\r\n');
    writeFileSync(join(x, 'OTHER.md'), '# Other\n\nnode -e "1"\n');
  });
  const r = validateTree(d, { exemptions: ['QUOTES.md'] });
  assert.deepEqual(pairs(r.errors).sort(), [['crlf', 'QUOTES.md'], ['node-eval', 'OTHER.md']]);
});

test('validateTree turns an exception into validator-crash naming the file being read', () => {
  const d = tree((x) => { writeFileSync(join(x, 'package.json'), '{"name":"fx"}'); rmSync(join(x, 'CLAUDE.md')); mkdirSync(join(x, 'CLAUDE.md')); });
  const r = validateTree(d);
  assert.equal(r.ok, false);
  assert.deepEqual(pairs(r.errors), [['package-shape', 'package.json'], ['validator-crash', 'CLAUDE.md']]);
  assert.match(r.errors[1].msg, /EISDIR/);
});

test('library and test sources hold no literal BOM or replacement characters', () => {
  for (const f of [LIB, fileURLToPath(import.meta.url)]) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!text.includes(String.fromCharCode(0xfeff)), `${f}: literal U+FEFF`);
    assert.ok(!text.includes(String.fromCharCode(0xfffd)), `${f}: literal U+FFFD`);
  }
});
