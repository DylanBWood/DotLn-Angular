import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  batches,
  dataDirectory,
  readCheckpoints,
  verificationKind,
} from './scripts/catalog/check-catalog.mjs';
import { joinDiagnostic, joinMaps } from './scripts/catalog/join-maps.mjs';

/** Builds a run folder from the bundled data; `mutate` may change source rows before writing. */
function withSource(run, mutate = () => undefined) {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-join-'));
  const output = join(directory, 'data');
  mkdirSync(output);
  try {
    const checkpoints = structuredClone(readCheckpoints(dataDirectory));
    const rows = new Map();
    for (const checkpoint of checkpoints) {
      for (const map of checkpoint.maps) rows.set(map.file, []);
      for (const tool of checkpoint.tools) {
        rows.get(tool.map.file)[tool.map.line - 1] = {
          concept: tool.title,
          definition: tool.definition,
          ...tool.place,
          related: tool.related.map((relation) => relation.title),
          dotlnHooks: tool.hooks,
          verified: tool.verified.note,
        };
      }
    }
    const first = rows.get('ai-for-games-3e-part-a.jsonl');
    first[0].concept = 'Join test origin';
    first[0].definition = 'Long teaching content. '.repeat(200);
    first[0].related = [
      'Unique join target',
      'Ambiguous join target',
      'Missing join target',
      'Other work target',
      'Join test origin',
    ];
    first[1].concept = 'Unique join target';
    first[2].concept = 'Ambiguous join target';
    first[3].concept = 'Ambiguous join target';
    rows.get('enterprise-integration-patterns.jsonl')[0].concept = 'Other work target';
    mutate(rows);
    const sources = [];
    for (const checkpoint of checkpoints) {
      const { folder } = batches[checkpoint.batch];
      mkdirSync(join(directory, 'out', folder), { recursive: true });
      for (const map of checkpoint.maps) {
        const bytes =
          rows
            .get(map.file)
            .map((row) => JSON.stringify(row))
            .join('\n') + '\n';
        map.sha256 = createHash('sha256').update(bytes).digest('hex');
        const path = join(directory, 'out', folder, map.file);
        writeFileSync(path, bytes);
        sources.push({ path, bytes });
        for (const tool of checkpoint.tools)
          if (tool.map.file === map.file) tool.map.sha256 = map.sha256;
      }
      writeFileSync(join(output, `tools-${checkpoint.batch}.json`), JSON.stringify(checkpoint));
    }
    writeFileSync(
      join(output, 'catalog-summary.json'),
      readFileSync(join(dataDirectory, 'catalog-summary.json')),
    );
    const before = new Map(
      [
        ...checkpoints.map((checkpoint) => `tools-${checkpoint.batch}.json`),
        'catalog-summary.json',
      ].map((name) => [name, readFileSync(join(output, name), 'utf8')]),
    );
    run({ directory, output, sources, before });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the join keeps full prose, resolves only a unique same-work title and never writes its source', () => {
  withSource(({ directory, output, sources }) => {
    const digests = joinMaps(directory, output);
    assert.equal(digests.length, 11);
    const joined = readCheckpoints(output);
    const origin = joined
      .flatMap((checkpoint) => checkpoint.tools)
      .find((tool) => tool.id === 'aifg-a:1');
    assert.equal(origin.title, 'Join test origin');
    assert.ok(origin.definition.length > 2000);
    assert.deepEqual(origin.related, [
      { title: 'Unique join target', id: 'aifg-a:2' },
      { title: 'Ambiguous join target', id: null },
      { title: 'Missing join target', id: null },
      { title: 'Other work target', id: null },
      { title: 'Join test origin', id: null },
    ]);
    for (const source of sources) assert.equal(readFileSync(source.path, 'utf8'), source.bytes);
  });
});

test('a malformed map row stops the join with its file and line', () => {
  withSource(
    ({ directory, output, before }) => {
      assert.throws(
        () => joinMaps(directory, output),
        (error) =>
          joinDiagnostic(error) === 'Map row shape differs: ai-for-games-3e-part-a.jsonl line 5.',
      );
      for (const [name, bytes] of before)
        assert.equal(readFileSync(join(output, name), 'utf8'), bytes);
    },
    (rows) => {
      delete rows.get('ai-for-games-3e-part-a.jsonl')[4].dotlnHooks;
    },
  );
});

test('a changed last source digest stops the join before any destination is replaced', () => {
  withSource(({ directory, output, sources, before }) => {
    writeFileSync(sources.at(-1).path, sources.at(-1).bytes + '\n');
    assert.throws(() => joinMaps(directory, output), /Digest changed/);
    for (const [name, bytes] of before)
      assert.equal(readFileSync(join(output, name), 'utf8'), bytes);
  });
});

test('verification keeps partial and model-knowledge distinctions', () => {
  assert.equal(verificationKind('Model-knowledge: a worker reading'), 'model-knowledge');
  assert.equal(verificationKind('MK: a worker reading'), 'model-knowledge');
  assert.equal(verificationKind('Source preview; partial coverage'), 'partial');
  assert.equal(
    verificationKind('eip-site:conversation/VocabularyIntro.html (partial stub)'),
    'partial',
  );
  assert.equal(verificationKind('Public source preview'), 'sourced');
  assert.equal(
    verificationKind('https://rxjs.dev/api/index/type-alias/PartialObserver'),
    'sourced',
  );
});

test('join diagnostics identify the declared file and operation without echoing input or paths', () => {
  withSource(({ directory, output }) => {
    writeFileSync(join(output, 'tools-aifg-a.json'), '{"test-marker":invalid');
    assert.throws(
      () => joinMaps(directory, output),
      (error) => {
        assert.equal(
          joinDiagnostic(error),
          '{"operation":"parse checkpoint","file":"tools-aifg-a.json"}',
        );
        assert.ok(!joinDiagnostic(error).includes(directory));
        assert.ok(!joinDiagnostic(error).includes('test-marker'));
        return true;
      },
    );
  });
  withSource(({ directory, output, sources }) => {
    rmSync(sources[0].path);
    assert.throws(
      () => joinMaps(directory, output),
      (error) => {
        assert.equal(
          joinDiagnostic(error),
          '{"operation":"read source","file":"ai-for-games-3e-part-a.jsonl"}',
        );
        assert.ok(!joinDiagnostic(error).includes(directory));
        return true;
      },
    );
  });
});
