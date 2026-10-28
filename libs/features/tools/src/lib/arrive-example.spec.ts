import { createCatalogLoader } from '@dotln-angular/catalog';

import {
  arriveExample,
  arriveFrames,
  arriveStudyId,
  calculateArriveStep,
  desiredVelocity,
  stepArrive,
} from './arrive-example';
import { arriveLimitExampleView } from './arrive-limit-example';

it('attaches the authored study to the bundled Arrive row', async () => {
  const tools = await createCatalogLoader().load('aifg');
  expect(tools.find((tool) => tool.id === arriveStudyId)?.title).toBe('Arrive');
});

it('works through the first acceleration cap and a braking step with concrete values', () => {
  const first = calculateArriveStep({ position: 0, velocity: 0 });
  expect(first).toMatchObject({
    distance: 100,
    desired: 16,
    requestedAcceleration: 40,
    acceleration: 12,
    settled: false,
  });
  expect(first.next.velocity).toBeCloseTo(1.2);
  expect(first.next.position).toBeCloseTo(0.12);
  const braking = calculateArriveStep({ position: 82, velocity: 12 });
  expect(braking).toMatchObject({
    distance: 18,
    desired: 8,
    requestedAcceleration: -10,
    acceleration: -10,
    settled: false,
    next: { position: 83.1, velocity: 11 },
  });
  expect(calculateArriveStep({ position: 99.9, velocity: 0.2 })).toMatchObject({
    settled: true,
    next: { position: 100, velocity: 0 },
  });
});

it('approaches a fixed target, slows down and settles without exceeding its motion limits', () => {
  const frames = arriveFrames();
  expect(frames).toHaveLength(arriveExample.steps + 1);
  expect(frames[0]).toEqual({ position: 0, velocity: 0 });
  for (const [index, frame] of frames.entries()) {
    expect(Number.isFinite(frame.position)).toBe(true);
    expect(Math.abs(frame.velocity)).toBeLessThanOrEqual(arriveExample.maxSpeed);
    if (index > 0 && frame.position !== arriveExample.target) {
      expect(
        Math.abs(frame.velocity - frames[index - 1].velocity) / arriveExample.timeStep,
      ).toBeLessThanOrEqual(arriveExample.maxAcceleration + 1e-10);
    }
  }
  expect(frames[75].velocity).toBeLessThan(frames[40].velocity);
  expect(frames[75].velocity).toBeGreaterThan(desiredVelocity(frames[75].position));
  expect(frames.at(-1)).toEqual({ position: 100, velocity: 0 });
});

it('brakes a moving character at the target instead of falsely treating distance alone as arrival', () => {
  expect(stepArrive({ position: 100, velocity: 10 })).toEqual({ position: 100.88, velocity: 8.8 });
  expect(stepArrive({ position: 100, velocity: 0 })).toEqual({ position: 100, velocity: 0 });
  expect(desiredVelocity(110)).toBeLessThan(0);
});

it('shows overshoot from late braking with the same start and motion limits', () => {
  const normal = arriveFrames();
  const late = arriveFrames(8);
  expect(late.slice(0, 41)).toEqual(normal.slice(0, 41));
  expect(Math.max(...normal.map((frame) => frame.position))).toBe(100);
  expect(Math.max(...late.map((frame) => frame.position))).toBeCloseTo(103.93, 2);
  expect(late.some((frame) => frame.velocity < 0)).toBe(true);
  expect(late.at(-1)).toEqual({ position: 100, velocity: 0 });
  for (const [index, frame] of late.entries()) {
    expect(Math.abs(frame.velocity)).toBeLessThanOrEqual(arriveExample.maxSpeed);
    if (index > 0 && frame.position !== arriveExample.target) {
      expect(
        Math.abs(frame.velocity - late[index - 1].velocity) / arriveExample.timeStep,
      ).toBeLessThanOrEqual(arriveExample.maxAcceleration + 1e-10);
    }
  }
});

it('labels the late-braking chart on the same scales as its plotted runs', () => {
  const view = arriveLimitExampleView();
  expect(view.positionTicks).toEqual([
    { label: '110', y: 47 },
    { label: '100', y: 82 },
    { label: '75', y: 169.5 },
    { label: '50', y: 257 },
  ]);
  expect(view.timeTicks).toEqual([
    { label: '4', x: 50 },
    { label: '8', x: 223.33 },
    { label: '12', x: 396.67 },
    { label: '16', x: 570 },
  ]);
  const xs = view.cases[0].points.split(' ').map((point) => Number(point.split(',')[0]));
  expect(xs.at(0)).toBe(view.timeTicks.at(0)?.x);
  expect(xs.at(-1)).toBe(view.timeTicks.at(-1)?.x);
  // The lines sit on the same scales, so each label stays on its own grid or target line.
  expect(view.gridPath).toBe('M 50 40 H 570 M 50 162.5 H 570 M 50 250 H 570');
  expect(view.targetPath).toBe('M 50 75 H 570');
  expect(view.axisPath).toBe('M 50 40 V 250 H 570');
});
