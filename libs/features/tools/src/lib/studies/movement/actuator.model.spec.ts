import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import { actuatorFrames, type ActuatorParameters, actuatorStep, model } from './actuator.model';

const example: ActuatorParameters = {
  beltSpeed: 6,
  impossibleSpeed: 12,
  initialSpeed: 0,
  maxSpeed: 8,
  maxAcceleration: 3,
  responseTime: 0.5,
  timeStep: 0.25,
  steps: 48,
};
const parameters: StudyParameters = { ...example };

const motionModel = (values: StudyParameters = parameters) => {
  return model(values, studyTranslate);
};

it('uses the draft record parameters for the Actuator row', async () => {
  const record = await createCatalogLoader().study('aifg-a:157');
  expect(record?.slug).toBe('actuator');
  expect(record?.example.parameters).toEqual(parameters);
});

it('turns the agreed velocity into an engine acceleration output and applies a hand-checkable step', () => {
  const first = actuatorStep({ position: 0, velocity: 0 }, example);
  expect(first).toEqual({
    agreed: 6,
    feasible: 6,
    rawAcceleration: 12,
    acceleration: 3,
    next: { position: 0.1875, velocity: 0.75 },
  });
  const catchingUp = actuatorStep({ position: 3.9375, velocity: 4.5 }, example);
  expect(catchingUp.rawAcceleration).toBe(3);
  expect(catchingUp.acceleration).toBe(3);
  expect(catchingUp.next).toEqual({ position: 5.25, velocity: 5.25 });
  const close = actuatorStep({ position: 5.25, velocity: 5.25 }, example);
  expect(close.acceleration).toBe(1.5);
  expect(close.next.velocity).toBe(5.625);
});

it('matches a feasible velocity gradually without closing the marker position gap', () => {
  const states = actuatorFrames(example);
  expect(states).toHaveLength(example.steps + 1);
  expect(states[0]).toEqual({ position: 0, velocity: 0 });
  expect(states[6]).toEqual({ position: 3.9375, velocity: 4.5 });
  expect(states.at(-1)?.velocity).toBeCloseTo(example.beltSpeed, 8);
  expect(
    example.beltSpeed * example.steps * example.timeStep - (states.at(-1)?.position ?? 0),
  ).toBeCloseTo(5.4375, 7);
  for (const [index, state] of states.entries()) {
    const calculation = actuatorStep(state, example);
    expect(calculation.feasible).toBe(6);
    expect(Math.abs(calculation.acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    expect(state.velocity).toBeLessThanOrEqual(example.maxSpeed);
    if (index > 0) {
      expect(state.velocity).toBeGreaterThanOrEqual(states[index - 1].velocity);
      expect(state.position).toBeLessThan(example.beltSpeed * index * example.timeStep);
    }
  }
});

it('caps an infeasible velocity channel while preserving the unmet original agreement', () => {
  const first = actuatorStep({ position: 0, velocity: 0 }, example, example.impossibleSpeed);
  expect(first).toMatchObject({
    agreed: 12,
    feasible: 8,
    rawAcceleration: 16,
    acceleration: 3,
  });
  const normal = actuatorFrames(example);
  const impossible = actuatorFrames(example, example.impossibleSpeed);
  expect(impossible[0]).toEqual(normal[0]);
  for (let index = 0; index <= 6; index++) {
    expect(impossible[index].velocity).toBeCloseTo(normal[index].velocity, 10);
    expect(impossible[index].position).toBeCloseTo(normal[index].position, 10);
  }
  expect(impossible.at(-1)?.velocity).toBeCloseTo(example.maxSpeed, 8);
  expect(example.impossibleSpeed - (impossible.at(-1)?.velocity ?? 0)).toBeCloseTo(4, 8);
  expect(impossible.every(({ velocity }) => velocity <= example.maxSpeed)).toBe(true);
  for (const [index, state] of impossible.entries()) {
    expect(
      Math.abs(actuatorStep(state, example, example.impossibleSpeed).acceleration),
    ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    if (index > 0)
      expect(
        Math.abs(state.velocity - impossible[index - 1].velocity) / example.timeStep,
      ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
  }
  const capable = actuatorFrames({ ...example, maxSpeed: 14 }, example.impossibleSpeed);
  expect(capable.at(-1)?.velocity).toBeCloseTo(example.impossibleSpeed, 7);
});

it('does not accelerate a courier already matching the agreed velocity', () => {
  const matched = actuatorStep({ position: 10, velocity: 6 }, example);
  expect(matched.acceleration).toBe(0);
  expect(matched.next).toEqual({ position: 11.5, velocity: 6 });
});

it('provides the same values, output and arithmetic to the drawing and the reading', () => {
  const run = motionModel();
  expect(run.motion.frames[0].values).toMatchObject({
    elapsed: '0.00',
    position: '0.00',
    markerPosition: '0.00',
    positionGap: '0.00',
    speed: '0.00',
    agreed: '6.00',
    feasible: '6.00',
    acceleration: '3.00',
    speedGap: '6.00',
    beltSpeed: '6',
    impossibleSpeed: '12',
    initialSpeed: '0',
    maxSpeed: '8',
    maxAcceleration: '3',
    responseTime: '0.5',
    timeStep: '0.25',
    duration: '12.00',
  });
  expect(run.motion.frames[0].worked?.lines[2]).toContain('(6.00 − 0.00) / 0.50 = 12.00');
  expect(run.motion.frames[0].worked?.lines[5]).toContain('0.00 + 0.75 × 0.25 = 0.19');
  expect(run.motion.frames[1].bodies[0].x).toBe(0.1875);
  expect(run.motion.frames[1].bodies[1].x).toBe(1.5);
  expect(run.motion.frames.at(-1)?.note).toContain('does not close a position gap');
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([49, 49, 49]);
  expect(run.comparison?.timeline.reference).toBe(example.maxSpeed);
  expect(run.comparison?.findings[1]).toContain('gap of 4.00 units/s');
  expect(run.moments).toHaveLength(4);
});

it('reruns its inputs deterministically and keeps bodies, arrows and chart series visible', () => {
  for (const beltSpeed of [2, 6, 12]) {
    for (const maxSpeed of [4, 8, 14]) {
      const changed = { ...parameters, beltSpeed, maxSpeed };
      const run = motionModel(changed);
      expect(model(changed, studyTranslate)).toEqual(run);
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
      expect(run.motion.frames[0].values['beltSpeed']).toBe(String(beltSpeed));
      expect(run.motion.frames[0].values['maxSpeed']).toBe(String(maxSpeed));
    }
  }
  expect(motionModel({ ...parameters, maxSpeed: 14 }).comparison?.findings[2]).toContain(
    'now fits the speed capability',
  );
  const same = motionModel({ ...parameters, beltSpeed: 12 });
  expect(same.comparison?.timeline.series[0].values).toEqual(
    same.comparison?.timeline.series[1].values,
  );
  expect(same.comparison?.note).toContain('same run');
});

it('translates presentation at the boundary while preserving computed motion', () => {
  const english = model(parameters, studyTranslate);
  const translated = model(
    parameters,
    (key, values) => `translated: ${studyTranslate(key, values)}`,
  );

  expect(translated.caption).toBe(`translated: ${english.caption}`);
  expect(translated.motion.frames[0].note).toMatch(/^translated: /);
  expect(translated.motion.frames[0].worked?.title).toMatch(/^translated: /);
  expect(translated.timeline?.title).toMatch(/^translated: /);
  expect(translated.comparison?.title).toMatch(/^translated: /);
  expect(translated.motion.bounds).toEqual(english.motion.bounds);
  expect(
    translated.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  ).toEqual(
    english.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  );
});
