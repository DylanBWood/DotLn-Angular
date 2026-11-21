import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import { model } from './godel-numbering.model';
import {
  type AlphabetSymbol,
  decodeCode,
  encodeWord,
  godelNumberingRun,
  joinCodes,
  readParameters,
} from './godel-numbering.simulation';

const record = await loadModelStudy('geb1:228', 'relations');
const parameters = record.example.parameters;

it('encodes both words and joins their codes as the record describes', () => {
  expect(parameters).toEqual({ leftWord: 'L', rightWord: 'R', probeCode: 3 });
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);

  const run = godelNumberingRun(readParameters(parameters));
  expect(run.leftCode).toBe(1n);
  expect(run.rightCode).toBe(2n);
  expect(run.joined).toEqual({ code: 5n, rightPlaces: 1, multiplier: 3n });
  expect(run.codeFromWords).toBe(5n);
  expect(run.recovered).toEqual(['L', 'R']);
  expect(run.probe).toEqual({ kind: 'zeroDigit', remaining: 3n });
  expect(joinCodes(2n, 1n).code).toBe(7n);
});

it('handles empty words, large exact codes and values outside the image', () => {
  const empty = model({ ...parameters, probeCode: 0 }, studyTranslate);
  expect(empty.relations.nodes.find((node) => node.id === 'probeWord')?.label).toBe(
    'the empty word',
  );
  expect(encodeWord([])).toBe(0n);
  expect(decodeCode(0n)).toEqual({ kind: 'word', word: [] });
  expect(joinCodes(0n, 5n).code).toBe(5n);
  expect(joinCodes(5n, 0n)).toEqual({ code: 5n, rightPlaces: 0, multiplier: 1n });
  expect(decodeCode(-1n)).toEqual({ kind: 'negative' });
  expect(decodeCode(10n)).toEqual({ kind: 'zeroDigit', remaining: 3n });
  expect(() => joinCodes(3n, 5n)).toThrow('codes in the image');
  expect(() => joinCodes(5n, 3n)).toThrow('codes in the image');
  expect(() => readParameters({ ...parameters, leftWord: 'LX' })).toThrow('outside the alphabet');
  expect(() => readParameters({ ...parameters, probeCode: 1.5 })).toThrow('safe integer');

  const word = Array<AlphabetSymbol>(40).fill('R');
  const code = 3n ** 40n - 1n;
  expect(encodeWord(word)).toBe(code);
  expect(decodeCode(code)).toEqual({ kind: 'word', word });
  expect(joinCodes(code, 2n).code).toBe(3n ** 41n - 1n);
});

it('shows the results of both routes and the rejected candidate in English', () => {
  const { relations, moments } = model(parameters, studyTranslate);
  expect(relations.edges).toContainEqual(
    expect.objectContaining({
      from: 'codePair',
      to: 'code',
      label: 'combine to give',
    }),
  );
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'Words L and R',
    'Codes 1 and 2',
    'word LR',
    'code 5',
    'Candidate 3',
  ]);
  expect(relations.frames[1].note).toBe(
    'The number of base-three places on the right is 1. The join is 1 × 3 + 2 = 5.',
  );
  expect(relations.frames[3].note).toBe(
    'Encoding the joined word gives 5. Joining the codes gives 5.',
  );
  expect(relations.frames[4].values['focus']).toBe('code 5 decodes to word LR');
  expect(moments).toContainEqual({ label: 'Test a candidate', step: 5 });

  const candidate = relations.frames[5];
  expect(candidate.focus).toEqual({ node: 'probe' });
  expect(fillValues(record.visual.textEquivalent, candidate.values)).toBe(
    'Candidate 3. The numeral 10 in base three has a zero digit. Dividing 3 by three exposes that remainder, so the candidate is outside the image.',
  );
});

it('draws new results and adds a decoding edge when the candidate is in the image', () => {
  const { relations } = model(
    { ...parameters, leftWord: 'RL', rightWord: 'LR', probeCode: 7 },
    studyTranslate,
  );
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'Words RL and LR',
    'Codes 7 and 5',
    'word RLLR',
    'code 68',
    'Candidate 7',
    'word RL',
  ]);
  expect(relations.frames[1].note).toBe(
    'The number of base-three places on the right is 2. The join is 7 × 9 + 5 = 68.',
  );
  expect(relations.frames[5].focus).toEqual({ relation: 'decodeProbe' });
  expect(relations.frames[5].note).toBe('The candidate decodes to RL and belongs to the image.');
});
