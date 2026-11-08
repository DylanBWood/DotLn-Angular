import { share, switchMap } from 'rxjs';

import { studyTranslate } from '../../../../testing/src';
import { flowFromMarbles, flowModel, type MarbleFlow } from '../../studies/flow';
import { type MarbleExample, marbleModel } from '../../studies/rxjs/marbles';
import { statesModel } from '../../studies/states';
import type {
  FlowModel,
  MarblesModel,
  MotionModel,
  StatesModel,
  StudyMoment,
  TimelineModel,
} from '../../studies/study-model';
import type { StudyTranslate } from '../../studies/study-translate';

/** Fixture words are invented here; real study messages retain the strict production resolver. */
export const fixtureTranslate: StudyTranslate = (key, params = {}) =>
  key.startsWith('study')
    ? studyTranslate(key, params)
    : key.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(params[name]));

/** Two bodies closing on a target, for the families' stories and specs. */
export const motionFixture: MotionModel = {
  bounds: { minX: 0, maxX: 100, minY: 0, maxY: 50 },
  frames: Array.from({ length: 11 }, (_, step) => ({
    seconds: step / 2,
    bodies: [
      { id: 'scout', x: 10 + step * 6, y: 15, heading: 0 },
      { id: 'follower', x: 5 + step * 5, y: 35, tone: 'other' as const },
    ],
    vectors: [{ x: 10 + step * 6, y: 15, dx: 8, dy: 0, tone: 'actual' as const }],
    marks: [{ x: 90, y: 25, shape: 'cross' as const }],
    zones: [{ x: 90, y: 25, radius: 15 }],
    values: { gap: String(80 - step * 6) },
  })),
  trail: true,
};

export const timelineFixture: TimelineModel = {
  title: 'Speed',
  xLabel: 'Time · seconds',
  yLabel: 'Speed · units/s',
  seconds: motionFixture.frames.map(({ seconds }) => seconds),
  series: [
    {
      id: 'actual',
      label: 'Actual',
      tone: 'actual',
      values: [0, 2, 4, 6, 8, 9, 9, 9, 8, 6, 4],
    },
    {
      id: 'desired',
      label: 'Desired',
      tone: 'desired',
      values: [9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 4],
    },
  ],
};

export const momentsFixture: readonly StudyMoment[] = [
  { label: 'Start', step: 0 },
  { label: 'Close', step: 8 },
];

/** A switch between two inner streams, for the marbles family's stories and specs. */
export const marblesStudyModel = marbleModel(
  {
    inputs: {
      source$: {
        label: 'source$',
        marbles: '-a--b-|',
        values: { a: 'first', b: 'second' },
        valueMessages: { a: 'first', b: 'second' },
      },
    },
    inner: {
      first: {
        label: 'inner(first)',
        marbles: '--1-2|',
        subscriptions: '-^--!',
      },
      second: {
        label: 'inner(second)',
        marbles: '--3-4|',
        subscriptions: '----^----!',
      },
    },
    operator: 'switchMap((value) => inner(value))',
    outputs: { out$: { label: 'out$', marbles: '---1--3-4|' } },
    run: ({ inputs: { source$ }, inner }) => ({
      out$: source$.pipe(switchMap((value) => inner[String(value)])),
    }),
    moments: [
      { label: 'First', frame: 1 },
      { label: 'Switch', frame: 4 },
    ],
  },
  {},
  fixtureTranslate,
);
export const marblesFixture: MarblesModel = marblesStudyModel.marbles;

/**
 * Three stages, a planner, a work queue and an executor, with two orders sent and one taken, for
 * the flow family's stories and specs.
 */
export const flowStudyModel = flowModel(
  {
    nodes: [
      { id: 'planner', label: 'Planner', stage: 0 },
      {
        id: 'queue',
        label: 'Work queue',
        stage: 1,
        kind: 'channel',
        tone: 'subject',
      },
      { id: 'executor', label: 'Executor', stage: 2 },
    ],
    links: [
      { id: 'send', from: 'planner', to: 'queue' },
      { id: 'take', from: 'queue', to: 'executor' },
    ],
    messages: {
      a: { key: 'a', content: 'order 31' },
      b: { key: 'b', content: 'order 32' },
    },
    start: {
      states: { queue: 'empty', executor: 'idle' },
      note: 'Nothing has been sent yet.',
    },
    steps: [
      {
        moves: [{ message: 'a', link: 'send' }],
        states: { queue: 'holds order 31' },
        held: { queue: ['a'] },
        note: 'The planner sends order 31 to the queue.',
      },
      {
        moves: [{ message: 'b', link: 'send' }],
        states: { queue: 'holds orders 31 and 32' },
        held: { queue: ['a', 'b'] },
        note: 'Order 32 joins it behind order 31.',
      },
      {
        moves: [{ message: 'a', link: 'take' }],
        states: { queue: 'holds order 32', executor: 'works on order 31' },
        held: { queue: ['b'] },
        note: 'The executor takes the oldest order, 31, and order 32 waits.',
      },
    ],
    moments: [
      { label: 'Both queued', step: 2 },
      { label: 'Taken', step: 3 },
    ],
  },
  {},
  fixtureTranslate,
);
export const flowFixture: FlowModel = flowStudyModel.flow;

/** One published event reaching two subscribers: the example that runs. */
export const marbleFlowExample: MarbleExample = {
  inputs: {
    published$: {
      label: 'published$',
      marbles: '-a--b|',
      values: { a: 'order 31 verified', b: 'order 32 verified' },
      valueMessages: { a: 'order 31 verified', b: 'order 32 verified' },
    },
  },
  operator: 'share()',
  outputs: {
    board$: {
      label: 'board$',
      marbles: '-a--b|',
      values: { a: 'order 31 verified', b: 'order 32 verified' },
      valueMessages: { a: 'order 31 verified', b: 'order 32 verified' },
    },
    log$: {
      label: 'log$',
      marbles: '-a--b|',
      values: { a: 'order 31 verified', b: 'order 32 verified' },
      valueMessages: { a: 'order 31 verified', b: 'order 32 verified' },
    },
  },
  run: ({ inputs: { published$ } }) => {
    const events$ = published$.pipe(share());
    return { board$: events$, log$: events$ };
  },
  moments: [{ label: 'First event', frame: 1 }],
};

/** The flow the example is drawn as. */
export const marbleFlow: MarbleFlow = {
  nodes: [
    { id: 'verifier', label: 'Verifier', stage: 0 },
    {
      id: 'events',
      label: 'Events',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    { id: 'board', label: 'Board', stage: 2 },
    { id: 'log', label: 'Log', stage: 2, row: 1 },
  ],
  links: [
    { id: 'publish', from: 'verifier', to: 'events' },
    { id: 'to-board', from: 'events', to: 'board' },
    { id: 'to-log', from: 'events', to: 'log' },
  ],
  routes: { published$: 'publish', board$: 'to-board', log$: 'to-log' },
  states: { 0: { events: 'two subscribers' } },
};

/** The example read as a flow, with its marble diagram beside it. */
export const marbleFlowStudyModel = flowFromMarbles(
  marbleFlowExample,
  marbleFlow,
  {},
  fixtureTranslate,
);

/**
 * A four-state register for the states family's stories and specs: three saved scenes, one
 * registered new, one edited and one removed, then all written out at once.
 */
export const statesStudyModel = statesModel(
  {
    shape: {
      nodes: [
        { id: 'clean', label: 'Clean' },
        { id: 'new', label: 'New', tone: 'subject' },
        { id: 'dirty', label: 'Dirty', tone: 'subject' },
        { id: 'removed', label: 'Removed', tone: 'subject' },
      ],
      objects: [
        { id: 'a', label: 'Scene A', key: 'A' },
        { id: 'b', label: 'Scene B', key: 'B' },
        { id: 'c', label: 'Scene C', key: 'C' },
      ],
      transitions: [
        { id: 'edit', from: 'clean', to: 'dirty', label: 'registerDirty' },
        { id: 'remove', from: 'clean', to: 'removed', label: 'registerRemoved' },
        { id: 'insert', from: 'new', to: 'clean', label: 'commit' },
        { id: 'update', from: 'dirty', to: 'clean', label: 'commit' },
        { id: 'delete', from: 'removed', to: null, label: 'commit' },
      ],
    },
    snapshots: [
      { at: { a: 'clean', b: 'clean' } },
      { at: { a: 'clean', b: 'clean', c: 'new' } },
      { at: { a: 'clean', b: 'dirty', c: 'new' }, took: { b: 'edit' } },
      { at: { a: 'removed', b: 'dirty', c: 'new' }, took: { a: 'remove' } },
      { at: { b: 'clean', c: 'clean' }, took: { a: 'delete', b: 'update', c: 'insert' } },
    ],
    text: [
      { notes: { a: 'version 3', b: 'version 5' } },
      { notes: { a: 'version 3', b: 'version 5', c: 'not stored yet' } },
      { notes: { a: 'version 3', b: 'title changed', c: 'not stored yet' } },
      { notes: { a: 'to delete', b: 'title changed', c: 'not stored yet' } },
      { notes: { b: 'version 6', c: 'version 1' } },
    ],
  },
  {
    moments: [
      { label: 'Registered', step: 1 },
      { label: 'Committed', step: 4 },
    ],
    legend: [
      { tone: 'subject', label: 'A state the pattern adds' },
      { tone: 'actual', label: 'Moving now' },
    ],
    caption: 'Each row is a scene and each column a register.',
  },
  fixtureTranslate,
);

export const statesFixture: StatesModel = statesStudyModel.states;

/**
 * A register of the given state names, with one object whose name widens the name column to its
 * most, so five names leave a phone the narrow columns Service Layer's register has.
 */
export const statesOfNames = (labels: readonly string[]): StatesModel =>
  statesModel(
    {
      shape: {
        nodes: labels.map((label, index) => ({ id: `state${index}`, label })),
        objects: [{ id: 'ridge', label: 'Hold the ridge again', key: 'R' }],
        transitions: [],
      },
      snapshots: [{ at: { ridge: 'state0' } }, { at: { ridge: 'state1' } }],
      text: [],
    },
    { moments: [] },
    fixtureTranslate,
  ).states;
