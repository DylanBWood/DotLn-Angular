import { defer, EMPTY, map, type Observable, of, shareReplay, startWith, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './start-with';

const line = (label: string) => {
  const found = marbleModel(example).marbles.lines.find((each) => each.label === label);
  if (!found) throw new Error(`No line ${label}.`);
  return found;
};

/** A lane's events in order, by value and frame. */
const told = (label: string) =>
  line(label).events.map(({ frame, value }) => `${value} at ${frame}`);

/** What a subscriber has received by the time its subscribe call returns. */
const heardAtOnce = (source: Observable<unknown>) => {
  const heard: unknown[] = [];
  source.subscribe((value) => heard.push(value)).unsubscribe();
  return heard;
};

const { marbles: statusMarbles, values } = example.inputs['status$'];

const testScheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the status panel example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the startWith row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:199');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/start-with.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(model(record.example.parameters).family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'status$',
    'panel$',
    'latePanel$',
  ]);
});

it('keeps the values the prose names equal to the run', async () => {
  const { parameters } = (await loadStudy('rxc:199')).example;
  expect(line('panel$').events[0]).toMatchObject({ frame: 0, value: parameters['seed'] });
  expect(line('latePanel$').subscribedAt).toBe(parameters['latePanel']);
  expect(line('latePanel$').events[0]).toMatchObject({
    frame: parameters['latePanel'],
    value: parameters['seed'],
  });
  const status = line('status$').events;
  expect(status[0]).toMatchObject({ kind: 'next', frame: parameters['firstReport'] });
  expect(status[status.length - 1]).toMatchObject({
    kind: 'complete',
    frame: parameters['completes'],
  });
});

it('gives each panel the seed when it subscribes, then the worker’s reports unchanged', () => {
  expect(told('panel$')).toEqual(['waiting at 0', 'running at 4', 'passed at 9', 'complete at 11']);
  // The second panel is seeded with waiting although the worker reported running at frame 4.
  expect(told('latePanel$')).toEqual(['waiting at 6', 'passed at 9', 'complete at 11']);
});

it('subscribes to the source once for each panel, each time after its seed', () => {
  testScheduler().run(({ hot, expectObservable, expectSubscriptions }) => {
    const status$ = hot(statusMarbles, values);
    const shown$ = status$.pipe(startWith('waiting'));
    expectObservable(shown$).toBe(example.outputs['panel$'].marbles, values);
    expectObservable(shown$, '------^').toBe(example.outputs['latePanel$'].marbles, values);
    expectSubscriptions(status$.subscriptions).toBe(['^----------!', '------^----!']);
  });
});

it('tells of the seed and names each panel’s seed in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[0];
  expect(telling.frame).toBe(0);
  expect(telling.values['now']).toBe('panel$ emits w (waiting)');
  const opened = run.marbles.frames.find(({ frame }) => frame === 6);
  expect(opened?.values['now']).toBe('latePanel$ subscribes; latePanel$ emits w (waiting)');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Seed', 0],
    ['First report', 4],
    ['Second panel opens', 6],
    ['Done', 11],
  ]);
});

it('sends the seed inside the subscribe call, before it subscribes to the source', () => {
  const order: string[] = [];
  const status$ = defer(() => {
    order.push('source subscribed');
    return of('running');
  });
  status$.pipe(startWith('waiting')).subscribe((value) => order.push(value));
  expect(order).toEqual(['waiting', 'source subscribed', 'running']);
  // A source that has said nothing yet still leaves the subscriber holding the seed.
  expect(heardAtOnce(new Subject<string>().pipe(startWith('waiting')))).toEqual(['waiting']);
});

it('has sent the seed even when the source fails at once', () => {
  testScheduler().run(({ cold, expectObservable }) => {
    const status$ = cold('#', undefined, 'no worker');
    expectObservable(status$.pipe(startWith('waiting'))).toBe('(w#)', values, 'no worker');
  });
});

it('hands a late panel the latest status instead once the seeded stream is shared', () => {
  testScheduler().run(({ hot, expectObservable }) => {
    const shared$ = hot(statusMarbles, values).pipe(startWith('waiting'), shareReplay(1));
    expectObservable(shared$).toBe('w---r----p-|', values);
    expectObservable(shared$, '------^').toBe('------r--p-|', values);
  });
});

it('fixes the seed when the pipeline is built, unlike a trigger read by a map', () => {
  let current = 'waiting';
  const seeded$ = EMPTY.pipe(startWith(current));
  const triggered$ = EMPTY.pipe(
    startWith(null),
    map(() => current),
  );
  current = 'running';
  expect(heardAtOnce(seeded$)).toEqual(['waiting']);
  expect(heardAtOnce(triggered$)).toEqual(['running']);
});
