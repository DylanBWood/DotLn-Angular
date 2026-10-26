import { expectTypeOf } from 'vitest';

import { R, RA } from '../public_api';

it('exposes only the functional helpers used by production consumers, at runtime and in types', () => {
  expect(Object.keys(R).sort()).toEqual(['filter', 'map', 'pipe']);
  expect(Object.keys(RA)).toEqual(['isNonEmptyString']);
  expectTypeOf<keyof typeof R>().toEqualTypeOf<'filter' | 'map' | 'pipe'>();
  expectTypeOf<keyof typeof RA>().toEqualTypeOf<'isNonEmptyString'>();
});
