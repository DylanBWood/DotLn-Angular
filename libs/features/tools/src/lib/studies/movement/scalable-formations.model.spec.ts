import type { StudyParameters } from '@dotln-angular/models';
import { centroid, distance, patternSlots, subtract } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  countAt,
  model,
  type ScalableFormationParameters,
  scalableFormationSamples,
} from './scalable-formations.model';

const example: ScalableFormationParameters = {
  initialCount: 3,
  targetCount: 5,
  comparisonCount: 7,
  spacing: 2,
  memberRadius: 0.5,
  laneWidth: 10,
  anchorX: 0,
  anchorY: 0,
  joinStart: 10,
  joinInterval: 10,
  timeStep: 0.1,
  steps: 50,
};
const parameters: StudyParameters = { ...example };
const record = await loadStudy('aifg-a:175');

it('uses exactly the draft record parameters and pairs steps with ordinary code blocks', () => {
  expect(record.id).toBe('aifg-a:175');
  expect(record.slug).toBe('scalable-formations');
  expect(record.example.parameters).toEqual(example);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
});

it('adds members on the declared samples and stops at the requested membership', () => {
  expect([0, 9, 10, 19, 20, 30, 50].map((step) => countAt(step, example))).toEqual([
    3, 3, 4, 4, 5, 5, 5,
  ]);
  expect(
    [9, 10, 20, 30, 40, 50].map((step) => countAt(step, example, example.comparisonCount)),
  ).toEqual([3, 4, 5, 6, 7, 7]);
  const samples = scalableFormationSamples(example);
  expect(samples).toHaveLength(example.steps + 1);
  expect(samples[9].positions).toEqual(samples[0].positions);
  expect(samples[19].positions).toEqual(samples[10].positions);
  expect(samples.at(-1)?.positions).toEqual(samples[20].positions);
});

it('works an incomplete wedge row and its recentring through by hand', () => {
  const samples = scalableFormationSamples(example);
  expect(samples[0].rawOffsets).toEqual([
    { x: 0, y: 0 },
    { x: -2, y: 2 },
    { x: -2, y: -2 },
  ]);
  expect(samples[0].rawCentre.x).toBeCloseTo(-4 / 3, 7);
  expect(samples[0].rawCentre.y).toBe(0);
  const joined = samples[10];
  expect(joined.rawOffsets).toEqual([
    { x: 0, y: 0 },
    { x: -2, y: 2 },
    { x: -2, y: -2 },
    { x: -4, y: 4 },
  ]);
  expect(joined.rawCentre).toEqual({ x: -2, y: 1 });
  expect(joined.positions).toEqual([
    { x: 2, y: -1 },
    { x: 0, y: 1 },
    { x: 0, y: -3 },
    { x: -2, y: 3 },
  ]);
  for (const [index, old] of samples[9].positions.entries()) {
    const shift = subtract(joined.positions[index], old);
    expect(shift.x).toBeCloseTo(2 / 3, 7);
    expect(shift.y).toBe(-1);
    expect(distance(joined.positions[index], old)).toBeCloseTo(Math.sqrt(13) / 3, 7);
  }
  expect(joined.retainedShift).toBeCloseTo(1.2, 2);
  expect(samples[11].retainedShift).toBe(0);
  const full = samples[20];
  expect(full.rawCentre.x).toBeCloseTo(-2.4, 7);
  expect(full.rawCentre.y).toBe(0);
  expect(full.positions[0].x).toBeCloseTo(2.4, 7);
  expect(full.positions[3].x).toBeCloseTo(-1.6, 7);
  expect(full.positions[3].y).toBe(4);
  expect(full.positions[4].y).toBe(-4);
});

it('uses the engine recipe for each count, keeps distinct slots and centres them on the anchor', () => {
  for (const targetCount of [example.targetCount, example.comparisonCount]) {
    for (const sample of scalableFormationSamples(example, targetCount)) {
      expect(sample.offsets).toEqual(patternSlots('wedge', sample.count, example.spacing));
      expect(sample.offsets).toHaveLength(sample.count);
      expect(new Set(sample.offsets.map((offset) => JSON.stringify(offset))).size).toBe(
        sample.count,
      );
      const middle = centroid(sample.positions);
      expect(middle.x).toBeCloseTo(example.anchorX, 7);
      expect(middle.y).toBeCloseTo(example.anchorY, 7);
      // Removing the engine's raw mean reproduces every generated offset.
      for (const [index, offset] of sample.offsets.entries()) {
        const centred = subtract(sample.rawOffsets[index], sample.rawCentre);
        expect(centred.x).toBeCloseTo(offset.x, 7);
        expect(centred.y).toBeCloseTo(offset.y, 7);
      }
      expect(sample.width).toBeCloseTo(
        (sample.count - 1) * example.spacing + 2 * example.memberRadius,
        7,
      );
    }
  }
});

it('includes body size and reveals the first larger layout that cannot fit the lane', () => {
  const normal = scalableFormationSamples(example);
  const larger = scalableFormationSamples(example, example.comparisonCount);
  expect([normal[0].width, normal[10].width, normal[20].width]).toEqual([5, 7, 9]);
  expect([normal[0].clearance, normal[10].clearance, normal[20].clearance]).toEqual([
    2.5, 1.5, 0.5,
  ]);
  expect(normal.every(({ clearance }) => clearance >= 0)).toBe(true);
  expect(larger.slice(0, 30)).toEqual(normal.slice(0, 30));
  const firstFailed = larger.find(({ clearance }) => clearance < 0);
  expect(firstFailed).toMatchObject({
    step: 30,
    seconds: 3,
    count: 6,
    centreSpan: 10,
    width: 11,
    clearance: -0.5,
  });
  expect(larger[40]).toMatchObject({ count: 7, centreSpan: 12, width: 13, clearance: -1.5 });
  expect(larger[30].centreSpan).toBe(example.laneWidth);
  expect(larger[30].width).toBeGreaterThan(example.laneWidth);
  expect(larger.at(-1)?.positions).toHaveLength(7);
  const biggerBodies = scalableFormationSamples({
    ...example,
    memberRadius: example.memberRadius * 2,
  });
  expect(biggerBodies[20].positions).toEqual(normal[20].positions);
  expect(biggerBodies[20].width).toBe(10);
  expect(biggerBodies[20].clearance).toBe(0);
});

it('translates the proposal with the lane and anchor while spacing changes the geometry', () => {
  const normal = scalableFormationSamples(example);
  const shifted = scalableFormationSamples({
    ...example,
    anchorX: example.spacing,
    anchorY: example.spacing,
  });
  for (const [index, sample] of shifted.entries()) {
    expect(sample.width).toBe(normal[index].width);
    expect(sample.clearance).toBe(normal[index].clearance);
    for (const [slot, position] of sample.positions.entries()) {
      expect(position.x).toBeCloseTo(normal[index].positions[slot].x + example.spacing, 7);
      expect(position.y).toBeCloseTo(normal[index].positions[slot].y + example.spacing, 7);
    }
  }
  const wider = scalableFormationSamples({ ...example, spacing: example.spacing * 2 });
  expect(wider[20].centreSpan).toBe(normal[20].centreSpan * 2);
  expect(wider[20].width).toBe(17);
  expect(wider[20].clearance).toBe(-3.5);
});

it('supplies accessible values, the worked arithmetic and bounds for all proposals, including failure', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.initialStep).toBe(20);
  expect(run.moments).toHaveLength(4);
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const required = prose.flatMap(placeholdersIn);
  for (const current of [run, model({ ...parameters, targetCount: example.comparisonCount })]) {
    for (const [step, frame] of current.motion.frames.entries()) {
      for (const name of required) expect(frame.values[name], name).toBeDefined();
      for (const text of prose) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
      expect(frame.bodies).toHaveLength(Number(frame.values['count']));
      expect(frame.bodies.length).toBeLessThanOrEqual(7);
      expect(frame.marks?.filter(({ shape }) => shape === 'ring')).toHaveLength(
        frame.bodies.length,
      );
      const drawn = motionDrawing(current.motion, step);
      expect(drawn.zones).toHaveLength(frame.bodies.length);
      for (const [index, body] of frame.bodies.entries()) {
        expect(frame.marks?.[index]).toMatchObject({ x: body.x, y: body.y });
        const zone = frame.zones?.[index];
        expect(zone).toMatchObject({ x: body.x, y: body.y, radius: example.memberRadius });
        expect(body.x - example.memberRadius).toBeGreaterThan(current.motion.bounds.minX);
        expect(body.x + example.memberRadius).toBeLessThan(current.motion.bounds.maxX);
        expect(body.y - example.memberRadius).toBeGreaterThan(current.motion.bounds.minY);
        expect(body.y + example.memberRadius).toBeLessThan(current.motion.bounds.maxY);
      }
    }
    for (const moment of current.moments) expect(current.motion.frames[moment.step]).toBeDefined();
  }
  const selected = run.motion.frames[10];
  expect(selected.values['rawCentre']).toBe('(-2.00, 1.00)');
  expect(selected.values['retainedShift']).toBe('1.20');
  expect(selected.worked?.lines.join(' ')).toContain('(-8.00 / 4, 4.00 / 4) = (-2.00, 1.00)');
  expect(selected.worked?.lines.join(' ')).toContain('6.00 + 2 × 0.50 = 7.00');
  expect(selected.note).toContain('wedge recentres');
  expect(run.comparison?.findings.join(' ')).toContain('3.00 s with 6 scouts');
  expect(run.comparison?.findings.join(' ')).toContain('width 11.00');
  expect(run.timeline?.series[0].values).toEqual(
    scalableFormationSamples(example).map(({ width }) => width),
  );
  for (const chart of [run.timeline, run.comparison?.timeline]) {
    if (!chart) throw new Error('Both footprint charts are present.');
    expect(chart.seconds).toHaveLength(run.motion.frames.length);
    for (const series of chart.series) expect(series.values).toHaveLength(chart.seconds.length);
    const drawing = timelineDrawing(chart, run.initialStep);
    expect(drawing.series.every(({ points }) => !/NaN|Infinity/.test(points))).toBe(true);
    expect(chart.reference).toBe(example.laneWidth);
  }
});

it('shows membership, spacing and lane width changing the proposed fit', () => {
  const inputs = model(parameters).inputs;
  if (!inputs) throw new Error('The muster needs live controls.');
  expect(inputs.map(({ name }) => name)).toEqual(['targetCount', 'spacing', 'laneWidth']);
  const members = inputs[0];
  const small = model({ ...parameters, [members.name]: members.min });
  const large = model({ ...parameters, [members.name]: members.max });
  expect(small.motion.frames[small.initialStep].bodies).toHaveLength(4);
  expect(large.motion.frames[large.initialStep].bodies).toHaveLength(7);
  expect(large.motion.frames[large.initialStep].note).toContain('crosses the lane edges');
  expect(large.comparison?.intro).toContain('from 7 to 3');
  expect(large.comparison?.findings[1]).toContain('chosen muster');
  expect(large.comparison?.timeline.marks?.[0].tone).toBe('actual');
  const spacing = inputs[1];
  const close = model({ ...parameters, [spacing.name]: spacing.min });
  const wide = model({ ...parameters, [spacing.name]: spacing.max });
  expect(close.motion.frames[close.initialStep].values['width']).toBe('7.00');
  expect(wide.motion.frames[wide.initialStep].values['width']).toBe('13.00');
  expect(close.motion.frames[close.initialStep].values['fitStatus']).toBe('fits the lane');
  expect(wide.motion.frames[wide.initialStep].note).toContain('cannot fit');
  expect(wide.motion.frames[wide.initialStep].worked?.lines.join(' ')).toContain(
    '12.00 + 2 × 0.50 = 13.00',
  );
  const lane = inputs[2];
  const tight = model({ ...parameters, [lane.name]: lane.min });
  const broad = model({ ...parameters, [lane.name]: lane.max });
  expect(tight.motion.frames[tight.initialStep].bodies).toEqual(
    broad.motion.frames[broad.initialStep].bodies,
  );
  expect(tight.motion.frames[tight.initialStep].values['clearance']).toBe('-1.50');
  expect(broad.motion.frames[broad.initialStep].values['clearance']).toBe('2.50');
  expect(tight.timeline?.reference).toBe(6);
  expect(broad.timeline?.reference).toBe(14);
  expect(broad.comparison?.findings[1]).toContain('both musters fits this lane');
  expect(broad.comparison?.timeline.marks).toEqual([]);
  expect(fillValues(record.limits[0], tight.motion.frames[0].values)).toContain(
    'does not fit the lane',
  );
  expect(fillValues(record.limits[0], broad.motion.frames[0].values)).toContain('fits the lane');
});

it('keeps notes, labels, prose and the complete footprint sound at every control corner', () => {
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
  for (const current of corners) {
    const run = model(current);
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(run.moments.length).toBeGreaterThanOrEqual(3);
    expect(run.moments.length).toBeLessThanOrEqual(5);
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
      expect(labels.map(({ label }) => label).sort()).toEqual([
        'Anchor',
        'Lower arm',
        'Lower edge',
        'Tip',
        'Upper arm',
        'Upper edge',
      ]);
      for (const [index, first] of labels.entries())
        for (const second of labels.slice(index + 1))
          expect(Math.hypot(first.x - second.x, first.labelY - second.labelY)).toBeGreaterThan(30);
    }
    for (const chart of [run.timeline, run.comparison?.timeline]) {
      if (!chart) throw new Error('Both muster charts are required.');
      for (const series of chart.series) expect(series.values.every(Number.isFinite)).toBe(true);
      expect(
        timelineDrawing(chart, run.initialStep).series.every(
          ({ points }) => !/NaN|Infinity/.test(points),
        ),
      ).toBe(true);
    }
  }
});
