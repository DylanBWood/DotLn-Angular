import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './team-scoped-flow';

const record = await loadModelStudy('tt1:151', 'relations');

it('takes the same reminder to production through specialist queues and through Renewals', () => {
  expect(record.example.parameters).toEqual({ leadDays: 3 });
  const { relations } = model(record.example.parameters, studyTranslate);
  const { edges, frames } = relations;

  expect(
    edges.filter((edge) => edge.to === 'live').map(({ from, label }) => [from, label]),
  ).toEqual([
    ['release', 'deploys'],
    ['renewals', 'deploys'],
  ]);
  expect(frames.map(({ focus }) => focus)).toEqual([
    { relation: 'specialist-intake' },
    { relation: 'rule-handoff' },
    { relation: 'release-handoff' },
    { relation: 'specialist-deploy' },
    { relation: 'renewals-intake' },
    { relation: 'gateway-contract' },
    { relation: 'renewals-deploy' },
  ]);
  expect(frames[2].values['focus']).toBe('Messaging team queues deployment with Release team');
  expect(frames[5].values['focus']).toBe('Renewals team tests against Mail gateway');
  expect(frames[6].note).toBe(
    'Renewals deploys and checks that the first emails go out three days before expiry.',
  );
});
