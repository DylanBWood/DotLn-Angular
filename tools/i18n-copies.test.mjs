import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

// Component tests render with this copy; it must say exactly what the app says.
test('the Tools testing translations equal the app catalog’s tools block', () => {
  const app = read('../apps/dotln/public/i18n/en.json');
  const copy = read('../libs/features/tools/testing/src/lib/tools-en.json');
  assert.deepEqual(Object.keys(copy), ['tools']);
  assert.deepEqual(copy.tools, app.tools);
});
