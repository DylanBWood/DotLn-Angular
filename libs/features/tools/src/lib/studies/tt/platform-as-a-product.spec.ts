import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { model } from './platform-as-a-product';

const record = await loadModelStudy('tt2:90', 'relations');

it('follows a preview user’s support question into the roadmap and back to the pull request', () => {
  const { relations, moments } = model(record.example.parameters, studyTranslate);

  expect(record.example.parameters).toEqual({
    attemptsPerPilot: 8,
    firstPilotNeededHelp: 5,
    secondPilotUnaided: 7,
  });
  expect(relations.nodes.map((node) => node.label)).toEqual([
    'Delivery teams',
    'Preview service',
    'Platform team',
  ]);
  expect(relations.edges).toMatchObject([
    { from: 'delivery-teams', to: 'preview-service', label: 'request previews from' },
    { from: 'delivery-teams', to: 'platform-team', label: 'ask for help from' },
    { from: 'platform-team', to: 'preview-service', label: 'improves the preview link in' },
    { from: 'preview-service', to: 'delivery-teams', label: 'shows a pull-request link to' },
  ]);
  expect(relations.frames[2]?.note).toBe(
    'The team puts the link on the pull request before adding a second runtime.',
  );
  expect(moments.at(-1)).toEqual({ label: 'Retest', step: 3 });
  expect(relations.frames.at(-1)).toMatchObject({
    focus: { relation: 'show-link' },
    note: '7 of 8 fresh attempts reach the preview without asking for help.',
  });
});
