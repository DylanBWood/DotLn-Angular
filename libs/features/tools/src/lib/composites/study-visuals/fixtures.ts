import { switchMap } from 'rxjs';

import { marbleModel } from '../../studies/rxjs/marbles';
import type {
  MarblesModel,
  MotionModel,
  StudyMoment,
  TimelineModel,
} from '../../studies/study-model';

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
    { id: 'actual', label: 'Actual', tone: 'actual', values: [0, 2, 4, 6, 8, 9, 9, 9, 8, 6, 4] },
    { id: 'desired', label: 'Desired', tone: 'desired', values: [9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 4] },
  ],
};

export const momentsFixture: readonly StudyMoment[] = [
  { label: 'Start', step: 0 },
  { label: 'Close', step: 8 },
];

/** A switch between two inner streams, for the marbles family's stories and specs. */
export const marblesStudyModel = marbleModel({
  inputs: {
    source$: { label: 'source$', marbles: '-a--b-|', values: { a: 'first', b: 'second' } },
  },
  inner: {
    first: { label: 'inner(first)', marbles: '--1-2|', subscriptions: '-^--!' },
    second: { label: 'inner(second)', marbles: '--3-4|', subscriptions: '----^----!' },
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
});
export const marblesFixture: MarblesModel = marblesStudyModel.marbles;
