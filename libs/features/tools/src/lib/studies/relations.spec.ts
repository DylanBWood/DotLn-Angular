import { type RelationsExample, relationsModel } from './relations';
import { ticksOf } from './study-model';

const example: RelationsExample = {
  layout: 'levels',
  nodes: ['mark', 'sentence', 'meaning'].map((id) => ({ id, label: id })),
  relations: [
    { id: 'read', from: 'mark', to: 'sentence', label: 'forms' },
    { id: 'interpret', from: 'sentence', to: 'meaning', label: 'expresses' },
    { id: 'refer', from: 'meaning', to: 'mark', label: 'refers to' },
  ],
  steps: [
    { id: 'start', focus: { node: 'mark' }, note: 'inspect' },
    { id: 'end', focus: { relation: 'refer' }, note: 'return' },
  ],
  moments: [{ label: 'again', step: 'end' }],
  caption: 'trace',
};
const build = (changes: Partial<RelationsExample> = {}) =>
  relationsModel({ ...example, ...changes }, (key, params) =>
    key === 'studyCommon.relations.connection'
      ? `${params?.['from']} ${params?.['relation']} ${params?.['to']}`
      : key,
  );

it('lays out the levels and reads a returning relation from the same endpoints the arrow joins', () => {
  const model = build();
  const [bottom, middle, top] = model.relations.nodes;
  expect(top.y).toBeLessThan(middle.y);
  expect(middle.y).toBeLessThan(bottom.y);
  expect(model.relations.edges[2]).toMatchObject({ from: top.id, to: bottom.id });
  expect(ticksOf(model)[model.moments[0].step].values['focus']).toBe('meaning refers to mark');
});

it('refuses unknown nodes, relations and steps and ambiguous identifiers', () => {
  expect(() => build({ nodes: example.nodes.slice(1) })).toThrow(/no node mark/);
  expect(() => build({ relations: [] })).toThrow(/no relation refer/);
  expect(() => build({ moments: [{ label: 'x', step: 'lost' }] })).toThrow(/no step lost/);
  expect(() => build({ steps: [{ id: 'start', focus: { node: 'lost' }, note: 'x' }] })).toThrow(
    /no node lost/,
  );
  expect(() => build({ steps: [example.steps[0], example.steps[0]] })).toThrow(/Duplicate step/);
  expect(() =>
    build({
      steps: [{ id: 'ambiguous', focus: { node: 'mark', relation: 'missing' }, note: 'x' }],
    }),
  ).toThrow(/exactly one node or relation/);
  expect(() => build({ steps: [] })).toThrow(/needs a node and a step/);
});

it('routes long reciprocal arrows on opposite sides of the levels', () => {
  const { relations } = build({
    relations: [
      ...example.relations,
      { id: 'lookup', from: 'mark', to: 'meaning', label: 'names' },
    ],
  });
  const center = relations.nodes[0].x;
  const controlX = (id: string) => {
    const path = relations.edges.find((edge) => edge.id === id)?.path ?? '';
    return Number(path.split(' C')[1]?.split(',')[0]);
  };
  expect(controlX('refer')).toBeGreaterThan(center);
  expect(controlX('lookup')).toBeLessThan(center);
});
