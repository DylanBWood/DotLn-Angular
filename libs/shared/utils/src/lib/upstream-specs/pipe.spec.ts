// Copyright (c) 2013-2025 Scott Sauyet and Michael Hurley — MIT.
// ported from https://github.com/ramda/ramda/blob/v0.32.0/test/pipe.js
import { expectTypeOf } from 'vitest';
import { R, RA } from '../../public_api';
import { provideUtilsTestKit } from '../../../testing/src';

describe('R.pipe through the house namespace', () => {
  it('composes from left to right and preserves curried collection types', () => {
    const parseAndScale = R.pipe(
      (text: string, radix: number) => Number.parseInt(text, radix),
      (factor) => (values: readonly number[]) => values.map((value) => value * factor),
    );
    expect(parseAndScale('10', 2)([1, 2, 3])).toEqual([2, 4, 6]);
    const { words, nonEmptyWords } = provideUtilsTestKit();
    const clean = R.pipe(
      R.map((word: string) => word),
      R.filter(RA.isNonEmptyString),
    );
    const result = clean(words);
    expectTypeOf(result).toEqualTypeOf<RA.NonEmptyString[]>();
    expect(result).toEqual(nonEmptyWords);
  });
});
