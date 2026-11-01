import type { StudyParameters } from '@dotln-angular/models';
import {
  applyStep,
  cosine,
  createSimulation,
  distance,
  length,
  sine,
} from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  type FixedFormationParameters,
  fixedFormationSamples,
  fixedOffsets,
  model,
} from './fixed-formations.model';

const example: FixedFormationParameters = {
  members: 3,
  leaderX: 0,
  leaderY: 0,
  spacing: 4,
  turnDegrees: 90,
  turnStart: 10,
  turnSteps: 20,
  fastTurnSteps: 1,
  speedLimit: 6,
  timeStep: 0.1,
  steps: 50,
};
const parameters: StudyParameters = { ...example };
const record = await loadStudy('aifg-a:174');

it('uses the draft record parameters and pairs every mechanism step with its code', () => {
  expect(record.id).toBe('aifg-a:174');
  expect(record.slug).toBe('fixed-formations');
  expect(record.example.parameters).toEqual(example);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
});

it('uses the scene fixed-formation offsets, rebased to the leader rather than the centroid', () => {
  expect(fixedOffsets(example)).toEqual([
    { x: 0, y: 0 },
    { x: -4, y: 4 },
    { x: -4, y: -4 },
  ]);
  const state = createSimulation({
    id: 'escort',
    sceneType: 'units-on-terrain',
    field: { width: 20, height: 20 },
    seed: 0,
    units: fixedOffsets(example).map((position, index) => ({
      id: String(index),
      labels: {},
      unitClass: 'escort',
      position,
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: example.speedLimit,
      maxAcceleration: 0,
      radius: 0,
    })),
  });
  const applied = applyStep(state, {
    at: 0,
    toolId: record.id,
    kind: 'formation.fixed',
    selection: state.units.map(({ id }) => id),
    params: { 'slot-spacing': example.spacing },
  });
  expect(applied.refusal).toBeNull();
  expect(applied.state.formations[0].slots).toEqual(fixedOffsets(example));
});

it('works the halfway sample and the completed rotation through by hand', () => {
  const samples = fixedFormationSamples(example);
  const halfway = samples[20];
  expect(halfway.seconds).toBe(2);
  expect(halfway.angleDegrees).toBe(45);
  expect(halfway.formation.heading.x).toBe(cosine(Math.PI / 4));
  expect(halfway.formation.heading.y).toBe(sine(Math.PI / 4));
  expect(halfway.targets[1].x).toBeCloseTo(-4 * Math.sqrt(2), 7);
  expect(halfway.targets[1].y).toBeCloseTo(0, 7);
  expect(halfway.targets[2].x).toBeCloseTo(0, 7);
  expect(halfway.targets[2].y).toBeCloseTo(-4 * Math.sqrt(2), 7);
  const finished = samples[30];
  expect(finished.angleDegrees).toBe(90);
  expect(finished.targets[1].x).toBeCloseTo(-4, 7);
  expect(finished.targets[1].y).toBeCloseTo(-4, 7);
  expect(finished.targets[2].x).toBeCloseTo(4, 7);
  expect(finished.targets[2].y).toBeCloseTo(-4, 7);
});

it('keeps the shape rigid and copies every change of heading without moving the leader', () => {
  const samples = fixedFormationSamples(example);
  const offsets = fixedOffsets(example);
  expect(samples).toHaveLength(example.steps + 1);
  for (const sample of samples) {
    expect(sample.formation.slots).toEqual(offsets);
    expect(sample.formation.anchor).toEqual({ x: 0, y: 0 });
    expect(sample.targets[0]).toEqual({ x: 0, y: 0 });
    for (const [index, target] of sample.targets.entries()) {
      expect(distance(target, sample.formation.anchor)).toBeCloseTo(length(offsets[index]), 7);
      for (const [other, target2] of sample.targets.entries()) {
        expect(distance(target, target2)).toBeCloseTo(distance(offsets[index], offsets[other]), 7);
      }
    }
  }
  expect(
    samples.slice(0, example.turnStart + 1).every(({ requiredSpeed }) => requiredSpeed === 0),
  ).toBe(true);
  expect(samples[example.turnStart + 1].requiredSpeed).toBeGreaterThan(0);
  expect(samples[31].requiredSpeed).toBe(0);
  expect(samples.at(-1)?.targets).toEqual(samples[30].targets);
});

it('measures chords consistently and reveals the impossible shorter turn', () => {
  const normal = fixedFormationSamples(example);
  const fast = fixedFormationSamples(example, example.fastTurnSteps);
  const radius = Math.sqrt(4 * 4 + 4 * 4);
  const chordSpeed = (2 * radius * sine(Math.PI / 2 / example.turnSteps / 2)) / example.timeStep;
  for (const sample of normal.slice(11, 31)) {
    expect(sample.requiredSpeed).toBeCloseTo(chordSpeed, 6);
    expect(sample.requiredSpeed).toBeCloseTo(4.44, 2);
    expect(sample.requiredSpeed).toBeLessThan(example.speedLimit);
  }
  const arcSpeed = (radius * Math.PI) / 2 / (example.turnSteps * example.timeStep);
  expect(chordSpeed).toBeLessThan(arcSpeed);
  expect(fast.slice(0, 11)).toEqual(normal.slice(0, 11));
  expect(fast[11].displacement).toBeCloseTo(8, 6);
  expect(fast[11].requiredSpeed).toBeCloseTo(80, 6);
  expect(
    fast.filter(({ requiredSpeed }) => requiredSpeed > example.speedLimit).map(({ step }) => step),
  ).toEqual([11]);
  expect(fast[11].targets).toEqual(normal[30].targets);
  expect(fast[12].requiredSpeed).toBe(0);
});

it('makes spacing affect demand and treats the speed budget as a check, not a target clamp', () => {
  const normal = fixedFormationSamples(example);
  const wider = fixedFormationSamples({ ...example, spacing: example.spacing * 2 });
  const smallerBudget = fixedFormationSamples({ ...example, speedLimit: example.speedLimit / 2 });
  expect(wider[20].requiredSpeed).toBeCloseTo(normal[20].requiredSpeed * 2, 7);
  expect(wider[20].targets[1].x).toBeCloseTo(normal[20].targets[1].x * 2, 7);
  expect(smallerBudget).toEqual(normal);
  const translated = fixedFormationSamples({ ...example, leaderX: example.spacing });
  for (const [index, sample] of translated.entries()) {
    expect(sample.requiredSpeed).toBeCloseTo(normal[index].requiredSpeed, 7);
    for (const [slot, target] of sample.targets.entries()) {
      expect(target.x).toBeCloseTo(normal[index].targets[slot].x + example.spacing, 7);
      expect(target.y).toBeCloseTo(normal[index].targets[slot].y, 7);
    }
  }
});

it('supplies every prose value, the worked calculation and bounded drawings for every sample', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.initialStep).toBe(20);
  expect(run.moments).toHaveLength(5);
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const required = prose.flatMap(placeholdersIn);
  for (const [step, frame] of run.motion.frames.entries()) {
    for (const name of required) expect(frame.values[name], name).toBeDefined();
    for (const text of prose) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
    const drawn = motionDrawing(run.motion, step);
    expect(drawn.bodies).toHaveLength(1);
    expect(drawn.marks.filter(({ shape }) => shape === 'ring')).toHaveLength(2);
    for (const position of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(position.x).toBeGreaterThan(run.motion.bounds.minX);
      expect(position.x).toBeLessThan(run.motion.bounds.maxX);
      expect(position.y).toBeGreaterThan(run.motion.bounds.minY);
      expect(position.y).toBeLessThan(run.motion.bounds.maxY);
    }
    for (const zone of frame.zones ?? []) {
      expect(zone.x - zone.radius).toBeGreaterThanOrEqual(run.motion.bounds.minX);
      expect(zone.x + zone.radius).toBeLessThanOrEqual(run.motion.bounds.maxX);
      expect(zone.y - zone.radius).toBeGreaterThanOrEqual(run.motion.bounds.minY);
      expect(zone.y + zone.radius).toBeLessThanOrEqual(run.motion.bounds.maxY);
    }
  }
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values['angle']).toBe('45.00');
  expect(selected.values['requiredSpeed']).toBe('4.44');
  expect(selected.worked?.lines.join(' ')).toContain('≈ -5.66');
  expect(selected.worked?.lines.join(' ')).toContain('0.44 / 0.10 ≈ 4.44');
  expect(selected.note).toContain('escort slots swing together');
  expect(run.timeline?.series[0].values).toEqual(
    fixedFormationSamples(example).map(({ requiredSpeed }) => requiredSpeed),
  );
  expect(run.comparison?.findings.join(' ')).toContain('8.00 / 0.10 = 80.00');
  for (const chart of [run.timeline, run.comparison?.timeline]) {
    if (!chart) throw new Error('Both target-demand charts are present.');
    expect(chart.seconds).toHaveLength(run.motion.frames.length);
    for (const series of chart.series) expect(series.values).toHaveLength(chart.seconds.length);
    const drawing = timelineDrawing(chart, run.initialStep);
    expect(drawing.series.every(({ points }) => !/NaN|Infinity/.test(points))).toBe(true);
    expect(drawing.referencePath).not.toBeNull();
  }
});

it('makes the live controls change the visible sweep and its feasibility', () => {
  const inputs = model(parameters).inputs;
  if (!inputs) throw new Error('The escort needs live controls.');
  expect(inputs.map(({ name }) => name)).toEqual(['turnSteps', 'spacing']);
  const turn = inputs[0];
  const rapid = model({ ...parameters, [turn.name]: turn.min });
  const gentle = model({ ...parameters, [turn.name]: turn.max });
  const rapidFrame = rapid.motion.frames[rapid.initialStep];
  const gentleFrame = gentle.motion.frames[gentle.initialStep];
  expect(Number(rapidFrame.values['requiredSpeed'])).toBeGreaterThan(example.speedLimit);
  expect(Number(gentleFrame.values['requiredSpeed'])).toBeLessThan(example.speedLimit);
  expect(rapidFrame.note).toContain('faster than the guards can reach');
  expect(gentleFrame.note).toContain('within the guards');
  expect(rapid.motion.frames.at(-1)?.note).toContain('pivot demanded more speed');
  expect(gentle.motion.frames.at(-1)?.note).toContain('original offsets');
  const rapidArrow = motionDrawing(rapid.motion, rapid.initialStep).vectors[0];
  const gentleArrow = motionDrawing(gentle.motion, gentle.initialStep).vectors[0];
  const arrowLength = (arrow: typeof rapidArrow) =>
    Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1);
  expect(arrowLength(rapidArrow)).toBeGreaterThan(arrowLength(gentleArrow));
  expect(rapidFrame.worked?.lines.join(' ')).not.toBe(gentleFrame.worked?.lines.join(' '));
  const spacing = inputs[1];
  const close = model({ ...parameters, [spacing.name]: spacing.min });
  const wide = model({ ...parameters, [spacing.name]: spacing.max });
  expect(close.motion.bounds).toEqual(wide.motion.bounds);
  const closeDrawing = motionDrawing(close.motion, close.initialStep);
  const wideDrawing = motionDrawing(wide.motion, wide.initialStep);
  expect(wideDrawing.zones[0].r).toBeCloseTo(closeDrawing.zones[0].r * 2, 1);
  expect(Number(wide.motion.frames[wide.initialStep].values['requiredSpeed'])).toBeGreaterThan(
    example.speedLimit,
  );
  expect(Number(close.motion.frames[close.initialStep].values['requiredSpeed'])).toBeLessThan(
    example.speedLimit,
  );
  expect(fillValues(record.example.description, wide.motion.frames[0].values)).toContain(
    '6.00 units',
  );
  expect(fillValues(record.limits[0], wide.motion.frames[0].values)).toContain(
    'over the sampled budget',
  );
});

it('keeps notes, labels, prose and all drawing geometry sound across control corners', () => {
  const inputs = model(parameters).inputs ?? [];
  const corners = inputs.reduce<readonly StudyParameters[]>(
    (runs, input) =>
      runs.flatMap((current) =>
        [input.min, input.max].map((value) => ({ ...current, [input.name]: value })),
      ),
    [parameters],
  );
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const current of [
    ...corners,
    { ...parameters, turnSteps: 3 },
    { ...parameters, turnSteps: 29 },
  ]) {
    const run = model(current);
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(new Set(run.moments.map(({ step }) => step)).size).toBe(run.moments.length);
    for (const moment of run.moments) {
      expect(moment.step).toBeGreaterThanOrEqual(0);
      expect(moment.step).toBeLessThan(run.motion.frames.length);
    }
    for (const [step, frame] of run.motion.frames.entries()) {
      expect(frame.note).toBeTruthy();
      expect(frame.note?.match(/[.!?]/g)).toHaveLength(1);
      expect(frame.note).not.toMatch(/[\d()]/);
      for (const text of prose) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
      const displayed = [
        ...prose.map((text) => fillValues(text, frame.values)),
        frame.worked?.title ?? '',
        ...(frame.worked?.lines ?? []),
      ].join(' ');
      expect(displayed).not.toMatch(/\d+\.\d{3,}/);
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
        ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
          { x: x - radius, y: y - radius },
          { x: x + radius, y: y + radius },
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
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label !== null);
      expect(labels.map(({ label }) => label)).toEqual(['Mira', 'Slot 1', 'Slot 2']);
      for (const [index, first] of labels.entries())
        for (const second of labels.slice(index + 1))
          expect(
            Math.abs(first.x - second.x) > 50 || Math.abs(first.labelY - second.labelY) > 18,
          ).toBe(true);
    }
    for (const chart of [run.timeline, run.comparison?.timeline]) {
      if (!chart) throw new Error('Both escort charts are required.');
      for (const series of chart.series) expect(series.values.every(Number.isFinite)).toBe(true);
      expect(
        timelineDrawing(chart, run.initialStep).series.every(
          ({ points }) => !/NaN|Infinity/.test(points),
        ),
      ).toBe(true);
    }
  }
});
