import type { CatalogSummary, ConceptStudy, Tool, WorkSlug } from '@dotln-angular/models';
import { TransformKind } from '@dotln-angular/models';

import { provideCatalog } from '../../../src';

export const catalogFixture: readonly Tool[] = [
  {
    id: 'sample:1',
    definition: 'A group moves using local separation, cohesion and velocity matching.',
    place: { chapter: 'Chapter 1', section: 'First concepts' },
    related: [],
    hooks: [],
    verified: { kind: 'model-knowledge', note: 'Test fixture.' },
    work: 'aifg',
    title: 'Flock',
    rowType: 'technique',
    kind: 'behaviour',
    status: 'typed',
    classifiedBy: 'test-kit',
    provenance: 'public-work',
    map: null,
    faces: {
      scene: ['units-on-terrain'],
      selection: { target: 'unit', min: 2, max: 20 },
      transform: {
        kind: TransformKind.SteerBlend,
        params: [{ name: 'cohesion', unit: 'weight', default: 1, min: 0, max: 5 }],
      },
      observable: ['Group spacing'],
      toyMetric: ['cohesion-radius'],
    },
  },
  {
    id: 'sample:2',
    definition: 'Track changes during a business transaction and coordinate writing them.',
    place: { chapter: 'Chapter 1', section: 'First concepts' },
    related: [],
    hooks: [],
    verified: { kind: 'model-knowledge', note: 'Test fixture.' },
    work: 'poeaa',
    title: 'Unit of Work',
    rowType: 'pattern',
    kind: 'rule',
    status: 'untyped',
    classifiedBy: 'test-kit',
    provenance: 'public-work',
    map: null,
    faces: {
      scene: ['channels'],
      selection: { target: 'scene', min: 1, max: 1 },
      transform: { kind: 'untyped', reason: 'The scene needs a transaction contract.' },
      observable: ['Pending changes'],
      toyMetric: ['pending-changes'],
    },
  },
  {
    id: 'sample:3',
    definition: 'A set of symbols and rules for constructing and transforming statements.',
    place: { chapter: 'Chapter 1', section: 'First concepts' },
    related: [],
    hooks: [],
    verified: { kind: 'model-knowledge', note: 'Test fixture.' },
    work: 'geb',
    title: 'Formal system',
    rowType: 'concept',
    kind: 'background',
    status: 'background',
    classifiedBy: 'test-kit',
    provenance: 'public-work',
    map: null,
  },
];

/** A complete study of the first fixture tool, for specs that need one to read. */
export const studyFixture: ConceptStudy = {
  schema: 'concept-study-v0',
  id: 'sample:1',
  work: 'aifg',
  slug: 'flock',
  authored: {
    by: 'test-kit',
    on: '2026-10-31',
    reviewedBy: ['factual-critic', 'reading-critic'],
    state: 'checked',
  },
  intuition: {
    text: 'Three local rules keep a group together.',
    situation: 'A crowd crosses a field without piling up.',
  },
  example: {
    name: 'Three sheep',
    description: 'Three sheep start apart and settle into a group.',
    parameters: { sheep: 3 },
  },
  mechanism: {
    steps: [
      { title: 'Look at the neighbours', text: 'Find everyone inside the radius.' },
      { title: 'Blend the rules', text: 'Weigh and sum the three steering outputs.' },
    ],
  },
  pseudocode: {
    ordinary: 'neighbours = within(radius)\n\nsteer = blend(rules, neighbours)',
    rxjs: 'frames$.pipe(scan(stepFlock, start))',
    executable: null,
  },
  visual: null,
  implementations: [
    {
      project: 'A public library',
      url: 'https://example.org/library',
      relevance: 'It runs flocks in a game.',
      explanation: 'It keeps its neighbours in a grid so the search stays cheap.',
    },
  ],
  references: [
    {
      title: 'A public reference',
      url: 'https://example.org/reference',
      accessed: '2026-10-31',
      supports: 'Three local rules are enough to form a flock.',
    },
  ],
  limits: ['A flock has no destination of its own.'],
  nearby: [{ id: 'sample:2', why: 'It keeps track of what a group has done.' }],
};

/** The summary a loader over these tools and studies would answer. */
export const summaryOf = (
  tools: readonly Tool[],
  studies: readonly ConceptStudy[],
): CatalogSummary => {
  const works = [...new Set(tools.map((tool) => tool.work))];
  const studied = (work: WorkSlug) => studies.filter((study) => study.work === work);
  return {
    works: works.map((work) => ({
      work,
      count: tools.filter((tool) => tool.work === work).length,
    })),
    studies: {
      schema: 'studies-summary-v0',
      works: works
        .filter((work) => studied(work).length > 0)
        .map((work) => ({
          work,
          studies: studied(work).map(({ id, authored }) => ({ id, state: authored.state })),
        })),
    },
  };
};

export function provideCatalogTestKit(
  tools: readonly Tool[] = catalogFixture,
  studies: readonly ConceptStudy[] = [studyFixture],
) {
  const calls: (string | undefined)[] = [];
  const loader = {
    load: async (work?: Tool['work']) => {
      calls.push(work);
      return work ? tools.filter((tool) => tool.work === work) : tools;
    },
    study: async (id: Tool['id']) => studies.find((study) => study.id === id) ?? null,
    summary: async () => summaryOf(tools, studies),
  };
  return { tools, studies, calls, loader, providers: provideCatalog(loader) };
}

export function provideCatalogTokenTestKit(
  tools: readonly Tool[] = catalogFixture,
  studies: readonly ConceptStudy[] = [studyFixture],
) {
  return provideCatalogTestKit(tools, studies);
}
