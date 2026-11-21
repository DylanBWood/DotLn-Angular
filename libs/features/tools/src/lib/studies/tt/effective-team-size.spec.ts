import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './effective-team-size';

const record = await loadModelStudy('tt1:215', 'relations');

it('compares growth with a split and traces the seat release across the new boundary', () => {
  const { edges, frames } = model(record.example.parameters, studyTranslate).relations;

  expect(record.example.parameters).toEqual({ baselinePeople: 8, addedPeople: 4 });
  expect(frames.map(({ values }) => values['focus'])).toEqual([
    'Reservations (8)',
    'Reservations (8) could grow into Reservations (12)',
    'Reservations (12) could give six people to Seat Holds',
    'Seat Holds sends a release notice to Waitlist',
  ]);
  expect(frames[1]?.note).toContain('possible pairs from 28 to 66');
  expect(edges.find(({ id }) => id === 'release-seat')).toMatchObject({
    from: 'seat-holds',
    to: 'waitlist',
    label: 'sends a release notice to',
  });
  expect(frames[3]?.note).toContain('delivery improves after counting the handoff');
});
