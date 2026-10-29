import type { Provider } from '@angular/core';

import type { CatalogCheckpoint, Tool, ToolContent, WorkSlug } from '@dotln-angular/models';

import { CatalogStore } from './catalog-store';
import { CatalogToken } from './catalog-token';
import type { CatalogChunks, CatalogLoader } from './types';

/** A tool-v0 row: a v1 tool without the content the join adds. Read for one release only. */
type LegacyTool = Tool extends infer Entry
  ? Entry extends Tool
    ? Omit<Entry, keyof ToolContent>
    : never
  : never;

const chunks: CatalogChunks = {
  aifg: [() => import('../data/tools-aifg-a.json'), () => import('../data/tools-aifg-b.json')],
  eip: [() => import('../data/tools-eip.json')],
  poeaa: [() => import('../data/tools-poeaa.json')],
  rxjs: [
    () => import('../data/tools-rxjs-core.json'),
    () => import('../data/tools-rxjs-patterns.json'),
  ],
  geb: [() => import('../data/tools-geb.json')],
  tt: [() => import('../data/tools-tt.json')],
};

export function createCatalogLoader(sources: CatalogChunks = chunks): CatalogLoader {
  const cache = new Map<WorkSlug, Promise<readonly Tool[]>>();
  const loadWork = (work: WorkSlug): Promise<readonly Tool[]> => {
    const existing = cache.get(work);
    if (existing) return existing;
    const pending = Promise.all((sources[work] ?? []).map((load) => load()))
      .then((modules) =>
        modules
          .flatMap((module) => {
            // Bundled checkpoints pass the schema and provenance gate before shipping.
            const checkpoint = module.default as
              | CatalogCheckpoint
              | {
                  readonly schema: 'tool-v0';
                  readonly tools: readonly LegacyTool[];
                };
            if (
              !checkpoint ||
              !['tool-v0', 'tool-v1'].includes(checkpoint.schema) ||
              !Array.isArray(checkpoint.tools) ||
              checkpoint.tools.some((tool) => tool.work !== work)
            ) {
              throw new Error('Catalog chunk has an unsupported shape.');
            }
            return checkpoint.schema === 'tool-v0'
              ? checkpoint.tools.map(upgradeLegacyTool)
              : checkpoint.tools;
          })
          .sort((a, b) => a.id.localeCompare(b.id)),
      )
      .catch((error: unknown) => {
        cache.delete(work);
        throw error;
      });
    cache.set(work, pending);
    return pending;
  };
  return {
    load: (work) =>
      work
        ? loadWork(work)
        : Promise.all((Object.keys(sources) as WorkSlug[]).map(loadWork)).then((groups) =>
            groups.flat().sort((a, b) => a.id.localeCompare(b.id)),
          ),
  };
}

/**
 * Temporary compatibility reader: remove it, the LegacyTool type and the tool-v0 branch
 * above when the loader's next release adopts v1 only.
 */
function upgradeLegacyTool(tool: LegacyTool): Tool {
  return {
    ...tool,
    definition: 'This legacy catalog does not contain a definition.',
    place: {},
    related: [],
    hooks: [],
    verified: { kind: 'partial', note: 'Legacy tool-v0 content; source reading unavailable.' },
  };
}

export function provideCatalog(loader?: CatalogLoader): Provider[] {
  return [
    CatalogStore,
    loader
      ? { provide: CatalogToken, useValue: loader }
      : { provide: CatalogToken, useFactory: createCatalogLoader },
  ];
}
