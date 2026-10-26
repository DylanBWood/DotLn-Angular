// Copyright (c) 2013-2025 Scott Sauyet and Michael Hurley — MIT.
// ported from https://github.com/ramda/ramda/blob/v0.32.0/test/filter.js
import { __, filter as upstreamFilter, into } from 'ramda';
import { expectTypeOf } from 'vitest';

import { R } from '../../public_api';

describe('R.filter through the house namespace', () => {
  it('keeps matching values and handles an empty result', () => {
    const evens = R.filter((value: number) => value % 2 === 0);
    const result = evens([1, 2, 3, 4, 5]);
    expectTypeOf(result).toEqualTypeOf<number[]>();
    expectTypeOf<Parameters<typeof evens>[0]>().toEqualTypeOf<readonly number[]>();
    expect(result).toEqual([2, 4]);
    expect(R.filter((value: number) => value > 100)([1, 9, 99])).toEqual([]);
    expect(evens([])).toEqual([]);
  });

  it('returns a variable-length array when a readonly tuple is filtered', () => {
    const input = [1, 2, 3] as const;
    const result = R.filter((value: number) => value % 2 === 0)(input);
    expectTypeOf(result).toEqualTypeOf<number[]>();
    expect(result).toEqual([2]);
    expect(R.filter((value: number) => value % 2 === 0, input)).toEqual([2]);
  });

  it('makes dictionary keys optional because filtering can remove them', () => {
    const positive = (value: number) => value > 0;
    const input = { first: 1, second: 0, third: -1 };
    const result = R.filter(positive)(input);
    expectTypeOf(result).toEqualTypeOf<Partial<typeof input>>();
    expect(result).toEqual({ first: 1 });
    expect(R.filter(positive, input)).toEqual(result);
    expect(R.filter(positive, {})).toEqual({});
    const placeholderResult = R.filter(__, input)(positive);
    expectTypeOf(placeholderResult).toEqualTypeOf<Partial<typeof input>>();
    expect(placeholderResult).toEqual(result);
  });

  it('narrows mixed collections in direct, curried and composed calls', () => {
    const isString = (value: string | number): value is string => typeof value === 'string';
    const mixed: (string | number)[] = ['home', 42, 'settings'];
    const direct = R.filter(isString, mixed);
    const curried = R.filter(isString)(mixed);
    const composed = R.pipe(
      R.filter(isString),
      R.map((word: string) => word.length),
    );
    expectTypeOf(direct).toEqualTypeOf<string[]>();
    expectTypeOf(curried).toEqualTypeOf<string[]>();
    expectTypeOf(composed(mixed)).toEqualTypeOf<number[]>();
    expect(direct).toEqual(['home', 'settings']);
    expect(curried).toEqual(direct);
    expect(composed(mixed)).toEqual([4, 8]);
  });

  it('retains map filtering and placeholder currying', () => {
    const positive = (value: number) => value > 0;
    const input = new Map([
      ['first', 1],
      ['second', 0],
      ['third', -1],
    ]);
    const result = R.filter(positive, input);
    expectTypeOf(result).toEqualTypeOf<Map<string, number>>();
    expect(result).toEqual(new Map([['first', 1]]));
    expect(R.filter(positive)(input)).toEqual(result);
    const placeholderResult = R.filter(__, input)(positive);
    expectTypeOf(placeholderResult).toEqualTypeOf<Map<string, number>>();
    expect(placeholderResult).toEqual(result);
    expect(R.filter(__, [1, 0, -1])(positive)).toEqual([1]);
    expect(R.filter(positive, __)([1, 0, -1])).toEqual([1]);
    expect(R.filter(__, __)(positive)([1, 0, -1])).toEqual([1]);
  });

  it('retains custom dispatch, fantasy-land dispatch and transducer behavior', () => {
    const positive = (value: number) => value > 0;
    const dispatch = { filter: (predicate: (value: number) => boolean) => predicate(3) };
    const fantasy = {
      'fantasy-land/filter': (predicate: (value: number) => boolean) => ({
        isNothing: !predicate(-1),
      }),
    };
    expect(R.filter(positive, dispatch)).toBe(true);
    expect(R.filter(__, dispatch)(positive)).toBe(true);
    expect(R.filter(positive, fantasy)).toEqual({ isNothing: true });
    expect(R.filter(__, fantasy)(positive)).toEqual({ isNothing: true });
    expect(into([], R.filter(positive), [1, 0, -1])).toEqual([1]);
    expect(R.filter).toBe(upstreamFilter);
  });
});
