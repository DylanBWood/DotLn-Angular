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
import { dirname, join } from 'node:path';

import { checkComponentOrder } from './scripts/check-component-order.mjs';
import { checkSharedTypes } from './scripts/check-shared-types.mjs';

const root = new URL('../', import.meta.url).pathname;
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'dotln-taxonomy-')));
const cases = [
  ...['fragments', 'templates', 'composites', 'layouts'].map((role) => [
    `taxonomy/${role}/inject.ts`,
    'no-restricted-syntax',
    `taxonomy/${role}/control.ts`,
  ]),
  ['taxonomy/fragments/constructor.ts', 'no-restricted-syntax', 'taxonomy/fragments/control.ts'],
  [
    'taxonomy/outside-behavior.ts',
    'no-restricted-imports',
    'taxonomy/wrappers/behavior-control.ts',
  ],
  ['taxonomy/mappers/data-access.ts', 'no-restricted-imports', 'taxonomy/mappers/control.ts'],
  [
    'conventions/readonly.ts',
    '@typescript-eslint/prefer-readonly',
    'conventions/readonly-control.ts',
  ],
  ['conventions/imports.ts', 'simple-import-sort/imports', 'conventions/imports-control.ts'],
  ['conventions/template.ts', 'dotln/inline-template-newlines', 'conventions/template-control.ts'],
];
function write(path, content) {
  const target = join(scratch, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content));
}
try {
  symlinkSync(join(root, 'node_modules'), join(scratch, 'node_modules'), 'dir');
  cpSync(join(root, 'tools/lint-rules'), join(scratch, 'tools/lint-rules'), { recursive: true });
  cpSync(join(root, 'tools/scripts'), join(scratch, 'tools/scripts'), { recursive: true });
  write('eslint.config.mjs', readFileSync(join(root, 'eslint.config.mjs'), 'utf8'));
  write('package.json', { name: 'taxonomy-fixtures', private: true });
  write('nx.json', {});
  write('tsconfig.base.json', {
    compilerOptions: {
      strict: true,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
    },
  });
  write('libs/fixture/tsconfig.json', {
    extends: '../../tsconfig.base.json',
    include: ['**/*.ts'],
  });
  write('libs/fixture/project.json', {
    name: 'fixture',
    projectType: 'library',
    tags: ['scope:shared', 'type:ui'],
  });
  write(
    'libs/fixture/eslint.config.mjs',
    "import base from '../../eslint.config.mjs';\nexport default [...base];\n",
  );
  for (const path of new Set(cases.flatMap(([bad, , good]) => [bad, good]))) {
    write(
      `libs/fixture/src/deep/${path}`,
      readFileSync(join(root, 'tools/lint-fixtures', path), 'utf8'),
    );
  }
  const env = {
    ...process.env,
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
    NX_WORKSPACE_DATA_DIRECTORY: join(scratch, '.nx/workspace-data'),
    NX_CACHE_DIRECTORY: join(scratch, '.nx/cache'),
  };
  const run = (script, args) => {
    const result = spawnSync(
      process.execPath,
      [
        join(
          root,
          'node_modules',
          script.split('/')[0],
          JSON.parse(
            readFileSync(join(root, 'node_modules', script.split('/')[0], 'package.json'), 'utf8'),
          ).bin[script.split('/')[0]],
        ),
        ...args,
      ],
      { cwd: scratch, env, encoding: 'utf8', timeout: 60_000, maxBuffer: 2 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    return result;
  };
  const graph = run('nx/bin/nx.js', ['graph', '--file=.nx/graph.json']);
  assert.equal(graph.status, 0, graph.stdout + graph.stderr);
  const lint = run('eslint/bin/eslint.js', [
    '--config',
    'libs/fixture/eslint.config.mjs',
    '--format=json',
    'libs/fixture/**/*.ts',
  ]);
  assert.equal(lint.status, 1, lint.stdout + lint.stderr);
  const results = JSON.parse(lint.stdout);
  const messages = (path) =>
    results.find((row) => row.filePath === join(scratch, 'libs/fixture/src/deep', path))?.messages;
  for (const [bad, rule, good] of cases) {
    const failures = messages(bad);
    assert.ok(
      failures?.some((message) => message.ruleId === rule),
      `${bad}: ${JSON.stringify(failures)}`,
    );
    assert.deepEqual(messages(good), [], `${good}: ${JSON.stringify(messages(good))}`);
    console.log(
      `PASS ${bad}: ${rule} refused; ${good} passes under a nested project configuration.`,
    );
  }
  const fixed = run('eslint/bin/eslint.js', [
    '--config',
    'libs/fixture/eslint.config.mjs',
    '--fix',
    'libs/fixture/src/deep/conventions/imports.ts',
  ]);
  assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
  assert.equal(
    readFileSync(join(scratch, 'libs/fixture/src/deep/conventions/imports.ts'), 'utf8'),
    readFileSync(join(root, 'tools/lint-fixtures/conventions/imports-control.ts'), 'utf8'),
  );
  assert.equal(
    checkSharedTypes([
      'tools/lint-fixtures/conventions/duplicate-a.ts',
      'tools/lint-fixtures/conventions/duplicate-b.ts',
    ]).length,
    1,
  );
  assert.equal(
    checkSharedTypes(['tools/lint-fixtures/conventions/duplicate-control.ts']).length,
    0,
  );
  assert.equal(checkComponentOrder(['tools/lint-fixtures/component-order.ts']).length, 3);
  assert.equal(checkComponentOrder(['tools/lint-fixtures/component-order-control.ts']).length, 0);
  console.log(
    'PASS import autofix, duplicate shared types and component-order negatives with controls.',
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
