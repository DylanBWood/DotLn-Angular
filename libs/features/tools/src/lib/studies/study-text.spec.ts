import { codeBlocks, fillValues, placeholdersIn } from './study-text';

it('fills the values a moment supplies and leaves any other braces as written', () => {
  expect(fillValues('{distance} units; {missing}', { distance: '4.0' })).toBe(
    '4.0 units; {missing}',
  );
  expect(fillValues('return { position: target }', { position: '1' })).toBe(
    'return { position: target }',
  );
  expect(placeholdersIn('At {seconds} s, {speed}.')).toEqual(['seconds', 'speed']);
});

it('splits pseudocode into its blank-line-separated blocks', () => {
  expect(codeBlocks('a\n  b\n\n\nc\n')).toEqual(['a\n  b', 'c']);
});
