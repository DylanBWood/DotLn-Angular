import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './consistency';

const record = await loadModelStudy('geb1:107', 'relations');

it('keeps Cedar Room in one slot and leaves the projector question open', () => {
  expect(record.example.parameters).toEqual({ slot: 3 });
  expect(record.nearby.map(({ id }) => id)).toContain('geb1:114');

  const run = model(record.example.parameters, studyTranslate);
  expect(run.relations.frames[0].note).toBe('The clearance makes Cedar Room bookable in slot 3.');
  expect(run.relations.edges).toContainEqual(
    expect.objectContaining({ from: 'bookable', to: 'projector', label: 'leaves open' }),
  );
  expect(run.relations.frames[1].focus).toEqual({ relation: 'open-projector' });
  expect(run.relations.frames[1].note).toBe(
    'Cedar Room can be bookable in slot 3 with the projector working or broken.',
  );
});

it('compares the booking claims only after the hold has been added', () => {
  const { relations, moments } = model(record.example.parameters, studyTranslate);
  expect(relations.frames[2].focus).toEqual({ relation: 'bars' });
  expect(relations.edges).toContainEqual(
    expect.objectContaining({ from: 'bookable', to: 'unavailable', label: 'contradicts' }),
  );
  expect(moments.at(-1)).toEqual({ label: 'Contradiction', step: 3 });
  expect(fillValues(record.visual.textEquivalent, relations.frames[3].values)).toBe(
    'Bookable contradicts Not bookable. No schedule can make Cedar Room both bookable and unavailable in slot 3.',
  );
});
