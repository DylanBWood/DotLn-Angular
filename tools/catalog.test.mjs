import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  catalogDiagnostic,
  checkCheckpoint,
  readCheckpoints,
  validateTool,
} from './scripts/catalog/check-catalog.mjs';
import { mergeCheckpoints } from './scripts/catalog/merge-checkpoints.mjs';

const fixture = JSON.parse(
  readFileSync(new URL('./lint-fixtures/catalog/with-definition.json', import.meta.url), 'utf8'),
);
const valid = () => {
  const value = structuredClone(fixture);
  delete value.tools[0].definition;
  return value;
};

test('the forbidden-definition fixture fails for the forbidden field and passes without it', () => {
  assert.throws(() => checkCheckpoint(fixture), /schema/);
  assert.doesNotThrow(() => checkCheckpoint(valid()));
  const result = spawnSync(
    process.execPath,
    ['tools/scripts/catalog/check-catalog.mjs', 'tools/lint-fixtures/catalog/with-definition.json'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL catalog validation/);
  assert.match(result.stderr, /batch=aifg-a; at \/tools\/0: schema additionalProperties/);
  assert.doesNotMatch(result.stderr, /This field is forbidden/);
});

test('diagnostics identify safe schema locations and never print untrusted values or keys', () => {
  const value = valid();
  value.tools[0].title = 'x'.repeat(81);
  try {
    checkCheckpoint(value);
    assert.fail('Expected rejection');
  } catch (error) {
    assert.match(catalogDiagnostic(error), /batch=aifg-a; at \/tools\/0\/title: schema maxLength/);
    assert.doesNotMatch(catalogDiagnostic(error), /xxxxxxxxxx/);
  }
  value.tools[0]['private-field'] = '/home/example/private';
  try {
    checkCheckpoint(value);
    assert.fail('Expected rejection');
  } catch (error) {
    assert.match(catalogDiagnostic(error), /at \/tools\/0\/\[field\]: scrub/);
    assert.doesNotMatch(catalogDiagnostic(error), /example|private-field|\/home/);
  }
});

test('tool schema pairs provenance, status and faces and rejects extra nested fields', () => {
  const tool = valid().tools[0];
  assert.equal(validateTool(tool), true);
  assert.equal(validateTool({ ...tool, provenance: 'public-work', map: null }), true);
  assert.equal(validateTool({ ...tool, provenance: 'public-work' }), false);
  assert.equal(validateTool({ ...tool, map: null }), false);
  assert.equal(validateTool({ ...tool, map: { ...tool.map, chapter: 'extra' } }), false);
  const faces = {
    scene: ['units-on-terrain'],
    selection: { target: 'unit', min: 1, max: 20 },
    transform: { kind: 'untyped', reason: 'Missing scene behavior.' },
    observable: ['Movement'],
    toyMetric: ['distance'],
  };
  assert.equal(validateTool({ ...tool, faces }), false);
  assert.equal(validateTool({ ...tool, kind: 'behaviour', status: 'untyped', faces }), true);
  assert.equal(validateTool({ ...tool, kind: 'behaviour', status: 'typed', faces }), false);
  assert.equal(validateTool({ ...tool, title: 'x'.repeat(81) }), false);
  assert.equal(
    validateTool({
      ...tool,
      kind: 'behaviour',
      status: 'untyped',
      faces: { ...faces, transform: { kind: 'untyped', reason: ' ' } },
    }),
    false,
  );
});

test('checkpoint validation refuses omissions, duplicate lines, invalid ids, wrong digests and absolute paths', () => {
  for (const mutate of [
    (value) => {
      value.maps[0].rows = 2;
    },
    (value) => {
      value.tools.push(value.tools[0]);
    },
    (value) => {
      value.tools[0].id = 'wrong:1';
    },
    (value) => {
      value.tools[0].map.sha256 = 'b'.repeat(64);
    },
    (value) => {
      value.tools[0].title = '/home/example/private';
    },
    (value) => {
      value.tools[0].work = 'tt';
    },
  ]) {
    const value = valid();
    mutate(value);
    assert.throws(() => checkCheckpoint(value));
  }
});

test('a merge validates all incoming checkpoints before replacing a destination file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-merge-test-'));
  try {
    const input = join(directory, 'input');
    mkdirSync(input);
    const output = join(directory, 'output');
    writeFileSync(join(input, 'tools-aifg-a.json'), JSON.stringify(valid()));
    assert.deepEqual(mergeCheckpoints(input, output), ['aifg-a']);
    const before = readFileSync(join(output, 'tools-aifg-a.json'), 'utf8');
    writeFileSync(join(input, 'tools-aifg-b.json'), JSON.stringify(fixture));
    assert.throws(() => mergeCheckpoints(input, output), /schema/);
    assert.equal(readFileSync(join(output, 'tools-aifg-a.json'), 'utf8'), before);
    assert.equal(readCheckpoints(output, true).length, 1);
    writeFileSync(join(output, 'unexpected.jsonl'), '{}\n');
    assert.throws(() => readCheckpoints(output, true), /Unexpected catalog data file/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
