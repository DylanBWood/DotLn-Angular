import type { StudyParameters } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  type IterativeTargetingParameters,
  model,
  searchTarget,
  simulateTargetFlight,
  targetFlightStep,
} from './iterative-targeting.model';

const record = await loadStudy('aifg-a:166');
const example: IterativeTargetingParameters = {
  targetX: 6,
  launchSpeed: 10,
  gravity: 10,
  drag: 0.2,
  timeStep: 0.1,
  flightSteps: 40,
  lowerAngle: 0,
  upperAngle: 40,
  tolerance: 0.02,
  maxIterations: 10,
  shortBudget: 2,
  guessSeconds: 1,
};
const parameters: StudyParameters = { ...example };

it('uses the assigned record, exact example parameters and one pseudocode block per step', () => {
  expect(record.id).toBe('aifg-a:166');
  expect(record.slug).toBe('iterative-targeting');
  expect(record.example.parameters).toEqual(example);
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  expect(record.pseudocode.rxjs).toBeNull();
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('works through launch components and velocity-before-position integration by hand', () => {
  const flight = simulateTargetFlight(30, example);
  const start = flight.points[0];
  expect(start.vx).toBeCloseTo(5 * Math.sqrt(3), 8);
  expect(start.vy).toBeCloseTo(5, 8);
  const next = targetFlightStep(start, example);
  expect(next.vx).toBeCloseTo(5 * Math.sqrt(3) * 0.98, 8);
  expect(next.vy).toBeCloseTo(3.9, 8);
  expect(next.x).toBeCloseTo(0.5 * Math.sqrt(3) * 0.98, 8);
  expect(next.height).toBeCloseTo(0.39, 8);
  expect(next.seconds).toBe(0.1);
});

it('measures the first ground crossing rather than the last airborne point', () => {
  const flight = simulateTargetFlight(30, example);
  const before = flight.points[flight.points.length - 2];
  const impact = flight.points[flight.points.length - 1];
  const after = targetFlightStep(before, example);
  const fraction = before.height / (before.height - after.height);
  expect(before.height).toBeGreaterThan(0);
  expect(after.height).toBeLessThan(0);
  expect(fraction).toBeGreaterThan(0);
  expect(fraction).toBeLessThan(1);
  expect(impact.height).toBe(0);
  expect(impact.x).toBeCloseTo(before.x + fraction * (after.x - before.x), 10);
  expect(impact.seconds).toBeCloseTo(before.seconds + fraction * example.timeStep, 10);
  expect(flight.range).toBe(impact.x);
  expect(simulateTargetFlight(0, example).range).toBe(0);
});

it('bisects the launch-angle bracket and accepts only a completed miss inside tolerance', () => {
  const result = searchTarget(example);
  expect(result.status).toBe('hit');
  expect(result.attempts.length).toBeLessThanOrEqual(example.maxIterations);
  expect(result.attempts[0].angle).toBe(20);
  expect(result.attempts[0].error).toBeLessThan(0);
  expect(result.attempts[1].angle).toBe(30);
  expect(result.attempts[1].error).toBeGreaterThan(0);
  for (const [index, attempt] of result.attempts.entries()) {
    expect(attempt.flight.range).not.toBeNull();
    expect(attempt.angle).toBe((attempt.lowerAngle + attempt.upperAngle) / 2);
    expect(attempt.nextUpper - attempt.nextLower).toBe(
      (attempt.upperAngle - attempt.lowerAngle) / 2,
    );
    const low = simulateTargetFlight(attempt.lowerAngle, example).range;
    const high = simulateTargetFlight(attempt.upperAngle, example).range;
    if (low === null || high === null || attempt.error === null)
      throw new Error('Completed bracket required.');
    expect((low - example.targetX) * (high - example.targetX)).toBeLessThanOrEqual(0);
    if (index < result.attempts.length - 1)
      expect(Math.abs(attempt.error)).toBeGreaterThan(example.tolerance);
  }
  const last = result.attempts[result.attempts.length - 1];
  expect(Math.abs(last.error ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(example.tolerance);
  expect(searchTarget(example)).toEqual(result);
});

it('accepts an endpoint already in tolerance without spending a midpoint guess', () => {
  const upper = simulateTargetFlight(example.upperAngle, example).range;
  if (upper === null) throw new Error('The upper endpoint reaches the ground.');
  const endpoint = searchTarget({ ...example, targetX: upper });
  expect(endpoint.status).toBe('hit');
  expect(endpoint.attempts).toEqual([]);
  expect(endpoint.endpointHit?.angle).toBe(example.upperAngle);
  const view = model({ ...parameters, targetX: upper });
  expect(view.motion.frames[0].note).toContain('without a midpoint guess');
  expect(view.motion.frames[0].values['error']).toBe('0.00');
});

it('reports the genuine remaining miss when only the midpoint budget is reduced', () => {
  const normal = searchTarget(example);
  const short = searchTarget(example, example.shortBudget);
  expect(short.attempts).toEqual(normal.attempts.slice(0, 2));
  expect(short.status).toBe('budget-exhausted');
  expect(short.attempts).toHaveLength(2);
  for (const { error } of short.attempts)
    expect(Math.abs(error ?? 0)).toBeGreaterThan(example.tolerance);
  const comparison = model(parameters).comparison;
  expect(comparison?.findings.join(' ')).toContain('budget-exhausted after 2');
  const shortValues = comparison?.timeline.series[1].values ?? [];
  expect(shortValues[shortValues.length - 1]).toBeGreaterThan(example.tolerance);
  expect(shortValues.slice(2).every((value) => value === shortValues[2])).toBe(true);
});

it('rejects an unusable bracket without claiming the target is unreachable everywhere', () => {
  const tooFar = searchTarget({ ...example, targetX: 10 });
  expect(tooFar.status).toBe('unbracketed');
  expect(tooFar.attempts).toEqual([]);
  const twoArcs = { ...example, lowerAngle: 10, upperAngle: 80 };
  expect(searchTarget(twoArcs).status).toBe('unbracketed');
  expect(simulateTargetFlight(40, twoArcs).range).toBeGreaterThan(example.targetX);
  const held = model({ ...parameters, targetX: 10 });
  expect(held.motion.frames).toHaveLength(2);
  expect(held.motion.frames.every(({ values }) => values['status'] === 'unbracketed')).toBe(true);
  expect(held.motion.frames[0].note).toContain('same side');
});

it('refuses a flight without a measured impact and exposes model mismatch as a real miss', () => {
  const unfinished = { ...example, flightSteps: 1 };
  expect(simulateTargetFlight(example.upperAngle, unfinished).range).toBeNull();
  expect(searchTarget(unfinished)).toMatchObject({ status: 'flight-unfinished', attempts: [] });
  const view = model({ ...parameters, flightSteps: 1 });
  expect(view.timeline).toBeNull();
  expect(view.comparison).toBeUndefined();
  const normal = searchTarget(example);
  const accepted = normal.attempts[normal.attempts.length - 1];
  const altered = simulateTargetFlight(accepted.angle, { ...example, drag: 0.4 });
  expect(Math.abs((altered.range ?? Number.POSITIVE_INFINITY) - example.targetX)).toBeGreaterThan(
    example.tolerance,
  );
});

it('keeps the diagram, arithmetic, live inputs, chart and accessible prose on the same run', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.motion.frames.length).toBe(searchTarget(example).attempts.length + 1);
  expect(run.motion.frames.length).toBeLessThanOrEqual(240);
  expect(run.motion.frames[0].values['status']).toBe('bracket-ready');
  expect(run.motion.frames[1].values['angle']).toBe('20.00');
  expect(run.motion.frames[2].values['angle']).toBe('30.00');
  expect(run.motion.frames[2].worked?.lines.join(' ')).toContain('(20.00 + 40.00) / 2 = 30.00');
  expect(run.motion.frames[2].worked?.lines.join(' ')).toContain('3.90');
  expect(motionDrawing(run.motion, run.initialStep).bodies).toHaveLength(2);
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const offered = run.inputs ?? [];
  const cases = [
    parameters,
    ...offered.flatMap(({ name, min, max }) =>
      [min, max].map((value) => ({ ...parameters, [name]: value })),
    ),
  ];
  for (const changed of cases) {
    const view = model(changed);
    expect(view.motion.frames.length).toBeGreaterThan(1);
    for (const moment of view.moments) expect(view.motion.frames[moment.step]).toBeDefined();
    for (const frame of view.motion.frames) {
      for (const text of texts) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
      const points = [
        ...frame.bodies,
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
      ];
      for (const { x, y } of points) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(view.motion.bounds.minX);
        expect(x).toBeLessThanOrEqual(view.motion.bounds.maxX);
        expect(y).toBeGreaterThanOrEqual(view.motion.bounds.minY);
        expect(y).toBeLessThanOrEqual(view.motion.bounds.maxY);
      }
    }
    for (const chart of [view.timeline, view.comparison?.timeline]) {
      if (!chart) continue;
      for (const series of chart.series) {
        expect(series.values).toHaveLength(chart.seconds.length);
        expect(series.values.every(Number.isFinite)).toBe(true);
      }
      expect(
        timelineDrawing(chart, view.initialStep).series.every(
          ({ points }) => !/NaN|Infinity/.test(points),
        ),
      ).toBe(true);
    }
  }
});
