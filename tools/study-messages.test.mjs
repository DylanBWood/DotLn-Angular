import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { presentationProblems } from './scripts/catalog/check-study-messages.mjs';
import { englishMessages, studyContent } from './scripts/catalog/study-messages.mjs';
import { studyProblems } from './scripts/catalog/check-studies.mjs';
import { workspaceRoot } from './scripts/source-files.mjs';

test('the presentation check rejects literal labels, indirect prose, and conditional templates', () => {
  for (const source of [
    "export const frame = { label: 'Courier' };",
    "const name = 'Courier'; export const frame = { label: name };",
    "const name = active ? 'Moving' : 'Still'; export const frame = { label: name };",
    'const frame = { note: `At ${seconds} seconds` };',
    "const frame = { worked: { lines: ['A calculation'] } };",
  ])
    assert.ok(presentationProblems(source).problems.length, source);
  assert.deepEqual(
    presentationProblems(`
    const frame = { id: 'courier', label: t('studyAifg.flee.model.courier'),
      note: t('studyAifg.flee.model.time', { seconds }),
      worked: { lines: [t('studyAifg.flee.model.calculation', { position })] } };
    const example = { valueMessages: { a: { key: 'studyRxjs.map.model.value', params: { symbol: 'a' } } } };
    const flow = { held: { 6: { operator: ['3'] } } };
  `).problems,
    [],
  );
});

test('message lookup fails closed and current study checks inspect translated prose', () => {
  const record = JSON.parse(readFileSync('libs/shared/catalog/src/studies/aifg/flee.json', 'utf8'));
  const message = englishMessages(workspaceRoot);
  const prose = studyContent(record, message);
  assert.equal(prose.example.name, message(record.example.name));
  assert.deepEqual(prose.example.parameters, record.example.parameters);
  assert.deepEqual(prose.pseudocode.executable, record.pseudocode.executable);
  const tools = new Map(
    [record.id, ...record.nearby.map(({ id }) => id)].map((id) => [id, { id, work: record.work }]),
  );
  assert.deepEqual(studyProblems(record, tools), []);
  const missing = {
    ...record,
    intuition: { ...record.intuition, text: 'studyAifg.flee.record.missing' },
  };
  assert.match(studyProblems(missing, tools).join(), /missing study message/);
  const literal = { ...record, intuition: { ...record.intuition, text: 'Untranslated prose' } };
  assert.match(studyProblems(literal, tools).join(), /schema pattern/);
  const changed = (key) => (key === record.pseudocode.ordinary ? 'one block only' : message(key));
  assert.match(
    studyProblems(record, tools, workspaceRoot, changed).join(),
    /mechanism steps against/,
  );
});
