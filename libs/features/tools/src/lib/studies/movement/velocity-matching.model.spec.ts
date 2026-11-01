import type { StudyParameters } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  calculateVelocityMatchingStep,
  model,
  velocityMatchingFrames,
  type VelocityMatchingParameters,
} from './velocity-matching.model';

const record = await loadStudy('aifg-a:118');

const example: VelocityMatchingParameters = {
  courierStart: 0,
  courierVelocity: 0,
  cartStart: 12,
  cartVelocity: 5.5,
  maxSpeed: 10,
  maxAcceleration: 4,
  responseTime: 0.5,
  shortResponseTime: 0.1,
  timeStep: 0.25,
  steps: 32,
  radius: 1,
  arrowSeconds: 1,
};
const parameters: StudyParameters = { ...example };

it('uses the assigned draft and the exact parameters of its worked example', () => {
  expect(record.id).toBe('aifg-a:118');
  expect(record.slug).toBe('velocity-matching');
  expect(record.example.parameters).toEqual(example);
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('caps the initial request and releases the cap at the displayed moment', () => {
  const states = velocityMatchingFrames(example);
  expect(calculateVelocityMatchingStep(states[0], example)).toEqual({
    velocityGap: 5.5,
    requestedAcceleration: 11,
    acceleration: 4,
    next: { courierPosition: 0.25, courierVelocity: 1, cartPosition: 13.375 },
  });
  // Half a second has elapsed, but the acceleration limit permits only a two-unit speed gain.
  expect(states[2].courierVelocity).toBe(2);
  expect(states[4]).toEqual({ courierPosition: 2.5, courierVelocity: 4, cartPosition: 17.5 });
  expect(calculateVelocityMatchingStep(states[4], example)).toEqual({
    velocityGap: 1.5,
    requestedAcceleration: 3,
    acceleration: 3,
    next: { courierPosition: 3.6875, courierVelocity: 4.75, cartPosition: 18.875 },
  });
});

it('converges monotonically in velocity while preserving the distance lost during acceleration', () => {
  const states = velocityMatchingFrames(example);
  expect(states).toHaveLength(33);
  for (const [index, state] of states.entries()) {
    expect(state.courierVelocity).toBeLessThan(example.cartVelocity);
    expect(Math.abs(state.courierVelocity)).toBeLessThanOrEqual(example.maxSpeed);
    if (index === 0) continue;
    const before = states[index - 1];
    expect(state.courierVelocity).toBeGreaterThan(before.courierVelocity);
    expect(state.courierVelocity - before.courierVelocity).toBeLessThanOrEqual(
      example.maxAcceleration * example.timeStep,
    );
    expect(state.cartPosition - state.courierPosition).toBeGreaterThan(
      before.cartPosition - before.courierPosition,
    );
    if (index > 4)
      expect(example.cartVelocity - state.courierVelocity).toBe(
        (example.cartVelocity - before.courierVelocity) / 2,
      );
  }
  const last = states[32];
  expect(last.courierVelocity).toBeCloseTo(5.5, 7);
  expect(last.cartPosition).toBe(56);
  expect(last.cartPosition - last.courierPosition).toBeCloseTo(15.375, 7);
});

it('copies signed velocity independently of both positions and leaves a matched gap unchanged', () => {
  const state = { courierPosition: -100, courierVelocity: 5.5, cartPosition: 200 };
  const matched = calculateVelocityMatchingStep(state, example);
  expect(matched.acceleration).toBe(0);
  expect(matched.next.cartPosition - matched.next.courierPosition).toBe(300);
  const nearer = calculateVelocityMatchingStep({ ...state, cartPosition: -99 }, example);
  expect(nearer.acceleration).toBe(matched.acceleration);
  const opposite = calculateVelocityMatchingStep({ ...state, courierVelocity: -5.5 }, example);
  expect(opposite.velocityGap).toBe(11);
  expect(opposite.requestedAcceleration).toBe(22);
  expect(opposite.acceleration).toBe(4);
  expect(opposite.next.courierVelocity).toBe(-4.5);
});

it('sustains alternating overshoot when only the response time is shortened', () => {
  const normal = velocityMatchingFrames(example);
  const short = velocityMatchingFrames(example, example.shortResponseTime);
  expect(short.slice(0, 5)).toEqual(normal.slice(0, 5));
  expect(short.slice(5, 10).map(({ courierVelocity }) => courierVelocity)).toEqual([5, 6, 5, 6, 5]);
  for (const [index, state] of short.entries()) {
    if (index >= 5) expect(Math.abs(state.courierVelocity - example.cartVelocity)).toBe(0.5);
    expect(Math.abs(state.courierVelocity)).toBeLessThanOrEqual(example.maxSpeed);
    if (index > 0)
      expect(
        Math.abs(state.courierVelocity - short[index - 1].courierVelocity),
      ).toBeLessThanOrEqual(example.maxAcceleration * example.timeStep);
  }
  expect(1 - example.timeStep / example.shortResponseTime).toBe(-1.5);
  expect(short[32].courierVelocity).toBe(6);
});

it('cannot match an unreachable speed and brakes when the velocity to match becomes zero', () => {
  const fastCart = velocityMatchingFrames({ ...example, cartVelocity: 12 });
  expect(fastCart[32].courierVelocity).toBe(10);
  expect(fastCart[32].cartPosition - fastCart[32].courierPosition).toBeGreaterThan(
    fastCart[31].cartPosition - fastCart[31].courierPosition,
  );
  const stoppedCart = calculateVelocityMatchingStep(
    { courierPosition: 0, courierVelocity: 5.5, cartPosition: 12 },
    { ...example, cartVelocity: 0 },
  );
  expect(stoppedCart.acceleration).toBe(-4);
  expect(stoppedCart.next.courierVelocity).toBe(4.5);
});

it('keeps the drawing, chart, arithmetic and accessible prose on the same deterministic run', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(record.example.parameters).toEqual(example);
  expect(run.initialStep).toBe(4);
  expect(run.moments).toHaveLength(4);
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values).toMatchObject({
    seconds: '1.00',
    courierPosition: '2.50',
    cartPosition: '17.50',
    positionGap: '15.00',
    requestedAcceleration: '3.00',
    nextVelocity: '4.75',
    nextPosition: '3.69',
    errorMultiplier: '0.50',
  });
  expect(selected.worked?.lines.join(' ')).toContain('1.50 / 0.50 = 3.00');
  expect(selected.worked?.lines.join(' ')).toContain('4.00 + 3.00 × 0.25 ≈ 4.75');
  expect(run.motion.frames[0].worked?.note).toContain('cap is active');
  expect(run.comparison?.findings.join(' ')).toContain('5.00 and 6.00');
  expect(run.comparison?.findings.join(' ')).toContain('15.37 units behind');
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const bounds = run.motion.bounds;
  for (const frame of run.motion.frames) {
    for (const text of texts) {
      for (const name of placeholdersIn(text)) expect(frame.values[name], name).toBeDefined();
      expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
    }
    const points = [
      ...frame.bodies,
      ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
        { x, y },
        { x: x + dx, y: y + dy },
      ]),
    ];
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(bounds.minX);
      expect(x).toBeLessThanOrEqual(bounds.maxX);
      expect(y).toBeGreaterThanOrEqual(bounds.minY);
      expect(y).toBeLessThanOrEqual(bounds.maxY);
    }
  }
  const states = velocityMatchingFrames(example);
  expect(run.timeline?.series[0].values).toEqual(
    states.map(({ courierVelocity }) => courierVelocity),
  );
  expect(run.comparison?.timeline.series[1].values).toEqual(
    velocityMatchingFrames(example, example.shortResponseTime).map(
      ({ courierVelocity }) => courierVelocity,
    ),
  );
  expect(motionDrawing(run.motion, run.initialStep).bodies).toHaveLength(2);
  if (!run.timeline) throw new Error('Velocity matching needs a velocity chart.');
  const drawing = timelineDrawing(run.timeline, run.initialStep);
  expect(drawing.series.every(({ points }) => !points.includes('NaN'))).toBe(true);
  expect(drawing.cursorX).not.toBeNull();
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
});

it('makes each live input visibly change the correction and describes overshoot as it happens', () => {
  expect(model(parameters).inputs?.map(({ name }) => name)).toEqual([
    'responseTime',
    'maxAcceleration',
  ]);
  const quick = model({ ...parameters, responseTime: 0.1 });
  const slow = model({ ...parameters, responseTime: 1 });
  expect(quick.timeline?.series[0].values.some((velocity) => velocity > example.cartVelocity)).toBe(
    true,
  );
  expect(
    slow.timeline?.series[0].values.every((velocity) => velocity <= example.cartVelocity),
  ).toBe(true);
  expect(quick.motion.frames[5].note).toContain('past the cart’s pace');
  expect(quick.motion.frames[6].note).toContain('brakes her');
  expect(slow.motion.frames[5].note).toContain('draw closer');
  expect(quick.motion.frames[5].worked?.lines.join(' ')).toContain('/ 0.10');
  expect(quick.comparison?.intro).toContain('Both traces now use');
  const weak = model({ ...parameters, maxAcceleration: 1 });
  const strong = model({ ...parameters, maxAcceleration: 8 });
  expect(weak.motion.frames[1].bodies[0].x).toBe(0.0625);
  expect(strong.motion.frames[1].bodies[0].x).toBe(0.5);
  expect(weak.motion.frames[1].note).toContain('at her limit');
  expect(strong.motion.frames[1].note).toContain('eases her acceleration');
  expect(Number(weak.motion.frames[32].values['positionGap'])).toBeGreaterThan(
    Number(strong.motion.frames[32].values['positionGap']),
  );
});

it('keeps notes, rounded readings, labels and charts sound across input endpoints and their combinations', () => {
  const offered = model(parameters).inputs ?? [];
  const cases: readonly StudyParameters[] = [
    parameters,
    ...offered.flatMap((input) =>
      [input.min, input.max].map((value) => ({ ...parameters, [input.name]: value })),
    ),
    ...[0.1, 1].flatMap((responseTime) =>
      [1, 8].map((maxAcceleration) => ({ ...parameters, responseTime, maxAcceleration })),
    ),
  ];
  const texts = [
    record.example.description,
    ...record.limits,
    record.visual.textEquivalent,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const changed of cases) {
    const run = model(changed);
    const bounds = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
    for (const frame of run.motion.frames) {
      expect(frame.note).toMatch(/^[^.!?]+[.!?]$/);
      expect(frame.note).not.toMatch(/[0-9()]/);
      expect(frame.bodies.map(({ label }) => label)).toEqual(['Mira', 'Cart']);
      for (const text of texts) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
      const displayed = [
        ...Object.values(frame.values),
        frame.note ?? '',
        frame.worked?.title ?? '',
        ...(frame.worked?.lines ?? []),
        frame.worked?.note ?? '',
      ];
      for (const text of displayed) expect(text).not.toMatch(/\d+\.\d{3}/);
      const points = [
        ...frame.bodies,
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
      ];
      for (const { x, y } of points) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(bounds.minX);
        expect(x).toBeLessThanOrEqual(bounds.maxX);
        expect(y).toBeGreaterThanOrEqual(bounds.minY);
        expect(y).toBeLessThanOrEqual(bounds.maxY);
      }
    }
    for (const chart of [run.timeline, run.comparison?.timeline]) {
      if (!chart) throw new Error('Both velocity charts are required.');
      for (const line of chart.series) {
        expect(line.values).toHaveLength(run.motion.frames.length);
        expect(line.values.every(Number.isFinite)).toBe(true);
      }
      const drawing = timelineDrawing(chart, run.initialStep);
      expect(drawing.series.every(({ points }) => !/NaN|Infinity/.test(points))).toBe(true);
    }
    for (const text of [
      run.caption,
      ...(run.comparison?.findings ?? []),
      run.comparison?.intro ?? '',
      run.comparison?.note ?? '',
    ])
      expect(text).not.toMatch(/\d+\.\d{3}/);
  }
  const labels = motionDrawing(model(parameters).motion, 4).bodies;
  expect(labels[1].x - labels[0].x).toBeGreaterThan(80);
});
