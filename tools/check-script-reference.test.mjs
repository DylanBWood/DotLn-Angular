import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const reference = 'docs/dev-reference/workspace/scripts.md';

function control(t, edit) {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-script-reference-'));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  mkdirSync(join(scratch, 'docs/dev-reference/workspace'), { recursive: true });
  cpSync(new URL('package.json', root), join(scratch, 'package.json'));
  cpSync(new URL('tools/scripts', root), join(scratch, 'tools/scripts'), { recursive: true });
  const document = readFileSync(new URL(reference, root), 'utf8');
  writeFileSync(join(scratch, reference), edit(document));
  return spawnSync(process.execPath, ['tools/scripts/check-script-reference.mjs'], {
    cwd: scratch,
    encoding: 'utf8',
  });
}

test('script reference passes on an unmodified candidate copy', (t) => {
  const result = control(t, (document) => document);
  assert.equal(result.status, 0, result.stderr);
  t.diagnostic(result.stdout.trim());
});

test('expected failure: removing the npm run boards row fails even when prose still names it', (t) => {
  const result = control(
    t,
    (document) =>
      document.replace(/^\| `npm run boards`[^\n]*\n/m, '') +
      '\nProse still names `npm run boards`.\n\n```md\n| `npm run boards` | fake row |\n```\n',
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Undocumented scripts: npm run boards/);
  t.diagnostic('Expected failure: Undocumented scripts: npm run boards');
});

test('expected failure: adding a row for npm run removed:check fails', (t) => {
  const result = control(
    t,
    (document) => document.trimEnd() + '\n| `npm run removed:check` | gone |\n',
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Stale script rows: npm run removed:check/);
  t.diagnostic('Expected failure: Stale script rows: npm run removed:check');
});

test('script file rows must cover existing direct modules and cannot name removed files', (t) => {
  const result = control(
    t,
    (document) =>
      document.replace(/^\| `tools\/scripts\/source-files\.mjs`[^\n]*\n/m, '') +
      '| `tools/scripts/removed.mjs` | gone |\n',
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Undocumented scripts: tools\/scripts\/source-files\.mjs/);
  assert.match(result.stderr, /Stale script rows: tools\/scripts\/removed\.mjs/);
});
