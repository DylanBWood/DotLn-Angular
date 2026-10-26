import { TestBed } from '@angular/core/testing';

import { catalogFixture, provideCatalogTokenTestKit } from '../../testing/src';
import { createCatalogLoader } from './catalog-loader';
import { CatalogToken } from './catalog-token';

it('allows an API-shaped provider to replace bundled loading', async () => {
  const kit = provideCatalogTokenTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  expect(await TestBed.inject(CatalogToken).load('poeaa')).toEqual([catalogFixture[1]]);
  expect(kit.calls).toEqual(['poeaa']);
});

it('loads only the requested work, shares pending imports, and retries a failed chunk', async () => {
  let attempts = 0;
  const aifg = vi.fn(async () => {
    if (++attempts === 1) throw new Error('Chunk unavailable');
    return { default: { schema: 'tool-v0', tools: [catalogFixture[0]] } };
  });
  const poeaa = vi.fn(async () => ({ default: { schema: 'tool-v0', tools: [catalogFixture[1]] } }));
  const loader = createCatalogLoader({ aifg: [aifg], poeaa: [poeaa] });
  await expect(loader.load('aifg')).rejects.toThrow('Chunk unavailable');
  const first = loader.load('aifg');
  expect(loader.load('aifg')).toBe(first);
  expect(await first).toEqual([catalogFixture[0]]);
  expect(poeaa).not.toHaveBeenCalled();
  expect(await loader.load()).toHaveLength(2);
  expect(aifg).toHaveBeenCalledTimes(2);
  expect(poeaa).toHaveBeenCalledTimes(1);
});

it('rejects chunks carrying another work or an unsupported schema', async () => {
  const loader = createCatalogLoader({
    aifg: [async () => ({ default: { schema: 'tool-v0', tools: [catalogFixture[1]] } })],
  });
  await expect(loader.load('aifg')).rejects.toThrow('unsupported shape');
});
