import type {
  CatalogChapter,
  CatalogReadingState,
  CatalogSummary,
  CatalogWork,
  SceneTypeId,
  Tool,
  ToolId,
  WorkSlug,
} from '@dotln-angular/models';
import { isSceneTool, workSlugs } from '@dotln-angular/models';
import { R, RA } from '@dotln-angular/utils';

import { byWork } from './filters';

// Each catalogued work's shelf title and the scene type its tools feed. A work enters the
// catalog with an entry here; the data spec runs the shelf over every bundled work.
const works: Readonly<
  Partial<Record<WorkSlug, { readonly title: string; readonly scene: SceneTypeId }>>
> = {
  aifg: { title: 'AI for Games', scene: 'units-on-terrain' },
  eip: { title: 'Enterprise Integration Patterns', scene: 'channels' },
  poeaa: { title: 'Patterns of Enterprise Application Architecture', scene: 'channels' },
  rxjs: { title: 'RxJS', scene: 'marbles' },
  geb: { title: 'Gödel, Escher, Bach', scene: 'levels' },
  tt: { title: 'Team Topologies', scene: 'teams' },
};

/** How many recent readings the history keeps. */
export const readingHistoryLimit = 10;

export const emptyReading: CatalogReadingState = {
  version: 1,
  work: null,
  chapter: null,
  section: null,
  selectedId: null,
  history: [],
  lastTitle: null,
};
export const chapterKey = (tool: Tool) =>
  JSON.stringify([tool.place.part ?? '', tool.place.chapter ?? '']);
// A restored reading may name any known slug, so a title falls back to the slug itself.
export const workTitle = (work: WorkSlug) => works[work]?.title ?? work;
export const sceneTools = (work: WorkSlug) => R.pipe(byWork(work), R.filter(isSceneTool));

/** The concepts that carry a study, across every work in the summary. */
export const studiedIds = (summary: CatalogSummary | null): ReadonlySet<ToolId> =>
  new Set(summary?.studies.works.flatMap(({ studies }) => studies.map(({ id }) => id)));

const studiedIn = (summary: CatalogSummary | null, work: WorkSlug) =>
  summary?.studies.works.find((entry) => entry.work === work)?.studies.length ?? 0;

const shelfEntry = (work: WorkSlug, count: number, summary: CatalogSummary | null) => ({
  work,
  title: works[work]?.title ?? work,
  scene: works[work]?.scene ?? null,
  count,
  studied: studiedIn(summary, work),
});

// A work a replacement loader returns without a shelf entry still reaches the reader, by
// its slug and without a scene type; the data spec keeps every bundled work listed.
export function catalogShelf(
  tools: readonly Tool[],
  summary: CatalogSummary | null = null,
): readonly CatalogWork[] {
  const counts = new Map<WorkSlug, number>();
  for (const tool of tools) counts.set(tool.work, (counts.get(tool.work) ?? 0) + 1);
  return [...counts].map(([work, count]) => shelfEntry(work, count, summary));
}

/** The shelf from the summary alone, for a page that has loaded no work. */
export const summaryShelf = (summary: CatalogSummary): readonly CatalogWork[] =>
  summary.works.map(({ work, count }) => shelfEntry(work, count, summary));

export const contentsFor = (work: WorkSlug) =>
  R.pipe(byWork(work), (tools: readonly Tool[]): CatalogChapter[] => {
    const chapters = new Map<string, Tool[]>();
    // Preserve map line order, including chapters whose numbers exceed nine.
    const ordered = [...tools].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true }),
    );
    for (const tool of ordered) {
      const key = chapterKey(tool);
      chapters.set(key, [...(chapters.get(key) ?? []), tool]);
    }
    return [...chapters].map(([key, rows]) => {
      const sections = new Map<string, Tool[]>();
      for (const tool of rows) {
        const section = tool.place.section ?? '';
        sections.set(section, [...(sections.get(section) ?? []), tool]);
      }
      return {
        key,
        part: rows[0].place.part ?? '',
        title: rows[0].place.chapter ?? '',
        count: rows.length,
        sections: [...sections].map(([title, tools]) => ({ title, tools })),
      };
    });
  });

export function searchReadings(tools: readonly Tool[], query: string): readonly Tool[] {
  const text = query.trim().toLocaleLowerCase();
  if (!text) return [];
  const rank = (tool: Tool) =>
    tool.title.toLocaleLowerCase() === text
      ? 0
      : tool.title.toLocaleLowerCase().startsWith(text)
        ? 1
        : tool.title.toLocaleLowerCase().includes(text)
          ? 2
          : 3;
  return tools
    .filter((tool) => `${tool.title}\n${tool.definition}`.toLocaleLowerCase().includes(text))
    .sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

export function restoreReading(value: unknown): CatalogReadingState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const state = value as Record<string, unknown>;
  const validId = (id: unknown): id is ToolId =>
    typeof id === 'string' && /^[a-z][a-z0-9-]*:[1-9][0-9]*$/.test(id);
  const optionalText = (text: unknown) => text === null || RA.isNonEmptyString(text) === true;
  if (
    state['version'] !== 1 ||
    !(state['work'] === null || workSlugs.some((work) => work === state['work'])) ||
    !optionalText(state['chapter']) ||
    !(state['section'] === null || typeof state['section'] === 'string') ||
    !(state['selectedId'] === null || validId(state['selectedId'])) ||
    !Array.isArray(state['history']) ||
    state['history'].length > readingHistoryLimit ||
    !state['history'].every(validId)
  )
    return undefined;
  return {
    version: 1,
    work: state['work'] as WorkSlug | null,
    chapter: state['chapter'] as string | null,
    section: state['section'] as string | null,
    // The address names the open reading, so a stored one opens nothing.
    selectedId: null,
    history: [...new Set(state['history'] as ToolId[])],
    // A reading stored before titles were kept has none; the link then names no concept.
    lastTitle: RA.isNonEmptyString(state['lastTitle']) === true ? String(state['lastTitle']) : null,
  };
}
