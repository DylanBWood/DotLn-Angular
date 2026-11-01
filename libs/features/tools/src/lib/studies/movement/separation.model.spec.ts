import type { StudyParameters } from '@dotln-angular/models';
import { distance, length, separate, zero } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  calculateSeparationStep,
  createShelfPair,
  model,
  separationFrames,
  type SeparationParameters,
  type ShelfPair,
} from './separation.model';

const record = await loadStudy('aifg-a:131');

const example: SeparationParameters = {
  centre: 0,
  initialGap: 2,
  inwardSpeed: 0,
  fastInwardSpeed: 4,
  radius: 0.5,
  threshold: 4,
  maxAcceleration: 6,
  maxSpeed: 5,
  timeStep: 0.1,
  steps: 60,
  laneOffset: 5,
  accelerationScale: 1,
};
const parameters: StudyParameters = { ...example };
const gapOf = (pair: ShelfPair) => distance(pair[0].position, pair[1].position);

it('uses the draft record and exactly its example parameters', () => {
  expect(record.id).toBe('aifg-a:131');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('works the first inverse-square and linear updates with hand-checkable numbers', () => {
  const pair = createShelfPair(example);
  const square = calculateSeparationStep(pair, example, 2);
  const linear = calculateSeparationStep(pair, example, 1);
  // Diameter 1, decay 6: 6 / 2² - 6 / 4² = 1.125.
  expect(square.gap).toBe(2);
  expect(square.accelerations).toEqual([
    { x: -1.125, y: 0 },
    { x: 1.125, y: 0 },
  ]);
  expect(square.next[0].velocity.x).toBeCloseTo(-0.1125);
  expect(square.next[0].position.x).toBeCloseTo(-1.01125);
  expect(gapOf(square.next)).toBeCloseTo(2.0225);
  // Linear: 6 × (4 - 2) / 4 = 3, giving velocity -0.3 and position -1.03.
  expect(linear.accelerations).toEqual([
    { x: -3, y: 0 },
    { x: 3, y: 0 },
  ]);
  expect(linear.next[0].velocity.x).toBeCloseTo(-0.3);
  expect(linear.next[0].position.x).toBeCloseTo(-1.03);
  expect(gapOf(linear.next)).toBeCloseTo(2.06);
  expect(pair[0].position.x).toBe(-1);
  expect(pair[1].position.x).toBe(1);
});

it('uses the engine fade at the threshold and does not equate inverse-square with always stronger', () => {
  const atGap = (gap: number, falloff: 1 | 2) =>
    length(
      calculateSeparationStep(createShelfPair({ ...example, initialGap: gap }), example, falloff)
        .accelerations[0],
    );
  for (const falloff of [1, 2] as const) {
    expect(atGap(4, falloff)).toBe(0);
    expect(atGap(5, falloff)).toBe(0);
    expect(atGap(3.999, falloff)).toBeGreaterThan(0);
    expect(atGap(3.999, falloff)).toBeLessThan(0.002);
    expect(atGap(0.5, falloff)).toBeLessThanOrEqual(6);
  }
  expect(atGap(2, 2)).toBe(1.125);
  expect(atGap(2, 1)).toBe(3);
  expect(atGap(1, 2)).toBe(5.625);
  expect(atGap(1, 1)).toBe(4.5);
  expect(atGap(0.5, 2)).toBe(6);
});

it('ignores itself, sums neighbours before capping, and can cancel in a symmetric crowd', () => {
  const centre = { ...createShelfPair(example)[0], position: zero };
  const left = { ...centre, position: { x: -0.5, y: 0 } };
  const right = { ...centre, position: { x: 0.5, y: 0 } };
  const tuning = { separationThreshold: example.threshold, separationFalloff: 2 };
  expect(separate(centre, 0, [centre], tuning)).toEqual(zero);
  expect(separate(centre, 0, [centre, left], tuning)).toEqual({ x: 6, y: 0 });
  expect(separate(centre, 0, [centre, left, { ...left }], tuning)).toEqual({ x: 6, y: 0 });
  expect(separate(centre, 0, [centre, left, right], tuning)).toEqual(zero);
});

it('uses the engine list-order direction to part exactly coincident couriers', () => {
  const pair = createShelfPair({ ...example, initialGap: 0 });
  for (const falloff of [1, 2] as const) {
    const step = calculateSeparationStep(pair, example, falloff);
    expect(step.accelerations[0].x).toBeCloseTo(3.6);
    expect(step.accelerations[0].y).toBeCloseTo(4.8);
    expect(step.accelerations[1].x).toBeCloseTo(-3.6);
    expect(step.accelerations[1].y).toBeCloseTo(-4.8);
    expect(length(step.accelerations[0])).toBeCloseTo(6);
    expect(gapOf(step.next)).toBeCloseTo(0.12);
  }
});

it('keeps the resting pair symmetric and respects both caps throughout each falloff', () => {
  for (const falloff of [1, 2] as const) {
    const states = separationFrames(example, falloff);
    expect(states).toHaveLength(61);
    for (const [index, pair] of states.entries()) {
      const calculation = calculateSeparationStep(pair, example, falloff);
      expect(pair[0].position.x + pair[1].position.x).toBeCloseTo(0);
      expect(pair[0].velocity.x + pair[1].velocity.x).toBeCloseTo(0);
      expect(pair[0].position.y).toBe(0);
      for (const body of pair)
        expect(length(body.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
      for (const acceleration of calculation.accelerations)
        expect(length(acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-12);
      if (index > 0) {
        expect(gapOf(pair)).toBeGreaterThan(gapOf(states[index - 1]));
        expect(Math.abs(pair[0].velocity.x - states[index - 1][0].velocity.x)).toBeLessThanOrEqual(
          example.maxAcceleration * example.timeStep + 1e-12,
        );
      }
    }
    const exit = states.findIndex((pair) => gapOf(pair) >= example.threshold);
    expect(exit).toBeGreaterThan(0);
    expect(exit).toBeLessThan(example.steps);
    const speedAtExit = states[exit][0].velocity.x;
    expect(speedAtExit).toBeLessThan(0);
    for (const pair of states.slice(exit)) {
      expect(calculateSeparationStep(pair, example, falloff).accelerations).toEqual([zero, zero]);
      expect(pair[0].velocity.x).toBe(speedAtExit);
    }
    expect(gapOf(states[example.steps])).toBeGreaterThan(example.threshold);
  }
  const square = separationFrames(example, 2);
  const linear = separationFrames(example, 1);
  expect(linear.every((pair, step) => gapOf(pair) >= gapOf(square[step]))).toBe(true);
});

it('shows overlap before inward motion reverses when only initial speed changes', () => {
  const normal = separationFrames(example, 2);
  const fast = separationFrames(example, 2, example.fastInwardSpeed);
  expect(fast[0].map((body) => body.position)).toEqual(normal[0].map((body) => body.position));
  expect(calculateSeparationStep(fast[0], example, 2).accelerations).toEqual(
    calculateSeparationStep(normal[0], example, 2).accelerations,
  );
  expect(fast[1][0].velocity.x).toBeCloseTo(3.8875);
  expect(gapOf(fast[1])).toBeCloseTo(1.2225);
  const firstOverlap = fast.findIndex((pair) => gapOf(pair) < 2 * example.radius);
  expect(firstOverlap).toBe(2);
  expect(fast[firstOverlap][0].velocity.x).toBeGreaterThan(0);
  expect(normal.every((pair) => gapOf(pair) >= 2 * example.radius)).toBe(true);
  expect(fast.some((pair) => pair[0].position.x > pair[1].position.x)).toBe(true);
  for (const pair of fast) {
    for (const acceleration of calculateSeparationStep(pair, example, 2).accelerations)
      expect(length(acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-12);
    for (const body of pair)
      expect(length(body.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
  }
  const smallerSteps = { ...example, timeStep: 0.05, steps: 120 };
  expect(
    separationFrames(smallerSteps, 2, example.fastInwardSpeed).some(
      (pair) => gapOf(pair) < 2 * example.radius,
    ),
  ).toBe(true);
});

it('gives every moment the record values and bounds all footprints and vector tips', () => {
  const run = model(parameters);
  const before = structuredClone(parameters);
  expect(model(parameters)).toEqual(run);
  expect(parameters).toEqual(before);
  expect(run.motion.frames).toHaveLength(61);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toHaveLength(4);
  expect(run.motion.frames[0].values).toMatchObject({
    squareGap: '2',
    squareSpeed: '0',
    squareAcceleration: '1.13',
    linearAcceleration: '3',
  });
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('6 × 1² × (1/2² − 1/4²)');
  const names = [
    ...placeholdersIn(record.visual?.textEquivalent ?? ''),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(4);
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    expect(fillValues(record.visual?.textEquivalent ?? '', frame.values)).not.toMatch(/\{[a-zA-Z]/);
    const points = [
      ...frame.bodies,
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
  const view = motionDrawing(run.motion, run.initialStep);
  expect(view.bodies).toHaveLength(4);
  expect(view.vectors).toHaveLength(4);
  expect(view.zones).toHaveLength(6);
});

it('plots the actual gaps and keeps the failure comparison on the same time samples', () => {
  const run = model(parameters);
  if (!run.timeline || !run.comparison) throw new Error('The shelf study needs both charts.');
  const square = separationFrames(example, 2);
  const linear = separationFrames(example, 1);
  const fast = separationFrames(example, 2, example.fastInwardSpeed);
  expect(run.timeline.seconds).toEqual(run.motion.frames.map((frame) => frame.seconds));
  expect(run.timeline.series.map((series) => series.values)).toEqual([
    square.map(gapOf),
    linear.map(gapOf),
  ]);
  expect(run.timeline.reference).toBe(4);
  expect(run.comparison.timeline.series.map((series) => series.values)).toEqual([
    square.map(gapOf),
    fast.map(gapOf),
  ]);
  expect(run.comparison.timeline.seconds).toEqual(run.timeline.seconds);
  expect(run.comparison.timeline.reference).toBe(1);
  expect(run.comparison.timeline.xRange).toEqual([0, 0.5]);
  const closeView = timelineDrawing(run.comparison.timeline, null);
  expect(closeView.series[0].points.split(' ')).toHaveLength(6);
  expect(closeView.marks).toHaveLength(1);
  expect(run.comparison.timeline.marks?.[0].y).toBeLessThan(1);
  expect(run.comparison.findings[0]).toContain('first overlaps at 0.2 s');
  const view = timelineDrawing(run.timeline, run.initialStep);
  expect(view.series.every((series) => series.points.split(' ').length === 61)).toBe(true);
  expect(view.series[0].dot?.x).toBe(50);
  expect(view.series.every((series) => !/NaN|Infinity/.test(series.points))).toBe(true);
});

it('lets inward speed expose overlap and neighbour range change the first push', () => {
  const resting = model(parameters);
  const closing = model({ ...parameters, inwardSpeed: 4 });
  expect(resting.motion.frames[0].note).toContain('start at rest');
  expect(closing.motion.frames[0].note).toContain('still closing');
  expect(closing.motion.frames[closing.initialStep].note).toContain('footprints overlap');
  expect(closing.motion.frames[closing.initialStep].seconds).toBeCloseTo(0.2);
  expect(closing.motion.frames[1].bodies[0].x).toBeGreaterThan(
    resting.motion.frames[1].bodies[0].x,
  );
  expect(closing.comparison?.findings[1]).toContain('same run');
  const short = model({ ...parameters, threshold: 2.5 });
  const broad = model({ ...parameters, threshold: 6 });
  // At gap 2, inverse-square gives 6/4 - 6/6.25 = 0.54, or 6/4 - 6/36 = 4/3.
  expect(short.motion.frames[0].vectors?.[0].dx).toBeCloseTo(-0.54);
  expect(broad.motion.frames[0].vectors?.[0].dx).toBeCloseTo(-4 / 3);
  expect(short.motion.frames[0].zones?.[0].radius).toBe(2.5);
  expect(broad.motion.frames[0].zones?.[0].radius).toBe(6);
  expect(short.timeline?.series[0].values).not.toEqual(broad.timeline?.series[0].values);
  expect(fillValues(record.example.description, closing.motion.frames[0].values)).toContain(
    'inward speed 4 units/s',
  );
});

it('keeps notes, rounded readings, names and all geometry sound at each slider endpoint', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['inwardSpeed', 'threshold']);
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
        expect(names.map(({ label }) => label).sort()).toEqual(['Mira', 'Mira', 'Rowan', 'Rowan']);
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
