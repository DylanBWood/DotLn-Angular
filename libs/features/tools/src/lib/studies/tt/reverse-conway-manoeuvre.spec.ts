import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './reverse-conway-manoeuvre';

const record = await loadModelStudy('tt1:138', 'relations');

it('starts from the stock reservation interface and follows it to an ownership and release test', () => {
  const { relations, moments } = model(record.example.parameters, studyTranslate);
  expect(relations.nodes.find(({ id }) => id === 'inventory')).toMatchObject({
    label: 'Inventory',
    x: 92,
  });
  expect(relations.nodes.find(({ id }) => id === 'stock-team')).toMatchObject({
    label: 'Stock team',
    x: 308,
  });
  expect(relations.edges.find(({ id }) => id === 'stock-owner')).toMatchObject({
    from: 'inventory',
    to: 'stock-team',
    label: 'is owned by',
  });
  expect(relations.frames[0].values['focus']).toBe('Order entry reserves stock through Inventory');
  expect(relations.frames[5].focus).toEqual({
    relation: 'reservation-contract',
  });
  expect(relations.frames[5].values['focus']).toBe(
    'Checkout team agrees on the reservation contract with Stock team',
  );
  expect(moments.map(({ label, step }) => [label, step])).toEqual([
    ['Target interfaces', 0],
    ['Assign owners', 2],
    ['Agree contracts', 5],
    ['Pilot a change', 7],
  ]);
  const pilot = relations.frames[7];
  expect(pilot.focus).toEqual({ node: 'stock-team' });
  expect(fillValues(record.visual.textEquivalent, pilot.values)).toBe(
    'Step 7. Stock team. Try one reservation-rule change. Can the Stock team deploy Inventory on its own while checkout still works through the same contract?',
  );
});
