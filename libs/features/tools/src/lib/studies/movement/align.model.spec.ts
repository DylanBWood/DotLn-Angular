import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import type { AlignParameters } from './align.model';
import { alignFrames, calculateAlignStep, model, wrapDegrees } from './align.model';

const example: AlignParameters = {
  cameraX: 0,
  cameraY: 0,
  initialHeading: 170,
  initialAngularSpeed: 0,
  targetHeading: -170,
  directionLength: 24,
  slowRadius: 60,
  maxAngularSpeed: 60,
  maxAngularAcceleration: 60,
  responseTime: 0.25,
  angleTolerance: 0.2,
  speedTolerance: 0.5,
  timeStep: 0.05,
  steps: 160,
  lateSlowRadius: 2,
};
const parameters: StudyParameters = Object.freeze({ ...example });
const record = await loadStudy('aifg-a:116');

it('uses the assigned catalogue row, draft authorship and these exact parameters', async () => {
  const tools = await createCatalogLoader().load('aifg');
  expect(tools.find(({ id }) => id === record.id)?.title).toBe('Align');
  expect(record.slug).toBe('align');
  expect(record.example.parameters).toEqual(example);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.visual?.model).toBe(record.pseudocode.executable?.module);
  for (const nearby of record.nearby) expect(tools.some(({ id }) => id === nearby.id)).toBe(true);
});

it('takes the short turn across the boundary and works the first acceleration cap by hand', () => {
  const first = calculateAlignStep(
    { heading: example.initialHeading, angularVelocity: example.initialAngularSpeed },
    example.targetHeading,
    example,
  );
  expect(first).toMatchObject({
    rawError: -340,
    error: 20,
    desiredVelocity: 20,
    requestedAcceleration: 80,
    acceleration: 60,
    settled: false,
    next: { angularVelocity: 3 },
  });
  expect(first.next.heading).toBeCloseTo(170.15, 10);
  const equivalentCommand = calculateAlignStep({ heading: 170, angularVelocity: 0 }, 190, example);
  expect(equivalentCommand.error).toBe(first.error);
  expect(equivalentCommand.next).toEqual(first.next);
});

it('brakes with the desired speed ramp and uses updated angular velocity for the turn', () => {
  const braking = calculateAlignStep({ heading: 180, angularVelocity: 16 }, -170, example);
  expect(braking).toMatchObject({
    rawError: -350,
    error: 10,
    desiredVelocity: 10,
    requestedAcceleration: -24,
    acceleration: -24,
    next: { angularVelocity: 14.8, heading: 180.74 },
  });
  const outside = calculateAlignStep({ heading: 0, angularVelocity: 0 }, -170, example);
  expect(outside.desiredVelocity).toBe(-example.maxAngularSpeed);
});

it('does not mistake a moving camera on the commanded heading for a settled one', () => {
  const moving = calculateAlignStep({ heading: 190, angularVelocity: 10 }, -170, example);
  expect(moving).toMatchObject({
    error: 0,
    desiredVelocity: 0,
    acceleration: -40,
    settled: false,
    next: { heading: 190.4, angularVelocity: 8 },
  });
  const almost = calculateAlignStep({ heading: 189.9, angularVelocity: 0.4 }, -170, example);
  expect(almost.settled).toBe(true);
  expect(almost.next).toEqual({ heading: 190, angularVelocity: 0 });
  const stopped = calculateAlignStep(almost.next, -170, example);
  expect(stopped.next).toEqual(almost.next);
  expect(stopped.acceleration).toBe(0);
});

it('defines the half-turn tie and exposes the direction flip on either side', () => {
  expect(wrapDegrees(180)).toBe(-180);
  expect(wrapDegrees(-180)).toBe(-180);
  expect(wrapDegrees(540)).toBe(-180);
  expect(wrapDegrees(-340)).toBe(20);
  expect(wrapDegrees(179.999)).toBeGreaterThan(0);
  expect(wrapDegrees(180.001)).toBeLessThan(0);
  const tie = calculateAlignStep({ heading: 170, angularVelocity: 0 }, -10, example);
  expect(tie.error).toBe(-180);
  expect(tie.next.angularVelocity).toBe(-3);
});

it('settles the normal camera without overshoot and shows overshoot and reversals with late braking', () => {
  const normal = alignFrames(example);
  const late = alignFrames(example, example.lateSlowRadius);
  expect(normal).toHaveLength(161);
  expect(normal[0]).toEqual({ heading: 170, angularVelocity: 0 });
  expect(normal.at(-1)?.heading).toBeCloseTo(190, 10);
  expect(normal.at(-1)?.angularVelocity).toBe(0);
  expect(
    normal.every(({ heading, angularVelocity }) => heading <= 190 && angularVelocity >= 0),
  ).toBe(true);
  expect(Math.max(...late.map(({ heading }) => heading))).toBeCloseTo(208.4, 10);
  expect(late[32]).toMatchObject({ heading: 208.4, angularVelocity: 0 });
  expect(late.some(({ angularVelocity }) => angularVelocity < 0)).toBe(true);
  expect(late.at(-1)?.angularVelocity).not.toBe(0);
  expect(late.at(-1)?.heading).toBeCloseTo(182.45108, 6);
  for (const states of [normal, late]) {
    for (const [step, state] of states.entries()) {
      expect(Number.isFinite(state.heading)).toBe(true);
      expect(Math.abs(state.angularVelocity)).toBeLessThanOrEqual(example.maxAngularSpeed);
      if (step > 0)
        expect(
          Math.abs(state.angularVelocity - states[step - 1].angularVelocity) / example.timeStep,
        ).toBeLessThanOrEqual(example.maxAngularAcceleration + 1e-9);
    }
  }
  const comparison = model(parameters).comparison;
  expect(comparison?.findings[0]).toContain('18.40° at 1.60 s');
  expect(comparison?.timeline.series[0].values).toEqual(
    normal.map(({ heading }) => wrapDegrees(-170 - heading)),
  );
  expect(comparison?.timeline.series[1].values).toEqual(
    late.map(({ heading }) => wrapDegrees(-170 - heading)),
  );
});

it('draws a rotating heading on a stationary pedestal and keeps every ray within bounds', () => {
  const run = model(parameters);
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(1);
    expect(frame.bodies[0]).toMatchObject({ x: 0, y: 0 });
    expect(frame.bodies[0].heading).toBeTypeOf('number');
    for (const vector of frame.vectors ?? []) {
      expect(vector.x + vector.dx).toBeGreaterThanOrEqual(minX);
      expect(vector.x + vector.dx).toBeLessThanOrEqual(maxX);
      expect(vector.y + vector.dy).toBeGreaterThanOrEqual(minY);
      expect(vector.y + vector.dy).toBeLessThanOrEqual(maxY);
      expect(Math.hypot(vector.dx, vector.dy)).toBeCloseTo(
        example.directionLength * (vector.tone === 'actual' ? 0.5 : 1.5),
        6,
      );
    }
  }
  const start = run.motion.frames[0];
  expect(start.vectors?.[0].dx).toBeCloseTo(-11.817693, 6);
  expect(start.vectors?.[0].dy).toBeCloseTo(2.083778, 6);
  expect(start.vectors?.[1].dy).toBeCloseTo(-6.251334, 6);
  const first = motionDrawing(run.motion, 0);
  const last = motionDrawing(run.motion, example.steps);
  expect(first.bodies[0]).toMatchObject({ x: 300, y: 300 });
  expect(first.bodies[0].arrow).not.toBeNull();
  expect(last.bodies[0].arrow).not.toBe(first.bodies[0].arrow);
  expect(last.bodies[0].x).toBe(first.bodies[0].x);
  expect(last.bodies[0].y).toBe(first.bodies[0].y);
});

it('opens on the boundary crossing and labels real braking, tolerance and rest moments', () => {
  const run = model(parameters);
  const frames = alignFrames(example);
  expect(run.initialStep).toBe(17);
  expect(run.moments).toHaveLength(5);
  const [start, braking, boundary, inside, stopped] = run.moments;
  expect(start.step).toBe(0);
  expect(braking.step).toBe(10);
  expect(boundary.step).toBe(run.initialStep);
  expect(wrapDegrees(frames[boundary.step].heading)).toBeLessThan(0);
  expect(frames[braking.step].angularVelocity).toBeGreaterThan(0);
  expect(calculateAlignStep(frames[braking.step], -170, example).acceleration).toBeLessThan(0);
  expect(Math.abs(wrapDegrees(-170 - frames[inside.step].heading))).toBeLessThanOrEqual(
    example.angleTolerance,
  );
  expect(frames[stopped.step].angularVelocity).toBe(0);
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('-170.00 − 170.00 = -340.00');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(20.00 − 0.00) / 0.25 = 80.00');
  expect(run.motion.frames[run.initialStep].worked?.note).toContain('braking');
});

it('supplies every prose placeholder on every frame and plots the same angular velocities', () => {
  const run = model(parameters);
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const frame of run.motion.frames) {
    for (const text of texts) {
      for (const name of placeholdersIn(text)) expect(frame.values[name], name).toBeDefined();
      expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
    }
  }
  expect(run.motion.frames[0].values).toMatchObject({
    rawError: '-340.00',
    error: '20.00',
    angularSpeed: '0.00',
    desiredAngularSpeed: '20.00',
  });
  for (const timeline of [run.timeline, run.comparison?.timeline]) {
    if (!timeline) throw new Error('Align supplies both charts.');
    expect(timeline.seconds).toHaveLength(run.motion.frames.length);
    const drawing = timelineDrawing(timeline, run.initialStep);
    expect(drawing.cursorX).toBeGreaterThanOrEqual(50);
    for (const [index, series] of timeline.series.entries()) {
      expect(series.values).toHaveLength(timeline.seconds.length);
      expect(series.values.every(Number.isFinite)).toBe(true);
      expect(drawing.series[index].points).not.toMatch(/NaN|Infinity/);
    }
  }
  const states = alignFrames(example);
  expect(run.timeline?.series[0].values).toEqual(
    states.map(({ angularVelocity }) => angularVelocity),
  );
  expect(run.timeline?.series[1].values).toEqual(
    states.map(
      (state) => calculateAlignStep(state, example.targetHeading, example).desiredVelocity,
    ),
  );
});

it('is repeatable and derives the pedestal placement and bounds from the parameters', () => {
  expect(model(parameters)).toEqual(model(parameters));
  const moved = model({ ...parameters, cameraX: 100, cameraY: -50 });
  expect(
    moved.motion.frames.every(({ bodies }) => bodies[0].x === 100 && bodies[0].y === -50),
  ).toBe(true);
  expect(moved.motion.bounds).toEqual({ minX: 52, maxX: 148, minY: -98, maxY: -2 });
  expect(moved.timeline).toEqual(model(parameters).timeline);
});

it('makes late braking and motor acceleration visible through the live inputs', () => {
  const late = model({ ...parameters, slowRadius: 2 });
  const early = model({ ...parameters, slowRadius: 90 });
  expect(model(parameters).inputs?.map(({ name }) => name)).toEqual([
    'slowRadius',
    'maxAngularAcceleration',
  ]);
  expect(late.motion.frames[16].note).toContain('passed the command');
  expect(late.motion.frames[32].bodies[0].heading).toBeGreaterThan(
    early.motion.frames[32].bodies[0].heading ?? 0,
  );
  expect(late.motion.frames[160].values['runOutcome']).toContain('still correcting');
  expect(early.motion.frames[160].values['runOutcome']).toContain('is at rest');
  expect(late.moments.at(-1)?.label).toBe('Still correcting');
  expect(late.comparison?.intro).toContain('lines coincide');
  expect(late.comparison?.timeline.series[0].values).toEqual(
    late.comparison?.timeline.series[1].values,
  );
  const weak = model({ ...parameters, maxAngularAcceleration: 30 });
  const strong = model({ ...parameters, maxAngularAcceleration: 120 });
  expect(weak.motion.frames[0].values['nextAngularSpeed']).toBe('1.50');
  expect(strong.motion.frames[0].values['nextAngularSpeed']).toBe('4.00');
  expect(weak.motion.frames[1].bodies[0].heading).toBeLessThan(
    strong.motion.frames[1].bodies[0].heading ?? 0,
  );
  expect(strong.comparison?.findings[1]).toContain('comparison run is at rest');
});

it('keeps notes, labels, moments, prose and geometry sound across the live ranges', () => {
  const base = model(parameters);
  const variants = [parameters];
  for (const input of base.inputs ?? [])
    for (const value of [input.min, (input.min + input.max) / 2, input.max])
      variants.push({ ...parameters, [input.name]: value });
  for (const slowRadius of [2, 90])
    for (const maxAngularAcceleration of [30, 120])
      variants.push({ ...parameters, slowRadius, maxAngularAcceleration });
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const variant of variants) {
    const run = model(variant);
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(run.moments.length).toBeGreaterThanOrEqual(3);
    expect(run.moments.length).toBeLessThanOrEqual(5);
    for (const moment of run.moments) {
      expect(Number.isInteger(moment.step)).toBe(true);
      expect(moment.step).toBeGreaterThanOrEqual(0);
      expect(moment.step).toBeLessThan(run.motion.frames.length);
      if (moment.label === 'At rest') {
        expect(run.motion.frames[moment.step].values['angularSpeed']).toBe('0.00');
        expect(run.motion.frames[moment.step].values['error']).toBe('0.00');
      }
    }
    for (const [step, frame] of run.motion.frames.entries()) {
      expect(frame.note?.match(/[.!?](?:\s|$)/g)).toHaveLength(1);
      expect(frame.note).not.toMatch(/[()\d]/);
      for (const text of texts) {
        const filled = fillValues(text, frame.values);
        expect(placeholdersIn(filled)).toEqual([]);
        expect(filled).not.toMatch(/-?\d+\.\d{3,}/);
      }
      const numbers = fillValues(record.visual.textEquivalent, frame.values);
      expect(numbers).not.toMatch(/[()]/);
      expect(numbers.match(/[.!?](?:\s|$)/g)).toHaveLength(2);
      expect(
        [frame.worked?.title, ...(frame.worked?.lines ?? []), ...Object.values(frame.values)].join(
          ' ',
        ),
      ).not.toMatch(/-?\d+\.\d{3,}/);
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
      ];
      for (const { x, y } of points) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(minX);
        expect(x).toBeLessThanOrEqual(maxX);
        expect(y).toBeGreaterThanOrEqual(minY);
        expect(y).toBeLessThanOrEqual(maxY);
      }
      const drawing = motionDrawing(run.motion, step);
      const camera = drawing.bodies[0];
      const command = drawing.marks[0];
      expect(camera.label).toBe('Camera');
      expect(command.label).toBe('Command');
      // Reserve the widest chart font for both labels, including on a narrow screen.
      expect(command.x + 'Command'.length * 7.2).toBeLessThan(camera.x - 'Camera'.length * 7.2);
      expect(command.x - 'Command'.length * 7.2).toBeGreaterThan(0);
      expect(drawing.vectors.every(({ head }) => head !== null)).toBe(true);
    }
    for (const chart of [run.timeline, run.comparison?.timeline]) {
      if (!chart) throw new Error('Both angular charts are present.');
      for (const series of chart.series) {
        expect(series.values).toHaveLength(chart.seconds.length);
        expect(series.values.every(Number.isFinite)).toBe(true);
      }
    }
  }
});
