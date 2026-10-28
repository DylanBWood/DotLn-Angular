import { TestBed } from '@angular/core/testing';

import { CatalogToken } from '@dotln-angular/catalog';
import { catalogFixture } from '@dotln-angular/catalog/testing';

import { provideToolsFacadeTestKit } from '../../../testing/src';
import { ToolsFacade } from './tools.facade';

it('calculates the selected moment only while its explanation is open', async () => {
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: 'aifg-a:112' }]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('aifg-a:112');
  expect(facade.vm().study?.currentCalculation).toBeNull();
  facade.expandStudy('algorithm', true);
  expect(facade.vm().study?.currentCalculation?.motion).toBe('braking');
  facade.open('aifg-a:112');
  expect(facade.vm().study?.currentCalculation?.motion).toBe('braking');
  facade.open('missing:99');
  expect(facade.vm().study?.currentCalculation?.motion).toBe('braking');
  facade.scrubStudy(0);
  expect(facade.vm().study?.currentCalculation?.values['nextPosition']).toBe('0.12');
  facade.scrubStudy(240);
  expect(facade.vm().study?.currentCalculation?.settled).toBe(true);
  facade.expandStudy('algorithm', false);
  facade.scrubStudy(40);
  expect(facade.vm().study?.currentCalculation).toBeNull();
  facade.expandStudy('algorithm', true);
  expect(facade.vm().study?.currentCalculation?.step).toBe(40);
});

it('opens the shelf, searches full definitions, applies result facets and persists readings', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().shelf.map((work) => work.work)).toEqual(['aifg', 'poeaa', 'geb']);
  expect(facade.vm().selected).toBeNull();
  facade.chooseWork('poeaa');
  expect(facade.vm().contents[0].count).toBe(1);
  facade.search('transaction');
  expect(facade.vm().rows.map((tool) => tool.id)).toEqual(['sample:2']);
  facade.filter('status', 'typed');
  expect(facade.vm().total).toBe(0);
  facade.filter('status', 'invalid');
  expect(facade.vm().filters.status).toBe('typed');
  facade.reset();
  facade.open('sample:2');
  expect(facade.vm().selected?.definition).toContain('transaction');
  expect(facade.vm().query).toBe('');
  TestBed.tick();
  expect(kit.storage.values.get('dotln-angular.tools')).toContain('sample:2');
});

it('derives the braking comparison on expansion and reuses it through unrelated interactions', async () => {
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: 'aifg-a:112' }]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('aifg-a:112');
  expect(facade.vm().study?.limitExample).toBeNull();
  facade.expandStudy('limits', true);
  const comparison = facade.vm().study?.limitExample;
  expect(comparison?.values['overshoot']).toBe('3.93');
  facade.scrubStudy(40);
  facade.expandStudy('reactive', true);
  expect(facade.vm().study?.limitExample).toBe(comparison);
  facade.expandStudy('limits', false);
  expect(facade.vm().study?.limitExample).toBeNull();
  facade.expandStudy('limits', true);
  expect(facade.vm().study?.limitExample).toEqual(comparison);
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
  expect(facade.vm().shelf).toEqual([]);
  fail = false;
  facade.retry();
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().failed).toBe(false);
});

it('bounds result pagination and keeps only ten distinct readings across works', async () => {
  const tools = Array.from({ length: 61 }, (_, index) => ({
    ...catalogFixture[0],
    id: `sample:${index + 1}` as const,
  }));
  const kit = provideToolsFacadeTestKit(tools);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(61));
  facade.search('flock');
  expect(facade.vm().rows).toHaveLength(30);
  facade.page(2);
  expect(facade.vm().rows).toHaveLength(1);
  facade.page(-1);
  facade.page(100);
  expect(facade.vm().page).toBe(2);
  for (const tool of tools.slice(0, 12)) facade.open(tool.id);
  expect(facade.vm().history.map((tool) => tool.id)).toEqual([
    'sample:12',
    'sample:11',
    'sample:10',
    'sample:9',
    'sample:8',
    'sample:7',
    'sample:6',
    'sample:5',
    'sample:4',
    'sample:3',
  ]);
  facade.open('sample:8');
  expect(facade.vm().history).toHaveLength(10);
  expect(facade.vm().history[0].id).toBe('sample:8');
});
