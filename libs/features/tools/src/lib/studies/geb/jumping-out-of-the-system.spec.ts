import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './jumping-out-of-the-system';

const record = await loadModelStudy('geb1:51', 'relations');

it('returns from the invariant to the unreachable target MU', () => {
  expect(record.example.parameters).toEqual({ start: 'MI', target: 'MU', modulus: 3 });

  const { relations, moments } = model(record.example.parameters, studyTranslate);
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'MI',
    'MIU',
    'MU',
    'Nonzero remainder',
  ]);
  expect(relations.edges.map(({ from, to, label }) => ({ from, to, label }))).toEqual([
    { from: 'start', to: 'trial', label: 'can produce' },
    { from: 'trial', to: 'invariant', label: 'suggests looking for a' },
    { from: 'invariant', to: 'target', label: 'rules out reaching' },
  ]);

  const terminal = relations.frames[3];
  expect(relations.frames[2].focus).toEqual({ node: 'invariant' });
  expect(terminal.focus).toEqual({ relation: 'return' });
  expect(moments).toContainEqual({ label: 'Return to MU', step: 3 });
  expect(fillValues(record.visual.textEquivalent, terminal.values)).toBe(
    'Nonzero remainder rules out reaching MU. MU contains zero I symbols. ' +
      'Starting at MI gives remainder 1, so MU is unreachable from MI by these rules.',
  );
});
