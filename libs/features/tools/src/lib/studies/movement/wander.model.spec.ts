import type { StudyParameters } from '@dotln-angular/models';
import { distance, length, normalize } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  calculateWanderStep,
  initialWanderState,
  model,
  wanderFrames,
  type WanderParameters,
} from './wander.model';

const record = await loadStudy('aifg-a:125');

const example: WanderParameters = {
  startX: 0,
  startY: 0,
  startHeading: 0,
  startSpeed: 0,
  initialAngle: 0,
  maxSpeed: 10,
  maxAcceleration: 8,
  responseTime: 0.5,
  wanderRadius: 4,
  narrowRadius: 0.5,
  wanderOffset: 6,
  turnScale: 0.6,
  walkingFraction: 0.4,
  drawPairs:
    '0.5:0.5,0.75:0.25,0.75:0.25,0.5:0.5,0.25:0.75,0.25:0.75,0.25:0.75,0.25:0.75,0.5:0.5,0.75:0.25,0.75:0.25,0.5:0.5',
  timeStep: 0.2,
  steps: 100,
  radius: 1,
  arrowSeconds: 1,
};
const parameters: StudyParameters = { ...example };

it('uses the assigned draft and the exact parameters of its worked example', () => {
  expect(record.id).toBe('aifg-a:125');
  expect(record.slug).toBe('wander');
  expect(record.example.parameters).toEqual(example);
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('works the first forward update and then the first turn with the engine’s arithmetic', () => {
  const states = wanderFrames(example);
  const first = calculateWanderStep(states[0], 0, example);
  expect(first.draw).toEqual({ first: 0.5, second: 0.5 });
  expect(first.binomial).toBe(0);
  expect(first.angle).toBe(0);
  expect(first.centre).toEqual({ x: 6, y: 0 });
  expect(first.target.x).toBeCloseTo(10, 10);
  expect(first.target.y).toBe(0);
  expect(first.desired).toEqual({ x: 4, y: 0 });
  expect(first.acceleration).toEqual({ x: 8, y: 0 });
  expect(first.next.velocity).toEqual({ x: 1.6, y: 0 });
  expect(first.next.position.x).toBeCloseTo(0.32, 10);
  expect(first.next.position.y).toBe(0);
  const second = calculateWanderStep(states[1], 1, example);
  expect(second.binomial).toBe(0.5);
  expect(second.angle).toBe(0.3);
  // (0.32, 0) + (6, 0) + 4 × (cos(0.3), sin(0.3)).
  expect(second.target.x).toBeCloseTo(10.1413459565, 8);
  expect(second.target.y).toBeCloseTo(1.1820808266, 8);
  expect(second.next.velocity.x).toBeCloseTo(2.5485355052, 8);
  expect(second.next.velocity.y).toBeCloseTo(0.1911934852, 8);
  expect(second.next.position.x).toBeCloseTo(0.829707101, 8);
  expect(second.next.position.y).toBeCloseTo(0.038238697, 8);
});

it('normalises the target direction and caps vector magnitude rather than each coordinate', () => {
  const start = initialWanderState(example);
  const sideways = calculateWanderStep({ ...start, wanderAngle: Math.PI / 2 }, 0, example);
  // A target at (6, 4) has length sqrt(52); the desired speed is still four.
  expect(sideways.target.x).toBeCloseTo(6, 7);
  expect(sideways.target.y).toBeCloseTo(4, 7);
  expect(sideways.desired.x).toBeCloseTo(24 / Math.sqrt(52), 7);
  expect(sideways.desired.y).toBeCloseTo(16 / Math.sqrt(52), 7);
  expect(length(sideways.desired)).toBeCloseTo(4, 10);
  const diagonal = calculateWanderStep({ ...start, velocity: { x: -6, y: -8 } }, 0, example);
  expect(diagonal.requestedAcceleration).toEqual({ x: 20, y: 16 });
  expect(diagonal.acceleration.x).toBeCloseTo(40 / Math.sqrt(41), 10);
  expect(diagonal.acceleration.y).toBeCloseTo(32 / Math.sqrt(41), 10);
  expect(length(diagonal.acceleration)).toBeCloseTo(8, 10);
  const opposed = calculateWanderStep({ ...start, velocity: { x: -10, y: 0 } }, 0, example);
  expect(opposed.requestedAcceleration).toEqual({ x: 28, y: 0 });
  expect(opposed.acceleration).toEqual({ x: 8, y: 0 });
  expect(opposed.next.velocity).toEqual({ x: -8.4, y: 0 });
  // Facing copies the resulting velocity; it has no separate angular acceleration limit.
  expect(opposed.next.heading.x).toBeCloseTo(-1);
  expect(opposed.next.heading.y).toBe(0);
});

it('retains angle across zero inputs and keeps a zero relative angle aligned with the current heading', () => {
  const states = wanderFrames(example);
  expect(states.slice(0, 8).map(({ wanderAngle }) => wanderAngle)).toEqual([
    0, 0, 0.3, 0.6, 0.6, 0.3, 0, -0.3,
  ]);
  const noDrawChange = calculateWanderStep(states[3], 3, example);
  expect(noDrawChange.binomial).toBe(0);
  expect(noDrawChange.angle).toBe(0.6);
  expect(states[6].heading.y).toBeGreaterThan(0.3);
  const straightAheadNow = calculateWanderStep(states[5], 5, example);
  expect(straightAheadNow.angle).toBe(0);
  expect(straightAheadNow.desiredTurn).toBeCloseTo(0, 10);
  expect(straightAheadNow.desired.y).toBeGreaterThan(1);
  expect(states[12].wanderAngle).toBe(0);
  expect(states[12].position.x).toBeGreaterThan(8);
  expect(states[12].heading.y).toBeGreaterThan(0);
});

it('keeps acceleration, speed and target geometry bounded while velocity follows turns gradually', () => {
  const states = wanderFrames(example);
  expect(states).toHaveLength(101);
  const turns = states.map((state, step) => calculateWanderStep(state, step, example));
  expect(turns.some(({ desiredTurn }) => desiredTurn > 0)).toBe(true);
  expect(turns.some(({ desiredTurn }) => desiredTurn < 0)).toBe(true);
  for (const [step, calculation] of turns.entries()) {
    expect(distance(calculation.centre, states[step].position)).toBeCloseTo(6, 9);
    expect(distance(calculation.target, calculation.centre)).toBeCloseTo(4, 9);
    expect(length(calculation.desired)).toBeCloseTo(4, 9);
    expect(length(calculation.acceleration)).toBeLessThanOrEqual(8 + 1e-10);
    expect(length(states[step].velocity)).toBeLessThanOrEqual(4 + 1e-10);
    expect(Math.abs(calculation.actualTurn)).toBeLessThanOrEqual(
      Math.abs(calculation.desiredTurn) + 1e-10,
    );
    if (length(states[step].velocity) > 0)
      expect(states[step].heading).toEqual(normalize(states[step].velocity));
  }
  expect(turns[2].actualTurn).toBeGreaterThan(0);
  expect(turns[2].actualTurn).toBeLessThan(turns[2].desiredTurn);
});

it('shows a narrower patrol from changing only the circle radius, with the same angle tape', () => {
  const normal = wanderFrames(example);
  const narrow = wanderFrames(example, example.narrowRadius);
  expect(narrow[0]).toEqual(normal[0]);
  expect(narrow[1].position.x).toBeCloseTo(normal[1].position.x, 10);
  expect(narrow.map(({ wanderAngle }) => wanderAngle)).toEqual(
    normal.map(({ wanderAngle }) => wanderAngle),
  );
  const spread = (ys: readonly number[]) => Math.max(...ys) - Math.min(...ys);
  const normalWidth = spread(normal.map(({ position }) => position.y));
  const narrowWidth = spread(narrow.map(({ position }) => position.y));
  expect(normalWidth).toBeCloseTo(14.3116262929, 6);
  expect(narrowWidth).toBeCloseTo(2.7378147287, 6);
  expect(narrowWidth).toBeLessThan(normalWidth / 5);
  const collapsed = wanderFrames(example, 0);
  expect(collapsed.every(({ position, velocity }) => position.y === 0 && velocity.y === 0)).toBe(
    true,
  );
});

it('applies perturbations per update and does not introduce a position-based avoidance force', () => {
  const normal = model(parameters);
  const fasterUpdates = model({ ...parameters, timeStep: 0.1 });
  expect(normal.motion.frames[12].seconds).toBeCloseTo(2.4);
  expect(fasterUpdates.motion.frames[12].seconds).toBeCloseTo(1.2);
  expect(fasterUpdates.motion.frames.map(({ values }) => values['angle'])).toEqual(
    normal.motion.frames.map(({ values }) => values['angle']),
  );
  const state = wanderFrames(example)[2];
  const shifted = calculateWanderStep(
    { ...state, position: { x: state.position.x + 1000, y: state.position.y + 1000 } },
    2,
    example,
  );
  expect(shifted.acceleration).toEqual(calculateWanderStep(state, 2, example).acceleration);
  expect(() => model({ ...parameters, walkingFraction: 0.5 })).toThrow(
    'fixes wander walkingFraction',
  );
});

it('supplies every selected-moment value and fits the circle, target and vectors in the local drawing', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.initialStep).toBe(2);
  expect(run.moments).toHaveLength(5);
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values).toMatchObject({
    seconds: '0.40',
    oldAngle: '0.30',
    angle: '0.60',
    walkingSpeed: '4.00',
  });
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('10.00 × 0.40 = 4.00');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain(
    '(0.00, 0.00) + (1.60, 0.00) × 0.20 ≈ (0.32, 0.00)',
  );
  expect(run.comparison?.findings[0]).toContain('14.31 units');
  expect(run.comparison?.findings[0]).toContain('2.74 units');
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
      ...(frame.marks ?? []),
      ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y + radius },
      ]),
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
  expect(run.comparison?.timeline.series[0].values).toEqual(
    wanderFrames(example).map(({ position }) => position.y),
  );
  expect(run.comparison?.timeline.series[1].values).toEqual(
    wanderFrames(example, example.narrowRadius).map(({ position }) => position.y),
  );
  const drawing = motionDrawing(run.motion, run.initialStep);
  expect(drawing.bodies).toHaveLength(1);
  expect(drawing.bodies[0].arrow).not.toBeNull();
  expect(drawing.zones).toHaveLength(1);
  expect(drawing.marks).toHaveLength(2);
  if (!run.timeline) throw new Error('Wander needs a turn chart.');
  const chart = timelineDrawing(run.timeline, run.initialStep);
  expect(chart.series.every(({ points }) => !points.includes('NaN'))).toBe(true);
  expect(run.timeline.series[0].values[2]).toBeLessThan(run.timeline.series[1].values[2]);
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
});

it('follows Nia locally so the circle and labelled target stay large and velocity directions remain distinct', () => {
  const run = model(parameters);
  const states = wanderFrames(example);
  expect(states[100].position.x).toBeGreaterThan(70);
  expect(run.motion.trail).toBe(false);
  expect(run.motion.bounds.maxX - run.motion.bounds.minX).toBeLessThan(20);
  for (const [step, frame] of run.motion.frames.entries()) {
    expect(frame.bodies[0]).toMatchObject({ label: 'Nia', x: 0, y: 0, heading: 0 });
    expect(frame.zones?.[0]).toMatchObject({ x: 6, y: 0, radius: 4 });
    const target = frame.marks?.find(({ shape }) => shape === 'cross');
    if (!target) throw new Error('The circle target must be visible.');
    expect(target.label).toBe('Target');
    // Map the local target back into the gallery to check that the camera preserves steering.
    const heading = states[step].heading;
    const worldX = states[step].position.x + target.x * heading.x - target.y * heading.y;
    const worldY = states[step].position.y + target.x * heading.y + target.y * heading.x;
    const calculation = calculateWanderStep(states[step], step, example);
    expect(worldX).toBeCloseTo(calculation.target.x, 9);
    expect(worldY).toBeCloseTo(calculation.target.y, 9);
    const desired = frame.vectors?.find(({ tone }) => tone === 'desired');
    if (!desired) throw new Error('The desired velocity must be visible.');
    expect(Math.atan2(desired.dy, desired.dx)).toBeCloseTo(calculation.desiredTurn, 10);
  }
  const drawing = motionDrawing(run.motion, run.initialStep);
  expect(drawing.zones[0].r * 2).toBeGreaterThan(250);
  expect(drawing.vectors[1].y2 - drawing.vectors[0].y2).toBeGreaterThan(20);
  expect(drawing.vectors.every(({ head }) => head !== null)).toBe(true);
  const target = drawing.marks.find(({ label }) => label === 'Target');
  if (!target) throw new Error('The target needs its short label.');
  expect(target.x - drawing.bodies[0].x).toBeGreaterThan(100);
  expect(record.visual.textEquivalent).not.toMatch(/\([^{]*\{/);
});

it('makes radius change the target deflection and makes zero nudge scale remove turning', () => {
  expect(model(parameters).inputs?.map(({ name }) => name)).toEqual(['wanderRadius', 'turnScale']);
  const narrow = model({ ...parameters, wanderRadius: 0.5 });
  const wide = model({ ...parameters, wanderRadius: 5 });
  const narrowTurn = narrow.timeline?.series[1].values[2];
  const wideTurn = wide.timeline?.series[1].values[2];
  if (narrowTurn === undefined || wideTurn === undefined)
    throw new Error('Both runs need their target bearing.');
  expect(narrowTurn).toBeGreaterThan(0);
  expect(wideTurn).toBeGreaterThan(narrowTurn * 4);
  expect(narrow.motion.frames[2].note).toContain('gentle turns');
  expect(narrow.comparison?.intro).toContain('Both traces now use');
  const straight = model({ ...parameters, turnScale: 0 });
  const turning = model({ ...parameters, turnScale: 1.2 });
  expect(
    straight.timeline?.series.every(({ values }) => values.every((value) => value === 0)),
  ).toBe(true);
  expect(turning.timeline?.series[1].values.some((value) => value > 0.4)).toBe(true);
  expect(turning.timeline?.series[1].values.some((value) => value < -0.4)).toBe(true);
  expect(straight.motion.frames[2].note).toContain('walks straight on');
  expect(straight.motion.frames[2].worked?.lines.join(' ')).toContain('× 0.00');
  expect(
    straight.comparison?.timeline.series.every(({ values }) =>
      values.every((value) => value === 0),
    ),
  ).toBe(true);
});

it('keeps every note, reading, label and complete circle sound across input endpoints and their combinations', () => {
  const offered = model(parameters).inputs ?? [];
  const cases: readonly StudyParameters[] = [
    parameters,
    ...offered.flatMap((input) =>
      [input.min, input.max].map((value) => ({ ...parameters, [input.name]: value })),
    ),
    ...[0.5, 5].flatMap((wanderRadius) =>
      [0, 1.2].map((turnScale) => ({ ...parameters, wanderRadius, turnScale })),
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
        ...(frame.marks ?? []),
        ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
          { x: x - radius, y: y - radius },
          { x: x + radius, y: y + radius },
        ]),
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
      if (!chart) throw new Error('Wander needs both its turn and comparison charts.');
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
    ])
      expect(text).not.toMatch(/\d+\.\d{3}/);
    for (const frame of [0, run.initialStep, run.motion.frames.length - 1]) {
      const drawing = motionDrawing(run.motion, frame);
      const height = Number(drawing.viewBox.split(' ')[3]);
      for (const labelled of [...drawing.bodies, ...drawing.marks].filter(({ label }) => label)) {
        expect(labelled.labelY).toBeGreaterThan(16);
        expect(labelled.labelY).toBeLessThan(height);
      }
    }
  }
});
