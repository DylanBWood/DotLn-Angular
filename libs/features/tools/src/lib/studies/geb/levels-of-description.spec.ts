import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './levels-of-description';

const record = await loadModelStudy('geb2:8', 'relations');

it('reads the guide revision from the attempted edit to the planning decision', () => {
  const { relations } = model(record.example.parameters, studyTranslate);
  expect(relations.specimen?.samples).toEqual(['ok 1 - both guide links have a target']);
  expect(record.example.description).toContain('45-minute');
  expect(record.example.description.match(/Guide links/g)?.length).toBeGreaterThan(1);
  expect(record.example.description.match(/Guide revision/g)?.length).toBeGreaterThan(1);
  expect(record.example.description.match(/Tutorial release/g)?.length).toBeGreaterThan(1);
  expect(record.example.parameters).toEqual({ windowMinutes: 45 });
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'Hook refusal',
    'Gate row',
    'Work order',
    'Planning pass',
  ]);
  expect(relations.edges.map(({ from, to, label }) => ({ from, to, label }))).toEqual([
    { from: 'hook', to: 'gate', label: 'shares a run with' },
    { from: 'gate', to: 'order', label: 'supplies evidence for' },
    { from: 'order', to: 'pass', label: 'belongs to' },
  ]);
  const readings = relations.frames.map(({ values }) =>
    fillValues(record.visual.textEquivalent, values),
  );
  expect(readings).toHaveLength(4);
  expect(readings[0]).toContain('Hook refusal. Did the extra edit get saved?');
  expect(readings[1]).toContain('Gate row. Did the links work?');
  expect(readings[2]).toContain('Work order. What did the team agree to deliver?');
  expect(readings[3]).toContain('Planning pass. Why do the guide first?');
});
