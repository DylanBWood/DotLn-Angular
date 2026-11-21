import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './collaboration-mode';

it('moves from exchanging test cases to owning separate work', async () => {
  const record = await loadModelStudy('tt3:7', 'relations');
  expect(record.example.parameters).toEqual({ timeboxDays: 10 });
  const run = model(record.example.parameters, studyTranslate);
  const { edges, frames } = run.relations;

  expect(edges).toContainEqual(
    expect.objectContaining({
      from: 'checkout',
      to: 'release-platform',
      label: 'brings test builds to',
    }),
  );
  expect(frames.map(({ values }) => values['focus'])).toEqual([
    'Checkout',
    'Checkout brings test builds to Release Platform',
    'Release Platform tests a prototype with Checkout',
    'Checkout tests the draft Preview API',
    'Release Platform publishes and owns the Preview API',
  ]);
  expect(run.moments[run.moments.length - 1]).toEqual({ label: 'Close joint work', step: 4 });
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Release Platform publishes and owns the Preview API. A fresh Checkout engineer built, diagnosed and cleaned up a preview from the docs alone. Joint sessions end and Release Platform owns the API. If that test still failed on day ten, this trial would end and the teams would revisit scope or ownership.',
  );
});
