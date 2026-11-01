import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import { calculateAlignStep, wrapDegrees } from './align.model';
import type { FaceParameters } from './face.model';
import { beaconAt, calculateFaceStep, faceFrames, model } from './face.model';

const example: FaceParameters = {
  cameraX: 0,
  cameraY: 0,
  initialHeading: 0,
  initialAngularSpeed: 0,
  targetStartX: 20,
  targetStartY: 20,
  targetVelocityX: -10,
  targetVelocityY: 0,
  travelDuration: 4,
  directionLength: 18,
  slowRadius: 45,
  maxAngularSpeed: 90,
  maxAngularAcceleration: 180,
  responseTime: 0.1,
  angleTolerance: 0.25,
  speedTolerance: 0.5,
  timeStep: 0.05,
  steps: 160,
  slowMotorSpeed: 10,
};
const parameters: StudyParameters = Object.freeze({ ...example });
const record = await loadStudy('aifg-a:123');

it('uses the assigned catalogue row, draft authorship and these exact parameters', async () => {
  const tools = await createCatalogLoader().load('aifg');
  expect(tools.find(({ id }) => id === record.id)?.title).toBe('Face');
  expect(record.slug).toBe('face');
  expect(record.example.parameters).toEqual(example);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.visual?.model).toBe(record.pseudocode.executable?.module);
  for (const nearby of record.nearby) expect(tools.some(({ id }) => id === nearby.id)).toBe(true);
});

it('derives the initial bearing and delegates a hand-checkable capped acceleration to Align', () => {
  const state = { heading: example.initialHeading, angularVelocity: example.initialAngularSpeed };
  const first = calculateFaceStep(state, beaconAt(0, example), example);
  expect(first.offset).toEqual({ x: 20, y: 20 });
  expect(first.bearing).toBe(45);
  expect(first.alignment).toMatchObject({
    rawError: 45,
    error: 45,
    desiredVelocity: 90,
    requestedAcceleration: 900,
    acceleration: 180,
    settled: false,
    next: { heading: 0.45, angularVelocity: 9 },
  });
  expect(first.alignment).toEqual(calculateAlignStep(state, 45, example));
});

it('subtracts the pedestal position and uses both components to choose the bearing quadrant', () => {
  const state = { heading: 0, angularVelocity: 0 };
  expect(calculateFaceStep(state, { x: -20, y: 20 }, example).bearing).toBe(135);
  expect(calculateFaceStep(state, { x: 20, y: -20 }, example).bearing).toBe(-45);
  expect(calculateFaceStep(state, { x: -20, y: -20 }, example).bearing).toBe(-135);
  expect(calculateFaceStep(state, { x: 0, y: 20 }, example).bearing).toBe(90);
  const moved = calculateFaceStep(
    state,
    { x: 120, y: -30 },
    { ...example, cameraX: 100, cameraY: -50 },
  );
  expect(moved).toEqual(calculateFaceStep(state, { x: 20, y: 20 }, example));
});

it('samples the beacon now, stops its path at the prescribed time and adds no prediction', () => {
  expect(beaconAt(0, example)).toEqual({ x: 20, y: 20 });
  expect(beaconAt(2, example)).toEqual({ x: 0, y: 20 });
  expect(beaconAt(4, example)).toEqual({ x: -20, y: 20 });
  expect(beaconAt(8, example)).toEqual(beaconAt(4, example));
  const state = faceFrames(example)[40];
  const now = calculateFaceStep(state, beaconAt(2, example), example);
  const future = calculateFaceStep(state, beaconAt(2 + example.timeStep, example), example);
  expect(now.bearing).toBe(90);
  expect(future.bearing).toBeGreaterThan(90);
  expect(now.alignment.error).toBeCloseTo(13.9943229161, 8);
  expect(now.alignment).toEqual(calculateAlignStep(state, 90, example));
  expect(
    calculateFaceStep(state, beaconAt(2, example), { ...example, targetVelocityX: 100 }),
  ).toEqual(now);
});

it('brakes a coincident target without manufacturing a bearing or freezing remaining rotation', () => {
  const atCamera = { x: example.cameraX, y: example.cameraY };
  const turning = calculateFaceStep({ heading: 45, angularVelocity: 20 }, atCamera, example);
  expect(turning.bearing).toBeNull();
  expect(turning.alignment).toMatchObject({
    error: 0,
    desiredVelocity: 0,
    acceleration: -180,
    settled: false,
    next: { heading: 45.55, angularVelocity: 11 },
  });
  const resting = calculateFaceStep({ heading: 45, angularVelocity: 0 }, atCamera, example);
  expect(resting.alignment.next).toEqual({ heading: 45, angularVelocity: 0 });
  const coincident = model({ ...parameters, targetStartX: 0, targetStartY: 0, targetVelocityX: 0 });
  expect(
    coincident.motion.frames.every(
      ({ vectors, values }) => vectors?.length === 1 && values['bearing'] === 'undefined',
    ),
  ).toBe(true);
  expect(coincident.motion.frames[0].note).toContain('there is no sight ray');
  expect(coincident.timeline?.series.every(({ values }) => values.every(Number.isFinite))).toBe(
    true,
  );
});

it('lags behind the moving beacon and settles after it stops while respecting the motor limits', () => {
  const states = faceFrames(example);
  expect(states).toHaveLength(161);
  expect(states[0]).toEqual({ heading: 0, angularVelocity: 0 });
  expect(states[40].heading).toBeCloseTo(76.0056770839, 8);
  expect(states[40].angularVelocity).toBeCloseTo(27.824843616, 8);
  expect(states[80].heading).toBeCloseTo(126.1349179958, 8);
  expect(states.at(-1)).toEqual({ heading: 135, angularVelocity: 0 });
  expect(states.every(({ heading }) => heading <= 135)).toBe(true);
  for (const [step, state] of states.entries()) {
    expect(Number.isFinite(state.heading)).toBe(true);
    expect(Math.abs(state.angularVelocity)).toBeLessThanOrEqual(example.maxAngularSpeed);
    if (step > 0)
      expect(
        Math.abs(state.angularVelocity - states[step - 1].angularVelocity) / example.timeStep,
      ).toBeLessThanOrEqual(example.maxAngularAcceleration + 1e-9);
  }
  for (let step = 0; step <= example.travelDuration / example.timeStep; step++) {
    const calculation = calculateFaceStep(
      states[step],
      beaconAt(step * example.timeStep, example),
      example,
    );
    expect(calculation.alignment.error).toBeGreaterThan(0);
  }
});

it('shows a slow motor falling further behind during the crossing and still missing the stopped beacon', () => {
  const slow = faceFrames(example, example.slowMotorSpeed);
  expect(slow[40].heading).toBeCloseTo(19.5, 8);
  expect(slow[80].heading).toBe(39.5);
  expect(slow.at(-1)).toEqual({ heading: 79.5, angularVelocity: 10 });
  const errorAt = (step: number) =>
    calculateFaceStep(slow[step], beaconAt(step * example.timeStep, example), example).alignment
      .error;
  expect(errorAt(0)).toBe(45);
  expect(errorAt(40)).toBeCloseTo(70.5, 8);
  expect(errorAt(80)).toBe(95.5);
  expect(errorAt(160)).toBe(55.5);
  for (const [step, state] of slow.entries()) {
    expect(Math.abs(state.angularVelocity)).toBeLessThanOrEqual(example.slowMotorSpeed);
    if (step > 0)
      expect(
        Math.abs(state.angularVelocity - slow[step - 1].angularVelocity) / example.timeStep,
      ).toBeLessThanOrEqual(example.maxAngularAcceleration + 1e-9);
  }
  const comparison = model(parameters).comparison;
  expect(comparison?.findings[0]).toContain('8.87°');
  expect(comparison?.findings[0]).toContain('95.50°');
  expect(comparison?.findings[1]).toContain('55.50°');
  expect(comparison?.timeline.series[1].values).toEqual(slow.map((_state, step) => errorAt(step)));
});

it('draws the camera heading, beacon and present sight ray inside bounds without moving the camera', () => {
  const run = model(parameters);
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(2);
    expect(frame.bodies[0]).toMatchObject({ id: 'dock-camera', x: 0, y: 0 });
    expect(frame.bodies[0].heading).toBeTypeOf('number');
    expect(frame.bodies[1].heading).toBeUndefined();
    for (const body of frame.bodies) {
      expect(body.x).toBeGreaterThanOrEqual(minX);
      expect(body.x).toBeLessThanOrEqual(maxX);
      expect(body.y).toBeGreaterThanOrEqual(minY);
      expect(body.y).toBeLessThanOrEqual(maxY);
    }
    for (const vector of frame.vectors ?? []) {
      expect(vector.x + vector.dx).toBeGreaterThanOrEqual(minX);
      expect(vector.x + vector.dx).toBeLessThanOrEqual(maxX);
      expect(vector.y + vector.dy).toBeGreaterThanOrEqual(minY);
      expect(vector.y + vector.dy).toBeLessThanOrEqual(maxY);
    }
  }
  expect(run.motion.frames[0].vectors?.[0].dx).toBeCloseTo(14.1421356237, 8);
  expect(run.motion.frames[0].vectors?.[0].dy).toBe(0);
  expect(run.motion.frames[0].vectors?.[1].dx).toBeCloseTo(10, 10);
  expect(run.motion.frames[0].vectors?.[1].dy).toBeCloseTo(10, 10);
  expect(run.motion.frames[40].vectors?.[1]).toMatchObject({ dx: 0, dy: 10 });
  expect(run.motion.frames[80].bodies[1]).toEqual(run.motion.frames[160].bodies[1]);
  const start = motionDrawing(run.motion, 0);
  const crossing = motionDrawing(run.motion, run.initialStep);
  expect(start.bodies[0].arrow).not.toBeNull();
  expect(crossing.bodies[0].arrow).not.toBe(start.bodies[0].arrow);
  expect(crossing.bodies[0].x).toBe(start.bodies[0].x);
  expect(crossing.bodies[0].y).toBe(start.bodies[0].y);
  expect(crossing.bodies[1].arrow).toBeNull();
});

it('opens at the beacon crossing and explains the exact current bearing and next angular step', () => {
  const run = model(parameters);
  expect(run.initialStep).toBe(40);
  expect(run.moments.map(({ step }) => step)).toEqual([0, 40, 80, 112]);
  expect(run.motion.frames[40].values).toMatchObject({
    seconds: '2.00',
    targetX: '0.00',
    targetY: '20.00',
    bearing: '90.00',
    heading: '76.01',
    error: '13.99',
  });
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('atan2(20.00, 20.00) = 45.00°');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(90.00 − 0.00) / 0.10 = 900.00');
  expect(run.motion.frames[40].worked?.lines.join(' ')).toContain('atan2(20.00, 0.00) = 90.00°');
  expect(run.motion.frames[80].note).toContain('beacon has stopped');
  expect(run.motion.frames[112].note).toContain('turn is complete');
});

it('supplies every prose placeholder and plots the same measured headings, bearings and errors', () => {
  const run = model(parameters);
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const frame of run.motion.frames)
    for (const text of texts) {
      for (const name of placeholdersIn(text)) expect(frame.values[name], name).toBeDefined();
      expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
    }
  const states = faceFrames(example);
  expect(run.timeline?.series[0].values).toEqual(states.map(({ heading }) => wrapDegrees(heading)));
  expect(run.timeline?.series[1].values[40]).toBe(90);
  expect(run.comparison?.timeline.series[0].values[160]).toBe(0);
  for (const timeline of [run.timeline, run.comparison?.timeline]) {
    if (!timeline) throw new Error('Face supplies both charts.');
    expect(timeline.seconds).toHaveLength(run.motion.frames.length);
    const drawing = timelineDrawing(timeline, run.initialStep);
    expect(drawing.cursorX).toBe(180);
    for (const [index, series] of timeline.series.entries()) {
      expect(series.values).toHaveLength(timeline.seconds.length);
      expect(series.values.every(Number.isFinite)).toBe(true);
      expect(drawing.series[index].points).not.toMatch(/NaN|Infinity/);
    }
  }
});

it('is repeatable and keeps all bearings and angular motion when the whole harbour is translated', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  const moved = model({
    ...parameters,
    cameraX: 100,
    cameraY: -50,
    targetStartX: 120,
    targetStartY: -30,
  });
  expect(moved.timeline?.seconds).toEqual(run.timeline?.seconds);
  for (const [index, series] of (run.timeline?.series ?? []).entries())
    for (const [step, value] of series.values.entries())
      expect(moved.timeline?.series[index].values[step]).toBeCloseTo(value, 10);
  expect(moved.comparison?.findings).toEqual(run.comparison?.findings);
  for (const [index, series] of (run.comparison?.timeline.series ?? []).entries())
    for (const [step, value] of series.values.entries())
      expect(moved.comparison?.timeline.series[index].values[step]).toBeCloseTo(value, 10);
  expect(moved.motion.frames[0].bodies).toMatchObject([
    { x: 100, y: -50 },
    { x: 120, y: -30 },
  ]);
  expect(moved.motion.bounds).toEqual({ minX: 71, maxX: 129, minY: -77, maxY: -21 });
});

it('makes a limited motor and a faster crossing visibly change the live tracking run', () => {
  const slow = model({ ...parameters, maxAngularSpeed: 10 });
  const quick = model({ ...parameters, maxAngularSpeed: 120 });
  expect(model(parameters).inputs?.map(({ name }) => name)).toEqual([
    'maxAngularSpeed',
    'targetVelocityX',
  ]);
  expect(slow.motion.frames[40].values['heading']).toBe('19.50');
  expect(Number(quick.motion.frames[40].values['heading'])).toBeGreaterThan(70);
  expect(slow.motion.frames[40].note).toContain('cannot turn any faster');
  expect(slow.motion.frames[160].values['trackingOutcome']).toContain('still correcting');
  expect(quick.motion.frames[160].values['trackingOutcome']).toContain('at rest');
  expect(slow.moments.at(-1)?.label).toBe('Still following the stopped beacon');
  expect(slow.comparison?.intro).toContain('lines coincide');
  expect(slow.comparison?.timeline.series[0].values).toEqual(
    slow.comparison?.timeline.series[1].values,
  );
  expect(slow.comparison?.findings[1]).toContain('current camera is still correcting');
  const fastBeacon = model({ ...parameters, targetVelocityX: -20 });
  const slowBeacon = model({ ...parameters, targetVelocityX: -5 });
  expect(fastBeacon.initialStep).toBe(20);
  expect(slowBeacon.initialStep).toBe(80);
  expect(fastBeacon.motion.frames[160].bodies[1].x).toBe(-60);
  expect(slowBeacon.motion.frames[160].bodies[1].x).toBe(0);
  expect(fastBeacon.motion.bounds.minX).toBeLessThan(slowBeacon.motion.bounds.minX);
  expect(fastBeacon.motion.frames[20].values['bearing']).toBe('90.00');
  expect(slowBeacon.motion.frames[20].values['bearing']).not.toBe('90.00');
});

it('keeps notes, names, moments, prose and bounds sound across the live ranges', () => {
  const base = model(parameters);
  const variants = [parameters];
  for (const input of base.inputs ?? [])
    for (const value of [input.min, (input.min + input.max) / 2, input.max])
      variants.push({ ...parameters, [input.name]: value });
  for (const maxAngularSpeed of [10, 120])
    for (const targetVelocityX of [-20, -5])
      variants.push({ ...parameters, maxAngularSpeed, targetVelocityX });
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
    expect(run.moments).toHaveLength(4);
    for (const moment of run.moments) {
      expect(Number.isInteger(moment.step)).toBe(true);
      expect(moment.step).toBeGreaterThanOrEqual(0);
      expect(moment.step).toBeLessThan(run.motion.frames.length);
      if (moment.label === 'Camera at rest on the bearing') {
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
      expect(drawing.bodies.map(({ label }) => label)).toEqual(['Camera', 'Beacon']);
      expect(drawing.bodies[1].labelY - 24).toBeGreaterThan(drawing.bodies[0].labelY);
      for (const body of drawing.bodies) {
        expect(body.x - (body.label?.length ?? 0) * 7.2).toBeGreaterThan(0);
        expect(body.x + (body.label?.length ?? 0) * 7.2).toBeLessThan(600);
      }
      expect(drawing.vectors.every(({ head }) => head !== null)).toBe(true);
    }
    for (const chart of [run.timeline, run.comparison?.timeline]) {
      if (!chart) throw new Error('Both tracking charts are present.');
      for (const series of chart.series) {
        expect(series.values).toHaveLength(chart.seconds.length);
        expect(series.values.every(Number.isFinite)).toBe(true);
      }
    }
  }
});
