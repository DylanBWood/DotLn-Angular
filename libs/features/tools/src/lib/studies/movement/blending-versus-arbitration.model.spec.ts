import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import {
  calculateCombinationStep,
  type CombinationParameters,
  combinationStates,
  combineRequests,
  marshalSignal,
  model,
} from './blending-versus-arbitration.model';

const example: CombinationParameters = {
  startX: 0,
  marshalX: -30,
  targetX: 30,
  maxAcceleration: 6,
  maxSpeed: 4,
  marshalWeight: 1,
  goalWeight: 1,
  holdSeconds: 1,
  fadeSeconds: 2,
  epsilon: 0.5,
  timeStep: 0.25,
  steps: 20,
  heavierWeight: 2,
};
const parameters: StudyParameters = { ...example };
const initial = { position: 0, velocity: 0 };

it('attaches these parameters to the Blending versus arbitration row', async () => {
  const record = await createCatalogLoader().study('aifg-a:143');
  expect(record?.slug).toBe('blending-versus-arbitration');
  expect(record?.example.parameters).toEqual(example);
});

it('runs the same opposing engine seek requests through both public combiners', () => {
  const blend = calculateCombinationStep(initial, 0, example, 'blend');
  const priority = calculateCombinationStep(initial, 0, example, 'priority');
  expect(blend.marshal).toEqual({ x: -6, y: 0 });
  expect(blend.goal).toEqual({ x: 6, y: 0 });
  expect(blend.blended).toEqual({ x: 0, y: 0 });
  expect(blend.arbitrated).toEqual({ x: -6, y: 0 });
  expect(blend.next).toEqual(initial);
  expect(priority.winner).toBe('marshal');
  expect(priority.next).toEqual({ velocity: -1.5, position: -0.375 });
});

it('shows a continuous sampled fade and an abrupt acceleration handover at its end', () => {
  expect(marshalSignal(0, example)).toBe(1);
  expect(marshalSignal(1, example)).toBe(1);
  expect(marshalSignal(1.25, example)).toBe(0.875);
  expect(marshalSignal(2.75, example)).toBe(0.125);
  expect(marshalSignal(3, example)).toBe(0);
  expect(marshalSignal(5, example)).toBe(0);
  const before = calculateCombinationStep(initial, 2.75, example, 'priority');
  const after = calculateCombinationStep(initial, 3, example, 'priority');
  expect(before.blended.x).toBe(5.25);
  expect(before.arbitrated.x).toBe(-0.75);
  expect(before.winner).toBe('marshal');
  expect(after.blended.x).toBe(6);
  expect(after.arbitrated.x).toBe(6);
  expect(after.winner).toBe('destination');
  expect(after.arbitrated.x - before.arbitrated.x).toBe(6.75);
  expect(after.blended.x - before.blended.x).toBe(0.75);
});

it('uses a strict epsilon test and silence when neither capped group qualifies', () => {
  const goal = { x: 6, y: 0 };
  expect(combineRequests({ x: -0.5, y: 0 }, goal, example).winner).toBe('destination');
  expect(combineRequests({ x: -0.5, y: 0 }, goal, example).arbitrated).toEqual(goal);
  expect(combineRequests({ x: -0.500001, y: 0 }, goal, example).winner).toBe('marshal');
  const silent = combineRequests({ x: -0.5, y: 0 }, { x: 0.5, y: 0 }, example);
  expect(silent.winner).toBe('none');
  expect(silent.arbitrated).toEqual({ x: 0, y: 0 });
});

it('demonstrates that a larger weight changes balance without granting precedence', () => {
  const original = calculateCombinationStep(initial, 0, example, 'blend');
  const heavier = calculateCombinationStep(initial, 0, example, 'blend', 2);
  expect(original.acceleration).toBe(0);
  expect(heavier.acceleration).toBe(-6);
  expect(heavier.marshalGroup.x).toBe(-6);
  const fading = calculateCombinationStep(initial, 2.25, example, 'blend', 2);
  expect(fading.signal).toBe(0.375);
  expect(fading.marshal.x).toBe(-2.25);
  expect(fading.marshalGroup.x).toBe(-4.5);
  expect(fading.blended.x).toBe(1.5);
  expect(fading.arbitrated.x).toBe(-4.5);
  expect(fading.winner).toBe('marshal');
});

it('keeps velocity continuous through a winner change and respects both motion caps', () => {
  const blended = combinationStates(example, 'blend');
  const priority = combinationStates(example, 'priority');
  expect(blended).toHaveLength(21);
  expect(blended.slice(0, 6).every(({ position }) => position === 0)).toBe(true);
  expect(priority[12].velocity).toBeCloseTo(-4);
  expect(priority[13].velocity).toBeCloseTo(-2.5);
  expect(priority[13].position).toBeLessThan(priority[12].position);
  expect(blended.at(-1)?.position).toBeGreaterThan(0);
  expect(priority.at(-1)?.velocity).toBeGreaterThan(0);
  for (const policy of ['blend', 'priority'] as const) {
    const states = combinationStates(example, policy);
    for (const [step, state] of states.entries()) {
      const calculation = calculateCombinationStep(state, step * example.timeStep, example, policy);
      expect(Math.abs(calculation.acceleration)).toBeLessThanOrEqual(6);
      expect(Math.abs(state.velocity)).toBeLessThanOrEqual(4 + 1e-10);
      if (step > 0)
        expect(Math.abs(state.velocity - states[step - 1].velocity)).toBeLessThanOrEqual(
          1.5 + 1e-10,
        );
    }
  }
});

it('makes the drawing, chart, worked calculation and weight comparison inspectable together', () => {
  const run = model(parameters);
  expect(run).toEqual(model(parameters));
  expect(run.initialStep).toBe(12);
  expect(run.motion.frames).toHaveLength(21);
  expect(run.motion.frames[0].values).toMatchObject({
    signal: '1.00',
    blendAcceleration: '0.00',
    priorityAcceleration: '-6.00',
    winner: 'marshal',
  });
  const selected = run.motion.frames[12];
  expect(selected.values).toMatchObject({
    elapsed: '3.00',
    signal: '0.00',
    blendAcceleration: '6.00',
    priorityAcceleration: '6.00',
    winner: 'destination',
  });
  expect(selected.worked?.lines.join(' ')).toContain('Selected: destination');
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([21, 21]);
  expect(run.comparison?.timeline.series[0].values[0]).toBe(0);
  expect(run.comparison?.timeline.series[1].values[0]).toBe(-6);
  expect(run.comparison?.findings[1]).toContain('At 2.25 s');
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    const points = [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
      ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
    ];
    for (const { x, y } of points) {
      expect(x).toBeGreaterThan(minX);
      expect(x).toBeLessThan(maxX);
      expect(y).toBeGreaterThan(minY);
      expect(y).toBeLessThan(maxY);
    }
    expect(frame.values['winner']).toBeDefined();
    expect(Object.values(frame.values).every((value) => !value.includes('NaN'))).toBe(true);
  }
});
