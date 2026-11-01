import { startWith } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const statuses = { w: 'waiting', r: 'running', p: 'passed' } as const;

/**
 * Status panels: each subscribes to a worker's status, which says nothing until the worker has
 * started, so startWith seeds it with an explicit initial status and a panel is never blank. The
 * seed goes out on subscription, before the source is subscribed, and the worker's own reports
 * follow unchanged. A second panel opened while the worker is already running is given the same
 * seed. The strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    status$: {
      label: 'status$',
      // The worker reports whether or not a panel is watching.
      hot: true,
      marbles: '^---r----p-|',
      values: statuses,
    },
  },
  operator: "startWith('waiting')",
  outputs: {
    panel$: {
      label: 'panel$',
      marbles: 'w---r----p-|',
      values: statuses,
    },
    latePanel$: {
      label: 'latePanel$',
      marbles: '------w--p-|',
      values: statuses,
      subscriptions: '------^',
    },
  },
  run: ({ inputs: { status$ } }) => {
    const shown$ = status$.pipe(startWith('waiting'));
    // Both panels subscribe to shown$: the first at once, the second when it is opened.
    return { panel$: shown$, latePanel$: shown$ };
  },
  moments: [
    { label: 'Seed', frame: 0 },
    { label: 'First report', frame: 4 },
    { label: 'Second panel opens', frame: 6 },
    { label: 'Done', frame: 11 },
  ],
  notes: {
    0: 'The first panel subscribes. startWith sends it waiting at once and only then subscribes to the worker’s status, so the panel has a state to show before the worker has said anything.',
    4: 'The worker’s first report, running, arrives; the first panel now shows running in place of waiting.',
    6: 'A second panel opens. startWith sends it waiting too, though the worker has been running since frame 4: the seed is the same for every subscriber, and this panel learns the real status only at the next report.',
    9: 'passed arrives, and both panels show it.',
    11: 'The worker’s status completes, and so do both panels’ streams.',
  },
  caption:
    'Time runs in frames. A circle is an emission, with its letter; a bar is completion. A panel’s lane starts at the frame it subscribes. Step the frames to follow the seed.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);
