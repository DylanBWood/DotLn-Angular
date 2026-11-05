import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import {
  model,
  motorControlFrames,
  type MotorControlParameters,
  motorControlStep,
} from './motor-control.model';

const example: MotorControlParameters = {
  initialSpeed: 6,
  steeringLimit: 12,
  motorBrake: 4,
  weakBrake: 1,
  responseTime: 0.2,
  timeStep: 0.1,
  steps: 100,
  stopLine: 6,
};
const parameters: StudyParameters = { ...example };

const motionModel = (values: StudyParameters = parameters) => {
  return model(values);
};

it('uses the draft record parameters for the Motor control row', async () => {
  const record = await createCatalogLoader().study('aifg-a:192');
  expect(record?.slug).toBe('motor-control');
  expect(record?.example.parameters).toEqual(parameters);
});

it('works through an engine braking request and a stricter motor cap by hand', () => {
  const step = motorControlStep({ position: 0, velocity: 6 }, example);
  expect(step).toMatchObject({ rawRequest: -30, requested: -12, applied: -4 });
  expect(step.next.velocity).toBeCloseTo(5.6);
  expect(step.next.position).toBeCloseTo(0.56);
  const withinCapability = motorControlStep({ position: 4.16, velocity: 0.8 }, example);
  expect(withinCapability.requested).toBeCloseTo(-4);
  expect(withinCapability.applied).toBeCloseTo(-4);
  expect(withinCapability.next.velocity).toBeCloseTo(0.4);
  expect(withinCapability.next.position).toBeCloseTo(4.2);
});

it('keeps motor acceleration bounded while velocity falls and distance still increases', () => {
  const states = motorControlFrames(example);
  expect(states).toHaveLength(example.steps + 1);
  expect(states[0]).toEqual({ position: 0, velocity: 6 });
  for (const [index, state] of states.entries()) {
    const step = motorControlStep(state, example);
    expect(step.applied).toBeGreaterThanOrEqual(-example.motorBrake);
    expect(step.applied).toBeLessThanOrEqual(0);
    expect(Math.abs(step.requested)).toBeLessThanOrEqual(example.steeringLimit + 1e-10);
    expect(state.velocity).toBeGreaterThanOrEqual(0);
    if (index > 0) {
      expect(state.velocity).toBeLessThanOrEqual(states[index - 1].velocity);
      expect(state.position).toBeGreaterThanOrEqual(states[index - 1].position);
      expect((states[index - 1].velocity - state.velocity) / example.timeStep).toBeLessThanOrEqual(
        example.motorBrake + 1e-10,
      );
    }
  }
  expect(states.at(-1)?.position).toBeCloseTo(4.24);
  expect(states.every(({ position }) => position < example.stopLine)).toBe(true);
  // The model neither snaps the cart to a location nor declares a small positive speed zero.
  expect(states.at(-1)?.velocity).toBeGreaterThan(0);
  expect(states.at(-1)?.velocity).toBeLessThan(0.01);
});

it('cannot reverse the cart with its brake, including a step large enough to reach zero', () => {
  expect(motorControlStep({ position: 2, velocity: 0 }, example).next).toEqual({
    position: 2,
    velocity: 0,
  });
  expect(
    motorControlStep({ position: 2, velocity: 0.1 }, { ...example, timeStep: 1 }).next,
  ).toEqual({ position: 2, velocity: 0 });
});

it('shows a weaker motor crossing the safety line despite obeying every braking limit', () => {
  const normal = motorControlFrames(example);
  const weak = motorControlFrames(example, example.weakBrake);
  expect(weak[0]).toEqual(normal[0]);
  expect(weak[1].velocity).toBeCloseTo(5.9);
  expect(weak[1].position).toBeCloseTo(0.59);
  expect(weak.at(-1)?.position).toBeCloseTo(17.71);
  const crossing = weak.findIndex(({ position }) => position > example.stopLine);
  expect(crossing).toBeGreaterThan(0);
  expect(weak[crossing + 1].position).toBeGreaterThan(weak[crossing].position);
  for (const [index, state] of weak.entries()) {
    expect(
      Math.abs(motorControlStep(state, example, example.weakBrake).applied),
    ).toBeLessThanOrEqual(example.weakBrake);
    if (index > 0)
      expect((weak[index - 1].velocity - state.velocity) / example.timeStep).toBeLessThanOrEqual(
        example.weakBrake + 1e-10,
      );
  }
});

it('supplies every narrated value and works through the same first step as the motion', () => {
  const run = motionModel();
  const start = run.motion.frames[0];
  expect(start.values).toMatchObject({
    position: '0.00',
    speed: '6.00',
    requested: '-12.00',
    applied: '-4.00',
    remaining: '6.00',
    initialSpeed: '6',
    steeringLimit: '12',
    motorBrake: '4',
    weakBrake: '1',
    responseTime: '0.2',
    timeStep: '0.1',
    stopLine: '6',
    duration: '10.00',
  });
  expect(start.vectors?.map(({ dx }) => dx)).toEqual([-12, -4]);
  expect(start.worked?.lines[0]).toContain('= -30.00 units/s²');
  expect(start.worked?.lines[4]).toContain('0.00 + 5.60 × 0.10 = 0.56');
  expect(run.comparison?.findings.join(' ')).toContain('17.71');
  expect(run.comparison?.timeline.reference).toBe(example.stopLine);
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([101, 101]);
  expect(run.moments).toHaveLength(4);
  expect(run.initialStep).toBe(0);
});

it('reruns its inputs deterministically and keeps positions, arrows and charts within bounds', () => {
  for (const initialSpeed of [2, 6, 10]) {
    for (const motorBrake of [1, 4, 6]) {
      const changed = { ...parameters, initialSpeed, motorBrake };
      const run = motionModel(changed);
      expect(model(changed)).toEqual(run);
      const { minX, maxX, minY, maxY } = run.motion.bounds;
      for (const frame of run.motion.frames) {
        for (const body of frame.bodies) {
          expect(body.x).toBeGreaterThanOrEqual(minX);
          expect(body.x).toBeLessThanOrEqual(maxX);
          expect(body.y).toBeGreaterThanOrEqual(minY);
          expect(body.y).toBeLessThanOrEqual(maxY);
        }
        for (const vector of frame.vectors ?? []) {
          expect(vector.x + vector.dx).toBeGreaterThanOrEqual(minX);
          expect(vector.x + vector.dx).toBeLessThanOrEqual(maxX);
        }
      }
      const chart = run.comparison?.timeline;
      expect(Math.max(...(chart?.series.flatMap(({ values }) => values) ?? []))).toBeLessThan(
        chart?.yRange?.[1] ?? 0,
      );
      expect(run.motion.frames[0].values['motorBrake']).toBe(String(motorBrake));
      expect(run.motion.frames[0].values['initialSpeed']).toBe(String(initialSpeed));
    }
  }
  const same = motionModel({ ...parameters, motorBrake: 1 });
  expect(same.comparison?.timeline.series[0].values).toEqual(
    same.comparison?.timeline.series[1].values,
  );
  expect(same.comparison?.note).toContain('same run');
});
