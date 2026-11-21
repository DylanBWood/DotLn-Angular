import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { mapStudy } from '../../mappers/study-mapper';
import { model } from './strange-loop';

const record = await loadModelStudy('geb2:302', 'relations');

it('returns through the depicted seaport to the gallery that exhibits the print', () => {
  const { relations } = model(record.example.parameters, studyTranslate);
  expect(record.references.find((ref) => ref.url === relations.sourceUrl)?.title).toContain(
    '1956 Print Gallery',
  );
  expect(relations.specimen?.samples).toContain('Count the letters on this card.');

  expect(relations.nodes.map((node) => node.label)).toEqual([
    'Gallery',
    'Seaport print',
    'Seaport scene',
  ]);
  expect(record.example.parameters['levelCount']).toBe(relations.nodes.length);
  expect(relations.edges.find((edge) => edge.id === 'return')).toMatchObject({
    from: 'seaport-scene',
    to: 'gallery',
    label: 'contains',
  });
  expect(relations.frames.map((frame) => frame.focus)).toEqual([
    { node: 'gallery' },
    { relation: 'exhibits' },
    { relation: 'depicts' },
    { relation: 'return' },
    { node: 'gallery' },
  ]);
  expect(relations.frames.at(-2)?.values['focus']).toBe('Seaport scene contains Gallery');
  expect(relations.frames.at(-1)?.values['focus']).toBe('Gallery');
});

it('keeps the gallery source with the example when the references are reordered', () => {
  const view = mapStudy(
    {
      record: { ...record, references: [...record.references].reverse() },
      model: model(record.example.parameters, studyTranslate),
    },
    { step: null, view: 'motion', expanded: [], playing: false, inputs: {} },
    [],
  ).visual;
  expect(view?.family === 'relations' && view.exampleSource?.title).toContain('1956 Print Gallery');
});
