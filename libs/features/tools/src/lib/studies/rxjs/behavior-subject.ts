import { BehaviorSubject, type Observable } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * The scene's Play and Pause button, whose presses set the scene's status in one BehaviorSubject,
 * with two listeners: the button's label from the start and a status panel opened while the scene
 * runs. Play is pressed a second time while the scene is already running. In the app play() and
 * pause() call next on the subject; here the presses are an input the subject subscribes to, which
 * makes the same calls. Both listeners subscribe to the same stream, at the frame their
 * subscription string gives. The strings here are what the spec beside this file asserts and what
 * the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    presses$: {
      label: 'presses$',
      marbles: '---r---r--p',
      values: { r: 'running', p: 'paused' },
      subscriptions: '^',
    },
  },
  operator: "status = new BehaviorSubject('paused')",
  outputs: {
    button$: {
      label: 'button$',
      marbles: 'p--r---r--p',
      values: { r: 'running', p: 'paused' },
    },
    panel$: {
      label: 'panel$',
      marbles: '-----r-r--p',
      values: { r: 'running', p: 'paused' },
      subscriptions: '-----^',
    },
  },
  run: ({ inputs }) => {
    // The presses are strings; the cast names their type for the subject.
    const presses$ = inputs['presses$'] as Observable<string>;
    const status = new BehaviorSubject('paused');
    presses$.subscribe(status);

    const button$ = status.asObservable(); // subscribed at frame 0
    const panel$ = status.asObservable(); // subscribed at frame 5
    return { button$, panel$ };
  },
  moments: [
    { label: 'Starts paused', frame: 0 },
    { label: 'Play', frame: 3 },
    { label: 'Panel subscribes', frame: 5 },
    { label: 'Play again', frame: 7 },
    { label: 'Pause', frame: 10 },
  ],
  notes: {
    0: 'The status starts as paused, and the button subscribes: it is handed paused at once, before anything is pressed.',
    3: 'Play is pressed. The subject replaces paused with running and hands it to the button, its only listener so far.',
    5: 'The panel opens and subscribes. It is handed the held status, running, at once: it does not wait for the next press, and it never learns that the scene was paused before.',
    7: 'Play is pressed again. The status was already running, but the subject does not compare: both listeners hear running again.',
    10: 'Pause is pressed. The subject replaces running with paused and hands it to both listeners in the same frame.',
  },
  caption:
    'Time runs in frames. presses$ is what the subject is fed; each line below the band is one listener, drawn from the frame it subscribes and starting with the value the subject holds then: the button from frame 0 and the panel from frame 5. A circle is a status it hears, with its letter. Step the frames to follow each press.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);
