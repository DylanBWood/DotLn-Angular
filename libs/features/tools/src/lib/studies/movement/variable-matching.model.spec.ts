import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import {
  calculateVariableMatchingStep,
  model,
  variableMatchingFrames,
  type VariableMatchingParameters,
} from './variable-matching.model';

const example: VariableMatchingParameters = {
  skiffStart: 0,
  initialVelocity: 0,
  pilotStart: 8,
  pilotVelocity: 4,
  correctionDirection: 1,
  responseTime: 1,
  maxAcceleration: 3,
  maxSpeed: 8,
  timeStep: 0.5,
  steps: 24,
  matchingTolerance: 0.05,
  bodyRadius: 0.5,
  arrowSeconds: 1,
  arrowLane: 3,
  padding: 4,
};
const parameters: StudyParameters = { ...example };

const viewOf = (input: StudyParameters = parameters): MotionStudyModel => {
  return model(input, studyTranslate);
};

it('uses the Variable matching row and the same parameters as its record', async () => {
  const loader = createCatalogLoader();
  const record = await loader.study('aifg-a:108');
  const tools = await loader.load('aifg');
  expect(tools.find(({ id }) => id === record?.id)?.title).toBe('Variable matching');
  expect(record?.example.parameters).toEqual(parameters);
});

it('works through a capped correction followed by an unclipped correction', () => {
  const first = calculateVariableMatchingStep(
    { skiffPosition: 0, skiffVelocity: 0, pilotPosition: 8 },
    example,
  );
  expect(first).toEqual({
    velocityError: 4,
    correctionTarget: 4,
    requestedAcceleration: 4,
    acceleration: 3,
    trialVelocity: 1.5,
    next: { skiffPosition: 0.75, skiffVelocity: 1.5, pilotPosition: 10 },
  });
  const second = calculateVariableMatchingStep(first.next, example);
  expect(second).toEqual({
    velocityError: 2.5,
    correctionTarget: 4,
    requestedAcceleration: 2.5,
    acceleration: 2.5,
    trialVelocity: 2.75,
    next: { skiffPosition: 2.125, skiffVelocity: 2.75, pilotPosition: 12 },
  });
});

it('reduces velocity error while retaining the distance lost before the pace agrees', () => {
  const states = variableMatchingFrames(example);
  expect(states).toHaveLength(25);
  for (const [step, state] of states.entries()) {
    expect(state.skiffVelocity).toBeGreaterThanOrEqual(0);
    expect(state.skiffVelocity).toBeLessThanOrEqual(example.pilotVelocity);
    if (step === 0) continue;
    const before = states[step - 1];
    const error = example.pilotVelocity - state.skiffVelocity;
    const previousError = example.pilotVelocity - before.skiffVelocity;
    expect(error).toBeLessThan(previousError);
    expect(state.pilotPosition - state.skiffPosition).toBeGreaterThan(
      before.pilotPosition - before.skiffPosition,
    );
    expect((state.skiffVelocity - before.skiffVelocity) / example.timeStep).toBeLessThanOrEqual(
      example.maxAcceleration,
    );
    if (step > 1) expect(error).toBeCloseTo(previousError * 0.5, 10);
  }
  const last = states[states.length - 1];
  expect(example.pilotVelocity - last.skiffVelocity).toBeLessThan(example.matchingTolerance);
  expect(last.pilotPosition - last.skiffPosition).toBeCloseTo(10.5, 5);
  expect(last.pilotPosition - last.skiffPosition).toBeGreaterThan(
    example.pilotStart - example.skiffStart,
  );
});

it('does not correct position when velocity is already matched', () => {
  const close = calculateVariableMatchingStep(
    { skiffPosition: 0, skiffVelocity: 4, pilotPosition: 8 },
    example,
  );
  const far = calculateVariableMatchingStep(
    { skiffPosition: 0, skiffVelocity: 4, pilotPosition: 80 },
    example,
  );
  expect(close.acceleration).toBe(0);
  expect(far.acceleration).toBe(0);
  expect(close.next).toEqual({
    skiffPosition: 2,
    skiffVelocity: 4,
    pilotPosition: 10,
  });
  expect(far.next.skiffVelocity).toBe(close.next.skiffVelocity);
  expect(far.next.pilotPosition - far.next.skiffPosition).toBe(80);
});

it('makes the inverse grow velocity error until the speed cap prevents further growth', () => {
  const inverse = { ...example, correctionDirection: -1 };
  const first = calculateVariableMatchingStep(
    { skiffPosition: 0, skiffVelocity: 0, pilotPosition: 8 },
    inverse,
  );
  expect(first).toMatchObject({
    velocityError: 4,
    correctionTarget: -4,
    requestedAcceleration: -4,
    acceleration: -3,
    next: { skiffPosition: -0.75, skiffVelocity: -1.5, pilotPosition: 10 },
  });
  const states = variableMatchingFrames(inverse);
  for (const [step, state] of states.entries()) {
    expect(Math.abs(state.skiffVelocity)).toBeLessThanOrEqual(example.maxSpeed);
    if (step === 0) continue;
    expect(example.pilotVelocity - state.skiffVelocity).toBeGreaterThanOrEqual(
      example.pilotVelocity - states[step - 1].skiffVelocity,
    );
  }
  const last = states[states.length - 1];
  const before = states[states.length - 2];
  expect(last.skiffVelocity).toBe(-8);
  expect(example.pilotVelocity - last.skiffVelocity).toBe(12);
  expect(last.pilotPosition - last.skiffPosition).toBeCloseTo(143.25, 8);
  expect(last.pilotPosition - last.skiffPosition).toBeGreaterThan(
    before.pilotPosition - before.skiffPosition,
  );
  expect(viewOf().comparison?.timeline.series[1].values.at(-1)).toBe(12);
  expect(viewOf().comparison?.findings[0]).toContain('position gap 143.25 units');
});

it('cannot match a target pace beyond the motor speed limit', () => {
  const tooFast = { ...example, pilotVelocity: 10 };
  const states = variableMatchingFrames(tooFast);
  const last = states[states.length - 1];
  expect(last.skiffVelocity).toBe(8);
  expect(tooFast.pilotVelocity - last.skiffVelocity).toBe(2);
  expect(calculateVariableMatchingStep(last, tooFast).acceleration).toBeGreaterThan(0);
});

it('shows the same selected variable in its arrows, chart, text and worked step', () => {
  const view = viewOf();
  expect(view.initialStep).toBe(1);
  expect(view.moments).toHaveLength(4);
  const frame = view.motion.frames[view.initialStep];
  expect(frame.values).toMatchObject({
    velocityError: '2.50',
    positionGap: '9.25',
    acceleration: '2.50',
    nextVelocity: '2.75',
    errorMultiplier: '0.50',
  });
  expect(frame.worked?.lines[2]).toContain('(4.00 − 1.50) / 1.00 = 2.50');
  expect(frame.worked?.note).toContain('error × 0.50');
  expect(view.motion.frames[0].worked?.note).toContain('A limit clips this update');
  expect(frame.vectors?.[1].dx).toBe(example.pilotVelocity * example.arrowSeconds);
  expect(view.timeline?.series[0].values[view.initialStep]).toBe(2.5);
  expect(view.timeline?.seconds).toHaveLength(view.motion.frames.length);
  expect(view.motion.frames.at(-1)?.note).toContain('position is not the variable being matched');
});

it('keeps both boats and arrow endpoints in bounds at the input extremes', () => {
  for (const responseTime of [0.5, 2]) {
    for (const maxAcceleration of [1, 6]) {
      const view = viewOf({ ...parameters, responseTime, maxAcceleration });
      const { minX, maxX, minY, maxY } = view.motion.bounds;
      for (const frame of view.motion.frames) {
        const xs = [
          ...frame.bodies.map(({ x }) => x),
          ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
        ];
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(minX);
        expect(Math.max(...xs)).toBeLessThanOrEqual(maxX);
        expect(minY).toBeLessThanOrEqual(-example.arrowLane);
        expect(maxY).toBeGreaterThanOrEqual(example.arrowLane);
      }
      expect(view.motion.frames[0].values['responseTime']).toBe(responseTime.toFixed(2));
      expect(view.motion.frames[0].values['maxAcceleration']).toBe(maxAcceleration.toFixed(2));
    }
  }
  expect(model(parameters, studyTranslate)).toEqual(model(parameters, studyTranslate));
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
