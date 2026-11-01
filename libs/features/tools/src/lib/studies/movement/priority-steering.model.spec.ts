import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { length } from '@dotln-angular/scene-engine';
import { loadStudy } from '@dotln-angular/tools/testing';

import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import type { StudyPoint } from '../study-model';
import {
  calculatePriorityStep,
  model,
  type PriorityParameters,
  prioritySteps,
} from './priority-steering.model';

const record = await loadStudy('aifg-a:149');

const example: PriorityParameters = {
  initialPosition: 0,
  initialVelocity: 0,
  trolleyPosition: 6,
  target: 12,
  maxSpeed: 3,
  maxAcceleration: 4,
  radius: 0.5,
  separationThreshold: 3,
  separationFalloff: 1,
  separationWeight: 1,
  brakeWeight: 1,
  slowRadius: 4,
  targetRadius: 0.2,
  responseTime: 0.5,
  epsilon: 0.1,
  timeStep: 0.1,
  steps: 120,
  clearancePriority: 1,
};
const parameters: StudyParameters = { ...example };
const state = (position: number, velocity: number) => ({
  position: { x: position, y: 0 },
  velocity: { x: velocity, y: 0 },
});

it('uses the assigned record, author, example inputs and aligned mechanism blocks', async () => {
  expect(record.id).toBe('aifg-a:149');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(record.pseudocode.ordinary.split(/\n\s*\n/)).toHaveLength(record.mechanism.steps.length);
  const rows = await createCatalogLoader().load('aifg');
  const ids = new Set<string>(rows.map(({ id }) => id));
  expect(record.nearby.every(({ id }) => ids.has(id))).toBe(true);
});

it('starts with a quiet clearance group and works the first update by hand', () => {
  const first = calculatePriorityStep(state(0, 0), example);
  expect(first).toMatchObject({
    gap: 6,
    separation: { x: 0, y: 0 },
    clearance: { x: 0, y: 0 },
    travel: { x: 4, y: 0 },
    activeGroup: 'Travel',
    acceleration: { x: 4, y: 0 },
  });
  expect(first.next.velocity.x).toBeCloseTo(0.4, 12);
  expect(first.next.position.x).toBeCloseTo(0.04, 12);
  const outside = calculatePriorityStep(state(0, 2), example);
  expect(outside.brake.x).toBe(-4);
  expect(outside.clearance.x).toBe(0);
  expect(outside.activeGroup).toBe('Travel');
  expect(calculatePriorityStep(state(3, 1), example).clearance.x).toBe(0);
});

it('blends separation with braking inside a group, then chooses that group without adding Travel', () => {
  const braking = calculatePriorityStep(state(4, 1), example);
  expect(braking.gap).toBe(2);
  expect(braking.separation.x).toBeCloseTo(-4 / 3, 12);
  expect(braking.brake.x).toBe(-2);
  expect(braking.clearance.x).toBeCloseTo(-10 / 3, 12);
  expect(braking.travel.x).toBe(4);
  expect(braking.activeGroup).toBe('Clearance');
  expect(braking.acceleration.x).toBeCloseTo(-10 / 3, 12);
  expect(braking.next.velocity.x).toBeCloseTo(2 / 3, 12);
  expect(braking.next.position.x).toBeCloseTo(4 + 1 / 15, 12);
  expect(calculatePriorityStep(state(5, 3), example).clearance.x).toBe(-4);
  const reversed = calculatePriorityStep(state(4, 1), example, 2);
  expect(reversed.clearance).toEqual(braking.clearance);
  expect(reversed.travel).toEqual(braking.travel);
  expect(reversed.activeGroup).toBe('Travel');
  expect(reversed.next).toEqual(state(4.14, 1.4));
});

it('rejects equality at epsilon, returns zero when all decline and retains existing momentum', () => {
  const equal = calculatePriorityStep(state(0, 1), { ...example, epsilon: 4 });
  expect(equal.travel.x).toBe(4);
  expect(equal.activeGroup).toBe('None');
  expect(equal.acceleration).toEqual({ x: 0, y: 0 });
  expect(equal.next).toEqual(state(0.1, 1));
  expect(calculatePriorityStep(state(0, 1), { ...example, epsilon: 3.999 }).activeGroup).toBe(
    'Travel',
  );
});

it('keeps this run clear, brakes while still moving towards the trolley and keeps handing control over', () => {
  const steps = prioritySteps(example);
  expect(steps).toHaveLength(121);
  expect(steps.findIndex(({ activeGroup }) => activeGroup === 'Clearance')).toBe(15);
  expect(steps[15].acceleration.x).toBe(-4);
  expect(steps[15].next.velocity.x).toBeGreaterThan(0);
  expect(Math.min(...steps.map(({ gap }) => gap))).toBeCloseTo(1.8879665835998756, 10);
  expect(steps.every(({ gap }) => gap > example.radius * 2)).toBe(true);
  expect(steps.every(({ state: current }) => current.position.x < example.trolleyPosition)).toBe(
    true,
  );
  expect(steps.every(({ state: current }) => current.position.y === 0)).toBe(true);
  expect(
    steps.filter((step, index) => index > 0 && step.activeGroup !== steps[index - 1].activeGroup),
  ).toHaveLength(21);
  const tail = steps.slice(-20);
  expect(tail.some(({ activeGroup }) => activeGroup === 'Travel')).toBe(true);
  expect(tail.some(({ state: current }) => current.velocity.x < 0)).toBe(true);
  expect(tail.some(({ state: current }) => current.velocity.x > 0)).toBe(true);
  for (const step of steps) {
    expect(length(step.acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-12);
    expect(length(step.next.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
  }
});

it('makes touching visible when only priority order changes and does not promise safety at a larger step', () => {
  const normal = prioritySteps(example);
  const failed = prioritySteps(example, 2);
  expect(failed.slice(0, 15)).toEqual(normal.slice(0, 15));
  expect(Math.min(...failed.map(({ gap }) => gap))).toBeCloseTo(0.011876411798097, 10);
  expect(failed.filter(({ gap }) => gap <= example.radius * 2)).toHaveLength(7);
  expect(
    failed.some(
      ({ clearance, activeGroup, gap }) =>
        gap <= example.radius * 2 &&
        activeGroup === 'Travel' &&
        length(clearance) > example.epsilon,
    ),
  ).toBe(true);
  expect(
    prioritySteps({ ...example, timeStep: 1 }).some(({ gap }) => gap <= example.radius * 2),
  ).toBe(true);
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(normal.map(({ gap }) => gap));
  expect(comparison?.timeline.series[1].values).toEqual(failed.map(({ gap }) => gap));
  expect(comparison?.findings[0]).toContain('7 sampled touching moments');
});

it('keeps the prose, drawing, timeline and worked arithmetic on the same deterministic frames', () => {
  const run = model(Object.freeze(parameters));
  expect(run).toEqual(model(parameters));
  expect(parameters).toEqual(record.example.parameters);
  expect(run.initialStep).toBe(15);
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain(
    '(0.00, 0.00) + (0.40, 0.00) × 0.10 ≈ (0.04, 0.00)',
  );
  expect(run.motion.frames[15].values['activeGroup']).toBe('Clearance');
  expect(run.motion.frames[15].values['acceleration']).toBe('-4.00');
  expect(run.motion.frames[15].note).toContain('still closing');
  expect(run.motion.frames[0].values['minimumGap']).toBe('1.89');
  expect(run.motion.frames[0].values['comparisonMinimumGap']).toBe('0.01');
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
  for (const [index, frame] of run.motion.frames.entries()) {
    expect(frame.seconds).toBe(index * example.timeStep);
    for (const name of placeholders) expect(frame.values[name]).toBeDefined();
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) inside(point);
    for (const zone of frame.zones ?? []) {
      inside({ x: zone.x - zone.radius, y: zone.y - zone.radius });
      inside({ x: zone.x + zone.radius, y: zone.y + zone.radius });
    }
    for (const line of frame.vectors ?? []) {
      inside(line);
      inside({ x: line.x + line.dx, y: line.y + line.dy });
    }
    const magnitudeKeys = ['clearanceAcceleration', 'travelAcceleration', 'acceleration'];
    for (const [seriesIndex, key] of magnitudeKeys.entries())
      expect(run.timeline?.series[seriesIndex].values[index]).toBeCloseTo(
        Math.abs(Number(frame.values[key])),
        2,
      );
  }
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
  expect(motionDrawing(run.motion, run.initialStep).bodies).toHaveLength(2);
  if (!run.timeline || !run.comparison) throw new Error('Priority steering needs both charts.');
  expect(
    timelineDrawing(run.timeline, run.initialStep).series.every(({ dot }) => dot !== null),
  ).toBe(true);
  expect(timelineDrawing(run.comparison.timeline, null).referencePath).not.toBeNull();
});

it('changes the order, buffer and threshold through the offered live inputs', () => {
  const normal = model(parameters);
  expect(normal.inputs?.map(({ name }) => name)).toEqual([
    'clearancePriority',
    'separationThreshold',
    'epsilon',
  ]);
  const reversed = model({ ...parameters, clearancePriority: 2 });
  expect(
    reversed.motion.frames.some(({ values }) => Number(values['gap']) <= example.radius * 2),
  ).toBe(true);
  expect(reversed.motion.frames.some(({ note }) => note?.includes('Travel wins despite'))).toBe(
    true,
  );
  expect(reversed.comparison?.timeline.series[1].values).toEqual(
    normal.comparison?.timeline.series[0].values,
  );
  const small = model({ ...parameters, separationThreshold: 1.25 });
  const large = model({ ...parameters, separationThreshold: 5 });
  expect(Number(small.motion.frames[0].values['minimumGap'])).toBeLessThan(example.radius * 2);
  expect(Number(large.motion.frames[0].values['minimumGap'])).toBeGreaterThan(example.radius * 2);
  expect(small.motion.frames.some(({ note }) => note?.startsWith('Mica touches'))).toBe(true);
  const silent = model({ ...parameters, epsilon: 4 });
  expect(silent.motion.frames.every(({ bodies }) => bodies[0].x === example.initialPosition)).toBe(
    true,
  );
  expect(
    silent.motion.frames.every(
      ({ note }) => note === 'The threshold silences both groups, leaving Mica at rest.',
    ),
  ).toBe(true);
  expect(silent.initialStep).toBe(0);
  expect(Number(silent.motion.frames[0].values['switches'])).toBe(0);
});

it('keeps every slider setting and corner finite, labelled, in bounds and true to its prose', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs).toHaveLength(3);
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
      for (const zone of frame.zones ?? []) {
        inside({ x: zone.x - zone.radius, y: zone.y - zone.radius });
        inside({ x: zone.x + zone.radius, y: zone.y + zone.radius });
      }
      for (const arrow of frame.vectors ?? []) {
        inside(arrow);
        inside({ x: arrow.x + arrow.dx, y: arrow.y + arrow.dy });
      }
      const drawing = motionDrawing(run.motion, index);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label !== null);
      expect(labels.map(({ label }) => label).sort()).toEqual(['Bay', 'Mica', 'Trolley']);
      for (const [leftIndex, left] of labels.entries())
        for (const right of labels.slice(leftIndex + 1))
          expect(
            Math.abs(left.labelY - right.labelY) >= 18 ||
              Math.abs(left.x - right.x) >=
                ((left.label?.length ?? 0) + (right.label?.length ?? 0)) * 4 + 8,
          ).toBe(true);
    }
    for (const timeline of [run.timeline, run.comparison?.timeline]) {
      expect(
        timeline?.series.every(
          ({ values }) =>
            values.length === run.motion.frames.length && values.every(Number.isFinite),
        ),
      ).toBe(true);
    }
    expect(
      [run.caption, run.comparison?.intro, ...(run.comparison?.findings ?? [])].join(' '),
    ).not.toMatch(/\d+\.\d{3,}/);
  }
  expect(record.visual.textEquivalent).not.toMatch(/\{position\}|\{velocity\}|\b[xy]\s*=/);
});
