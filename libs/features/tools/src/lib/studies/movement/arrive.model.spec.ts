import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import type { ArriveParameters } from './arrive.model';
import {
  arriveFrames,
  calculateArriveStep,
  desiredVelocity,
  model,
  stepArrive,
} from './arrive.model';

const example: ArriveParameters = {
  target: 100,
  slowRadius: 36,
  maxSpeed: 16,
  maxAcceleration: 12,
  responseTime: 0.4,
  tolerance: 0.3,
  timeStep: 0.1,
  steps: 240,
  lateRadius: 8,
};
const parameters: StudyParameters = { ...example };

it('attaches the record to the Arrive row with the parameters these numbers come from', async () => {
  const loader = createCatalogLoader();
  const record = await loader.study('aifg-a:112');
  const tools = await loader.load('aifg');
  expect(tools.find((tool) => tool.id === record?.id)?.title).toBe('Arrive');
  expect(record?.example.parameters).toEqual(example);
});

// These are the values the hand-wired study asserted before it became a record and a model:
// the migration changed no number.
it('works through the first acceleration cap and a braking step with concrete values', () => {
  const first = calculateArriveStep({ position: 0, velocity: 0 }, example);
  expect(first).toMatchObject({
    distance: 100,
    desired: 16,
    requestedAcceleration: 40,
    acceleration: 12,
    settled: false,
  });
  expect(first.next.velocity).toBeCloseTo(1.2);
  expect(first.next.position).toBeCloseTo(0.12);
  const braking = calculateArriveStep({ position: 82, velocity: 12 }, example);
  expect(braking).toMatchObject({
    distance: 18,
    desired: 8,
    requestedAcceleration: -10,
    acceleration: -10,
    settled: false,
    next: { position: 83.1, velocity: 11 },
  });
  expect(calculateArriveStep({ position: 99.9, velocity: 0.2 }, example)).toMatchObject({
    settled: true,
    next: { position: 100, velocity: 0 },
  });
});

it('approaches a fixed target, slows down and settles without exceeding its motion limits', () => {
  const frames = arriveFrames(example);
  expect(frames).toHaveLength(example.steps + 1);
  expect(frames[0]).toEqual({ position: 0, velocity: 0 });
  for (const [index, frame] of frames.entries()) {
    expect(Number.isFinite(frame.position)).toBe(true);
    expect(Math.abs(frame.velocity)).toBeLessThanOrEqual(example.maxSpeed);
    if (index > 0 && frame.position !== example.target) {
      expect(
        Math.abs(frame.velocity - frames[index - 1].velocity) / example.timeStep,
      ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    }
  }
  expect(frames[75].velocity).toBeLessThan(frames[40].velocity);
  expect(frames[75].velocity).toBeGreaterThan(desiredVelocity(frames[75].position, example));
  expect(frames.at(-1)).toEqual({ position: 100, velocity: 0 });
});

it('brakes a moving character at the target instead of falsely treating distance alone as arrival', () => {
  expect(stepArrive({ position: 100, velocity: 10 }, example)).toEqual({
    position: 100.88,
    velocity: 8.8,
  });
  expect(stepArrive({ position: 100, velocity: 0 }, example)).toEqual({
    position: 100,
    velocity: 0,
  });
  expect(desiredVelocity(110, example)).toBeLessThan(0);
});

it('shows overshoot from late braking with the same start and motion limits', () => {
  const normal = arriveFrames(example);
  const late = arriveFrames(example, example.lateRadius);
  expect(late.slice(0, 41)).toEqual(normal.slice(0, 41));
  expect(Math.max(...normal.map((frame) => frame.position))).toBe(100);
  expect(Math.max(...late.map((frame) => frame.position))).toBeCloseTo(103.93, 2);
  expect(late.some((frame) => frame.velocity < 0)).toBe(true);
  expect(late.at(-1)).toEqual({ position: 100, velocity: 0 });
  for (const [index, frame] of late.entries()) {
    expect(Math.abs(frame.velocity)).toBeLessThanOrEqual(example.maxSpeed);
    if (index > 0 && frame.position !== example.target) {
      expect(
        Math.abs(frame.velocity - late[index - 1].velocity) / example.timeStep,
      ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    }
  }
});

it('labels the late-braking chart on the same scales as its plotted runs', () => {
  const comparison = model(parameters).comparison;
  if (!comparison) throw new Error('Arrive compares a late-braking run.');
  const view = timelineDrawing(comparison.timeline, null);
  expect(view.yTicks).toEqual([
    { label: '110', y: 47 },
    { label: '100', y: 82 },
    { label: '75', y: 169.5 },
    { label: '50', y: 257 },
  ]);
  expect(view.xTicks).toEqual([
    { label: '4', x: 50 },
    { label: '8', x: 223.33 },
    { label: '12', x: 396.67 },
    { label: '16', x: 570 },
  ]);
  const xs = view.series[0].points.split(' ').map((point) => Number(point.split(',')[0]));
  expect(xs.at(0)).toBe(view.xTicks.at(0)?.x);
  expect(xs.at(-1)).toBe(view.xTicks.at(-1)?.x);
  expect(view.gridPath).toBe('M 50 40 H 570 M 50 162.5 H 570 M 50 250 H 570');
  expect(view.referencePath).toBe('M 50 75 H 570');
  expect(view.axisPath).toBe('M 50 40 V 250 H 570');
});

it('tells the reader the moment the prose and the worked step describe', () => {
  const run = model(parameters);
  expect(run.motion.frames).toHaveLength(241);
  expect(run.initialStep).toBe(75);
  const slowing = run.motion.frames[run.initialStep];
  expect(slowing.seconds).toBeCloseTo(7.5);
  expect(slowing.worked?.title).toBe('Worked step: 7.50 → 7.60 seconds');
  expect(slowing.worked?.note).toContain('Negative acceleration brakes the character');
  const start = run.motion.frames[0];
  expect(start.values).toMatchObject({ distance: '100.0', speed: '0.0', desired: '16.0' });
  expect(start.worked?.lines.join(' ')).toContain('(16.00 − 0.00) / 0.40 ≈ 40.00');
  expect(start.worked?.lines.join(' ')).toContain('0.00 + (1.20 × 0.10) ≈ 0.12');
  const last = run.motion.frames.at(-1);
  expect(last?.values).toMatchObject({ distance: '0.0', speed: '0.0', desired: '0.0' });
  expect(last?.worked?.title).toBe('At rest at 24.00 seconds');
  expect(last?.worked?.note).toContain('Both conditions pass');
  expect(run.comparison?.findings[0]).toContain('overshooting the target by 3.93 units');
  expect(run.timeline?.series.map((series) => series.values.length)).toEqual([241, 241]);
});

it('keeps every run of its inputs inside the drawing and the chart', () => {
  const run = model({ ...parameters, slowRadius: 4, maxAcceleration: 4 });
  const { maxX } = run.motion.bounds;
  expect(Math.max(...run.motion.frames.map(({ bodies }) => bodies[0].x))).toBeLessThan(maxX);
  const chart = run.comparison?.timeline;
  const highest = Math.max(...(chart?.series.flatMap(({ values }) => values) ?? []));
  expect(highest).toBeLessThan(chart?.yRange?.[1] ?? 0);
  const wide = model({ ...parameters, slowRadius: 60 }).motion.bounds;
  expect(wide.maxY).toBeGreaterThanOrEqual(60);
  expect(wide.maxX).toBeGreaterThanOrEqual(160);
});

it('keeps a run that comes back past the target on the velocity chart', () => {
  const chart = model({ ...parameters, slowRadius: 4, maxAcceleration: 4 }).timeline;
  const lowest = Math.min(...(chart?.series.flatMap(({ values }) => values) ?? []));
  expect(lowest).toBeLessThan(0);
  expect(chart?.yRange?.[0]).toBeLessThanOrEqual(lowest);
  expect(chart?.yTicks).toContain(chart?.yRange?.[0]);
  expect(model(parameters).timeline?.yRange).toEqual([0, 16]);
});

it('says so when an input makes the two compared runs the same', () => {
  const findings = model({ ...parameters, slowRadius: 8 }).comparison?.findings ?? [];
  expect(findings).toHaveLength(1);
  expect(findings[0]).toContain('so they are the same run');
  expect(findings[0]).toContain('overshooting the target by 3.93 units');
});

it('states the values a reader changed where the example describes them', () => {
  const run = model({ ...parameters, slowRadius: 20, maxAcceleration: 9 });
  expect(run.motion.frames[0].values).toMatchObject({ slowRadius: '20', maxAcceleration: '9' });
});

it('stays true past the target, where a late-braking input takes the character', () => {
  const run = model({ ...parameters, slowRadius: 8 });
  expect(run.comparison?.timeline.reference).toBe(100);
  const frames = run.motion.frames;
  const returning = frames.findIndex(
    (frame) => frame.bodies[0].x > example.target && (frame.vectors?.[0].dx ?? 0) < 0,
  );
  expect(returning).toBeGreaterThan(0);
  const frame = frames[returning];
  expect(frame.note).toContain('has passed the target');
  expect(frame.worked?.lines[1]).toContain('|100.00 − 10');
  expect(frame.worked?.lines[2]).toContain('sign(100.00 − 10');
  expect(frame.worked?.note).toContain('Negative acceleration builds speed toward the target');
  const outbound = frames.findIndex(
    (candidate) => candidate.bodies[0].x > example.target && (candidate.vectors?.[0].dx ?? 0) > 0,
  );
  expect(frames[outbound].worked?.note).toContain('still moving away from the target');
});
