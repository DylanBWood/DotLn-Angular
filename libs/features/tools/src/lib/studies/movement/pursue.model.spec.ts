import type { StudyParameters } from '@dotln-angular/models';
import { distance, length } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import type { StudyPoint } from '../study-model';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  calculatePursueStep,
  model,
  predictionTime,
  pursueFrames,
  type PursueParameters,
  runnerAt,
} from './pursue.model';

const record = await loadStudy('aifg-a:120');

const example: PursueParameters = {
  startX: 0,
  startY: 0,
  velocityX: 0,
  velocityY: 4,
  targetX: 0,
  targetY: 12,
  targetVelocityX: 4.5,
  targetVelocityY: 0,
  turnedVelocityX: -4.5,
  turnedVelocityY: 0,
  maxSpeed: 8,
  maxAcceleration: 8,
  maxPrediction: 2,
  turnAt: 20,
  comparisonTurnAt: 1,
  tagRadius: 2,
  timeStep: 0.1,
  steps: 80,
  velocitySeconds: 1,
  accelerationSecondsSquared: 0.5,
};
const parameters: StudyParameters = { ...example };

it('uses the authored Pursue record and exactly its example parameters', () => {
  expect(record.id).toBe('aifg-a:120');
  expect(record.example.parameters).toEqual(parameters);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable.module).toBe(record.visual.model);
});

it('works the capped prediction, normalisation and first movement by hand', () => {
  const first = calculatePursueStep(
    { position: { x: 0, y: 0 }, velocity: { x: 0, y: 4 } },
    { position: { x: 0, y: 12 }, velocity: { x: 4.5, y: 0 } },
    example,
  );
  expect(first.distance).toBe(12);
  expect(first.speed).toBe(4);
  expect(first.prediction).toBe(2); // min(2, 12 / 4)
  expect(first.predicted).toEqual({ x: 9, y: 12 }); // (0, 12) + (4.5, 0) * 2
  expect(first.acceleration.x).toBeCloseTo(4.8); // 9 / 15 * 8
  expect(first.acceleration.y).toBeCloseTo(6.4); // 12 / 15 * 8
  expect(first.next.velocity.x).toBeCloseTo(0.48);
  expect(first.next.velocity.y).toBeCloseTo(4.64);
  expect(first.next.position.x).toBeCloseTo(0.048);
  expect(first.next.position.y).toBeCloseTo(0.464);
});

it('caps at rest and shortens the horizon using current speed rather than relative or maximum speed', () => {
  expect(predictionTime(12, 0, example.maxPrediction)).toBe(2);
  expect(predictionTime(1, 4, example.maxPrediction)).toBe(0.25);
  expect(predictionTime(0, 4, example.maxPrediction)).toBe(0);
  const ash = { position: { x: 0, y: 11 }, velocity: { x: 0, y: 4 } };
  const reed = { position: { x: 0, y: 12 }, velocity: { x: 4.5, y: 0 } };
  const near = calculatePursueStep(ash, reed, example);
  expect(near.prediction).toBe(0.25);
  expect(near.predicted).toEqual({ x: 1.125, y: 12 });
  expect(calculatePursueStep(ash, reed, { ...example, maxSpeed: 80 }).prediction).toBe(0.25);
  expect(
    calculatePursueStep(
      { ...ash, velocity: { x: 4, y: 0 } },
      { ...reed, velocity: { x: -4.5, y: 0 } },
      example,
    ).prediction,
  ).toBe(0.25);
  const resting = calculatePursueStep({ ...ash, velocity: { x: 0, y: 0 } }, reed, example);
  expect(resting.prediction).toBe(example.maxPrediction);
  expect(resting.predicted).toEqual({ x: 9, y: 12 });
  const stationary = calculatePursueStep(ash, { ...reed, velocity: { x: 0, y: 0 } }, example);
  expect(stationary.predicted).toEqual(reed.position);
  expect(stationary.acceleration).toEqual({ x: 0, y: 8 });
});

it('leads steady Reed, enters tag range and continues without an arrival or contact latch', () => {
  const frames = pursueFrames(example);
  expect(frames).toHaveLength(example.steps + 1);
  const shortened = frames.findIndex(
    ({ calculation }) => calculation.prediction < example.maxPrediction,
  );
  const tagged = frames.findIndex(({ calculation }) => calculation.distance <= example.tagRadius);
  expect(shortened).toBeGreaterThan(0);
  expect(tagged).toBeGreaterThan(shortened);
  expect(frames[tagged + 1].ash.position).not.toEqual(frames[tagged].ash.position);
  expect(length(frames[tagged].ash.velocity)).toBeGreaterThan(0);
  expect(distance(frames[tagged].ash.velocity, frames[tagged].reed.velocity)).toBeGreaterThan(0);
  expect(Math.min(...frames.map(({ calculation }) => calculation.distance))).toBeGreaterThan(0);
  expect(pursueFrames({ ...example, tagRadius: 24 })).toEqual(frames);
  for (const [step, frame] of frames.entries()) {
    expect(frame.calculation.prediction).toBeGreaterThanOrEqual(0);
    expect(frame.calculation.prediction).toBeLessThanOrEqual(example.maxPrediction);
    expect(frame.calculation.predicted.y).toBe(example.targetY);
    expect(frame.calculation.predicted.x).toBeGreaterThanOrEqual(frame.reed.position.x);
    expect(frame.forecastError).toBeCloseTo(0, 10);
    expect(length(frame.ash.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-10);
    expect(length(frame.calculation.acceleration)).toBeLessThanOrEqual(
      example.maxAcceleration + 1e-10,
    );
    if (step > 0)
      expect(distance(frame.ash.velocity, frames[step - 1].ash.velocity)).toBeLessThanOrEqual(
        example.maxAcceleration * example.timeStep + 1e-10,
      );
  }
  const coincident = calculatePursueStep(
    { position: { x: 0, y: 12 }, velocity: { x: 0, y: 4 } },
    { position: { x: 0, y: 12 }, velocity: { x: 4.5, y: 0 } },
    example,
  );
  expect(coincident.prediction).toBe(0);
  expect(coincident.acceleration).toEqual({ x: 0, y: 0 });
  expect(coincident.next).toEqual({ position: { x: 0, y: 12.4 }, velocity: { x: 0, y: 4 } });
});

it('misses the reversed runner by a hand-checkable amount without leaking the future into steering', () => {
  const changed = { ...example, turnAt: example.comparisonTurnAt };
  const normal = pursueFrames(example);
  const turned = pursueFrames(changed);
  expect(runnerAt(1, changed)).toEqual({
    position: { x: 4.5, y: 12 },
    velocity: { x: -4.5, y: 0 },
  });
  expect(runnerAt(2, changed).position).toEqual({ x: 0, y: 12 });
  expect(turned[0].calculation.predicted).toEqual({ x: 9, y: 12 });
  expect(turned[0].forecastError).toBe(9);
  expect(normal[0].forecastError).toBe(0);
  const turnStep = example.comparisonTurnAt / example.timeStep;
  for (let step = 0; step < turnStep; step++) {
    expect(turned[step].ash).toEqual(normal[step].ash);
    expect(turned[step].reed).toEqual(normal[step].reed);
    expect(turned[step].calculation).toEqual(normal[step].calculation);
  }
  expect(turned[turnStep].ash).toEqual(normal[turnStep].ash);
  expect(turned[turnStep].calculation.acceleration).not.toEqual(
    normal[turnStep].calculation.acceleration,
  );
  expect(turned[turnStep + 1].ash).not.toEqual(normal[turnStep + 1].ash);
  expect(Math.max(...turned.map(({ forecastError }) => forecastError))).toBeGreaterThan(9);
  for (const frame of turned.slice(turnStep)) expect(frame.forecastError).toBeCloseTo(0, 10);
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(
    normal.map(({ forecastError }) => forecastError),
  );
  expect(comparison?.timeline.series[1].values).toEqual(
    turned.map(({ forecastError }) => forecastError),
  );
  expect(comparison?.findings[0]).toContain('first forecast miss by 9.00 units');
});

it('cannot catch a faster Reed running directly away, even with a longer horizon', () => {
  const changed = {
    ...example,
    startY: example.targetY,
    velocityX: example.maxSpeed,
    velocityY: 0,
    targetX: example.targetY,
    targetVelocityX: example.maxSpeed * 2,
    turnedVelocityX: example.maxSpeed * 2,
    maxPrediction: example.maxPrediction * 2,
  };
  const frames = pursueFrames(changed);
  for (const [step, frame] of frames.entries())
    expect(frame.calculation.distance).toBeCloseTo(12 + 8 * step * example.timeStep);
  expect(frames.at(-1)?.calculation.distance).toBeCloseTo(76);
});

it('does not constrain the seek step to a route around a quay wall', () => {
  const wall = example.targetY / 2;
  const step = calculatePursueStep(
    { position: { x: wall - 0.1, y: example.targetY }, velocity: { x: example.maxSpeed, y: 0 } },
    {
      position: { x: example.targetY, y: example.targetY },
      velocity: { x: example.targetVelocityX, y: 0 },
    },
    example,
  );
  expect(step.acceleration).toEqual({ x: example.maxAcceleration, y: 0 });
  expect(step.next.position.x).toBeGreaterThan(wall);
});

it('keeps the drawing, prose, worked numbers and chart on the same run', () => {
  const run = model(record.example.parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.motion.frames).toHaveLength(81);
  expect(run.moments).toHaveLength(4);
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const names = texts.flatMap(placeholdersIn);
  const bounds = run.motion.bounds;
  const inBounds = ({ x, y }: StudyPoint) => {
    expect(x).toBeGreaterThanOrEqual(bounds.minX);
    expect(x).toBeLessThanOrEqual(bounds.maxX);
    expect(y).toBeGreaterThanOrEqual(bounds.minY);
    expect(y).toBeLessThanOrEqual(bounds.maxY);
  };
  for (const [step, frame] of run.motion.frames.entries()) {
    expect(frame.seconds).toBeCloseTo(step * example.timeStep);
    expect(frame.bodies).toHaveLength(2);
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    for (const text of texts) expect(fillValues(text, frame.values)).not.toMatch(/\{[a-zA-Z]/);
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) inBounds(point);
    for (const vector of frame.vectors ?? [])
      inBounds({ x: vector.x + vector.dx, y: vector.y + vector.dy });
    for (const zone of frame.zones ?? []) {
      inBounds({ x: zone.x - zone.radius, y: zone.y - zone.radius });
      inBounds({ x: zone.x + zone.radius, y: zone.y + zone.radius });
    }
  }
  const first = run.motion.frames[0];
  expect(first.values['predictedX']).toBe('9.00');
  expect(first.values['predictedY']).toBe('12.00');
  expect(first.worked?.lines.join(' ')).toContain('min(2.00, 12.00 / 4.00) ≈ 2.00');
  expect(first.worked?.lines.join(' ')).toContain('(0.05, 0.46)');
  expect(run.motion.frames[run.initialStep].note).toContain('shorter lookahead');
  const tagged = run.moments.find(({ label }) => label === 'In tag range');
  if (!tagged || !run.timeline) throw new Error('The example must show the tag measurement.');
  expect(run.motion.frames[tagged.step].note).toContain('steering still pulls');
  expect(run.timeline.series[0].values).toHaveLength(run.motion.frames.length);
  const chart = timelineDrawing(run.timeline, 0);
  expect(chart.series[0].dot).toEqual({ x: 50, y: 40 });
  expect(chart.referencePath).toBe('M 50 215 H 570');
  for (const moment of run.moments) {
    expect(moment.step).toBeGreaterThanOrEqual(0);
    expect(moment.step).toBeLessThan(run.motion.frames.length);
  }
});

it('moves the aim further ahead and increases reversal error with a longer prediction cap', () => {
  const input = model(parameters).inputs?.find(({ name }) => name === 'maxPrediction');
  if (!input) throw new Error('Pursue must expose the prediction cap.');
  const short = model({ ...parameters, maxPrediction: input.min });
  const long = model({ ...parameters, maxPrediction: input.max });
  expect(short.motion.frames[0].marks?.[0].x).toBeCloseTo(1.125);
  expect(long.motion.frames[0].marks?.[0].x).toBeCloseTo(13.5);
  expect(short.motion.frames[0].values['leadDistance']).toBe('1.13');
  expect(long.motion.frames[0].values['leadDistance']).toBe('13.50');
  expect(short.motion.frames[0].worked?.lines.join(' ')).toContain(
    'min(0.25, 12.00 / 4.00) ≈ 0.25',
  );
  expect(long.motion.frames[0].worked?.lines.join(' ')).toContain('min(3.00, 12.00 / 4.00) ≈ 3.00');
  expect(short.timeline?.series[0].values).not.toEqual(long.timeline?.series[0].values);
  const shortError = short.comparison?.timeline.series[1].values ?? [];
  const longError = long.comparison?.timeline.series[1].values ?? [];
  expect(Math.max(...shortError)).toBeGreaterThan(0);
  expect(Math.max(...longError)).toBeGreaterThan(Math.max(...shortError));
  expect(short.comparison?.findings[0]).toContain('ends before Reed reverses');
  expect(long.comparison?.findings[0]).toContain('miss by 18.00 units');
});

it('keeps every offered cap readable with truthful moments, outcomes and separated names', () => {
  const input = model(parameters).inputs?.[0];
  if (!input) throw new Error('Pursue must offer a live input.');
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (let value = input.min; value <= input.max; value += input.step) {
    const run = model({ ...parameters, [input.name]: value });
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(Number.isFinite(minX + maxX + minY + maxY)).toBe(true);
    expect(maxX).toBeGreaterThan(minX);
    expect(maxY).toBeGreaterThan(minY);
    expect(run.initialStep >= 0 && run.initialStep < run.motion.frames.length).toBe(true);
    for (const moment of run.moments) {
      expect(moment.step >= 0 && moment.step < run.motion.frames.length).toBe(true);
      if (moment.label === 'In tag range')
        expect(Number(run.motion.frames[moment.step].values['distance'])).toBeLessThanOrEqual(
          example.tagRadius,
        );
      if (moment.label === 'Lead shortens')
        expect(Number(run.motion.frames[moment.step].values['prediction'])).toBeLessThanOrEqual(
          value,
        );
    }
    for (const [step, frame] of run.motion.frames.entries()) {
      expect(frame.note?.match(/[.!?]/g)).toHaveLength(1);
      expect(frame.note).not.toMatch(/\d|\([^)]*,[^)]*\)/);
      const prose = texts.map((text) => fillValues(text, frame.values));
      expect(prose.join(' ')).not.toMatch(/\{[a-zA-Z]/);
      expect(prose[0]).not.toMatch(/\([^)]*,[^)]*\)/);
      const shown = [
        ...Object.values(frame.values),
        ...prose,
        frame.note ?? '',
        frame.worked?.title ?? '',
        ...(frame.worked?.lines ?? []),
        frame.worked?.note ?? '',
      ];
      expect(shown.join(' ')).not.toMatch(/\d+\.\d{3,}/);
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
        ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
          { x: x - radius, y: y - radius },
          { x: x + radius, y: y + radius },
        ]),
      ];
      for (const { x, y } of points)
        expect(Number.isFinite(x + y) && x >= minX && x <= maxX && y >= minY && y <= maxY).toBe(
          true,
        );
      const drawing = motionDrawing(run.motion, step);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label !== null);
      expect(labels.map(({ label }) => label).sort()).toEqual(['Aim', 'Ash', 'Reed']);
      for (const [index, label] of labels.entries()) {
        const halfWidth = (label.label?.length ?? 0) * 8;
        expect(label.x - halfWidth >= 0 && label.x + halfWidth <= 600 && label.labelY >= 24).toBe(
          true,
        );
        for (const vector of drawing.vectors) {
          const entirelyBeside =
            Math.min(vector.x1, vector.x2) > label.x + halfWidth + 6 ||
            Math.max(vector.x1, vector.x2) < label.x - halfWidth - 6;
          const entirelyAboveOrBelow =
            Math.min(vector.y1, vector.y2) > label.labelY + 10 ||
            Math.max(vector.y1, vector.y2) < label.labelY - 30;
          expect(entirelyBeside || entirelyAboveOrBelow).toBe(true);
        }
        for (const other of labels.slice(index + 1))
          expect(
            Math.abs(label.labelY - other.labelY) >= 24 ||
              Math.abs(label.x - other.x) >= halfWidth + (other.label?.length ?? 0) * 8,
          ).toBe(true);
      }
    }
    const entered = run.motion.frames.some(
      ({ values }) => Number(values['distance']) <= example.tagRadius,
    );
    expect(run.motion.frames[0].values['tagOutcome']).toContain(
      entered ? 'enters tag range' : 'stays outside tag range',
    );
    expect(
      [run.caption, run.comparison?.intro, ...(run.comparison?.findings ?? [])].join(' '),
    ).not.toMatch(/\d+\.\d{3,}/);
  }
});
