import { wrapText } from './drawn-text';

it('wraps a name at its spaces and leaves a long word whole', () => {
  expect(wrapText('Consistency reviewer of the order', 12)).toEqual([
    'Consistency',
    'reviewer of',
    'the order',
  ]);
  expect(wrapText('Aggregator', 4)).toEqual(['Aggregator']);
  expect(wrapText('', 10)).toEqual([]);
});
