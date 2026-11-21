import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './x-as-a-service-mode';

it('returns to the service request after the teams work out a revised contract', async () => {
  const record = await loadModelStudy('tt3:8', 'relations');
  expect(record.example.parameters).toEqual({ reviewAfterBlockedRuns: 3 });
  const run = model(record.example.parameters, studyTranslate);
  const { edges, frames } = run.relations;

  expect(edges).toContainEqual(
    expect.objectContaining({
      from: 'preview-api',
      to: 'checkout',
      label: 'returns a ready URL to',
    }),
  );
  expect(frames.map(({ values }) => values['focus'])).toEqual([
    'Release Platform runs the Preview API',
    'Checkout requests a preview through the Preview API',
    'Preview API returns a ready URL to Checkout',
    'Checkout reports a gap to Release Platform',
    'Release Platform tries a revised contract with Checkout',
    'Checkout requests a preview through the Preview API',
  ]);
  expect(run.moments[run.moments.length - 1]).toEqual({ label: 'Use the revised API', step: 5 });
  expect(fillValues(record.visual.textEquivalent, frames[5].values)).toBe(
    'Checkout requests a preview through the Preview API. Checkout now runs a fresh two-app preview from the revised instructions without Release Platform’s help. Two-app previews can return to routine service use. Release Platform supports the version and Checkout chooses when to adopt it.',
  );
});
