import { TestBed } from '@angular/core/testing';

import { CatalogToken } from '@dotln-angular/catalog';

import { provideToolsHomeFacadeTestKit } from '../../../testing/src';
import { ToolsHomeFacade } from './tools-home.facade';

it('shows the works and their studied counts from the summaries, loading no work', async () => {
  const kit = provideToolsHomeFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsHomeFacade);
  await vi.waitFor(() => expect(facade.vm().works).toHaveLength(3));
  expect(facade.vm().works[0]).toMatchObject({ title: 'AI for Games', count: 1, studied: 1 });
  expect(kit.catalog.calls).toEqual([]);
  expect(facade.vm().last).toBeNull();
});

it('names the last reading from the stored history', async () => {
  const kit = provideToolsHomeFacadeTestKit();
  kit.storage.values.set(
    'dotln-angular.tools',
    JSON.stringify({
      version: 1,
      work: 'aifg',
      chapter: null,
      section: null,
      selectedId: null,
      history: ['aifg-a:112', 'aifg-a:110'],
      lastTitle: 'Arrive',
    }),
  );
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsHomeFacade);
  expect(facade.vm().last).toEqual({ id: 'aifg-a:112', title: 'Arrive' });
});

it('makes a failed summary visible and recovers on retry', async () => {
  const kit = provideToolsHomeFacadeTestKit();
  let fail = true;
  const summary = async () => {
    if (fail) throw new Error('Unavailable');
    return kit.catalog.loader.summary();
  };
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      { provide: CatalogToken, useValue: { ...kit.catalog.loader, summary } },
    ],
  });
  const facade = TestBed.inject(ToolsHomeFacade);
  await vi.waitFor(() => expect(facade.vm().failed).toBe(true));
  fail = false;
  facade.retry();
  await vi.waitFor(() => expect(facade.vm().works).toHaveLength(3));
  expect(facade.vm().failed).toBe(false);
});
