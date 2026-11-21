import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './sentence-g';

const record = await loadModelStudy('geb2:138', 'relations');

it('follows G from proof codes to unprovability in PA and truth in the natural numbers', () => {
  expect(record.example.parameters).toEqual({ theory: 'PA' });

  const { relations, moments } = model(record.example.parameters, studyTranslate);
  expect(relations.edges).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        from: 'pa-proofs',
        to: 'proof-codes',
        label: 'are represented by',
      }),
      expect.objectContaining({ from: 'formula-b', to: 'sentence-g', label: 'instantiates to' }),
      expect.objectContaining({
        from: 'consistency',
        to: 'sentence-g',
        label: 'rules out a proof of',
      }),
      expect.objectContaining({
        from: 'natural-numbers',
        to: 'sentence-g',
        label: 'give a truth value to',
      }),
    ]),
  );
  expect(relations.frames.map(({ focus }) => focus)).toEqual([
    { relation: 'encode' },
    { relation: 'describe' },
    { relation: 'substitute' },
    { relation: 'rule-out' },
    { relation: 'interpret' },
  ]);
  expect(moments).toContainEqual({ label: 'Read G as arithmetic', step: 4 });
  expect(fillValues(record.visual.textEquivalent, relations.frames[4].values)).toBe(
    'Natural numbers give a truth value to G for PA. If PA is consistent, no natural number codes a PA proof of G. ' +
      'With the standard encoding, G is true in the natural numbers.',
  );
});
