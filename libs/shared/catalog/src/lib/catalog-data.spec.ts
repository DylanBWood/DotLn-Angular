import Ajv2020 from 'ajv/dist/2020.js';

import type { CatalogCheckpoint } from '@dotln-angular/models';
import { TransformKind } from '@dotln-angular/models';

import summary from '../data/catalog-summary.json';
import schema from '../schema/tool-v1.schema.json';
import { catalogShelf, sceneTools } from './reading';

const checkpoints = Object.values(
  import.meta.glob<CatalogCheckpoint>('../data/tools-*.json', { eager: true, import: 'default' }),
);
const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);

it('validates every definition, chapter, transform contract and relation in all eight checkpoints', () => {
  const validate = new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(schema);
  expect(checkpoints).toHaveLength(8);
  expect(tools).toHaveLength(3463);
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  expect(byId.size).toBe(tools.length);
  for (const checkpoint of checkpoints) expect(checkpoint.schema).toBe('tool-v1');
  for (const tool of tools) {
    expect(validate(tool), tool.id).toBe(true);
    expect(tool.definition.trim().length).toBeGreaterThan(0);
    expect(tool.place.chapter?.trim().length).toBeGreaterThan(0);
    if (tool.status === 'typed')
      expect(Object.values(TransformKind)).toContain(tool.faces.transform.kind);
    if (tool.status === 'untyped')
      expect(tool.faces.transform.reason.trim().length).toBeGreaterThan(0);
    if (tool.status === 'background') expect(tool.faces).toBeUndefined();
    for (const relation of tool.related)
      if (relation.id !== null) {
        expect(relation.id, tool.id).not.toBe(tool.id);
        expect(byId.get(relation.id)?.work, tool.id).toBe(tool.work);
        expect(byId.get(relation.id)?.title, tool.id).toBe(relation.title);
      }
  }
  // The run marks one row as partially verified; a source URL naming PartialObserver is not one.
  expect(tools.filter((tool) => tool.verified.kind === 'partial').map((tool) => tool.id)).toEqual([
    'eip:258',
  ]);
  expect(
    validate({ ...tools[0], definition: 'Readable content', place: { chapter: 'A chapter' } }),
  ).toBe(true);
  const { definition: _definition, ...missing } = tools[0];
  expect(validate(missing)).toBe(false);
  expect(validate({ ...tools[0], place: {} })).toBe(false);
});

it('publishes the exact scene-tool set, chapter totals and historical Team Topologies shortfall', () => {
  expect(summary.schema).toBe('catalog-summary-v1');
  expect(summary.maps).toHaveLength(11);
  expect(summary.mappedRows).toBe(3463);
  expect(summary.works).toHaveLength(6);
  // The shelf's scene types are written beside its titles; they must agree with the summary.
  expect(catalogShelf(tools).map(({ work, scene }) => [work, scene])).toEqual(
    expect.arrayContaining(summary.works.map(({ work, sceneType }) => [work, sceneType])),
  );
  expect(catalogShelf(tools)).toHaveLength(summary.works.length);
  for (const work of summary.works) {
    expect(work.sceneTools).toEqual(
      sceneTools(work.work as (typeof tools)[number]['work'])(tools).map((tool) => tool.id),
    );
    expect(work.chapters.reduce((total, chapter) => total + chapter.count, 0)).toBe(
      tools.filter((tool) => tool.work === work.work).length,
    );
  }
  expect(summary.works.find((work) => work.work === 'tt')?.typedShortfall).toBe(1);
  const floor = sceneTools('aifg')(tools).map((tool) => tool.title);
  for (const title of [
    'Seek',
    'Arrive',
    'Separation',
    'Velocity matching',
    'Wander',
    'Flocking',
    'Priority steering',
    'Two-level formation steering',
    'Fixed formations',
    'Slot assignment',
  ])
    expect(floor).toContain(title);
});
