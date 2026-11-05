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
      label: 'studyRxjs.behavior-subject.model.example.inputs.presses.label',
      marbles: '---r---r--p',
      values: { r: 'running', p: 'paused' },
      subscriptions: '^',

      valueMessages: {
        r: 'studyRxjs.behavior-subject.model.example.inputs.presses.values.r',
        p: 'studyRxjs.behavior-subject.model.example.inputs.presses.values.p',
      },
    },
  },
  operator: 'studyRxjs.behavior-subject.model.example.operator',
  outputs: {
    button$: {
      label: 'studyRxjs.behavior-subject.model.example.outputs.button.label',
      marbles: 'p--r---r--p',
      values: { r: 'running', p: 'paused' },

      valueMessages: {
        r: 'studyRxjs.behavior-subject.model.example.outputs.button.values.r',
        p: 'studyRxjs.behavior-subject.model.example.outputs.button.values.p',
      },
    },
    panel$: {
      label: 'studyRxjs.behavior-subject.model.example.outputs.panel.label',
      marbles: '-----r-r--p',
      values: { r: 'running', p: 'paused' },
      subscriptions: '-----^',

      valueMessages: {
        r: 'studyRxjs.behavior-subject.model.example.outputs.panel.values.r',
        p: 'studyRxjs.behavior-subject.model.example.outputs.panel.values.p',
      },
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
    {
      label: 'studyRxjs.behavior-subject.model.example.moments.0.label',
      frame: 0,
    },
    {
      label: 'studyRxjs.behavior-subject.model.example.moments.1.label',
      frame: 3,
    },
    {
      label: 'studyRxjs.behavior-subject.model.example.moments.2.label',
      frame: 5,
    },
    {
      label: 'studyRxjs.behavior-subject.model.example.moments.3.label',
      frame: 7,
    },
    {
      label: 'studyRxjs.behavior-subject.model.example.moments.4.label',
      frame: 10,
    },
  ],
  notes: {
    0: 'studyRxjs.behavior-subject.model.example.notes.0',
    3: 'studyRxjs.behavior-subject.model.example.notes.3',
    5: 'studyRxjs.behavior-subject.model.example.notes.5',
    7: 'studyRxjs.behavior-subject.model.example.notes.7',
    10: 'studyRxjs.behavior-subject.model.example.notes.10',
  },
  caption: 'studyRxjs.behavior-subject.model.example.caption',

  parameterMessages: {
    initial: 'studyRxjs.behavior-subject.record.parameters.initial',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);
