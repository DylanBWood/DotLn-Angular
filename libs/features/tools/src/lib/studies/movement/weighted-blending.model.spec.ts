import type { StudyParameters } from '@dotln-angular/models';
import { distance, length, type Vec2, zero } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  blendingFrames,
  calculateBlendingStep,
  createNia,
  model,
  type WeightedBlendingParameters,
} from './weighted-blending.model';

const record = await loadStudy('aifg-a:144');

const example: WeightedBlendingParameters = {
  startX: 0,
  startY: 0,
  targetX: 16,
  targetY: 0,
  robotX: 2,
  robotY: 1.5,
  alignedRobotY: 0,
  radius: 0.8,
  threshold: 4,
  maxAcceleration: 4,
  maxSpeed: 3,
  seekWeight: 1.5,
  separationWeight: 3,
  timeStep: 0.1,
  steps: 60,
  accelerationScale: 0.5,
};
const parameters: StudyParameters = { ...example };
const expectVector = (actual: Vec2, expected: Vec2) => {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
};

it('uses the draft record and exactly its example parameters', () => {
  expect(record.id).toBe('aifg-a:144');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('works the first vector sum and movement from a simple right triangle', () => {
  const start = createNia(example);
  const calculation = calculateBlendingStep(start, example);
  // Distance √(2² + 1.5²) = 2.5; linear strength 4 × (4 - 2.5) / 4 = 1.5.
  expect(calculation.robotDistance).toBe(2.5);
  expectVector(calculation.seekRequest, { x: 4, y: 0 });
  expectVector(calculation.separationRequest, { x: -1.2, y: -0.9 });
  expectVector(calculation.weightedSeek, { x: 6, y: 0 });
  expectVector(calculation.weightedSeparation, { x: -3.6, y: -2.7 });
  expectVector(calculation.raw, { x: 2.4, y: -2.7 });
  expect(length(calculation.raw)).toBeCloseTo(Math.sqrt(13.05));
  expectVector(calculation.acceleration, { x: 2.4, y: -2.7 });
  expectVector(calculation.next.velocity, { x: 0.24, y: -0.27 });
  expectVector(calculation.next.position, { x: 0.024, y: -0.027 });
  expect(start.position).toEqual(zero);
  expect(start.velocity).toEqual(zero);
});

it('does not average weights, and clips the completed sum rather than the terms independently', () => {
  const start = createNia(example);
  const first = calculateBlendingStep(start, example);
  expect(first.weightedSeek.x).toBe(6);
  expect(first.acceleration.x).toBeCloseTo(2.4);
  expect(first.acceleration.x).not.toBeCloseTo(2.4 / 4.5);
  // With Nia already beyond the aligned robot, seek contributes 6 and separation contributes 9.
  const beyond = { ...start, position: { x: 3, y: 0 } };
  const clipped = calculateBlendingStep(beyond, example, example.alignedRobotY);
  expect(clipped.seekRequest).toEqual({ x: 4, y: 0 });
  expect(clipped.separationRequest).toEqual({ x: 3, y: 0 });
  expect(clipped.raw).toEqual({ x: 15, y: 0 });
  expect(clipped.acceleration).toEqual({ x: 4, y: 0 });
  expectVector(clipped.next.velocity, { x: 0.4, y: 0 });
  expectVector(clipped.next.position, { x: 3.04, y: 0 });
  const stronger = calculateBlendingStep(start, { ...example, seekWeight: 3, separationWeight: 6 });
  expect(length(stronger.acceleration)).toBeCloseTo(4);
  expect(stronger.acceleration.x * first.raw.y - stronger.acceleration.y * first.raw.x).toBeCloseTo(
    0,
  );
});

it('deflects Nia above the robot, clears the footprints and respects both motion caps', () => {
  const states = blendingFrames(example);
  const robot = { x: example.robotX, y: example.robotY };
  expect(states).toHaveLength(61);
  expect(states[1].position.y).toBeLessThan(0);
  expect(states.some((state) => state.position.x > example.robotX)).toBe(true);
  expect(Math.min(...states.map((state) => distance(state.position, robot)))).toBeGreaterThan(
    2 * example.radius,
  );
  expect(states[example.steps].position.x).toBeGreaterThan(15);
  expect(
    distance(states[example.steps].position, { x: example.targetX, y: example.targetY }),
  ).toBeLessThan(1);
  let clippedSteps = 0;
  for (const [index, state] of states.entries()) {
    const calculation = calculateBlendingStep(state, example);
    expect(length(calculation.acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-12);
    expect(length(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
    const rawMagnitude = length(calculation.raw);
    if (rawMagnitude > example.maxAcceleration) {
      clippedSteps++;
      expect(length(calculation.acceleration)).toBeCloseTo(example.maxAcceleration);
      expect(
        calculation.acceleration.x * calculation.raw.y -
          calculation.acceleration.y * calculation.raw.x,
      ).toBeCloseTo(0);
      expect(
        calculation.acceleration.x * calculation.raw.x +
          calculation.acceleration.y * calculation.raw.y,
      ).toBeGreaterThan(0);
    } else expectVector(calculation.acceleration, calculation.raw);
    if (index > 0)
      expect(distance(state.velocity, states[index - 1].velocity)).toBeLessThanOrEqual(
        example.maxAcceleration * example.timeStep + 1e-12,
      );
  }
  expect(clippedSteps).toBeGreaterThan(0);
});

it('continues evaluating seek after the robot leaves the separation neighbourhood', () => {
  const body = { ...createNia(example), position: { x: 10, y: 0 } };
  const step = calculateBlendingStep(body, example);
  expect(step.robotDistance).toBeGreaterThan(example.threshold);
  expect(step.separationRequest).toEqual(zero);
  expect(step.weightedSeek).toEqual({ x: 6, y: 0 });
  expect(step.raw).toEqual({ x: 6, y: 0 });
  expect(step.acceleration).toEqual({ x: 4, y: 0 });
});

it('cancels exactly at rest when only the robot lateral coordinate moves onto the route', () => {
  const aligned = blendingFrames(example, example.alignedRobotY);
  const initial = calculateBlendingStep(aligned[0], example, example.alignedRobotY);
  expect(initial.seekRequest).toEqual({ x: 4, y: 0 });
  expect(initial.separationRequest).toEqual({ x: -2, y: 0 });
  expect(initial.weightedSeek).toEqual({ x: 6, y: 0 });
  expect(initial.weightedSeparation).toEqual({ x: -6, y: 0 });
  expect(initial.raw).toEqual(zero);
  for (const state of aligned) {
    expect(state.position).toEqual(zero);
    expect(state.velocity).toEqual(zero);
    expect(distance(state.position, { x: example.targetX, y: example.targetY })).toBe(16);
  }
  const longer = blendingFrames({ ...example, steps: 120 }, example.alignedRobotY);
  expect(longer.every((state) => state.position.x === 0 && state.position.y === 0)).toBe(true);
  const moving = { ...createNia(example), velocity: { x: 1, y: 0 } };
  const coasting = calculateBlendingStep(moving, example, example.alignedRobotY);
  expect(coasting.acceleration).toEqual(zero);
  expect(coasting.next.velocity).toEqual({ x: 1, y: 0 });
  expect(coasting.next.position).toEqual({ x: 0.1, y: 0 });
});

it('does not guarantee clearance when separation weight is reduced to zero', () => {
  const reduced = { ...example, separationWeight: 0 };
  const states = blendingFrames(reduced);
  const robot = { x: example.robotX, y: example.robotY };
  expect(states.some((state) => distance(state.position, robot) < 2 * example.radius)).toBe(true);
  for (const state of states) {
    expect(state.position.y).toBe(0);
    expect(length(calculateBlendingStep(state, reduced).acceleration)).toBeLessThanOrEqual(
      example.maxAcceleration + 1e-12,
    );
  }
});

it('does not erase velocity just because a moving courier is at the bay', () => {
  const atBay = {
    ...createNia(example),
    position: { x: example.targetX, y: example.targetY },
    velocity: { x: 1, y: 0 },
  };
  const step = calculateBlendingStep(atBay, example);
  expect(step.seekRequest).toEqual(zero);
  expect(step.separationRequest).toEqual(zero);
  expect(step.acceleration).toEqual(zero);
  expect(step.next.velocity).toEqual({ x: 1, y: 0 });
  expect(step.next.position).toEqual({ x: 16.1, y: 0 });
});

it('supplies all prose values, scales the vector addition and bounds every visible element', () => {
  const before = structuredClone(parameters);
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(parameters).toEqual(before);
  expect(run.motion.frames).toHaveLength(61);
  expect(run.initialStep).toBe(14);
  expect(run.moments).toHaveLength(5);
  const selected = calculateBlendingStep(blendingFrames(example)[run.initialStep], example);
  expect(length(selected.raw)).toBeGreaterThan(6);
  expect(length(selected.acceleration)).toBeCloseTo(4);
  expect(length(selected.separationRequest)).toBeGreaterThan(0);
  const names = [
    ...placeholdersIn(record.visual?.textEquivalent ?? ''),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  expect(run.motion.frames[0].values).toMatchObject({
    robotDistance: '2.5',
    weightedSeekMagnitude: '6',
    weightedSeparationMagnitude: '4.5',
    rawMagnitude: '3.61',
    weightSum: '4.5',
  });
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('4 × (4 − 2.5) / 4 ≈ 1.5');
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(2);
    expect(frame.bodies[1]).toMatchObject({ x: example.robotX, y: example.robotY });
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    expect(fillValues(record.visual?.textEquivalent ?? '', frame.values)).not.toMatch(/\{[a-zA-Z]/);
    const points = [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y + radius },
      ]),
      ...(frame.vectors ?? []).flatMap((vector) => [
        vector,
        { x: vector.x + vector.dx, y: vector.y + vector.dy },
      ]),
    ];
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(minX);
      expect(x).toBeLessThanOrEqual(maxX);
      expect(y).toBeGreaterThanOrEqual(minY);
      expect(y).toBeLessThanOrEqual(maxY);
    }
  }
  for (const moment of run.moments) expect(moment.step).toBeLessThan(run.motion.frames.length);
  const first = run.motion.frames[0];
  const [seekVector, separationVector, usedVector] = first.vectors ?? [];
  expectVector({ x: seekVector.dx, y: seekVector.dy }, { x: 3, y: 0 });
  expectVector(separationVector, { x: 3, y: 0 });
  expectVector({ x: separationVector.dx, y: separationVector.dy }, { x: -1.8, y: -1.35 });
  expectVector({ x: usedVector.dx, y: usedVector.dy }, { x: 1.2, y: -1.35 });
  const view = motionDrawing(run.motion, run.initialStep);
  expect(view.bodies).toHaveLength(2);
  expect(view.vectors).toHaveLength(3);
  expect(view.zones).toHaveLength(3);
});

it('charts the actual capped magnitudes and the stalled comparison on the motion samples', () => {
  const run = model(parameters);
  if (!run.timeline || !run.comparison) throw new Error('Blending needs both charts.');
  const states = blendingFrames(example);
  const calculations = states.map((state) => calculateBlendingStep(state, example));
  expect(run.timeline.seconds).toEqual(run.motion.frames.map((frame) => frame.seconds));
  expect(run.timeline.reference).toBe(4);
  expect(run.timeline.series[0].values).toEqual(calculations.map(({ raw }) => length(raw)));
  expect(run.timeline.series[1].values).toEqual(
    calculations.map(({ acceleration }) => length(acceleration)),
  );
  expect(run.comparison.timeline.seconds).toEqual(run.timeline.seconds);
  expect(run.comparison.timeline.series[1].values).toEqual(Array.from({ length: 61 }, () => 16));
  expect(run.comparison.timeline.series[0].values).toEqual(
    states.map((state) => distance(state.position, { x: example.targetX, y: example.targetY })),
  );
  expect(run.comparison.findings[0]).toContain(
    'seek contributes 6 units/s² towards the bay and separation 6 away',
  );
  const view = timelineDrawing(run.timeline, run.initialStep);
  expect(view.series.every((series) => series.points.split(' ').length === 61)).toBe(true);
  expect(view.series.every((series) => !/NaN|Infinity/.test(series.points))).toBe(true);
  expect(view.series.every((series) => series.dot?.x === view.cursorX)).toBe(true);
});

it('describes the first push upwards and keeps vector arithmetic in the worked step', () => {
  const run = model(parameters);
  const first = run.motion.frames[0];
  expect(first.note).toBe(
    'Separation pushes Nia above the parked robot while seek draws her towards the bay.',
  );
  expect(blendingFrames(example)[1].position.y).toBeLessThan(example.startY);
  const text = fillValues(record.visual.textEquivalent, first.values);
  expect(text).toContain('above and to the left of the parked robot, 2.5 units away');
  expect(text).not.toMatch(/\(-?\d/);
  expect(first.values['rawMagnitude']).toBe('3.61');
  expect(first.worked?.lines.join(' ')).toContain('(2.4, -2.7)');
  expect(first.worked?.lines.join(' ')).not.toMatch(/\d+\.\d{3,}/);
  expect(length(calculateBlendingStep(createNia(example), example).raw)).toBeCloseTo(
    Math.sqrt(13.05),
    12,
  );
});

it('makes low weight overlap visible and an aligned robot expose cancellation', () => {
  const low = model({ ...parameters, separationWeight: 0 });
  const strong = model({ ...parameters, separationWeight: 4.5 });
  expect(low.motion.frames[low.initialStep].note).toContain('footprint overlaps');
  expect(low.motion.frames[0].values['clearanceSummary']).toBe('the footprints overlap');
  expect(strong.motion.frames[0].values['clearanceSummary']).toBe(
    'the sampled footprints stay apart',
  );
  expect(low.motion.frames[0].vectors?.[1].dx).toBeCloseTo(0);
  expect(strong.motion.frames[0].vectors?.[1].dx).toBeCloseTo(-2.7);
  expect(low.timeline?.series[0].values).not.toEqual(strong.timeline?.series[0].values);
  const aligned = model({ ...parameters, robotY: 0 });
  const offset = model({ ...parameters, robotY: 3 });
  expect(aligned.motion.frames.every((frame) => frame.note?.includes('stays at rest'))).toBe(true);
  expect(
    aligned.motion.frames.every((frame) => frame.bodies[0].x === 0 && frame.bodies[0].y === 0),
  ).toBe(true);
  expect(offset.motion.frames.some((frame) => frame.bodies[0].x > example.robotX)).toBe(true);
  const changedWeights = low.motion.frames[0].values;
  expect(fillValues(record.example.description, changedWeights)).toContain(
    'the sum starts Nia towards the bay',
  );
  expect(fillValues(record.limits[0], changedWeights)).not.toContain('stays at rest');
});

it('keeps notes, rounded readings, names and all geometry sound at each slider endpoint', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['separationWeight', 'robotY']);
  for (const input of inputs)
    for (const value of [input.min, input.max]) {
      const run = model({ ...parameters, [input.name]: value });
      const { minX, maxX, minY, maxY } = run.motion.bounds;
      expect(run.initialStep).toBeGreaterThanOrEqual(0);
      expect(run.initialStep).toBeLessThan(run.motion.frames.length);
      for (const moment of run.moments) {
        expect(Number.isInteger(moment.step)).toBe(true);
        expect(moment.step).toBeGreaterThanOrEqual(0);
        expect(moment.step).toBeLessThan(run.motion.frames.length);
      }
      for (const [step, frame] of run.motion.frames.entries()) {
        expect(frame.note).toBeTruthy();
        expect(frame.note).not.toMatch(/\d|\bcoordinates?\b/);
        expect(frame.note?.match(/[.!?](?:\s|$)/g)).toHaveLength(1);
        const reading = [
          record.visual.textEquivalent,
          record.example.description,
          ...record.limits,
          ...record.mechanism.steps.map(({ text }) => text),
        ].map((text) => fillValues(text, frame.values));
        const displayed = [
          ...reading,
          ...Object.values(frame.values),
          frame.worked?.title ?? '',
          ...(frame.worked?.lines ?? []),
        ].join(' ');
        expect(displayed).not.toMatch(/\d+\.\d{3,}/);
        expect(reading.join(' ')).not.toMatch(/\{[a-zA-Z]|\(-?\d+(?:\.\d+)?,\s*-?\d/);
        const points = [
          ...frame.bodies,
          ...(frame.marks ?? []),
          ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
          ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
            { x: x - radius, y: y - radius },
            { x: x + radius, y: y + radius },
          ]),
          ...(frame.vectors ?? []).flatMap((vector) => [
            vector,
            { x: vector.x + vector.dx, y: vector.y + vector.dy },
          ]),
        ];
        for (const { x, y } of points) {
          expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          expect(x >= minX && x <= maxX && y >= minY && y <= maxY).toBe(true);
        }
        const drawn = motionDrawing(run.motion, step);
        const height = Number(drawn.viewBox.split(' ')[3]);
        const names = [...drawn.bodies, ...drawn.marks].flatMap((point) =>
          point.label
            ? [
                {
                  label: point.label,
                  left: point.x - point.label.length * 7.2,
                  right: point.x + point.label.length * 7.2,
                  top: point.labelY - 24,
                  bottom: point.labelY + 5,
                },
              ]
            : [],
        );
        expect(names.map(({ label }) => label).sort()).toEqual(['Bay', 'Nia', 'Robot']);
        for (const [index, name] of names.entries()) {
          expect(
            name.left >= 0 && name.right <= 600 && name.top >= 0 && name.bottom <= height,
          ).toBe(true);
          for (const other of names.slice(index + 1))
            expect(
              name.right <= other.left ||
                other.right <= name.left ||
                name.bottom <= other.top ||
                other.bottom <= name.top,
            ).toBe(true);
        }
      }
      for (const chart of [run.timeline, run.comparison?.timeline])
        if (chart) {
          expect(chart.seconds).toHaveLength(run.motion.frames.length);
          for (const series of chart.series)
            expect(series.values.every(Number.isFinite)).toBe(true);
        }
      const comparisonText = [
        run.caption,
        run.comparison?.intro,
        run.comparison?.note,
        ...(run.comparison?.findings ?? []),
      ].join(' ');
      expect(comparisonText).not.toMatch(/\d+\.\d{3,}/);
    }
});
