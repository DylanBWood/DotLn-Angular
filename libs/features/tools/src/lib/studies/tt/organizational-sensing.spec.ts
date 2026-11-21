import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './organizational-sensing';

const record = await loadModelStudy('tt3:47', 'relations');

it('joins the parcel signals at the review and returns the triage trial’s outcome there', () => {
  const { relations, moments } = model(record.example.parameters, studyTranslate);

  expect(record.example.parameters).toEqual({ reviewCases: 3, trialDays: 14, trialCases: 3 });
  expect(relations.edges.slice(0, 3)).toMatchObject([
    { from: 'customer-reports', to: 'incident-review', label: 'flag late updates for' },
    { from: 'decoder-logs', to: 'incident-review', label: 'show rejected statuses to' },
    { from: 'ticket-handoffs', to: 'incident-review', label: 'show repeated transfers to' },
  ]);
  expect(relations.edges.slice(3)).toMatchObject([
    { from: 'incident-review', to: 'triage-trial', label: 'starts' },
    { from: 'triage-trial', to: 'incident-review', label: 'sends follow-up evidence to' },
  ]);
  expect(moments.at(-1)).toEqual({ label: 'Follow-up review', step: 4 });
  expect(relations.frames.at(-1)).toMatchObject({
    focus: { relation: 'return-findings' },
    note: 'With no bounces in 3 comparable tickets, the review keeps Carrier as first responder.',
  });
});
