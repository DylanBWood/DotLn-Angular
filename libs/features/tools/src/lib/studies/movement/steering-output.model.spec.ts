import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { loadStudy } from '@dotln-angular/tools/testing';

import { studyTranslate } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import {
  applySteeringOutput,
  model,
  outputAt,
  type OutputParameters,
  type OutputState,
  outputSteps,
} from './steering-output.model';

const record = await loadStudy('aifg-a:94');
const example: OutputParameters = {
  initialX: 0,
  initialY: 0,
  initialVelocityX: 2,
  initialVelocityY: 0,
  initialHeading: 0,
  initialRotation: 0,
  linearAccelerationX: 0,
  linearAccelerationY: 2,
  angularAcceleration: 0.5,
  pulseSeconds: 1,
  comparisonLinearAccelerationY: 0,
  timeStep: 0.25,
  steps: 16,
};
const parameters: StudyParameters = { ...example };
const initial: OutputState = {
  position: { x: 0, y: 0 },
  velocity: { x: 2, y: 0 },
  heading: 0,
  rotation: 0,
};
const runModel = (inputs: StudyParameters = parameters) => {
  return model(inputs, studyTranslate);
};

it('binds the record, example, executable and mechanism blocks to its catalog row', async () => {
  expect(record.slug).toBe('steering-output');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable.module).toBe(record.visual.model);
  expect(record.pseudocode.ordinary.split(/\n\s*\n/)).toHaveLength(record.mechanism.steps.length);
  const ids = new Set((await createCatalogLoader().load('aifg')).map(({ id }) => id));
  expect(record.nearby.every(({ id }) => ids.has(id))).toBe(true);
});

it('applies one linear and angular output with arithmetic a reader can check', () => {
  const output = outputAt(0, example);
  expect(output).toEqual({ linear: { x: 0, y: 2 }, angular: 0.5 });
  expect(applySteeringOutput(initial, output, 0.25)).toEqual({
    velocity: { x: 2, y: 0.5 },
    rotation: 0.125,
    position: { x: 0.5, y: 0.125 },
    heading: 0.03125,
  });
  expect(initial).toEqual({
    position: { x: 0, y: 0 },
    velocity: { x: 2, y: 0 },
    heading: 0,
    rotation: 0,
  });
});

it('clears both output channels at the pulse boundary and keeps existing motion', () => {
  expect(outputAt(0.75, example)).toEqual({
    linear: { x: 0, y: 2 },
    angular: 0.5,
  });
  expect(outputAt(1, example)).toEqual({ linear: { x: 0, y: 0 }, angular: 0 });
  const run = outputSteps(example);
  expect(run[4].state).toEqual({
    position: { x: 2, y: 1.25 },
    velocity: { x: 2, y: 2 },
    heading: 0.3125,
    rotation: 0.5,
  });
  expect(run[4].next).toEqual({
    position: { x: 2.5, y: 1.75 },
    velocity: { x: 2, y: 2 },
    heading: 0.4375,
    rotation: 0.5,
  });
  expect(run[16].state).toEqual({
    position: { x: 8, y: 7.25 },
    velocity: { x: 2, y: 2 },
    heading: 1.8125,
    rotation: 0.5,
  });
  for (const step of run.slice(4)) {
    expect(step.output).toEqual({ linear: { x: 0, y: 0 }, angular: 0 });
    expect(step.next.velocity).toEqual(step.state.velocity);
    expect(step.next.rotation).toBe(step.state.rotation);
    expect(step.next.position).not.toEqual(step.state.position);
    expect(step.next.heading).toBeGreaterThan(step.state.heading);
  }
});

it('shows that angular output alone cannot redirect a world-coordinate velocity', () => {
  const run = outputSteps(example);
  const withoutSidewaysThrust = outputSteps(example, 0);
  for (const [index, step] of run.entries()) {
    const comparison = withoutSidewaysThrust[index];
    expect(comparison.state.heading).toBe(step.state.heading);
    expect(comparison.state.rotation).toBe(step.state.rotation);
    expect(comparison.state.position.x).toBe(step.state.position.x);
    expect(comparison.state.position.y).toBe(0);
    expect(comparison.state.velocity).toEqual({ x: 2, y: 0 });
  }
  expect(withoutSidewaysThrust[16].state.position).toEqual({ x: 8, y: 0 });
  expect(withoutSidewaysThrust[16].state.heading).toBe(1.8125);
  const turned = applySteeringOutput(
    { ...initial, heading: Math.PI / 2 },
    outputAt(0, example),
    example.timeStep,
  );
  expect(turned.velocity).toEqual(run[0].next.velocity);
});

it('makes the integration and pulse-sampling limits explicit', () => {
  const fine = outputSteps(example)[4].state;
  const coarse = outputSteps({ ...example, timeStep: 0.5, steps: 8 })[2].state;
  expect(coarse.velocity).toEqual(fine.velocity);
  expect(coarse.rotation).toBe(fine.rotation);
  expect(coarse.position.y).toBe(1.5);
  expect(fine.position.y).toBe(1.25);
  expect(coarse.heading).toBe(0.375);
  expect(fine.heading).toBe(0.3125);
  const betweenSamples = outputSteps({ ...example, pulseSeconds: 0.6 });
  expect(betweenSamples[2].output.angular).toBe(0.5);
  expect(betweenSamples[3].output.angular).toBe(0);
  expect(betweenSamples[3].state.rotation).toBe(0.375);
});

it('opens after the pulse and connects every prose placeholder to every frame', () => {
  const run = runModel();
  expect(run.initialStep).toBe(4);
  expect(run.motion.frames).toHaveLength(17);
  expect(run.motion.frames[4].values).toMatchObject({
    seconds: '1.00',
    position: '(2.00, 1.25)',
    velocity: '(2.00, 2.00)',
    heading: '0.31',
    rotation: '0.50',
    linearOutput: '(0.00, 0.00)',
    angularOutput: '0.00',
    comparisonPosition: '(2.00, 0.00)',
    finalY: '7.25',
    comparisonFinalY: '0.00',
  });
  expect(run.motion.frames[4].note).toContain('keeps the velocity and turning rate');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(0.50, 0.13) units');
  const placeholders = [...JSON.stringify(record).matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(
    (match) => match[1],
  );
  for (const frame of run.motion.frames) {
    for (const name of placeholders) expect(frame.values[name]).toBeDefined();
  }
  expect(run.timeline?.series[0].values).toEqual(
    outputSteps(example).map(({ state }) => state.rotation),
  );
  expect(run.comparison?.timeline.series[1].values).toEqual(Array.from({ length: 17 }, () => 0));
  expect(runModel({ ...parameters, linearAccelerationY: 0 }).comparison?.findings[0]).toContain(
    'coincide',
  );
  expect(runModel({ ...parameters, pulseSeconds: 2 }).initialStep).toBe(8);
  expect(model(parameters, studyTranslate)).toEqual(model(parameters, studyTranslate));
});

it('keeps both tugs and the velocity arrows inside the drawing for the offered inputs', () => {
  for (const linearAccelerationY of [0, 3]) {
    for (const pulseSeconds of [0.5, 2]) {
      const run = runModel({
        ...parameters,
        linearAccelerationY,
        pulseSeconds,
      });
      const { minX, maxX, minY, maxY } = run.motion.bounds;
      for (const [index, frame] of run.motion.frames.entries()) {
        const points = [
          ...frame.bodies,
          ...(frame.marks ?? []),
          ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
            { x, y },
            { x: x + dx, y: y + dy },
          ]),
        ];
        for (const { x, y } of points) {
          expect(x).toBeGreaterThan(minX);
          expect(x).toBeLessThan(maxX);
          expect(y).toBeGreaterThan(minY);
          expect(y).toBeLessThan(maxY);
        }
        expect(motionDrawing(run.motion, index).viewBox).not.toContain('NaN');
      }
      const comparison = run.comparison;
      if (!comparison) throw new Error('Steering output compares the linear pulse.');
      expect(timelineDrawing(comparison.timeline, null).series).toHaveLength(2);
    }
  }
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
