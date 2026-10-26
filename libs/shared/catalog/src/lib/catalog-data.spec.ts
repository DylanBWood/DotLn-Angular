import Ajv2020 from 'ajv/dist/2020.js';

import type { CatalogCheckpoint } from '@dotln-angular/models';
import { TransformKind } from '@dotln-angular/models';

import summary from '../data/catalog-summary.json';
import schema from '../schema/tool-v0.schema.json';

const checkpoints = Object.values(
  import.meta.glob<CatalogCheckpoint>('../data/tools-*.json', { eager: true, import: 'default' }),
);
const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);

it('compiles the allow-list schema and validates every shipped row with closed transform/status pairing', () => {
  const validate = new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(schema);
  expect(checkpoints).toHaveLength(8);
  expect(tools).toHaveLength(3463);
  expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
  for (const tool of tools) {
    expect(validate(tool), tool.id).toBe(true);
    expect(['typed', 'untyped', 'background']).toContain(tool.status);
    if (tool.status === 'typed')
      expect(Object.values(TransformKind)).toContain(tool.faces.transform.kind);
    if (tool.status === 'untyped')
      expect(tool.faces.transform.reason.trim().length).toBeGreaterThan(0);
    if (tool.status === 'background') expect(tool.faces).toBeUndefined();
  }
  expect(validate({ ...tools[0], definition: 'Forbidden source text' })).toBe(false);
});

it('records eleven maps, up to three typed examples per work and every explicit shortfall', () => {
  expect(summary.maps).toHaveLength(11);
  expect(summary.mappedRows).toBe(3463);
  expect(summary.works).toHaveLength(6);
  for (const work of summary.works) {
    const typedCount = tools.filter(
      (tool) => tool.work === work.work && tool.status === 'typed',
    ).length;
    expect(work.typedShortfall, work.work).toBe(Math.max(0, 3 - typedCount));
    expect(work.firstThree, work.work).toHaveLength(Math.min(3, typedCount));
    for (const id of work.firstThree) {
      const tool = tools.find((candidate) => candidate.id === id);
      expect(tool?.work).toBe(work.work);
      expect(tool?.status).toBe('typed');
      if (tool?.status === 'typed') {
        expect(Object.values(TransformKind)).toContain(tool.faces.transform.kind);
        expect(tool.faces.scene.length).toBeGreaterThan(0);
      }
    }
  }
});
