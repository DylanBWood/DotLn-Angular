import { defer, repeat } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A page asks for a build's status three times, waiting after each answer. The check is cold, as
 * an HTTP request is: each subscription sends a new request and reads the build as it is at that
 * moment, so each run is drawn as a line of its own. The first run is the source as the page wrote
 * it; the later ones are the subscriptions repeat makes again. The strings here are what the spec
 * beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    check$: {
      label: 'check$',
      marbles: '--q|',
      values: { q: 'queued' },
      subscriptions: '^--!',
    },
  },
  inner: {
    second: {
      label: 'check$, run 2',
      marbles: '--r|',
      values: { r: 'running' },
      subscriptions: '-----^--!',
    },
    third: {
      label: 'check$, run 3',
      marbles: '--p|',
      values: { p: 'passed' },
      subscriptions: '----------^--!',
    },
  },
  operator: 'repeat({ count: 3, delay: 2 })',
  outputs: {
    status$: {
      label: 'status$',
      marbles: '--q----r----p|',
      values: { q: 'queued', r: 'running', p: 'passed' },
    },
  },
  run: ({ inputs, inner }) => {
    // Each subscription to check$ sends a new request: the next run in turn.
    const runs = [inputs['check$'], inner['second'], inner['third']];
    let sent = 0;
    const check$ = defer(() => runs[sent++]);
    const status$ = check$.pipe(repeat({ count: 3, delay: 2 }));
    return { status$ };
  },
  moments: [
    { label: 'First answer', frame: 2 },
    { label: 'Run 1 completes', frame: 3 },
    { label: 'Run 2 starts', frame: 5 },
    { label: 'Run 3 starts', frame: 10 },
    { label: 'Done', frame: 13 },
  ],
  caption:
    'Time runs in frames, left to right. A circle is an emission, with its letter, and a bar is completion. Each grey lane is check$ subscribed again by repeat; the bar that ends each run is held back from status$ until the last run, so status$ has a single bar, at the end. Step the frames to follow each run.',
  notes: {
    0: 'The page subscribes to status$, so check$ sends its first request.',
    1: 'The first request is out; its answer is not back yet.',
    2: 'The first answer, queued, arrives and goes straight through to status$.',
    3: 'check$ completes, but status$ does not. repeat counts one finished run, sees that the count is not reached and starts the timer for its delay.',
    4: 'repeat is waiting out its delay. No request is out.',
    5: 'The timer fires. repeat subscribes to check$ again, and the new subscription sends a new request.',
    6: 'The second request is out.',
    7: 'The second answer, running, goes straight through.',
    8: 'The second run completes. Two runs are finished, so repeat waits once more.',
    9: 'repeat is waiting out its delay before the last request.',
    10: 'The timer fires, and repeat subscribes to check$ for the third and last time.',
    11: 'The third request is out.',
    12: 'The third answer, passed, goes straight through.',
    13: 'The third run completes. That is the count, so repeat completes status$ instead of waiting again.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);
