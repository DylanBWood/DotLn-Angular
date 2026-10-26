// Copyright 2017-2019 Vladimír Gorej and the Ramda Adjunct contributors — BSD-3-Clause.
// ported from https://github.com/char0n/ramda-adjunct/blob/v6.1.0/test/isNonEmptyString.js
import { __ } from 'ramda';
import { isNonEmptyString as upstreamIsNonEmptyString } from 'ramda-adjunct';
import { expectTypeOf } from 'vitest';

import { R, RA } from '../../public_api';

describe('RA.isNonEmptyString through the house namespace', () => {
  it('accepts a nonempty primitive string', () => {
    expect(RA.isNonEmptyString('home')).toBe(true);
  });

  it.each([
    '',
    Object('42'),
    Object(''),
    String.prototype,
    [],
    [42],
    {},
    null,
    undefined,
    17,
    true,
    false,
  ])('refuses an empty string or nonstring value %#', (value) =>
    expect(RA.isNonEmptyString(value)).toBe(false),
  );

  it('supports the upstream placeholder call', () => {
    expect(RA.isNonEmptyString(__)('home')).toBe(true);
    expect(RA.isNonEmptyString(__)('')).toBe(false);
    expect(RA.isNonEmptyString()('home')).toBe(true);
    expect(RA.isNonEmptyString).toBe(upstreamIsNonEmptyString);
  });

  it('does not narrow unknown placeholders to strings', () => {
    const value: unknown = __;
    const result = RA.isNonEmptyString(value);
    expectTypeOf(result).toEqualTypeOf<boolean | typeof RA.isNonEmptyString>();
    if (result) {
      expectTypeOf(value).toEqualTypeOf<unknown>();
    }
    expect(typeof result).toBe('function');
    const retained = R.filter((item: unknown) => Boolean(RA.isNonEmptyString(item)))([__, 'home']);
    expectTypeOf(retained).toEqualTypeOf<unknown[]>();
    expect(retained).toEqual([__, 'home']);
  });

  it('narrows the true branch without excluding empty strings from the false branch', () => {
    const inspect = (value: string | number) => {
      if (RA.isNonEmptyString(value)) {
        expectTypeOf(value).toEqualTypeOf<RA.NonEmptyString>();
        return value.toUpperCase();
      }
      expectTypeOf(value).toEqualTypeOf<string | number>();
      return value;
    };
    expect(inspect('home')).toBe('HOME');
    expect(inspect('')).toBe('');
    expect(inspect(17)).toBe(17);
  });
});
