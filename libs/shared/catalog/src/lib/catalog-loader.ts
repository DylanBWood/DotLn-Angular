import type { Provider } from '@angular/core';

import type {
  CatalogCheckpoint,
  CatalogSummary,
  ConceptStudy,
  StudiesSummary,
  Tool,
  ToolContent,
  WorkSlug,
} from '@dotln-angular/models';

import { CatalogStore } from './catalog-store';
import { CatalogToken } from './catalog-token';
import type { CatalogChunks, CatalogLoader, StudyChunks, SummaryChunks } from './types';

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

// One chunk per work, beside the tool data, so a regenerated join never touches a study.
const studyChunks: StudyChunks = {
  aifg: () => import('../studies/aifg'),
};

const summaryChunks: SummaryChunks = [
  () => import('../data/catalog-summary.json'),
  () => import('../studies/studies-summary.json'),
];

const rowCounts = (module: { readonly default: unknown }) => {
  const summary = module.default as { readonly counts?: { readonly work?: unknown } };
  const counts = summary?.counts?.work;
  if (!counts || typeof counts !== 'object')
    throw new Error('Catalog summary has an unsupported shape.');
  return Object.entries(counts).map(([work, count]) => ({
    work: work as WorkSlug,
    count: Number(count),
  }));
};

const studiesOf = (module: { readonly default: unknown }) => {
  const summary = module.default as StudiesSummary;
  if (summary?.schema !== 'studies-summary-v0' || !Array.isArray(summary.works))
    throw new Error('Studies summary has an unsupported shape.');
  return summary;
};

const recordsOf = (work: WorkSlug, module: { readonly default: unknown }) => {
  const records = module.default as readonly ConceptStudy[];
  if (
    !Array.isArray(records) ||
    records.some((study) => study?.schema !== 'concept-study-v0' || study.work !== work)
  )
    throw new Error('Study chunk has an unsupported shape.');
  return records;
};

/** Keeps one pending or settled value per key and forgets a failure, so a retry can run. */
function cached<Key, Value>(load: (key: Key) => Promise<Value>) {
  const values = new Map<Key, Promise<Value>>();
  return (key: Key): Promise<Value> => {
    const existing = values.get(key);
    if (existing) return existing;
    const pending = load(key).catch((error: unknown) => {
      values.delete(key);
      throw error;
    });
    values.set(key, pending);
    return pending;
  };
}

export function createCatalogLoader(
  sources: CatalogChunks = chunks,
  studies: StudyChunks = studyChunks,
  summaries: SummaryChunks = summaryChunks,
): CatalogLoader {
  const summary = cached(async (_key: 'summary'): Promise<CatalogSummary> => {
    const [catalog, studied] = await Promise.all(summaries.map((load) => load()));
    return { works: rowCounts(catalog), studies: studiesOf(studied) };
  });
  const studiesFor = cached(async (work: WorkSlug): Promise<readonly ConceptStudy[]> =>
    recordsOf(work, (await studies[work]?.()) ?? { default: [] }),
  );
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
    study: async (id) => {
      const { studies: summarized } = await summary('summary');
      const work = summarized.works.find(({ studies }) =>
        studies.some((study) => study.id === id),
      )?.work;
      if (!work) return null;
      return (await studiesFor(work)).find((study) => study.id === id) ?? null;
    },
    summary: () => summary('summary'),
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
