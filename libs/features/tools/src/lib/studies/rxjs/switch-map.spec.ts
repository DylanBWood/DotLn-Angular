import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './switch-map';

it('runs the search box example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the switchMap row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:152');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/switch-map.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'query$',
    'results(ant)',
    'results(bee)',
    'results(cat)',
    'shown$',
  ]);
});

it('drops the middle query entirely and the first query’s second page', () => {
  const { marbles } = marbleModel(example);
  const dropped = marbles.lines.flatMap(({ label, events }) =>
    events
      .filter(({ kind, delivered }) => kind === 'next' && !delivered)
      .map(({ key }) => `${label} ${key}`),
  );
  expect(dropped).toEqual(['results(ant) 2', 'results(bee) 3', 'results(bee) 4']);
  const bee = marbles.lines.find(({ label }) => label === 'results(bee)');
  expect(bee).toMatchObject({ subscribedAt: 5, unsubscribedAt: 7, cancelled: true });
  const cat = marbles.lines.find(({ label }) => label === 'results(cat)');
  expect(cat).toMatchObject({ subscribedAt: 7, unsubscribedAt: 14, cancelled: false });
  expect(marbles.frames[marbles.frames.length - 1].values['delivered']).toBe(
    '1 (ant, page 1), 5 (cat, page 1), 6 (cat, page 2)',
  );
  // Every frame of the diagram is a step, up to the last thing received or completed.
  expect(marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 15 }, (_, frame) => frame),
  );
  expect(marbles.frames[2].values['now']).toBe('nothing new happens');
});

it('tells of the switch and names each emission in the frame’s sentence', () => {
  const run = marbleModel(example);
  // The drawing opens on the last frame, the whole run.
  expect(run.initialStep).toBe(run.marbles.lastFrame);
  const telling = run.marbles.frames[5];
  expect(telling.frame).toBe(5);
  expect(telling.values['now']).toBe(
    'query$ emits b (bee); results(ant) is cut off; results(bee) is opened',
  );
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual']);
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['ant', 1],
    ['bee cancels ant', 5],
    ['cat cancels bee', 7],
    ['Done', 14],
  ]);
});
