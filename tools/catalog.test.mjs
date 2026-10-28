import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  catalogDiagnostic,
  checkCheckpoint,
  dataDirectory,
  readCheckpoints,
  validateTool,
} from './scripts/catalog/check-catalog.mjs';

const fixture = JSON.parse(
  readFileSync(new URL('./lint-fixtures/catalog/missing-definition.json', import.meta.url), 'utf8'),
);
const valid = () => {
  const value = structuredClone(fixture);
  value.tools[0].definition = 'A readable definition.';
  return value;
};

test('the missing-definition fixture fails and a full reading row passes', () => {
  assert.throws(() => checkCheckpoint(fixture), /schema/);
  assert.doesNotThrow(() => checkCheckpoint(valid()));
  const result = spawnSync(
    process.execPath,
    [
      'tools/scripts/catalog/check-catalog.mjs',
      'tools/lint-fixtures/catalog/missing-definition.json',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL catalog validation/);
  assert.match(result.stderr, /batch=aifg-a; at \/tools\/0: schema required/);
  assert.doesNotMatch(result.stderr, /This field is forbidden/);
});

test('diagnostics identify safe schema locations and never print untrusted values or keys', () => {
  const value = valid();
  value.tools[0].title = null;
  try {
    checkCheckpoint(value);
    assert.fail('Expected rejection');
  } catch (error) {
    assert.match(catalogDiagnostic(error), /batch=aifg-a; at \/tools\/0\/title: schema type/);
    assert.doesNotMatch(catalogDiagnostic(error), /xxxxxxxxxx/);
  }
  value.tools[0].title = 'Example';
  value.tools[0]['private-field'] = '/home/example/private';
  try {
    checkCheckpoint(value);
    assert.fail('Expected rejection');
  } catch (error) {
    assert.match(catalogDiagnostic(error), /at \/tools\/0: schema additionalProperties/);
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
  assert.equal(
    validateTool({ ...tool, title: 'x'.repeat(181), definition: 'x'.repeat(2000) }),
    true,
  );
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
      value.tools[0].map.file = '/home/example/private';
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

test('a stored verification kind must be the one its note implies', () => {
  const value = valid();
  value.tools[0].verified = {
    kind: 'partial',
    note: 'https://rxjs.dev/api/index/type-alias/PartialObserver',
  };
  assert.throws(() => checkCheckpoint(value), /Verification kind differs from its note/);
  value.tools[0].verified.kind = 'sourced';
  assert.doesNotThrow(() => checkCheckpoint(value));
});

test('the full catalog refuses a dangling relation and a relation to the same concept', () => {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-relations-test-'));
  try {
    const checkpoint = JSON.parse(readFileSync(join(dataDirectory, 'tools-aifg-a.json'), 'utf8'));
    const tool = checkpoint.tools.find((candidate) => candidate.related.length);
    for (const [id, message] of [
      ['aifg-a:999999', /Relation target is missing or belongs to another work/],
      [tool.id, /Relation links a concept to itself/],
    ]) {
      for (const name of readdirSync(dataDirectory))
        writeFileSync(join(directory, name), readFileSync(join(dataDirectory, name)));
      tool.related[0].id = id;
      writeFileSync(join(directory, 'tools-aifg-a.json'), JSON.stringify(checkpoint));
      assert.throws(() => readCheckpoints(directory), message);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a partial read ignores hidden files and refuses unexpected data files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-partial-test-'));
  try {
    writeFileSync(join(directory, 'tools-aifg-a.json'), JSON.stringify(valid()));
    assert.equal(readCheckpoints(directory, true).length, 1);
    writeFileSync(join(directory, '.DS_Store'), '');
    assert.equal(readCheckpoints(directory, true).length, 1);
    writeFileSync(join(directory, 'unexpected.jsonl'), '{}\n');
    assert.throws(() => readCheckpoints(directory, true), /Unexpected catalog data file/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
