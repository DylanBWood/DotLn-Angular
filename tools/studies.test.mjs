import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  checkStudies,
  chunkContents,
  citedUrls,
  codeBlocks,
  coverage,
  createSummary,
  readStudies,
  studyProblems,
} from './scripts/catalog/check-studies.mjs';

const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./lint-fixtures/catalog/${name}.json`, import.meta.url), 'utf8'),
  );
const checked = () => ({
  ...fixture('study-draft'),
  authored: {
    by: 'fixture',
    on: '2026-10-31',
    reviewedBy: ['factual-critic', 'reading-critic'],
    state: 'checked',
  },
});
const tools = new Map([
  ['aifg-a:110', { id: 'aifg-a:110', work: 'aifg' }],
  ['aifg-a:112', { id: 'aifg-a:112', work: 'aifg' }],
]);
const run = (...args) =>
  spawnSync(process.execPath, ['tools/scripts/catalog/check-studies.mjs', ...args], {
    encoding: 'utf8',
  });

for (const [name, message] of [
  ['study-unknown-id', /its id is not in the catalog/],
  ['study-reference-without-supports', /schema required supports/],
  ['study-draft', /it is a draft, which never ships/],
])
  test(`the ${name} fixture fails the check`, () => {
    const result = run(`tools/lint-fixtures/catalog/${name}.json`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL check-studies/);
    assert.match(result.stderr, message);
  });

test('a complete checked record passes, and a null representation stays legal', () => {
  assert.deepEqual(studyProblems(checked(), tools), []);
  const study = checked();
  assert.equal(study.visual, null);
  assert.equal(study.pseudocode.rxjs, null);
  assert.deepEqual(study.implementations, []);
});

test('the required parts are refused when empty or absent', () => {
  for (const change of [
    { references: [] },
    { limits: [] },
    { nearby: [] },
    { mechanism: { steps: [] } },
    { intuition: { text: ' ', situation: 'A place.' } },
  ])
    assert.notDeepEqual(studyProblems({ ...checked(), ...change }, tools), []);
  const { example: _example, ...missing } = checked();
  assert.match(studyProblems(missing, tools)[0], /schema required example/);
  assert.match(
    studyProblems({ ...checked(), extra: true }, tools)[0],
    /schema additionalProperties/,
  );
});

test('a reference needs an ISO date and an https address', () => {
  const [reference] = checked().references;
  for (const change of [{ accessed: '31 October 2026' }, { url: 'http://example.org' }])
    assert.notDeepEqual(
      studyProblems({ ...checked(), references: [{ ...reference, ...change }] }, tools),
      [],
    );
});

test('the catalog decides whether an id, its work and each nearby id are real', () => {
  assert.match(
    studyProblems({ ...checked(), work: 'eip' }, tools).join(),
    /work differs from the catalog/,
  );
  assert.match(
    studyProblems({ ...checked(), nearby: [{ id: 'aifg-a:5', why: 'Why.' }] }, tools).join(),
    /nearby id aifg-a:5 is not in the catalog/,
  );
  assert.match(
    studyProblems({ ...checked(), nearby: [{ id: 'aifg-a:110', why: 'Why.' }] }, tools).join(),
    /names the study itself/,
  );
});

test('a checked record names two different reviewers', () => {
  const study = checked();
  study.authored.reviewedBy = ['one'];
  assert.match(studyProblems(study, tools).join(), /fewer than 2 reviewers/);
  study.authored.reviewedBy = ['one', 'one'];
  assert.match(studyProblems(study, tools).join(), /fewer than 2 reviewers/);
});

test('a model or executable module exists with a spec beside it', () => {
  const root = mkdtempSync(join(tmpdir(), 'studies-model-'));
  try {
    mkdirSync(join(root, 'libs'));
    const model = 'libs/seek.model.ts';
    const study = {
      ...checked(),
      visual: { family: 'motion', model, textEquivalent: 'A scout runs for a flag.' },
    };
    assert.match(studyProblems(study, tools, root).join(), /does not exist/);
    writeFileSync(join(root, model), '');
    assert.match(studyProblems(study, tools, root).join(), /no spec beside it/);
    writeFileSync(join(root, 'libs/seek.model.spec.ts'), '');
    assert.deepEqual(studyProblems(study, tools, root), []);
    assert.match(
      studyProblems(
        {
          ...checked(),
          pseudocode: {
            ...checked().pseudocode,
            executable: { kind: 'typescript', module: 'libs/missing.ts' },
          },
        },
        tools,
        root,
      ).join(),
      /does not exist/,
    );
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('the ordinary pseudocode has one blank-line block per mechanism step', () => {
  assert.deepEqual(codeBlocks('a\nb\n\n  \nc\n'), ['a\nb', 'c']);
  const study = checked();
  assert.match(
    studyProblems(
      { ...study, pseudocode: { ...study.pseudocode, ordinary: 'one\n\ntwo' } },
      tools,
    ).join(),
    /1 mechanism steps against 2 blocks/,
  );
});

const filed = (records = [checked()]) => {
  const directory = mkdtempSync(join(tmpdir(), 'studies-'));
  mkdirSync(join(directory, 'aifg'));
  for (const study of records)
    writeFileSync(join(directory, 'aifg', `${study.slug}.json`), JSON.stringify(study));
  writeFileSync(
    join(directory, 'aifg.ts'),
    `${records.map((study, index) => `import s${index} from './aifg/${study.slug}.json';\n`).join('')}` +
      `export default [${records.map((_study, index) => `s${index}`).join(', ')}];\n`,
  );
  return directory;
};

test('a stale summary fails until --write-summary rewrites it', () => {
  const directory = filed();
  try {
    assert.deepEqual(checkStudies({ directory }).problems, [
      'studies-summary.json is stale; run this check with --write-summary',
    ]);
    assert.deepEqual(checkStudies({ directory, write: true }).problems, []);
    assert.deepEqual(checkStudies({ directory }).problems, []);
    const summary = JSON.parse(readFileSync(join(directory, 'studies-summary.json'), 'utf8'));
    assert.deepEqual(summary, {
      schema: 'studies-summary-v0',
      works: [{ work: 'aifg', studies: [{ id: 'aifg-a:110', state: 'checked' }] }],
    });
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('a repeated slug or id, a misplaced file and a chunk that misses a record all fail', () => {
  const directory = filed();
  try {
    writeFileSync(join(directory, 'aifg', 'copy.json'), JSON.stringify(checked()));
    writeFileSync(
      join(directory, 'aifg', 'renamed.json'),
      JSON.stringify({ ...checked(), id: 'aifg-a:112', slug: 'renamed' }),
    );
    const { problems } = checkStudies({ directory, write: true });
    assert.ok(problems.some((problem) => /file name differs from its slug/.test(problem)));
    assert.ok(problems.some((problem) => /slug repeats/.test(problem)));
    assert.ok(problems.some((problem) => /two records study one concept/.test(problem)));
    assert.ok(problems.some((problem) => /chunk's list differs/.test(problem)));
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('a record imported but not exported by its chunk fails, because it could never load', () => {
  const directory = filed();
  try {
    writeFileSync(
      join(directory, 'aifg.ts'),
      "import s0 from './aifg/seek.json';\nexport default [];\n",
    );
    const { problems } = checkStudies({ directory, write: true });
    assert.ok(problems.some((problem) => /chunk's export differs/.test(problem)));
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('a commented-out export or import stands for nothing in a chunk', () => {
  const { imports, exported } = chunkContents(
    [
      "import type { ConceptStudy } from '@dotln-angular/models';",
      "import seek from './aifg/seek.json';",
      "// import arrive from './aifg/arrive.json';",
      '// export default [seek];',
      'export default [seek] as ConceptStudy[];',
    ].join('\n'),
  );
  assert.deepEqual([...imports], [['seek', './aifg/seek.json']]);
  assert.deepEqual(exported, ['seek']);
  const directory = filed();
  try {
    writeFileSync(
      join(directory, 'aifg.ts'),
      "import s0 from './aifg/seek.json';\n// export default [s0];\nexport default [];\n",
    );
    const { problems } = checkStudies({ directory, write: true });
    assert.ok(problems.some((problem) => /chunk's export differs/.test(problem)));
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('a type-only import brings no record into a chunk, and a record loads from its own work', () => {
  const directory = filed();
  try {
    writeFileSync(
      join(directory, 'aifg.ts'),
      "import type s0 from './aifg/seek.json';\nexport default [s0];\n",
    );
    assert.ok(
      checkStudies({ directory, write: true }).problems.some((problem) =>
        /chunk's export differs/.test(problem),
      ),
    );
    writeFileSync(
      join(directory, 'aifg.ts'),
      "import s0 from './other/seek.json';\nexport default [s0];\n",
    );
    assert.ok(
      checkStudies({ directory, write: true }).problems.some((problem) =>
        /chunk's list differs/.test(problem),
      ),
    );
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('a record that is malformed or does not parse is reported, and nothing is written', () => {
  const directory = filed();
  try {
    writeFileSync(join(directory, 'aifg', 'seek.json'), '{ not json');
    const { problems } = checkStudies({ directory, write: true });
    assert.match(problems.join(), /schema type/);
    assert.equal(existsSync(join(directory, 'studies-summary.json')), false);
    writeFileSync(join(directory, 'aifg', 'seek.json'), JSON.stringify({ schema: 'other' }));
    assert.match(checkStudies({ directory, write: true }).problems.join(), /schema/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('the summary sorts a work by source line, and coverage counts every work', () => {
  const records = [{ study: { ...checked(), id: 'aifg-a:110' } }, { study: checked() }];
  records[0].study = { ...records[0].study, id: 'aifg-a:112' };
  assert.deepEqual(
    createSummary(records).works[0].studies.map(({ id }) => id),
    ['aifg-a:110', 'aifg-a:112'],
  );
  assert.deepEqual(coverage(records, tools), [{ work: 'aifg', studied: 2, checked: 2, total: 2 }]);
});

test('the link check lists each cited address once, with the studies that cite it', () => {
  const study = {
    ...checked(),
    implementations: [
      {
        project: 'A project',
        url: 'https://example.org/project',
        relevance: 'It is relevant.',
        explanation: 'It explains.',
      },
    ],
  };
  const records = [{ study }, { study: { ...study, slug: 'other' } }];
  assert.deepEqual(
    [...citedUrls(records)],
    [
      ['https://example.org/steering', ['seek', 'other']],
      ['https://example.org/project', ['seek', 'other']],
    ],
  );
});

test('the movement batch is exactly the concepts its order names', () => {
  assert.deepEqual(
    readStudies()
      .filter(({ study }) => study.work === 'aifg')
      .map(({ study }) => study.id)
      .sort(),
    [
      'aifg-a:110',
      'aifg-a:112',
      'aifg-a:116',
      'aifg-a:118',
      'aifg-a:120',
      'aifg-a:123',
      'aifg-a:125',
      'aifg-a:131',
      'aifg-a:144',
      'aifg-a:145',
      'aifg-a:149',
      'aifg-a:151',
      'aifg-a:153',
      'aifg-a:174',
      'aifg-a:175',
      'aifg-a:177',
      'aifg-a:181',
      'aifg-a:186',
      'aifg-b:354',
      'aifg-b:373',
    ],
  );
});

test('the workspace check runs inside check:fixtures and the committed records pass it', () => {
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(scripts['check:fixtures'], /catalog:check && npm run studies:check$/);
  const result = run();
  assert.equal(result.status, 0);
  // Later batches add records, so the count follows them.
  assert.ok(result.stdout.includes(`check-studies: ${readStudies().length} records; 0 problems`));
  assert.equal(
    readStudies().every(({ study }) => study.authored.state === 'checked'),
    true,
  );
});
