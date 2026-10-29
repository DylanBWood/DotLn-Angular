import { expectTypeOf } from 'vitest';

import type { Tool } from '@dotln-angular/models';
import { TransformKind } from '@dotln-angular/models';
import { R } from '@dotln-angular/utils';

import { catalogFixture } from '../../testing/src';
import {
  availableCatalogOptions,
  byKind,
  bySceneType,
  byStatus,
  byTransform,
  byWork,
  emptyCatalogFilters,
  filterCatalog,
  isCatalogFilters,
} from './filters';

it('composes typed readonly-input selectors and derives only loaded work options', () => {
  const selected = R.pipe(byWork('aifg'), byStatus('typed'))(catalogFixture);
  expectTypeOf(selected).toEqualTypeOf<Tool[]>();
  expectTypeOf<Parameters<ReturnType<typeof byWork>>[0]>().toEqualTypeOf<readonly Tool[]>();
  expect(availableCatalogOptions([...catalogFixture, catalogFixture[0]]).work).toEqual([
    'aifg',
    'poeaa',
    'geb',
  ]);
  expect(availableCatalogOptions([]).work).toEqual([]);
});

it('filters each face without exposing an untyped or background row as executable', () => {
  expect(byWork('aifg')(catalogFixture).map((tool) => tool.id)).toEqual(['sample:1']);
  expect(byKind('rule')(catalogFixture).map((tool) => tool.id)).toEqual(['sample:2']);
  expect(byStatus('background')(catalogFixture).map((tool) => tool.id)).toEqual(['sample:3']);
  expect(bySceneType('channels')(catalogFixture).map((tool) => tool.id)).toEqual(['sample:2']);
  expect(byTransform(TransformKind.SteerBlend)(catalogFixture).map((tool) => tool.id)).toEqual([
    'sample:1',
  ]);
  expect(
    filterCatalog(catalogFixture, {
      ...emptyCatalogFilters,
      work: 'poeaa',
      transform: TransformKind.SteerBlend,
    }),
  ).toEqual([]);
  expect(catalogFixture).toHaveLength(3);
});

it('refuses corrupt persisted filters and accepts only the complete closed shape', () => {
  expect(isCatalogFilters(emptyCatalogFilters)).toBe(true);
  expect(isCatalogFilters({ ...emptyCatalogFilters, work: 'aifg' })).toBe(true);
  expect(isCatalogFilters({ ...emptyCatalogFilters, transform: 'execute-anything' })).toBe(false);
  expect(isCatalogFilters({ ...emptyCatalogFilters, extra: true })).toBe(false);
  expect(isCatalogFilters({ work: 'aifg' })).toBe(false);
  expect(isCatalogFilters(null)).toBe(false);
});

it.each(['', ' ', 0, Object('aifg'), {}, { '@@functional/placeholder': true }])(
  'refuses a nonmember persisted work value %#',
  (work) => expect(isCatalogFilters({ ...emptyCatalogFilters, work })).toBe(false),
);
