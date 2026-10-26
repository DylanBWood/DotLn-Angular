import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeBundle, checkBundle, staticClosure } from './scripts/check-bundle.mjs';

const menu = 'libs/shared/ui/src/lib/wrappers/menu/menu.ts';
const output = (entryPoint, inputs = {}, imports = []) => ({
  entryPoint,
  bytes: 100,
  inputs: Object.fromEntries(
    Object.entries(inputs).map(([name, bytes]) => [name, { bytesInOutput: bytes }]),
  ),
  imports,
});
const fixture = () => ({
  outputs: {
    'main.js': output('apps/dotln/src/main.ts', {}, [
      { path: 'shared.js', kind: 'import-statement' },
      { path: 'tools.js', kind: 'dynamic-import' },
    ]),
    'shared.js': output(undefined, { 'node_modules/@angular/core/index.js': 80 }),
    'tools.js': output('libs/features/tools/src/index.ts', {}, [
      { path: 'menu.js', kind: 'import-statement' },
      { path: 'data.js', kind: 'dynamic-import' },
    ]),
    'menu.js': output(undefined, { [menu]: 60 }, [{ path: 'shared.js', kind: 'import-statement' }]),
    'data.js': output(undefined, { 'libs/shared/catalog/src/data/tools-example.json': 100 }),
  },
});

test('route-only code stays lazy while the menu arrives with its route', () => {
  const result = checkBundle(fixture());
  assert.equal(result.initialBytes, 200);
  assert.deepEqual(result.attributedInputBytes, { '@angular/core': 80 });
  assert.equal(result.menuAvailableWithTools, true);
  const linked = fixture();
  linked.outputs['shared.js'].inputs = {
    '../base/node_modules/@angular/core/index.js': { bytesInOutput: 80 },
  };
  assert.deepEqual(checkBundle(linked).attributedInputBytes, { '@angular/core': 80 });
});

test('transitive menu and catalog data leaks fail even when an output is small', () => {
  for (const path of ['menu.js', 'data.js']) {
    const stats = fixture();
    stats.outputs['shared.js'].imports.push({ path, kind: 'import-statement' });
    assert.throws(() => checkBundle(stats), /Route-only code/);
    assert.equal(analyzeBundle(stats).lazyCodeInInitial.length, 1);
  }
});

test('deferring the menu again, missing metadata and static cycles are handled explicitly', () => {
  const stats = fixture();
  stats.outputs['tools.js'].imports[0].kind = 'dynamic-import';
  assert.throws(() => checkBundle(stats), /no longer loads its menu statically/);
  delete stats.outputs['main.js'];
  assert.throws(() => checkBundle(stats), /one application entry/);
  assert.throws(() => staticClosure(stats.outputs, ['missing.js']), /missing a static output/);
  const cycle = fixture();
  cycle.outputs['shared.js'].imports.push({ path: 'main.js', kind: 'import-statement' });
  assert.equal(checkBundle(cycle).initialBytes, 200);
});
