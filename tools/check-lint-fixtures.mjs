import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
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
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'dotln-boundaries-')));
const invalid = 'tools/lint-fixtures/boundary-violation.spec.ts';
const valid = 'tools/lint-control/allowed.ts';
const env = {
  ...process.env,
  NX_DAEMON: 'false',
  NX_ISOLATE_PLUGINS: 'false',
  NX_WORKSPACE_DATA_DIRECTORY: join(scratch, '.nx/workspace-data'),
  NX_CACHE_DIRECTORY: join(scratch, '.nx/cache'),
};

function write(path, content) {
  const target = join(scratch, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content));
}

function run(packageName, binName, args) {
  const directory = join(root, 'node_modules', packageName);
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[binName];
  const result = spawnSync(process.execPath, [join(directory, bin), ...args], {
    cwd: scratch,
    env,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

try {
  // Build an actual isolated Nx graph. No production library or graph is changed.
  symlinkSync(join(root, 'node_modules'), join(scratch, 'node_modules'), 'dir');
  write('package.json', { name: 'boundary-fixtures', private: true });
  write('nx.json', { cacheDirectory: '.nx/cache' });
  write('tsconfig.base.json', {
    compilerOptions: {
      baseUrl: '.',
      paths: { '@dotln-angular/fixture-util': ['tools/lint-target/index.ts'] },
    },
  });
  write('eslint.config.mjs', readFileSync(join(root, 'eslint.config.mjs'), 'utf8'));
  for (const dependency of [
    'tools/lint-rules/token-names.mjs',
    'tools/lint-rules/inline-template-newlines.mjs',
    'tools/scripts/check-token-names.mjs',
    'tools/scripts/source-files.mjs',
  ]) {
    write(dependency, readFileSync(join(root, dependency), 'utf8'));
  }
  for (const [name, directory, type] of [
    ['fixture-models', 'tools/lint-fixtures', 'models'],
    ['fixture-control', 'tools/lint-control', 'util'],
    ['fixture-util', 'tools/lint-target', 'util'],
  ]) {
    write(`${directory}/project.json`, {
      name,
      root: directory,
      projectType: 'library',
      tags: ['scope:shared', `type:${type}`],
    });
  }
  const source = readFileSync(join(root, invalid), 'utf8');
  write(invalid, source);
  write(valid, source);
  write('tools/lint-target/index.ts', 'export const value = 1;\n');
  const foundationFixtures = [
    ['tools/lint-fixtures/private-keyword.ts', 'no-restricted-syntax', 1],
    ['tools/lint-fixtures/bad-token.ts', 'dotln/token-names', 1],
    ['tools/lint-fixtures/aliased-tokens.ts', 'dotln/token-names', 2],
  ];
  for (const [fixture] of foundationFixtures) {
    write(fixture, readFileSync(join(root, fixture), 'utf8'));
  }
  write(
    'tools/lint-control/good-token.ts',
    readFileSync(join(root, foundationFixtures[1][0]), 'utf8').replace(
      'wrong.namespace',
      'dotln-angular.shared.core.fixture',
    ),
  );
  write(
    'tools/lint-control/good-aliased-tokens.ts',
    readFileSync(join(root, foundationFixtures[2][0]), 'utf8').replaceAll(
      'wrong.namespace',
      'dotln-angular.shared.core.fixture',
    ),
  );
  write(
    'tools/lint-control/hash-private.ts',
    'export class HashPrivate { readonly #value = 1; read() { return this.#value; } }\n',
  );

  const graph = run('nx', 'nx', ['graph', '--file=.nx/graph.json']);
  assert.equal(graph.status, 0, graph.stdout + graph.stderr);
  const lint = run('eslint', 'eslint', ['--no-ignore', '--format=json', invalid, valid]);
  assert.equal(
    lint.status,
    1,
    `Expected an ESLint violation, got ${lint.status}: ${lint.stdout}${lint.stderr}`,
  );
  const results = JSON.parse(lint.stdout);
  const violation = results.find((result) => result.filePath === join(scratch, invalid));
  const control = results.find((result) => result.filePath === join(scratch, valid));
  assert.equal(violation?.messages.length, 1, lint.stdout);
  assert.equal(violation.messages[0].ruleId, '@nx/enforce-module-boundaries', lint.stdout);
  assert.equal(violation.messages[0].messageId, 'emptyOnlyTagsConstraintViolation', lint.stdout);
  assert.deepEqual(control?.messages, [], lint.stdout);
  console.log(
    `PASS ${invalid}: models → util refused by @nx/enforce-module-boundaries; util → util allowed.`,
  );
  const foundation = run('eslint', 'eslint', [
    '--no-ignore',
    '--format=json',
    ...foundationFixtures.map(([fixture]) => fixture),
    'tools/lint-control/good-token.ts',
    'tools/lint-control/good-aliased-tokens.ts',
    'tools/lint-control/hash-private.ts',
  ]);
  assert.equal(foundation.status, 1, foundation.stdout + foundation.stderr);
  const checked = JSON.parse(foundation.stdout);
  for (const [fixture, rule, count] of foundationFixtures) {
    const result = checked.find((row) => row.filePath === join(scratch, fixture));
    assert.equal(result?.errorCount, count, foundation.stdout);
    assert.ok(
      result.messages.every((message) => message.ruleId === rule),
      foundation.stdout,
    );
    console.log(`PASS ${fixture}: expected ${rule} rejection (${count}).`);
  }
  for (const name of ['good-token.ts', 'good-aliased-tokens.ts', 'hash-private.ts']) {
    assert.deepEqual(
      checked.find((row) => row.filePath === join(scratch, 'tools/lint-control', name))?.messages,
      [],
      foundation.stdout,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
