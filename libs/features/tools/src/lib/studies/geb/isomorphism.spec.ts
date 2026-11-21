import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './isomorphism';

const record = await loadModelStudy('geb1:65', 'relations');

it('shows two routes to the same code and a unique return to LR', () => {
  expect(record.example.parameters).toEqual({ leftWord: 'L', rightWord: 'R', probeCode: 3 });

  const { relations, moments } = model(record.example.parameters, studyTranslate);
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'L then R',
    '1 then 2',
    'LR',
    '5',
    'Candidate 3',
  ]);
  expect(relations.edges).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ from: 'wordPair', to: 'word', label: 'join to form' }),
      expect.objectContaining({ from: 'word', to: 'code', label: 'encodes as' }),
      expect.objectContaining({ from: 'wordPair', to: 'codePair', label: 'encode as' }),
      expect.objectContaining({ from: 'codePair', to: 'code', label: 'combine to give' }),
      expect.objectContaining({ from: 'code', to: 'word', label: 'decodes to' }),
    ]),
  );
  expect(moments).toContainEqual({ label: 'Decode the result', step: 4 });

  const boundary = relations.frames[5];
  expect(boundary.focus).toEqual({ node: 'probe' });
  expect(relations.edges.some(({ from, to }) => from === 'probe' || to === 'probe')).toBe(false);
  expect(fillValues(record.visual.textEquivalent, boundary.values)).toBe(
    'Candidate 3. In base three, 3 is written 10. The digit 0 has no letter, so this positive number lies outside the image.',
  );
});
