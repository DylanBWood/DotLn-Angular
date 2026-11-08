import { breakWord, wrapText } from './drawn-text';

it('wraps a name at its spaces and leaves a long word whole', () => {
  expect(wrapText('Consistency reviewer of the order', 12)).toEqual([
    'Consistency',
    'reviewer of',
    'the order',
  ]);
  expect(wrapText('Aggregator', 4)).toEqual(['Aggregator']);
  expect(wrapText('', 10)).toEqual([]);
});

it('breaks a word too long for its line into hyphenated parts, the longer parts first', () => {
  expect(breakWord('Announced', 6)).toEqual(['Annou-', 'nced']);
  expect(breakWord('Refused', 6)).toEqual(['Refu-', 'sed']);
  expect(breakWord('Unchanged', 8)).toEqual(['Uncha-', 'nged']);
  expect(breakWord('Stored', 6)).toEqual(['Stored']);
  // A width with no room for a letter beside its hyphen leaves the word whole.
  expect(breakWord('Draft', 1)).toEqual(['Draft']);
});

it('breaks every word into the fewest parts that fit, losing no letter', () => {
  const word = 'Abcdefghijklmnopqrst';
  for (let length = 2; length <= word.length; length++)
    for (let width = 2; width < length; width++) {
      const parts = breakWord(word.slice(0, length), width);
      const where = `${length} letters in ${width}`;
      expect(parts.map((part) => part.replace(/-$/, '')).join(''), where).toBe(
        word.slice(0, length),
      );
      expect(
        parts.every((part) => part.length >= 1 && part.length <= width),
        where,
      ).toBe(true);
      expect(
        parts.slice(0, -1).every((part) => part.endsWith('-')),
        where,
      ).toBe(true);
      expect(parts, where).toHaveLength(Math.ceil((length - 1) / (width - 1)));
    }
});
