import { ReplaySubject, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './replay-subject';

const line = (label: string) => {
  const found = marbleModel(example).marbles.lines.find((each) => each.label === label);
  if (!found) throw new Error(`No line ${label}.`);
  return found;
};

/** A lane's events in order, by letter and frame. */
const told = (label: string) => line(label).events.map(({ frame, key }) => `${key} at ${frame}`);

it('runs the report log example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the ReplaySubject row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:63');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/replay-subject.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(model(record.example.parameters).family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'report$',
    'dashboard$',
    'verifier$',
    'auditor$',
  ]);
});

it('keeps the numbers the prose names equal to the run', async () => {
  const { parameters } = (await loadStudy('rxc:63')).example;
  const bufferSize = Number(parameters['bufferSize']);
  expect(line('verifier$').subscribedAt).toBe(parameters['verifierJoins']);
  expect(line('auditor$').subscribedAt).toBe(parameters['auditorJoins']);
  const replayedAt = (label: string) =>
    line(label).events.filter(
      ({ frame, kind }) => kind === 'next' && frame === line(label).subscribedAt,
    );
  expect(replayedAt('verifier$')).toHaveLength(bufferSize);
  expect(replayedAt('auditor$')).toHaveLength(bufferSize);
});

it('hands the verifier the newest two at once and never the first report', () => {
  expect(told('dashboard$')).toEqual([
    'a at 1',
    'b at 3',
    'c at 5',
    'd at 10',
    'e at 13',
    '| at 15',
  ]);
  expect(told('verifier$')).toEqual(['b at 6', 'c at 6', 'd at 10', 'e at 13', '| at 15']);
  expect(told('auditor$')).toEqual(['d at 18', 'e at 18', '| at 18']);
});

it('subscribes to the source once, whoever listens', () => {
  expect(line('report$')).toMatchObject({ subscribedAt: 0, unsubscribedAt: 15, cancelled: false });
  expect(line('verifier$')).toMatchObject({ subscribedAt: 6, cancelled: false });
});

it('tells of the join and names the replay in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[6];
  expect(telling.frame).toBe(6);
  expect(telling.values['now']).toBe(
    'verifier$ subscribes; verifier$ emits b (types ok); verifier$ emits c (tests ok)',
  );
  const audited = run.marbles.frames.find(({ frame }) => frame === 18);
  expect(audited?.values['now']).toBe(
    'auditor$ subscribes; auditor$ emits d (build ok); auditor$ emits e (docs ok); auditor$ completes',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['First report', 1],
    ['Verifier joins', 6],
    ['Run completes', 15],
    ['Auditor joins', 18],
  ]);
});

it('replays inside the subscribe call, before it returns', () => {
  const log = new ReplaySubject<string>(2);
  for (const report of ['lint ok', 'types ok', 'tests ok']) log.next(report);
  const heard: string[] = [];
  log.subscribe((report) => heard.push(report));
  expect(heard).toEqual(['types ok', 'tests ok']);
});

it('goes on replaying after an error, then repeats the error', () => {
  const log = new ReplaySubject<string>(2);
  const crash = new Error('the run crashed');
  for (const report of ['lint ok', 'types ok', 'tests ok']) log.next(report);
  log.error(crash);
  const heard: string[] = [];
  let failed: unknown;
  log.subscribe({ next: (report) => heard.push(report), error: (error) => (failed = error) });
  expect(heard).toEqual(['types ok', 'tests ok']);
  expect(failed).toBe(crash);
});

it('leaves a late verifier with nothing to catch up on when the log is a plain Subject', () => {
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  scheduler.run(({ hot, expectObservable }) => {
    const { marbles, values } = example.inputs['report$'];
    const log = new Subject();
    hot(marbles, values).subscribe(log);
    expectObservable(log, '------^').toBe('----------d--e-|', values);
  });
});
