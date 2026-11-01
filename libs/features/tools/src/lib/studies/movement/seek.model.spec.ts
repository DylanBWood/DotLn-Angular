import type { StudyParameters } from '@dotln-angular/models';
import { distance, dot, length, subtract } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import type { StudyPoint } from '../study-model';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  calculateSeekStep,
  model,
  seekFrames,
  type SeekParameters,
  sweptAngles,
} from './seek.model';

const record = await loadStudy('aifg-a:110');

const example: SeekParameters = {
  startX: 0,
  startY: 0,
  targetX: 24,
  targetY: 0,
  velocityX: 6,
  velocityY: 2,
  comparisonVelocityY: 0,
  maxSpeed: 8,
  maxAcceleration: 4,
  timeStep: 0.1,
  steps: 220,
  velocitySeconds: 1,
  accelerationSecondsSquared: 2,
};
const parameters: StudyParameters = { ...example };
const beacon = { x: example.targetX, y: example.targetY };

it('uses the authored Seek record and exactly its example parameters', () => {
  expect(record.id).toBe('aifg-a:110');
  expect(record.example.parameters).toEqual(parameters);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable.module).toBe(record.visual.model);
});

it('works the first pull and preserves sideways velocity by hand', () => {
  const first = calculateSeekStep({ position: { x: 0, y: 0 }, velocity: { x: 6, y: 2 } }, example);
  expect(first.offset).toEqual({ x: 24, y: 0 });
  expect(first.distance).toBe(24);
  expect(first.acceleration).toEqual({ x: 4, y: 0 });
  expect(first.trialVelocity).toEqual({ x: 6.4, y: 2 });
  expect(first.next.velocity).toEqual({ x: 6.4, y: 2 });
  expect(first.next.position.x).toBeCloseTo(0.64);
  expect(first.next.position.y).toBeCloseTo(0.2);
});

it('uses full inward acceleration near the target regardless of the current velocity', () => {
  const far = calculateSeekStep({ position: { x: 21, y: -4 }, velocity: { x: 0, y: 0 } }, example);
  const near = calculateSeekStep(
    { position: { x: 23.7, y: -0.4 }, velocity: { x: -6, y: 2 } },
    example,
  );
  expect(far.distance).toBe(5);
  expect(far.acceleration.x).toBeCloseTo(2.4);
  expect(far.acceleration.y).toBeCloseTo(3.2);
  expect(near.distance).toBeCloseTo(0.5);
  expect(near.acceleration.x).toBeCloseTo(2.4);
  expect(near.acceleration.y).toBeCloseTo(3.2);
  expect(length(near.acceleration)).toBeCloseTo(example.maxAcceleration);
});

it('caps speed without braking for a close beacon and coasts through exact coincidence', () => {
  const capped = calculateSeekStep(
    { position: { x: 23, y: 0 }, velocity: { x: 8, y: 0 } },
    example,
  );
  expect(capped.trialVelocity).toEqual({ x: 8.4, y: 0 });
  expect(capped.next.velocity).toEqual({ x: 8, y: 0 });
  expect(capped.next.position).toEqual({ x: 23.8, y: 0 });
  const coincident = calculateSeekStep({ position: beacon, velocity: { x: 6, y: 2 } }, example);
  expect(coincident.acceleration).toEqual({ x: 0, y: 0 });
  expect(coincident.next).toEqual({ position: { x: 24.6, y: 0.2 }, velocity: { x: 6, y: 2 } });
  const resting = calculateSeekStep({ position: beacon, velocity: { x: 0, y: 0 } }, example);
  expect(resting.next).toEqual({ position: beacon, velocity: { x: 0, y: 0 } });
});

it('overshoots and completes repeated circuits around the fixed beacon within its limits', () => {
  const states = seekFrames(example);
  const angles = sweptAngles(states, beacon);
  expect(states).toHaveLength(example.steps + 1);
  const passed = states.findIndex(({ position }) => position.x > example.targetX);
  const circuit = angles.findIndex((angle) => Math.abs(angle) >= 2 * Math.PI);
  expect(passed).toBeGreaterThan(0);
  expect(circuit).toBeGreaterThan(passed);
  expect(Math.abs(angles[angles.length - 1])).toBeGreaterThan(4 * Math.PI);
  const quadrants = new Set(
    states
      .slice(passed)
      .map(
        ({ position }) => `${Math.sign(position.x - beacon.x)},${Math.sign(position.y - beacon.y)}`,
      ),
  );
  expect(quadrants.size).toBe(4);
  expect(Math.min(...states.map(({ position }) => distance(position, beacon)))).toBeGreaterThan(0);
  expect(length(states[states.length - 1].velocity)).toBeGreaterThan(0);
  for (const [step, state] of states.entries()) {
    const calculation = calculateSeekStep(state, example);
    const radius = subtract(state.position, beacon);
    expect(radius.x * state.velocity.y - radius.y * state.velocity.x).toBeLessThan(0);
    expect(length(calculation.acceleration)).toBeCloseTo(example.maxAcceleration);
    expect(length(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-10);
    if (step > 0) {
      expect(angles[step]).toBeLessThan(angles[step - 1]);
      expect(distance(state.velocity, states[step - 1].velocity)).toBeLessThanOrEqual(
        example.maxAcceleration * example.timeStep + 1e-10,
      );
    }
  }
  const selected = states[model(parameters).initialStep];
  expect(selected.position.x).toBeGreaterThan(beacon.x);
  expect(dot(selected.velocity, subtract(beacon, selected.position))).toBeLessThan(0);
  expect(calculateSeekStep(selected, example).acceleration.x).toBeLessThan(0);
  expect(selected.velocity.x).toBeGreaterThan(0);
});

it('removing only sideways velocity replaces the orbit with repeated straight overshoot', () => {
  const changed = { ...example, velocityY: example.comparisonVelocityY };
  const straight = seekFrames(changed);
  expect(straight.every(({ position, velocity }) => position.y === 0 && velocity.y === 0)).toBe(
    true,
  );
  expect(straight.findIndex(({ position }) => position.x > example.targetX)).toBe(31);
  expect(straight[31].position.x).toBeCloseTo(24.4);
  expect(straight[31].velocity.x).toBeCloseTo(8);
  expect(Math.max(...straight.map(({ position }) => position.x))).toBeCloseTo(32);
  const crossings = straight
    .slice(1)
    .filter(
      (state, index) => (state.position.x - beacon.x) * (straight[index].position.x - beacon.x) < 0,
    );
  expect(crossings.length).toBeGreaterThanOrEqual(3);
  const run = model(parameters);
  expect(run.comparison?.timeline.series[0].values).toEqual(
    seekFrames(example).map(({ position }) => distance(position, beacon)),
  );
  expect(run.comparison?.timeline.series[1].values).toEqual(
    straight.map(({ position }) => distance(position, beacon)),
  );
  expect(run.comparison?.findings.join(' ')).toContain('0.40 units beyond the beacon');
});

it('has no wall constraint: the same pull advances through a hypothetical barrier', () => {
  const wall = example.targetX / 2;
  const step = calculateSeekStep(
    { position: { x: wall - 0.1, y: 0 }, velocity: { x: example.maxSpeed, y: 0 } },
    example,
  );
  expect(step.acceleration.x).toBe(example.maxAcceleration);
  expect(step.next.position.x).toBeGreaterThan(wall);
});

it('supplies every prose value, the worked arithmetic and bounds for the complete drawing', () => {
  const run = model(record.example.parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.motion.frames.length).toBeLessThanOrEqual(241);
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
    expect(frame.bodies).toHaveLength(1);
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    for (const text of texts) expect(fillValues(text, frame.values)).not.toMatch(/\{[a-zA-Z]/);
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) inBounds(point);
    for (const vector of frame.vectors ?? [])
      inBounds({ x: vector.x + vector.dx, y: vector.y + vector.dy });
    for (const link of frame.links ?? []) {
      inBounds(link.from);
      inBounds(link.to);
    }
  }
  const first = run.motion.frames[0];
  expect(first.worked?.lines.join(' ')).toContain('(6.00, 2.00) + (4.00, 0.00) × 0.10');
  expect(first.worked?.lines.join(' ')).toContain('(0.64, 0.20)');
  expect(run.motion.frames[run.initialStep].note).toContain('Mica is moving away');
  expect(
    fillValues(record.visual.textEquivalent, run.motion.frames[run.initialStep].values),
  ).toContain('moving away while the motor pulls back');
  expect(run.motion.frames.at(-1)?.links?.length).toBeGreaterThanOrEqual(example.steps);
  expect(run.timeline?.series[0].values).toHaveLength(run.motion.frames.length);
  for (const moment of run.moments) {
    expect(moment.step).toBeGreaterThanOrEqual(0);
    expect(moment.step).toBeLessThan(run.motion.frames.length);
  }
});

it('changes straight overshoot into an orbit when the sideways start is raised', () => {
  const input = model(parameters).inputs?.find(({ name }) => name === 'velocityY');
  if (!input) throw new Error('Seek must expose the sideways start.');
  const straight = model({ ...parameters, velocityY: input.min });
  const sideways = model({ ...parameters, velocityY: input.max });
  expect(straight.motion.frames.every(({ bodies }) => bodies[0].y === 0)).toBe(true);
  expect(
    Math.max(...sideways.motion.frames.map(({ bodies }) => Math.abs(bodies[0].y))),
  ).toBeGreaterThan(1);
  expect(sideways.moments.some(({ label }) => label === 'Complete circuit')).toBe(true);
  expect(straight.moments.some(({ label }) => label === 'Complete circuit')).toBe(false);
  expect(straight.motion.frames[0].note).toContain('heads straight');
  expect(sideways.motion.frames[0].note).toContain('sideways motion');
  expect(straight.motion.frames[0].worked?.lines.join(' ')).toContain(
    '(6.00, 0.00) + (4.00, 0.00)',
  );
  expect(sideways.motion.frames[0].worked?.lines.join(' ')).toContain(
    '(6.00, 4.00) + (4.00, 0.00)',
  );
  expect(straight.timeline?.series[0].values).not.toEqual(sideways.timeline?.series[0].values);
  expect(straight.comparison?.intro).toContain('runs coincide');
  expect(straight.comparison?.timeline.series[0].values).toEqual(
    straight.comparison?.timeline.series[1].values,
  );
  expect(straight.comparison?.findings.join(' ')).not.toContain('circles the beacon');
});

it('keeps every offered sideways start readable, labelled and inside the drawing', () => {
  const input = model(parameters).inputs?.[0];
  if (!input) throw new Error('Seek must offer a live input.');
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
    for (const moment of run.moments)
      expect(moment.step >= 0 && moment.step < run.motion.frames.length).toBe(true);
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
      ];
      for (const { x, y } of points)
        expect(Number.isFinite(x + y) && x >= minX && x <= maxX && y >= minY && y <= maxY).toBe(
          true,
        );
      const drawing = motionDrawing(run.motion, step);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label !== null);
      expect(labels.map(({ label }) => label).sort()).toEqual(['Beacon', 'Mica']);
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
    expect(
      [run.caption, run.comparison?.intro, ...(run.comparison?.findings ?? [])].join(' '),
    ).not.toMatch(/\d+\.\d{3,}/);
  }
});
