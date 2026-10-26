import { expectTypeOf } from 'vitest';

import type {
  CatalogFilters,
  Tool,
  ToolFaces,
  ToolMap,
  TypedTransform,
  UntypedTransform,
} from './toolbox';
import { TransformKind } from './toolbox';

it('narrows transform and provenance contracts without permitting mutable faces', () => {
  expectTypeOf<Extract<Tool, { status: 'typed' }>['faces']>().toEqualTypeOf<
    ToolFaces<TypedTransform>
  >();
  expectTypeOf<Extract<Tool, { status: 'untyped' }>['faces']>().toEqualTypeOf<
    ToolFaces<UntypedTransform>
  >();
  expectTypeOf<Extract<Tool, { status: 'background' }>['faces']>().toEqualTypeOf<undefined>();
  expectTypeOf<Extract<Tool, { provenance: 'public-work' }>['map']>().toEqualTypeOf<null>();
  expectTypeOf<Extract<Tool, { provenance: 'map' }>['map']>().toEqualTypeOf<ToolMap>();
  expectTypeOf<CatalogFilters['transform']>().toEqualTypeOf<TransformKind | null>();
  expect(Object.values(TransformKind)).not.toContain('untyped');
});
