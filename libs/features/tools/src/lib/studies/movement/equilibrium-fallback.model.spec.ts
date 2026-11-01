import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { length } from '@dotln-angular/scene-engine';
import { loadStudy } from '@dotln-angular/tools/testing';

import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import type { StudyPoint } from '../study-model';
import {
  calculateEquilibriumStep,
  type EquilibriumParameters,
  equilibriumSteps,
  model,
} from './equilibrium-fallback.model';

const record = await loadStudy('aifg-a:151');

const example: EquilibriumParameters = {
  initialX: 0,
  initialY: 0,
  initialVelocityX: 0,
  initialVelocityY: 0,
  headingX: 0,
  headingY: 1,
  beaconHalfSpan: 6,
  beaconY: 0,
  beaconWeight: 1,
  maxSpeed: 5,
  maxAcceleration: 4,
  radius: 0.5,
  wanderAngle: 0,
  wanderRadius: 1,
  wanderOffset: 2,
  responseTime: 0.5,
  fallbackWeight: 1,
  weakFallbackWeight: 0.02,
  epsilon: 0.1,
  timeStep: 0.1,
  steps: 80,
};
const parameters: StudyParameters = { ...example };
const rest = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };

it('uses the assigned record and the same inputs as the worked calculations', async () => {
  expect(record.id).toBe('aifg-a:151');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(record.pseudocode.ordinary.split(/\n\s*\n/)).toHaveLength(record.mechanism.steps.length);
  const rows = await createCatalogLoader().load('aifg');
  const ids = new Set<string>(rows.map(({ id }) => id));
  expect(record.nearby.every(({ id }) => ids.has(id))).toBe(true);
});

it('cancels two full requests and works the first fallback updates by hand', () => {
  const first = calculateEquilibriumStep(rest, example);
  expect(first.left).toEqual({ x: -4, y: 0 });
  expect(first.right).toEqual({ x: 4, y: 0 });
  expect(first.primary).toEqual({ x: 0, y: 0 });
  expect(first.wander).toEqual({ x: 0, y: 4 });
  expect(first.fallback).toEqual({ x: 0, y: 4 });
  expect(first.activeGroup).toBe('Wander fallback');
  expect(first.next.velocity.y).toBeCloseTo(0.4, 12);
  expect(first.next.position.y).toBeCloseTo(0.04, 12);
  const second = calculateEquilibriumStep(first.next, example);
  expect(second.primary.y).toBeCloseTo(-0.053332148187653, 12);
  expect(second.fallback.y).toBeCloseTo(3.2, 12);
  expect(second.activeGroup).toBe('Wander fallback');
  expect(second.next.velocity.y).toBeCloseTo(0.72, 12);
  expect(second.next.position.y).toBeCloseTo(0.112, 12);
  const third = calculateEquilibriumStep(second.next, example);
  expect(third.primary.y).toBeCloseTo(-0.149307322945332, 12);
  expect(third.fallback.y).toBeCloseTo(2.56, 12);
  expect(third.activeGroup).toBe('Beacon blend');
  expect(third.acceleration).toEqual(third.primary);
  expect(third.next.velocity.y).toBeCloseTo(0.705069267705467, 12);
  expect(third.next.position.y).toBeCloseTo(0.182506926770547, 12);
});

it('clips a net blend and lets it win even when the fallback also requests full acceleration', () => {
  const displaced = calculateEquilibriumStep({ ...rest, position: { x: 0, y: 4.5 } }, example);
  expect(displaced.left.x).toBeCloseTo(-3.2, 12);
  expect(displaced.right.x).toBeCloseTo(3.2, 12);
  expect(displaced.left.y).toBeCloseTo(-2.4, 12);
  expect(displaced.right.y).toBeCloseTo(-2.4, 12);
  expect(displaced.primary).toEqual({ x: 0, y: -4 });
  expect(displaced.fallback).toEqual({ x: 0, y: 4 });
  expect(displaced.activeGroup).toBe('Beacon blend');
  expect(displaced.acceleration).toEqual({ x: 0, y: -4 });
});

it('rejects a fallback at or below epsilon, leaving the comparison at rest throughout', () => {
  const first = calculateEquilibriumStep(rest, example, example.weakFallbackWeight);
  expect(first.fallback).toEqual({ x: 0, y: 0.08 });
  const equal = calculateEquilibriumStep(rest, example, example.epsilon / example.maxAcceleration);
  expect(equal.fallback).toEqual({ x: 0, y: 0.1 });
  expect(equal.activeGroup).toBe('None');
  expect(first.activeGroup).toBe('None');
  expect(first.acceleration).toEqual({ x: 0, y: 0 });
  expect(first.next).toEqual(rest);
  expect(calculateEquilibriumStep(rest, example, 0.025001).activeGroup).toBe('Wander fallback');
  const weak = equilibriumSteps(example, example.weakFallbackWeight);
  expect(weak).toHaveLength(example.steps + 1);
  expect(
    weak.every(
      ({ state, activeGroup }) =>
        activeGroup === 'None' && state.position.y === 0 && length(state.velocity) === 0,
    ),
  ).toBe(true);
  const view = model(parameters);
  expect(view.comparison?.timeline.series[1].values).toEqual(weak.map(() => 0));
  expect(view.comparison?.intro).toContain('0.08 units/s²: the comparison fallback does not clear');
});

it('hands control back after a nudge but neither chooses a beacon nor guarantees a permanent escape', () => {
  const steps = equilibriumSteps(example);
  expect(steps).toHaveLength(81);
  expect(steps.findIndex(({ activeGroup }) => activeGroup === 'Beacon blend')).toBe(2);
  expect(steps.some(({ state }) => state.velocity.y < 0)).toBe(true);
  expect(steps.slice(3).some(({ activeGroup }) => activeGroup === 'Wander fallback')).toBe(true);
  expect(Math.max(...steps.map(({ state }) => Math.abs(state.position.y)))).toBeCloseTo(
    0.678728254662498,
    10,
  );
  expect(steps.every(({ state }) => state.position.x === 0)).toBe(true);
  for (const step of steps) {
    expect(length(step.acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-12);
    expect(length(step.next.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
    if (step.activeGroup === 'Beacon blend')
      expect(step.primary.y * step.state.position.y).toBeLessThan(0);
  }
});

it('cannot distinguish satisfied goals from cancellation or make zero acceleration stop momentum', () => {
  const satisfied = calculateEquilibriumStep(rest, { ...example, beaconHalfSpan: 0 });
  expect(satisfied.left).toEqual({ x: 0, y: 0 });
  expect(satisfied.right).toEqual({ x: 0, y: 0 });
  expect(satisfied.activeGroup).toBe('Wander fallback');
  expect(satisfied.next.position.y).toBeCloseTo(0.04, 12);
  const coasting = calculateEquilibriumStep({ ...rest, velocity: { x: 1, y: 0 } }, example, 0);
  expect(coasting.activeGroup).toBe('None');
  expect(coasting.next).toEqual({ position: { x: 0.1, y: 0 }, velocity: { x: 1, y: 0 } });
});

it('supplies every prose value and draws the same deterministic vectors and chart values', () => {
  const run = model(Object.freeze(parameters));
  expect(run).toEqual(model(parameters));
  expect(parameters).toEqual(record.example.parameters);
  expect(run.initialStep).toBe(0);
  expect(run.motion.frames[0].values['primaryRequest']).toBe('(0.00, 0.00)');
  expect(run.motion.frames[0].values['fallbackRequest']).toBe('(0.00, 4.00)');
  expect(run.motion.frames[0].values['firstPrimaryTime']).toBe('0.20');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain(
    '(0.00, 0.40) × 0.10 ≈ (0.00, 0.04)',
  );
  expect(run.motion.frames[2].values['activeGroup']).toBe('Beacon blend');
  const placeholders = [...JSON.stringify(record).matchAll(/\{([A-Za-z]\w*)\}/g)].map(
    (match) => match[1],
  );
  const bounds = run.motion.bounds;
  const inside = ({ x, y }: StudyPoint) => {
    expect(x).toBeGreaterThanOrEqual(bounds.minX);
    expect(x).toBeLessThanOrEqual(bounds.maxX);
    expect(y).toBeGreaterThanOrEqual(bounds.minY);
    expect(y).toBeLessThanOrEqual(bounds.maxY);
  };
  const steps = equilibriumSteps(example);
  for (const [index, frame] of run.motion.frames.entries()) {
    expect(frame.seconds).toBe(index * example.timeStep);
    for (const name of placeholders) expect(frame.values[name]).toBeDefined();
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) inside(point);
    for (const line of frame.vectors ?? []) {
      inside(line);
      inside({ x: line.x + line.dx, y: line.y + line.dy });
    }
    expect(run.timeline?.series.map(({ values }) => values[index])).toEqual([
      length(steps[index].primary),
      length(steps[index].fallback),
      length(steps[index].acceleration),
    ]);
  }
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
  expect(motionDrawing(run.motion, run.initialStep).vectors).toHaveLength(5);
  if (!run.timeline || !run.comparison) throw new Error('Equilibrium fallback needs both charts.');
  expect(
    timelineDrawing(run.timeline, run.initialStep).series.every(({ dot }) => dot !== null),
  ).toBe(true);
  expect(timelineDrawing(run.comparison.timeline, null).referencePath).not.toBeNull();
});

it('shows an absent nudge and changes handover time when the offered inputs change', () => {
  const normal = model(parameters);
  expect(normal.inputs?.map(({ name }) => name)).toEqual(['fallbackWeight', 'epsilon']);
  const silent = model({ ...parameters, fallbackWeight: 0 });
  expect(silent.motion.frames.every(({ bodies }) => bodies[0].y === example.beaconY)).toBe(true);
  expect(silent.motion.frames[0].values['primaryHandover']).toContain('never reclaims');
  expect(silent.motion.frames[0].values['returnReading']).toContain('does not move back');
  expect(silent.motion.frames.every(({ note }) => note?.endsWith('leaving Nori at rest.'))).toBe(
    true,
  );
  const higherThreshold = model({ ...parameters, epsilon: 1 });
  expect(Number(higherThreshold.motion.frames[0].values['firstPrimaryTime'])).toBeGreaterThan(
    Number(normal.motion.frames[0].values['firstPrimaryTime']),
  );
  const lowerThreshold = model({ ...parameters, epsilon: 0.05 });
  expect(lowerThreshold.comparison?.timeline.series[1].values.some((value) => value > 0)).toBe(
    true,
  );
  expect(lowerThreshold.motion.frames[0].values['comparisonStart']).toBe(
    'the comparison fallback clears the threshold',
  );
});

it('keeps every slider setting and corner finite, labelled, in bounds and true to its prose', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs).toHaveLength(2);
  const variants: StudyParameters[] = [];
  for (const input of inputs)
    for (let tick = 0; tick <= Math.round((input.max - input.min) / input.step); tick++)
      variants.push({
        ...parameters,
        [input.name]: Number((input.min + tick * input.step).toFixed(2)),
      });
  for (let corner = 0; corner < 2 ** inputs.length; corner++)
    variants.push({
      ...parameters,
      ...Object.fromEntries(
        inputs.map((input, index) => [input.name, corner & (1 << index) ? input.max : input.min]),
      ),
    });
  const names = [...JSON.stringify(record).matchAll(/\{([A-Za-z]\w*)\}/g)].map((match) => match[1]);
  for (const variant of variants) {
    const run = model(variant);
    const bounds = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(run.moments.length).toBeGreaterThanOrEqual(3);
    expect(run.moments.length).toBeLessThanOrEqual(5);
    for (const { step } of run.moments) {
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThan(run.motion.frames.length);
    }
    const inside = ({ x, y }: StudyPoint) => {
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY).toBe(
        true,
      );
    };
    for (const [index, frame] of run.motion.frames.entries()) {
      expect(frame.note).toMatch(/^[^.]+\.$/);
      expect(frame.note).not.toMatch(/\b[xy]\s*=|\([^)]*,/);
      for (const name of names) expect(frame.values[name]).toBeDefined();
      expect(
        [
          ...Object.values(frame.values),
          frame.worked?.title ?? '',
          ...(frame.worked?.lines ?? []),
        ].join(' '),
      ).not.toMatch(/\d+\.\d{3,}/);
      for (const point of [...frame.bodies, ...(frame.marks ?? [])]) inside(point);
      for (const { from, to } of frame.links ?? []) {
        inside(from);
        inside(to);
      }
      for (const arrow of frame.vectors ?? []) {
        inside(arrow);
        inside({ x: arrow.x + arrow.dx, y: arrow.y + arrow.dy });
      }
      const drawing = motionDrawing(run.motion, index);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label !== null);
      expect(labels.map(({ label }) => label).sort()).toEqual(['East', 'Nori', 'West']);
      for (const [leftIndex, left] of labels.entries())
        for (const right of labels.slice(leftIndex + 1))
          expect(
            Math.abs(left.labelY - right.labelY) >= 18 ||
              Math.abs(left.x - right.x) >=
                ((left.label?.length ?? 0) + (right.label?.length ?? 0)) * 4 + 8,
          ).toBe(true);
    }
    for (const timeline of [run.timeline, run.comparison?.timeline])
      expect(
        timeline?.series.every(
          ({ values }) =>
            values.length === run.motion.frames.length && values.every(Number.isFinite),
        ),
      ).toBe(true);
    expect(
      [run.caption, run.comparison?.intro, ...(run.comparison?.findings ?? [])].join(' '),
    ).not.toMatch(/\d+\.\d{3,}/);
  }
  expect(record.visual.textEquivalent).not.toMatch(
    /\{position\}|\{velocity\}|\{leftRequest\}|\{rightRequest\}|\b[xy]\s*=/,
  );
});
