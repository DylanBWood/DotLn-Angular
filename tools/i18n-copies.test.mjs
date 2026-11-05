import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

// Component tests render with this copy; it must say exactly what the app says.
test('the Tools testing translations equal the app catalog’s tools block', () => {
  const app = read('../apps/dotln/public/i18n/en.json');
  const copy = read('../libs/features/tools/testing/src/lib/tools-en.json');
  assert.deepEqual(Object.keys(copy), ['tools']);
  assert.deepEqual(copy.tools, app.tools);
});

test('the Scene testing translations equal the app catalog’s scene block', () => {
  const app = read('../apps/dotln/public/i18n/en.json');
  const copy = read('../libs/features/scene/testing/src/lib/scene-en.json');
  assert.deepEqual(Object.keys(copy), ['scene']);
  assert.deepEqual(copy.scene, app.scene);
});

test('model specs use exactly the lazy study message catalogs served by the app', () => {
  const root = new URL('../apps/dotln/public/i18n/', import.meta.url);
  const catalogs = Object.fromEntries(
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('study'))
      .map(({ name }) => [name, read(`../apps/dotln/public/i18n/${name}/en.json`)]),
  );
  assert.deepEqual(read('../libs/features/tools/testing/src/lib/study-en.json'), catalogs);
});
