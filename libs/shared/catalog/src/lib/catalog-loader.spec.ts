import { TestBed } from '@angular/core/testing';

import { catalogFixture, provideCatalogTokenTestKit, studyFixture } from '../../testing/src';
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
    return { default: { schema: 'tool-v1', tools: [catalogFixture[0]] } };
  });
  const poeaa = vi.fn(async () => ({ default: { schema: 'tool-v1', tools: [catalogFixture[1]] } }));
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
    aifg: [async () => ({ default: { schema: 'tool-v1', tools: [catalogFixture[1]] } })],
  });
  await expect(loader.load('aifg')).rejects.toThrow('unsupported shape');
});

it('reads v0 for one release while explicitly marking its missing reading content', async () => {
  const {
    definition: _definition,
    place: _place,
    related: _related,
    hooks: _hooks,
    verified: _verified,
    ...legacy
  } = catalogFixture[0];
  const loader = createCatalogLoader({
    aifg: [async () => ({ default: { schema: 'tool-v0', tools: [legacy] } })],
  });
  const [tool] = await loader.load('aifg');
  expect(tool.id).toBe(legacy.id);
  expect(tool.definition).toContain('does not contain a definition');
  expect(tool.verified.kind).toBe('partial');
  expect(tool.related).toEqual([]);
});

const studiedSummary = {
  schema: 'studies-summary-v0',
  works: [{ work: 'aifg', studies: [{ id: 'sample:1', state: 'checked' }] }],
};
const summaries = [
  async () => ({ default: { counts: { work: { aifg: 2, eip: 1 } } } }),
  async () => ({ default: studiedSummary }),
] as const;

it('answers a study from its work’s chunk, loading that chunk once', async () => {
  const aifg = vi.fn(async () => ({ default: [studyFixture] }));
  const loader = createCatalogLoader({}, { aifg }, summaries);
  expect(await loader.study('sample:1')).toEqual(studyFixture);
  expect(await loader.study('sample:1')).toEqual(studyFixture);
  expect(aifg).toHaveBeenCalledTimes(1);
});

it('answers null for a concept with no study and loads no chunk for it', async () => {
  const aifg = vi.fn(async () => ({ default: [studyFixture] }));
  const loader = createCatalogLoader({}, { aifg }, summaries);
  expect(await loader.study('sample:2')).toBeNull();
  expect(aifg).not.toHaveBeenCalled();
});

it('retries a failed study chunk and refuses one of another work or schema', async () => {
  let attempts = 0;
  const aifg = vi.fn(async () => {
    if (++attempts === 1) throw new Error('Chunk unavailable');
    return { default: [studyFixture] };
  });
  const loader = createCatalogLoader({}, { aifg }, summaries);
  await expect(loader.study('sample:1')).rejects.toThrow('Chunk unavailable');
  expect(await loader.study('sample:1')).toEqual(studyFixture);
  const foreign = createCatalogLoader(
    {},
    { aifg: async () => ({ default: [{ ...studyFixture, work: 'eip' }] }) },
    summaries,
  );
  await expect(foreign.study('sample:1')).rejects.toThrow('unsupported shape');
});

it('summarizes the works and their studies without loading a work', async () => {
  const aifg = vi.fn(async () => ({ default: { schema: 'tool-v1', tools: [] } }));
  const loader = createCatalogLoader({ aifg: [aifg] }, {}, summaries);
  expect(await loader.summary()).toEqual({
    works: [
      { work: 'aifg', count: 2 },
      { work: 'eip', count: 1 },
    ],
    studies: studiedSummary,
  });
  expect(aifg).not.toHaveBeenCalled();
});

it('retries a failed summary and refuses one of an unknown shape', async () => {
  let attempts = 0;
  const loader = createCatalogLoader({}, {}, [
    async () => {
      if (++attempts === 1) throw new Error('Unavailable');
      return { default: { counts: { work: {} } } };
    },
    summaries[1],
  ]);
  await expect(loader.summary()).rejects.toThrow('Unavailable');
  expect((await loader.summary()).works).toEqual([]);
  const broken = createCatalogLoader({}, {}, [async () => ({ default: {} }), summaries[1]]);
  await expect(broken.summary()).rejects.toThrow('unsupported shape');
  const stale = createCatalogLoader({}, {}, [summaries[0], async () => ({ default: {} })]);
  await expect(stale.summary()).rejects.toThrow('unsupported shape');
});

it('serves the bundled Arrive study and the bundled summary', async () => {
  const loader = createCatalogLoader();
  expect((await loader.study('aifg-a:112'))?.slug).toBe('arrive');
  const summary = await loader.summary();
  expect(summary.works.map(({ work }) => work).sort()).toEqual(
    ['aifg', 'eip', 'geb', 'poeaa', 'rxjs', 'tt'].sort(),
  );
});
