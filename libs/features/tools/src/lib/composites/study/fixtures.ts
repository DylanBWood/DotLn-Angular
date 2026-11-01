import { fillValues } from '../../studies/study-text';
import type { StudyView } from '../../types';
import {
  flowFixture,
  flowStudyModel,
  marbleFlowStudyModel,
  marblesFixture,
  marblesStudyModel,
  momentsFixture,
  motionFixture,
  timelineFixture,
} from '../study-visuals/fixtures';

/** A study with every representation, for the composite's stories and specs. */
export const studyViewFixture: StudyView = {
  id: 'sample:1',
  authoredBy: 'A study author',
  authoredOn: '2026-10-31',
  reviewers: 'factual-critic, reading-critic',
  intuition: {
    text: 'Point at the target and go.',
    situation: 'A scout runs for a flag.',
  },
  example: {
    name: 'A scout and a flag',
    description: 'One scout starts ten units from a flag.',
    parameters: { distance: 10 },
  },
  visual: {
    family: 'motion',
    view: 'motion',
    motion: motionFixture,
    timeline: timelineFixture,
    step: 4,
    moments: momentsFixture,
    legend: [
      { tone: 'actual', label: 'Solid green · actual' },
      { tone: 'desired', label: 'Dashed amber · desired' },
    ],
    caption: 'The arrow is the scout; the cross is the flag.',
    textEquivalent: 'The scout is 56 units from the flag.',
    note: 'The scout is still speeding up.',
    playing: false,
    inputs: [{ name: 'gap', label: 'Gap', unit: 'units', min: 1, max: 20, step: 1, value: 10 }],
  },
  expanded: [],
  worked: {
    title: 'Worked step: 2.00 → 2.50 seconds',
    lines: ['Find the distance.', 'Move toward it.'],
    note: 'The scout is still speeding up.',
  },
  pseudocode: 'direction = target - position\n\nposition += direction * dt',
  steps: [
    { title: 'Point at the target', text: 'Subtract.', code: 'direction = target - position' },
    { title: 'Move', text: 'Add.', code: 'position += direction * dt' },
  ],
  rxjs: { code: 'frames$.pipe(scan(step, start))', executable: false, spec: null },
  limits: ['Seek overshoots a fixed target.'],
  comparison: {
    title: 'What if the scout never slows?',
    intro: 'Two runs of the example.',
    timeline: timelineFixture,
    findings: ['The scout passes the flag.'],
    note: 'Values are rounded.',
  },
  implementations: [
    {
      project: 'A public library',
      url: 'https://example.org/library',
      relevance: 'It runs scouts in a game.',
      explanation: 'It clips the acceleration itself.',
    },
  ],
  references: [
    {
      title: 'A public reference',
      url: 'https://example.org/reference',
      accessed: '2026-10-31',
      supports: 'Seek accelerates toward the target at the limit.',
    },
  ],
  nearby: [{ id: 'sample:2', title: 'Arrive', why: 'It adds the braking Seek lacks.' }],
  next: null,
};

/** A study drawn as a marble diagram, with its code marked executable, for the specs and stories. */
export const marblesStudyViewFixture: StudyView = {
  ...studyViewFixture,
  id: 'sample:3',
  example: {
    name: 'A switch between two inner streams',
    description: 'The source emits a and then b; each opens an inner stream.',
    parameters: { values: 'a, b' },
  },
  visual: {
    family: 'marbles',
    marbles: marblesFixture,
    step: 4,
    moments: marblesStudyModel.moments,
    legend: marblesStudyModel.legend,
    caption: marblesStudyModel.caption,
    textEquivalent: fillValues('Frame {frame}: {now}.', marblesFixture.frames[4].values),
    note: 'The first inner stream is cut off before its second value.',
    playing: false,
    inputs: [],
  },
  worked: { title: 'Frame 4', lines: ['source$: a at 1, b at 4'] },
  rxjs: {
    code: 'out$ = source$.pipe(switchMap((value) => inner(value)));',
    executable: true,
    spec: 'libs/features/tools/src/lib/studies/rxjs/switch-map.spec.ts',
  },
  comparison: null,
};

/** A study drawn as a flow written step by step, whose example does not run. */
export const flowStudyViewFixture: StudyView = {
  ...studyViewFixture,
  id: 'sample:4',
  intuition: {
    text: 'A queue keeps each piece of work until a worker is free, oldest first.',
    situation: 'The planner sends orders faster than the executor can take them.',
  },
  example: {
    name: 'Two orders through a work queue',
    description: 'The planner sends two orders and the executor takes the oldest.',
    parameters: { orders: 2 },
  },
  pseudocode: 'on each order: add it to the queue\n\nwhen the executor is free: give it the oldest',
  steps: [
    {
      title: 'Queue the order',
      text: 'The queue keeps the orders in the order they came.',
      code: 'on each order: add it to the queue',
    },
    {
      title: 'Hand on the oldest',
      text: 'The executor takes one order at a time.',
      code: 'when the executor is free: give it the oldest',
    },
  ],
  limits: ['A queue that fills faster than the executor empties it never empties.'],
  implementations: [
    {
      project: 'A public broker',
      url: 'https://example.org/broker',
      relevance: 'It keeps messages in a queue for one consumer.',
      explanation: 'It hands each message to one consumer.',
    },
  ],
  references: [
    {
      title: 'A public reference',
      url: 'https://example.org/queue',
      accessed: '2026-11-01',
      supports: 'A point-to-point channel gives each message to one receiver.',
    },
  ],
  nearby: [
    { id: 'sample:5', title: 'One event, two subscribers', why: 'Every subscriber gets a copy.' },
  ],
  visual: {
    family: 'flow',
    view: 'flow',
    flow: flowFixture,
    marbles: null,
    step: 2,
    moments: flowStudyModel.moments,
    legend: flowStudyModel.legend,
    caption: flowStudyModel.caption,
    textEquivalent: fillValues('Step {step}: {moves}.', flowFixture.frames[2].values),
    note: flowFixture.frames[2].note ?? null,
    playing: false,
    inputs: [],
  },
  worked: null,
  rxjs: null,
  comparison: null,
};

/** A study drawn as a flow over a marble example that runs, with the diagram to switch to. */
export const marbleFlowStudyViewFixture: StudyView = {
  ...flowStudyViewFixture,
  id: 'sample:5',
  intuition: {
    text: 'Every subscriber gets its own copy of each event.',
    situation: 'The verifier publishes each verdict once, and the board and the log both need it.',
  },
  example: {
    name: 'One verdict, two subscribers',
    description:
      'The verifier publishes two verdicts, and the board and the log each receive both.',
    parameters: { events: 2 },
  },
  pseudocode: 'on each event: send a copy to every subscriber',
  steps: [
    {
      title: 'Copy to every subscriber',
      text: 'The channel keeps no copy itself.',
      code: 'on each event: send a copy to every subscriber',
    },
  ],
  limits: ['A subscriber that joins late misses what was published before it joined.'],
  nearby: [
    { id: 'sample:4', title: 'Two orders through a work queue', why: 'One receiver per message.' },
  ],
  visual: {
    ...flowStudyViewFixture.visual,
    family: 'flow',
    view: 'flow',
    flow: marbleFlowStudyModel.flow,
    marbles: marbleFlowStudyModel.diagram?.marbles ?? null,
    step: 1,
    moments: marbleFlowStudyModel.moments,
    legend: marbleFlowStudyModel.legend,
    caption: marbleFlowStudyModel.caption,
    textEquivalent: fillValues('Step {step}: {moves}.', marbleFlowStudyModel.flow.frames[1].values),
    note: marbleFlowStudyModel.flow.frames[1].note ?? null,
    playing: false,
    inputs: [],
  },
  // The spec that runs this example under the TestScheduler.
  rxjs: {
    code: 'events$ = published$.pipe(share());',
    executable: true,
    spec: 'libs/features/tools/src/lib/studies/flow.spec.ts',
  },
};
