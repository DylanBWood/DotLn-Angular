import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './homomorphic-force';

const record = await loadModelStudy('tt1:94', 'relations');

it('shows two components in Borrowing and the interface that brings both teams back together', () => {
  const { edges, frames } = model(record.example.parameters, studyTranslate).relations;

  expect(record.example.parameters).toEqual({ borrowingComponents: 2 });
  expect(edges.filter(({ from }) => from === 'borrowing').map(({ to }) => to)).toEqual([
    'messaging',
    'loan-policy',
    'reminder-job',
  ]);
  expect(edges.find(({ id }) => id === 'send-reminder')).toMatchObject({
    from: 'reminder-job',
    to: 'delivery-gateway',
    label: 'sends a reminder request to',
  });
  expect(frames.map(({ values }) => values['focus'])).toEqual([
    'Borrowing team coordinates with Messaging team',
    'Borrowing team maintains Reminder job',
    'Reminder job sends a reminder request to Delivery gateway',
    'Borrowing team coordinates with Messaging team',
  ]);
  expect(frames[3]?.note).toContain('A delivery receipt brings the same teams back together');
});
