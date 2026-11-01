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
  squeezedCode,
  studyProblems,
  withoutComments,
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
  ['rxc:152', { id: 'rxc:152', work: 'rxjs' }],
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

test('a named file that does not parse is a schema problem, not a crash', () => {
  const directory = mkdtempSync(join(tmpdir(), 'studies-named-'));
  try {
    const path = join(directory, 'broken.json');
    writeFileSync(path, '{ not json');
    const result = run(path);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL check-studies: .*broken\.json: at \/: schema type/);
    assert.doesNotMatch(result.stderr, /SyntaxError/);
  } finally {
    rmSync(directory, { recursive: true });
  }
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

const rxjsStudy = (root, changes = {}) => {
  const module = 'libs/switch-map.ts';
  mkdirSync(join(root, 'libs'), { recursive: true });
  writeFileSync(
    join(root, module),
    'export const run = () => {\n  const shown$ = query$.pipe(\n    switchMap((query) => results(query)),\n  );\n  return { shown$ };\n};\n',
  );
  writeFileSync(join(root, 'libs/switch-map.spec.ts'), 'expectMarbleExample(example);\n');
  return {
    ...checked(),
    id: 'rxc:152',
    work: 'rxjs',
    slug: 'switch-map',
    pseudocode: {
      ordinary: checked().pseudocode.ordinary,
      rxjs: 'shown$ = query$.pipe(switchMap((query) => results(query)));',
      executable: { kind: 'rxjs', module },
    },
    visual: { family: 'marbles', model: module, textEquivalent: 'Frame {frame}: {now}.' },
    ...changes,
  };
};

test('an executable RxJS reading shows the code its module runs, whitespace and trailing commas aside', () => {
  const root = mkdtempSync(join(tmpdir(), 'studies-rxjs-'));
  try {
    assert.deepEqual(studyProblems(rxjsStudy(root), tools, root), []);
    assert.equal(squeezedCode('a(\n  b,\n)'), squeezedCode('a(b)'));
    const study = rxjsStudy(root);
    const changed = {
      ...study,
      pseudocode: { ...study.pseudocode, rxjs: 'shown$ = query$.pipe(mergeMap(results));' },
    };
    assert.match(
      studyProblems(changed, tools, root).join(),
      /RxJS code is not in its executable module/,
    );
    const silent = { ...study, pseudocode: { ...study.pseudocode, rxjs: null } };
    assert.match(studyProblems(silent, tools, root).join(), /has no code to show/);
    // The code must run: the same text inside a comment does not count.
    writeFileSync(
      join(root, 'libs/switch-map.ts'),
      '// shown$ = query$.pipe(switchMap((query) => results(query)));\nexport const run = () => ({});\n',
    );
    assert.match(
      studyProblems(study, tools, root).join(),
      /RxJS code is not in its executable module/,
    );
    assert.equal(
      withoutComments("a('https://x') // gone\n/* also\ngone */b"),
      "a('https://x') \nb",
    );
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('an executable RxJS reading’s spec runs the example through expectMarbleExample', () => {
  const root = mkdtempSync(join(tmpdir(), 'studies-rxjs-'));
  try {
    const study = rxjsStudy(root);
    assert.deepEqual(studyProblems(study, tools, root), []);
    writeFileSync(join(root, 'libs/switch-map.spec.ts'), "it('runs', () => {});\n");
    assert.match(
      studyProblems(study, tools, root).join(),
      /spec does not run the example through expectMarbleExample/,
    );
    // A call left inside a comment does not count either.
    writeFileSync(join(root, 'libs/switch-map.spec.ts'), '// expectMarbleExample(example);\n');
    assert.match(
      studyProblems(study, tools, root).join(),
      /spec does not run the example through expectMarbleExample/,
    );
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('a marbles drawing reads the executable module, and an RxJS reading that runs nowhere says so', () => {
  const root = mkdtempSync(join(tmpdir(), 'studies-rxjs-'));
  try {
    const study = rxjsStudy(root);
    const elsewhere = {
      ...study,
      visual: { ...study.visual, model: 'libs/other.ts' },
    };
    writeFileSync(join(root, 'libs/other.ts'), '');
    writeFileSync(join(root, 'libs/other.spec.ts'), '');
    assert.match(
      studyProblems(elsewhere, tools, root).join(),
      /marbles drawing does not read its executable module/,
    );
    const unmarked = {
      ...study,
      visual: null,
      pseudocode: { ...study.pseudocode, executable: null },
    };
    assert.match(
      studyProblems(unmarked, tools, root).join(),
      /neither runs nor is marked illustrative/,
    );
    const marked = {
      ...unmarked,
      pseudocode: {
        ...unmarked.pseudocode,
        rxjs: '// Illustrative: the scheduler hop has no frame in a marble diagram.\nsource$.pipe(observeOn(asyncScheduler))',
      },
    };
    assert.deepEqual(studyProblems(marked, tools, root), []);
    // The movement batch's illustrative readings stay legal: the rule is the RxJS work's.
    assert.deepEqual(studyProblems(checked(), tools, root), []);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('a flow drawn over an executable example reads its module, and a messaging reading that runs nowhere says so', () => {
  const root = mkdtempSync(join(tmpdir(), 'studies-flow-'));
  const messaging = new Map([...tools, ['eip:110', { id: 'eip:110', work: 'eip' }]]);
  try {
    const study = rxjsStudy(root);
    const flow = {
      ...study,
      id: 'eip:110',
      work: 'eip',
      slug: 'aggregator',
      visual: {
        family: 'flow',
        model: study.visual.model,
        textEquivalent: 'Step {step}: {moves}.',
      },
    };
    assert.deepEqual(studyProblems(flow, messaging, root), []);
    writeFileSync(join(root, 'libs/other.ts'), '');
    writeFileSync(join(root, 'libs/other.spec.ts'), '');
    const elsewhere = { ...flow, visual: { ...flow.visual, model: 'libs/other.ts' } };
    assert.match(
      studyProblems(elsewhere, messaging, root).join(),
      /flow drawing does not read its executable module/,
    );
    // A flow whose example does not run reads its own model, and its RxJS reading is absent…
    const structure = {
      ...elsewhere,
      pseudocode: { ...flow.pseudocode, rxjs: null, executable: null },
    };
    assert.deepEqual(studyProblems(structure, messaging, root), []);
    // …or marked as a sketch with its reason.
    const unmarked = {
      ...structure,
      pseudocode: { ...structure.pseudocode, rxjs: 'store$.pipe(tap(keep))' },
    };
    assert.match(
      studyProblems(unmarked, messaging, root).join(),
      /neither runs nor is marked illustrative/,
    );
    const marked = {
      ...unmarked,
      pseudocode: {
        ...unmarked.pseudocode,
        rxjs: '// Illustrative: a store keeps copies; it does not transform a stream.\nstore$.pipe(tap(keep))',
      },
    };
    assert.deepEqual(studyProblems(marked, messaging, root), []);
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
  assert.deepEqual(coverage(records, tools), [
    { work: 'aifg', studied: 2, checked: 2, total: 2 },
    { work: 'rxjs', studied: 0, checked: 0, total: 1 },
  ]);
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

test('the RxJS batch is exactly the concepts its order names', () => {
  assert.deepEqual(
    readStudies()
      .filter(({ study }) => study.work === 'rxjs')
      .map(({ study }) => study.id)
      .sort(),
    [
      'rxc:134',
      'rxc:147',
      'rxc:149',
      'rxc:150',
      'rxc:152',
      'rxc:161',
      'rxc:192',
      'rxc:199',
      'rxc:215',
      'rxc:216',
      'rxc:220',
      'rxc:221',
      'rxc:229',
      'rxc:230',
      'rxc:234',
      'rxc:237',
      'rxc:238',
      'rxc:5',
      'rxc:62',
      'rxc:63',
    ],
  );
});

test('the messaging batch is exactly the patterns its order names, and the stream patterns run', () => {
  const messaging = readStudies().filter(({ study }) => study.work === 'eip');
  assert.deepEqual(messaging.map(({ study }) => study.id).sort(), [
    'eip:105',
    'eip:110',
    'eip:120',
    'eip:131',
    'eip:146',
    'eip:170',
    'eip:175',
    'eip:184',
    'eip:192',
    'eip:211',
    'eip:60',
    'eip:65',
    'eip:71',
    'eip:73',
    'eip:78',
    'eip:80',
    'eip:83',
    'eip:87',
    'eip:91',
    'eip:99',
  ]);
  // The patterns whose mechanism is a stream transformation run their example as marbles, from a
  // module under the batch's own folder, and their flow is drawn from that same module.
  const streams = ['eip:110', 'eip:120', 'eip:99', 'eip:105', 'eip:91', 'eip:211', 'eip:65'];
  for (const { study } of messaging.filter(({ study }) => streams.includes(study.id))) {
    const { executable } = study.pseudocode;
    assert.equal(executable?.kind, 'rxjs', `${study.slug} does not run`);
    assert.match(executable.module, /^libs\/features\/tools\/src\/lib\/studies\/eip\//);
    assert.equal(study.visual?.family, 'flow');
    assert.equal(study.visual.model, executable.module);
  }
  // Every study of the batch is drawn as a flow, whether or not its example runs.
  assert.ok(messaging.every(({ study }) => study.visual?.family === 'flow'));
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
