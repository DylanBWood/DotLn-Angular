import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './facilitating-mode';

const record = await loadModelStudy('tt3:9', 'relations');

it('follows rollback coaching from the request to practice and independent ownership', () => {
  expect(record.example.parameters).toEqual({ coachingWeeks: 2 });
  const run = model(record.example.parameters, studyTranslate);
  const { edges, frames } = run.relations;

  expect(edges).toContainEqual(
    expect.objectContaining({
      from: 'reliability',
      to: 'returns',
      label: 'coaches',
    }),
  );
  expect(frames.map(({ focus }) => focus)).toEqual([
    { relation: 'request' },
    { relation: 'teach' },
    { relation: 'practice' },
    { relation: 'practice' },
    { relation: 'maintain' },
  ]);
  expect(frames[2].values['focus']).toBe('Returns team runs Rollback drill');
  expect(frames[3].note).toBe(
    'A second Returns engineer restores the healthy release and verifies recovery using the runbook alone.',
  );
  expect(frames[4].values['focus']).toBe('Returns team maintains Returns runbook');
  expect(frames[4].note).toBe(
    'A second Returns engineer verified recovery alone. Coaching ends and Returns owns the runbook. If the two weeks expired first, this engagement would still end. The teams would record what remained to learn.',
  );
  expect(run.moments.at(-1)).toEqual({ label: 'Close the engagement', step: 4 });
});
