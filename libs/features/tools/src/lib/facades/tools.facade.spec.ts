import { TestBed } from '@angular/core/testing';

import { CatalogToken } from '@dotln-angular/catalog';
import { catalogFixture } from '@dotln-angular/catalog/testing';

import { provideToolsFacadeTestKit } from '../../../testing/src';
import { ToolsFacade } from './tools.facade';

it('derives work options from the loader result and retains them while filtering', async () => {
  const tools = [
    ...catalogFixture,
    { ...catalogFixture[0], id: 'new-work:1' as const, work: 'artofwar' as const },
  ];
  const kit = provideToolsFacadeTestKit(tools);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(4));
  expect(facade.options().work).toEqual(['aifg', 'poeaa', 'geb', 'artofwar']);
  facade.filter('work', 'artofwar');
  expect(facade.vm().rows.map((tool) => tool.id)).toEqual(['new-work:1']);
  expect(facade.options().work).toEqual(['aifg', 'poeaa', 'geb', 'artofwar']);
});

it('loads, intersects filters, persists selection and rejects invalid filter intents', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  facade.filter('work', 'poeaa');
  expect(facade.vm().rows.map((tool) => tool.id)).toEqual(['sample:2']);
  facade.select('sample:2');
  expect(facade.vm().selected?.status).toBe('untyped');
  facade.filter('work', 'invalid');
  expect(facade.vm().filters.work).toBe('poeaa');
  TestBed.tick();
  expect(kit.storage.values.get('dotln-angular.catalog')).toContain('sample:2');
  facade.filter('transform', 'steer.blend');
  expect(facade.vm().total).toBe(0);
  expect(facade.vm().selected).toBeNull();
  facade.reset();
  expect(facade.vm().total).toBe(3);
});

it('recovers from a failed loader and never reports failure as an empty success', async () => {
  const kit = provideToolsFacadeTestKit();
  let fail = true;
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      {
        provide: CatalogToken,
        useValue: {
          load: async () => {
            if (fail) throw new Error('Unavailable');
            return catalogFixture;
          },
        },
      },
    ],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().failed).toBe(true));
  expect(facade.vm().rows).toEqual([]);
  fail = false;
  facade.retry();
  await vi.waitFor(() => expect(facade.vm().total).toBe(3));
  expect(facade.vm().failed).toBe(false);
});

it('restores valid UI state, rejects corrupt persisted values and bounds pagination', async () => {
  const tools = Array.from({ length: 61 }, (_, index) => ({
    ...catalogFixture[0],
    id: `sample:${index + 1}` as const,
  }));
  const kit = provideToolsFacadeTestKit(tools);
  kit.storage.values.set(
    'dotln-angular.catalog',
    JSON.stringify({ filters: { work: 'invalid' }, selectedId: 'sample:1' }),
  );
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().total).toBe(61));
  expect(facade.vm().rows).toHaveLength(50);
  facade.page(1);
  expect(facade.vm().rows).toHaveLength(11);
  facade.page(-1);
  facade.page(100);
  expect(facade.vm().page).toBe(1);
  facade.filter('status', 'untyped');
  expect(facade.vm().page).toBe(0);
  expect(facade.vm().total).toBe(0);
});
