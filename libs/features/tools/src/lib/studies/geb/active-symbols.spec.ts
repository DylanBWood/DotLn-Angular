import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './active-symbols';

const record = await loadModelStudy('geb2:61', 'relations');

it('follows the kettle cue and two associations that share the same source', () => {
  const { relations } = model(record.example.parameters, studyTranslate);
  const associations = relations.edges.filter((edge) => edge.from === 'making-tea');

  expect(relations.nodes.map((node) => node.label)).toEqual([
    'Kettle click',
    'Making tea',
    'Mug',
    'Tea bag',
  ]);
  expect(relations.edges.find((edge) => edge.id === 'cue')).toMatchObject({
    from: 'kettle-click',
    to: 'making-tea',
    label: 'suggests',
  });
  expect(record.example.parameters['linksFromTea']).toBe(associations.length);
  expect(associations.map((edge) => edge.to)).toEqual(['mug', 'tea-bag']);
  expect(relations.frames.map((frame) => frame.focus)).toEqual([
    { node: 'kettle-click' },
    { relation: 'cue' },
    { relation: 'mug-link' },
    { relation: 'tea-bag-link' },
  ]);
  expect(relations.frames.at(-1)?.values['focus']).toBe('Making tea calls up Tea bag');
});
