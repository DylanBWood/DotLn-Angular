import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { boardValidator, fixtureDirectory } from './scripts/check-board-fixtures.mjs';
import { assertScrubbed, scrubBoard, unavailableBoard } from './scripts/scrub-board-fixture.mjs';
import { workspaceRoot } from './scripts/source-files.mjs';

test('fixture CLI failures withhold raw JSON and filesystem paths', () => {
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'dotln-scrub-cli-')));
  const marker = 'sensitive-test-marker';
  const input = join(scratch, `${marker}.json`);
  const output = join(scratch, 'result.json');
  const run = (script, args = []) => {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(
      result.stderr.startsWith('FAIL board fixture'),
      'failure uses a controlled diagnostic',
    );
    assert.equal((result.stdout + result.stderr).includes(scratch), false);
    assert.equal((result.stdout + result.stderr).includes(marker), false);
    return result.stderr;
  };
  try {
    const scrub = resolve(workspaceRoot, 'tools/scripts/scrub-board-fixture.mjs');
    assert.ok(run(scrub, [input, output, scratch]).includes('input read'));
    writeFileSync(input, `{"value":"${marker}",`);
    assert.ok(run(scrub, [input, output, scratch]).includes('JSON parse'));
    writeFileSync(input, '{}');
    assert.ok(
      run(scrub, [input, join(scratch, marker, 'missing.json'), scratch]).includes('output write'),
    );
    const scripts = join(scratch, 'tools/scripts');
    mkdirSync(scripts, { recursive: true });
    for (const name of [
      'check-board-fixtures.mjs',
      'scrub-board-fixture.mjs',
      'source-files.mjs',
    ]) {
      cpSync(resolve(workspaceRoot, 'tools/scripts', name), join(scripts, name));
    }
    symlinkSync(resolve(workspaceRoot, 'node_modules'), join(scratch, 'node_modules'), 'dir');
    assert.ok(run(join(scripts, 'check-board-fixtures.mjs')).includes('validation'));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('scrubbing replaces only the launchpad root and never reports private values', () => {
  const input = { ref: '/Users/example/project/docs/source.md', url: 'https://example.com/path' };
  const result = scrubBoard(input, '/Users/example/project');
  assert.equal(result.ref, '<launchpad>/docs/source.md');
  assert.equal(result.url, input.url);
  assert.notDeepEqual(result, input);
  for (const value of [
    '/Users/example/project-other/file',
    '/home/example/file',
    'C:\\private\\file',
    'c:/private/file',
  ]) {
    assert.throws(
      () => scrubBoard({ value }, '/Users/example/project'),
      (error) => {
        assert.equal(error.message.includes(value), false);
        return /Unscrubbed absolute path at \/value/.test(error.message);
      },
    );
  }
  assert.doesNotThrow(() => assertScrubbed({ url: 'https://example.com' }));
});

test('the pinned schema rejects invalid versions, states and missing provenance', () => {
  const validate = boardValidator();
  const board = JSON.parse(
    readFileSync(resolve(fixtureDirectory, 'launchpad-board-2026-10-21.json'), 'utf8'),
  );
  assert.equal(validate(board), true);
  const variants = [
    (copy) => {
      copy.viewModelVersion = 'future-version';
    },
    (copy) => {
      copy.panels.pop();
    },
    (copy) => {
      copy.panels
        .find((p) => p.sections.some((s) => s.rows.length))
        .sections.find((s) => s.rows.length).rows[0].cells[0].evidence = [];
    },
    (copy) => {
      copy.panels
        .find((p) => p.sections.some((s) => s.rows.length))
        .sections.find((s) => s.rows.length).rows[0].cells[0].status = 'success';
    },
    (copy) => {
      const cell = copy.panels
        .find((p) => p.sections.some((s) => s.rows.length))
        .sections.find((s) => s.rows.length).rows[0].cells[0];
      cell.status = 'unknown';
      cell.value = 0;
    },
  ];
  for (const mutate of variants) {
    const changed = structuredClone(board);
    mutate(changed);
    assert.equal(validate(changed), false);
  }
  const unavailable = unavailableBoard(board);
  assert.equal(validate(unavailable), true);
  assert.ok(
    unavailable.panels
      .flatMap((p) => p.sections)
      .every((s) => s.status === 'unavailable' && s.explanation && !s.rows.length),
  );
  assert.ok(unavailable.sources.every((s) => s.status === 'unavailable' && s.explanation));
});
