import type { Tool } from '@dotln-angular/models';
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

export function provideCatalogTestKit(tools: readonly Tool[] = catalogFixture) {
  const calls: (string | undefined)[] = [];
  const loader = {
    load: async (work?: Tool['work']) => {
      calls.push(work);
      return work ? tools.filter((tool) => tool.work === work) : tools;
    },
  };
  return { tools, calls, loader, providers: provideCatalog(loader) };
}

export function provideCatalogTokenTestKit(tools: readonly Tool[] = catalogFixture) {
  return provideCatalogTestKit(tools);
}
