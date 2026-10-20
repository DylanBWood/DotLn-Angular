// Copyright (c) 2013-2025 Scott Sauyet and Michael Hurley — MIT.
// ported from https://github.com/ramda/ramda/blob/v0.32.0/test/map.js
import { expectTypeOf } from 'vitest';
import { R } from '../../public_api';

describe('R.map through the house namespace', () => {
  it('supports both direct and curried mapping', () => {
    const double = (value: number) => value * 2;
    expect(R.map(double, [1, 2, 3, 4])).toEqual([2, 4, 6, 8]);
    const result = R.map((value: number) => value - 1)(R.map(double)([10, 20, 30]));
    expectTypeOf(result).toEqualTypeOf<number[]>();
    expect(result).toEqual([19, 39, 59]);
  });
});
