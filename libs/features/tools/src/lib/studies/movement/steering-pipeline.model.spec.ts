import type { StudyParameters } from '@dotln-angular/models';
import type { SteeringBody } from '@dotln-angular/scene-engine';
import { arrive, distance, length } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import type { PipelineParameters, PipelineState } from './steering-pipeline.model';
import {
  calculatePipelineStep,
  model,
  pipelineFrames,
  segmentClearance,
} from './steering-pipeline.model';

const record = await loadStudy('aifg-a:153');
const visual = record.visual;
const executable = record.pseudocode.executable;

const example: PipelineParameters = {
  startX: 0,
  startY: 0,
  startVelocityX: 0,
  startVelocityY: 0,
  goalX: 80,
  goalY: 0,
  palletX: 40,
  palletY: 0,
  palletRadius: 8,
  courierRadius: 2,
  safetyMargin: 2,
  detourPadding: 8,
  maxSpeed: 12,
  maxAcceleration: 24,
  slowRadius: 12,
  targetRadius: 2,
  responseTime: 0.5,
  cornerSpeed: 0.2,
  timeStep: 0.1,
  steps: 220,
  maxChecks: 2,
  failureChecks: 1,
};
const parameters: StudyParameters = { ...example };
const goal = { x: 80, y: 0 };
const bypass = [{ x: 20, y: -20 }, { x: 60, y: -20 }, goal];
const start: PipelineState = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, route: [goal] };

it('uses the record parameters and pairs each pipeline stage with its code block', () => {
  expect(record.example.parameters).toEqual(example);
  expect(record.id).toBe('aifg-a:153');
  expect(visual.model).toBe(executable.module);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.mechanism.steps).toHaveLength(4);
});

it('works out closed-segment clearance, including endpoints and a stationary preview', () => {
  // Inflated radius = 8 + 2 + 2 = 12. A line through the centre has clearance -12.
  expect(segmentClearance(start.position, goal, example)).toBe(-12);
  expect(segmentClearance(start.position, { x: 20, y: 0 }, example)).toBe(8);
  expect(segmentClearance({ x: 20, y: -20 }, { x: 60, y: -20 }, example)).toBe(8);
  expect(segmentClearance(start.position, start.position, example)).toBe(28);
  expect(segmentClearance(goal, start.position, example)).toBe(-12);
});

it('rejects the delivery line, validates its repair and actuates the local waypoint', () => {
  const result = calculatePipelineStep(start, example);
  expect(result.goal).toEqual(goal);
  expect(result.attempts).toHaveLength(2);
  expect(result.attempts[0]).toMatchObject({
    waypoint: goal,
    routeClearance: -12,
    accepted: false,
  });
  expect(result.attempts[1]).toMatchObject({
    waypoint: bypass[0],
    routeClearance: 8,
    accepted: true,
  });
  expect(result.accepted).toBe(true);
  expect(result.next.route).toEqual(bypass);
  // A diagonal acceleration of magnitude 24 gives 24 / sqrt(2) on each axis.
  expect(result.acceleration.x).toBeCloseTo(24 / Math.sqrt(2), 12);
  expect(result.acceleration.y).toBeCloseTo(-24 / Math.sqrt(2), 12);
  expect(length(result.acceleration)).toBeCloseTo(24, 12);
  expect(result.next.velocity.x).toBeCloseTo(2.4 / Math.sqrt(2), 12);
  expect(result.next.velocity.y).toBeCloseTo(-2.4 / Math.sqrt(2), 12);
  expect(result.next.position.x).toBeCloseTo(0.24 / Math.sqrt(2), 12);
  expect(result.next.position.y).toBeCloseTo(-0.24 / Math.sqrt(2), 12);
});

it('uses the engine Arrive ramp with its half-target-radius stopping distance', () => {
  const state: PipelineState = {
    position: { x: 14, y: -20 },
    velocity: { x: 4, y: 0 },
    route: bypass,
  };
  const result = calculatePipelineStep(state, example);
  const body: SteeringBody = {
    ...state,
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.courierRadius,
    wanderAngle: 0,
  };
  expect(result.acceleration).toEqual(
    arrive(body, bypass[0], { slowRadius: 12, targetRadius: 2, timeToTarget: 0.5 }),
  );
  // Gap 6; stop at 1; desired = 12 * (6 - 1) / (12 - 1) = 60/11.
  // Acceleration = (60/11 - 4) / 0.5 = 32/11.
  expect(result.acceleration.x).toBeCloseTo(32 / 11, 12);
  expect(result.acceleration.y).toBe(0);
  expect(result.next.velocity.x).toBeCloseTo(4 + 3.2 / 11, 12);
  expect(result.next.position.x).toBeCloseTo(14.4 + 0.32 / 11, 12);
});

it('keeps a corner while passing it quickly and releases it only after slowing', () => {
  const fast: PipelineState = { position: bypass[0], velocity: { x: 12, y: 0 }, route: bypass };
  expect(calculatePipelineStep(fast, example).attempts[0].waypoint).toEqual(bypass[0]);
  const slow = calculatePipelineStep({ ...fast, velocity: { x: 0, y: 0 } }, example);
  expect(slow.attempts[0].waypoint).toEqual(bypass[1]);
  expect(slow.next.route).toEqual(bypass.slice(1));
});

it('retains its bypass, clears the pallet, respects motion limits and delivers', () => {
  const states = pipelineFrames(example);
  expect(states).toHaveLength(example.steps + 1);
  expect(states[0]).toEqual(start);
  const routeLengths = new Set<number>();
  for (const [index, state] of states.entries()) {
    expect(Number.isFinite(state.position.x) && Number.isFinite(state.position.y)).toBe(true);
    expect(length(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-10);
    expect(distance(state.position, { x: 40, y: 0 })).toBeGreaterThanOrEqual(12);
    if (index === states.length - 1) continue;
    const result = calculatePipelineStep(state, example);
    expect(result.goal).toEqual(goal);
    expect(result.accepted).toBe(true);
    expect(result.attempts.length).toBeLessThanOrEqual(example.maxChecks);
    expect(length(result.acceleration)).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    expect(
      segmentClearance(state.position, states[index + 1].position, example),
    ).toBeGreaterThanOrEqual(0);
    if (index > 0) expect(result.attempts).toHaveLength(1);
    routeLengths.add(result.next.route.length);
    if (state.route.length > result.next.route.length) {
      expect(distance(state.position, state.route[0])).toBeLessThanOrEqual(example.targetRadius);
      expect(length(state.velocity)).toBeLessThanOrEqual(example.cornerSpeed);
    }
  }
  expect([...routeLengths]).toEqual([3, 2, 1]);
  const last = states[example.steps];
  expect(distance(last.position, goal)).toBeLessThanOrEqual(example.targetRadius);
  expect(length(last.velocity)).toBeLessThan(example.cornerSpeed);
  expect(states.some((state) => state.position.x >= 40 && state.position.y <= -19)).toBe(true);
});

it('discards an unchecked repair and repeats a safe but unproductive refusal', () => {
  const failure = { ...example, maxChecks: example.failureChecks };
  const states = pipelineFrames(failure);
  expect(
    states.every(
      (state) => distance(state.position, start.position) === 0 && length(state.velocity) === 0,
    ),
  ).toBe(true);
  for (const state of states) {
    const result = calculatePipelineStep(state, failure);
    expect(result.accepted).toBe(false);
    expect(result.attempts).toHaveLength(1);
    expect(result.next.route).toEqual([goal]);
  }
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[1].values).toEqual(states.map(() => 80));
  expect(comparison?.findings[1]).toContain('refuses 220 updates');
  expect(comparison?.findings[1]).toContain('80.00 units');
});

it('cannot repair a delivery position inside the pallet by increasing the budget', () => {
  const impossible = {
    ...example,
    goalX: example.palletX,
    maxChecks: example.maxChecks + example.failureChecks,
  };
  const state = pipelineFrames(impossible)[0];
  const result = calculatePipelineStep(state, impossible);
  expect(result.accepted).toBe(false);
  expect(result.attempts).toHaveLength(3);
  expect(result.attempts.every((attempt) => attempt.routeClearance === -12)).toBe(true);
  expect(result.next.position).toEqual(start.position);
});

it('checks momentum even on a clear route, and does not promise emergency stopping', () => {
  const state: PipelineState = {
    position: { x: 27, y: 0 },
    velocity: { x: 12, y: 0 },
    route: bypass,
  };
  const first = calculatePipelineStep(state, example);
  expect(first.attempts[0].routeClearance).toBe(1);
  expect(first.attempts[0].sweptClearance).toBeLessThan(0);
  expect(first.accepted).toBe(false);
  // Braking is capped: v = 12 - 24 * .1 = 9.6; x = 27 + 9.6 * .1 = 27.96.
  expect(first.acceleration).toEqual({ x: -24, y: 0 });
  expect(first.next.velocity.x).toBeCloseTo(9.6);
  expect(first.next.position.x).toBeCloseTo(27.96);
  const second = calculatePipelineStep(first.next, example);
  expect(second.accepted).toBe(false);
  expect(second.next.velocity.x).toBeCloseTo(7.68);
  expect(second.next.position.x).toBeCloseTo(28.728);
  expect(segmentClearance(first.next.position, second.next.position, example)).toBeLessThan(0);
});

it('supplies every prose placeholder, shows the hand calculation and keeps drawings in bounds', () => {
  const run = model(parameters);
  const texts = [
    record.intuition.text,
    record.intuition.situation,
    record.example.description,
    ...record.mechanism.steps.map((step) => step.text),
    visual.textEquivalent,
    ...record.limits,
  ];
  const names = texts.flatMap(placeholdersIn);
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  expect(run.motion.frames).toHaveLength(221);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toHaveLength(5);
  expect(run.moments.map((moment) => moment.step)).toEqual(
    [...run.moments.map((moment) => moment.step)].sort((a, b) => a - b),
  );
  for (const [index, frame] of run.motion.frames.entries()) {
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    expect(fillValues(visual.textEquivalent, frame.values)).not.toMatch(/\{[A-Za-z]/);
    for (const p of [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.vectors ?? []).map((v) => ({ x: v.x + v.dx, y: v.y + v.dy })),
    ]) {
      expect(p.x).toBeGreaterThanOrEqual(minX);
      expect(p.x).toBeLessThanOrEqual(maxX);
      expect(p.y).toBeGreaterThanOrEqual(minY);
      expect(p.y).toBeLessThanOrEqual(maxY);
    }
    for (const zone of frame.zones ?? []) {
      expect(zone.x - zone.radius).toBeGreaterThanOrEqual(minX);
      expect(zone.x + zone.radius).toBeLessThanOrEqual(maxX);
      expect(zone.y - zone.radius).toBeGreaterThanOrEqual(minY);
      expect(zone.y + zone.radius).toBeLessThanOrEqual(maxY);
    }
    const drawing = motionDrawing(run.motion, index);
    expect(drawing.bodies).toHaveLength(1);
    expect(JSON.stringify(drawing)).not.toContain('NaN');
  }
  const first = run.motion.frames[0];
  expect(first.values).toMatchObject({
    exclusionRadius: '12.00',
    firstCorner: '(20.00, -20.00)',
    secondCorner: '(60.00, -20.00)',
    checks: '2',
    rejections: '1',
    routeClearance: '8.00',
    nextPosition: '(0.17, -0.17)',
  });
  const lines = first.worked?.lines.join('\n');
  expect(lines).toContain('8.00 + 2.00 + 2.00 = 12.00');
  expect(lines).toContain('Check 1: decomposer selects (80.00, 0.00)');
  expect(lines).toContain('Check 2: decomposer selects (20.00, -20.00)');
  expect(lines).toContain('(0.17, -0.17)');
  expect(lines).toContain('clamp(800.00 / 1600.00, 0, 1) = 0.50');
  expect(lines).toContain('clearance = 20.00 − 12.00 = 8.00');
  expect(run.timeline?.series.map((series) => series.values.length)).toEqual([221, 221]);
  expect(run.timeline?.series[0].values[0]).toBe(80);
  expect(run.timeline?.series[1].values[0]).toBeCloseTo(Math.sqrt(800));
  const chart = run.timeline;
  if (!chart || !run.comparison)
    throw new Error('The courier needs its progress and deadlock charts.');
  const drawing = timelineDrawing(chart, run.initialStep);
  expect(drawing.series.every((series) => series.dot?.x === drawing.cursorX)).toBe(true);
  expect(JSON.stringify(timelineDrawing(run.comparison.timeline, null))).not.toContain('NaN');
});

it('is repeatable without mutating inputs, and responds to a changed delivery position', () => {
  const frozen = Object.freeze({ ...parameters });
  expect(model(frozen)).toEqual(model(frozen));
  expect(frozen).toEqual(parameters);
  const state: PipelineState = Object.freeze({
    position: Object.freeze({ ...start.position }),
    velocity: Object.freeze({ ...start.velocity }),
    route: Object.freeze(start.route.map((p) => Object.freeze({ ...p }))),
  });
  expect(calculatePipelineStep(state, example)).toEqual(calculatePipelineStep(state, example));
  expect(state).toEqual(start);
  const changed = model({ ...parameters, goalX: example.goalX + example.detourPadding });
  expect(changed.motion.frames[0].values['goalDistance']).toBe('88.00');
  expect(changed.motion.bounds.maxX).toBeGreaterThan(model(parameters).motion.bounds.maxX);
});

it('lets the budget stop delivery and restores progress when a repair can be checked', () => {
  const stopped = model({ ...parameters, maxChecks: 1 });
  const moving = model({ ...parameters, maxChecks: 2 });
  expect(stopped.inputs?.map(({ name }) => name)).toEqual(['maxChecks', 'detourPadding']);
  expect(
    stopped.motion.frames.every((frame) => frame.bodies[0].x === 0 && frame.bodies[0].y === 0),
  ).toBe(true);
  expect(stopped.motion.frames[0].note).toBe(
    'The courier waits because the bypass was suggested but never checked.',
  );
  expect(stopped.moments.map(({ label }) => label)).toEqual([
    'Request refused',
    'Still waiting',
    'No delivery',
  ]);
  expect(stopped.timeline?.series[0].values.every((value) => value === 80)).toBe(true);
  expect(moving.motion.frames[0].note).toContain('accepts a checked bypass');
  expect(moving.motion.frames[moving.moments[1].step].note).toContain('releases the entry corner');
  expect(moving.motion.frames[moving.moments[3].step].note).toContain('releases the exit corner');
  expect(moving.motion.frames[moving.moments[4].step].note).toContain('has reached delivery');
  expect(moving.timeline?.series[0].values.at(-1)).toBeLessThanOrEqual(example.targetRadius);
  expect(stopped.motion.frames[0].worked?.lines.join(' ')).toContain('Budget exhausted');
  expect(moving.motion.frames[0].worked?.lines.join(' ')).toContain('Check 2:');
  // The comparison stays distinct when the selected run is already the failing case.
  expect(stopped.motion.frames[0].values['comparisonChecks']).toBe('2');
  expect(stopped.comparison?.intro).toContain('from 1 to 2');
  expect(stopped.comparison?.timeline.series[0].values).toEqual(
    moving.comparison?.timeline.series[1].values,
  );
  expect(stopped.comparison?.timeline.series[1].values).toEqual(
    moving.comparison?.timeline.series[0].values,
  );
  const description = fillValues(record.example.description, stopped.motion.frames[0].values);
  expect(description).toContain('selected budget is 1');
  expect(description).toContain('comparison changes only that budget to 2');
});

it('moves the bypass and its clearance when padding changes while retaining the delivery goal', () => {
  const narrow = model({ ...parameters, detourPadding: 2 });
  const wide = model({ ...parameters, detourPadding: 12 });
  const firstNarrow = narrow.motion.frames[0];
  const firstWide = wide.motion.frames[0];
  expect(firstNarrow.marks?.find(({ label }) => label === 'Entry')).toMatchObject({
    x: 26,
    y: -14,
  });
  expect(firstWide.marks?.find(({ label }) => label === 'Entry')).toMatchObject({ x: 16, y: -24 });
  expect(firstNarrow.values['routeClearance']).toBe('2.00');
  expect(firstWide.values['routeClearance']).toBe('12.00');
  expect(firstNarrow.marks?.find(({ label }) => label === 'Delivery')).toMatchObject(goal);
  expect(firstWide.marks?.find(({ label }) => label === 'Delivery')).toMatchObject(goal);
  expect(Math.min(...wide.motion.frames.map((frame) => frame.bodies[0].y))).toBeLessThan(
    Math.min(...narrow.motion.frames.map((frame) => frame.bodies[0].y)),
  );
  expect(narrow.timeline?.series[1].values[0]).toBeCloseTo(Math.sqrt(26 * 26 + 14 * 14));
  expect(wide.timeline?.series[1].values[0]).toBeCloseTo(Math.sqrt(16 * 16 + 24 * 24));
  expect(firstNarrow.worked?.lines.join(' ')).toContain('clearance = 14.00 − 12.00 = 2.00');
  expect(firstWide.worked?.lines.join(' ')).toContain('clearance = 24.00 − 12.00 = 12.00');
  for (const run of [narrow, wide]) {
    const description = fillValues(record.example.description, run.motion.frames[0].values);
    expect(description).toContain(
      `${run.motion.frames[0].values['detourPadding']} units of padding`,
    );
    expect(run.motion.frames.at(-1)?.note).toContain('has reached delivery');
  }
});

it('keeps notes, prose, arithmetic, labels and every drawing sound over the offered input ranges', () => {
  const offered = model(parameters).inputs;
  if (!offered || offered.length !== 2) throw new Error('Offer the budget and bypass padding.');
  const budgetInput = offered.find(({ name }) => name === 'maxChecks');
  const paddingInput = offered.find(({ name }) => name === 'detourPadding');
  if (!budgetInput || !paddingInput) throw new Error('Both pipeline controls must be present.');
  const texts = [
    record.example.description,
    record.visual.textEquivalent,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ];
  for (let budget = budgetInput.min; budget <= budgetInput.max; budget += budgetInput.step)
    for (
      let padding = paddingInput.min;
      padding <= paddingInput.max;
      padding += paddingInput.step
    ) {
      const run = model({ ...parameters, maxChecks: budget, detourPadding: padding });
      const where = `budget ${budget}, padding ${padding}`;
      const { minX, maxX, minY, maxY } = run.motion.bounds;
      expect(run.motion.frames).toHaveLength(example.steps + 1);
      expect(run.initialStep, where).toBeGreaterThanOrEqual(0);
      expect(run.initialStep, where).toBeLessThan(run.motion.frames.length);
      expect(new Set(run.moments.map(({ step }) => step)).size, where).toBe(run.moments.length);
      for (const moment of run.moments) {
        expect(moment.step, where).toBeGreaterThanOrEqual(0);
        expect(moment.step, where).toBeLessThan(run.motion.frames.length);
      }
      for (const [index, frame] of run.motion.frames.entries()) {
        expect(frame.note, where).toBeTruthy();
        expect(frame.note, where).not.toMatch(/[\d()]/);
        expect(frame.note?.match(/[.!?](?=\s|$)/g), where).toHaveLength(1);
        expect(frame.note?.length, where).toBeLessThan(125);
        const filled = texts.map((text) => fillValues(text, frame.values));
        for (const text of filled) expect(text, where).not.toMatch(/\{[A-Za-z]/);
        const accessible = fillValues(record.visual.textEquivalent, frame.values);
        expect(accessible, where).not.toMatch(/[()]/);
        expect(accessible.match(/[.!?](?=\s|$)/g), where).toHaveLength(2);
        const displayed = [
          ...Object.values(frame.values),
          frame.note ?? '',
          frame.worked?.title ?? '',
          ...(frame.worked?.lines ?? []),
          ...filled,
        ].join(' ');
        expect(displayed, where).not.toMatch(/\b\d+\.\d{3,}\b/);
        const inBounds = ({ x, y }: { readonly x: number; readonly y: number }) => {
          expect(Number.isFinite(x) && Number.isFinite(y), where).toBe(true);
          expect(x, where).toBeGreaterThanOrEqual(minX);
          expect(x, where).toBeLessThanOrEqual(maxX);
          expect(y, where).toBeGreaterThanOrEqual(minY);
          expect(y, where).toBeLessThanOrEqual(maxY);
        };
        for (const place of [
          ...frame.bodies,
          ...(frame.marks ?? []),
          ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ])
          inBounds(place);
        for (const zone of frame.zones ?? []) {
          inBounds({ x: zone.x - zone.radius, y: zone.y - zone.radius });
          inBounds({ x: zone.x + zone.radius, y: zone.y + zone.radius });
        }
        const view = motionDrawing(run.motion, index);
        expect(view.bodies[0].label, where).toBe('Courier');
        const height = Number(view.viewBox.split(' ')[3]);
        // Check names at the renderer's larger font size, with space below the baseline.
        const labels = [...view.bodies, ...view.marks].flatMap((place) =>
          place.label
            ? [
                {
                  left: place.x - place.label.length * 7.2,
                  right: place.x + place.label.length * 7.2,
                  top: place.labelY - 24,
                  bottom: place.labelY + 6,
                },
              ]
            : [],
        );
        for (const [labelIndex, label] of labels.entries()) {
          expect(label.left, where).toBeGreaterThanOrEqual(0);
          expect(label.right, where).toBeLessThanOrEqual(600);
          expect(label.top, where).toBeGreaterThanOrEqual(0);
          expect(label.bottom, where).toBeLessThanOrEqual(height);
          for (const other of labels.slice(labelIndex + 1))
            expect(
              label.right <= other.left ||
                other.right <= label.left ||
                label.bottom <= other.top ||
                other.bottom <= label.top,
              where,
            ).toBe(true);
        }
      }
      for (const timeline of [run.timeline, run.comparison?.timeline]) {
        if (!timeline) throw new Error('Keep both progress charts.');
        expect(timeline.seconds).toHaveLength(run.motion.frames.length);
        for (const series of timeline.series) {
          expect(series.values).toHaveLength(run.motion.frames.length);
          expect(series.values.every(Number.isFinite), where).toBe(true);
        }
      }
      const comparisonText = [
        run.comparison?.intro ?? '',
        ...(run.comparison?.findings ?? []),
      ].join(' ');
      expect(comparisonText, where).not.toMatch(/\b\d+\.\d{3,}\b/);
    }
});
