import type { StudyParameters } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  acceptableCounts,
  allocate,
  assignmentCost,
  cheapestComplete,
  model,
  readSlotExample,
} from './slot-assignment.model';

const record = await loadStudy('aifg-a:186');
const parameters: StudyParameters = {
  'cost.reserve.front': 0.1,
  'cost.reserve.flank': 0.2,
  'cost.reserve.rear': 0.3,
  'cost.shield.front': 0,
  'cost.shield.flank': 4,
  'cost.shield.rear': 6,
  'cost.medic.front': 5,
  'cost.medic.flank': 0.4,
  'cost.medic.rear': 0.1,
  comparisonFlankCost: 0.9,
  acceptableBelow: 1,
  unitX: -4,
  slotX: 4,
  spacing: 2,
  decisionSeconds: 1,
};
const example = readSlotExample(parameters);

it('uses the draft Beacon gate record and exactly its parameters', () => {
  expect(record.id).toBe('aifg-a:186');
  expect(record.example.parameters).toEqual(parameters);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('counts the original choices, allocates the constrained shield first and totals the reservations', () => {
  expect(acceptableCounts(example)).toEqual([
    { id: 'Ari', count: 3 },
    { id: 'Bryn', count: 1 },
    { id: 'Cleo', count: 2 },
  ]);
  const assignment = allocate(example);
  expect(assignment).toEqual([
    { unitId: 'Bryn', slot: 0, slotRole: 'front', cost: 0 },
    { unitId: 'Cleo', slot: 2, slotRole: 'rear', cost: 0.1 },
    { unitId: 'Ari', slot: 1, slotRole: 'flank', cost: 0.2 },
  ]);
  expect(new Set(assignment.map(({ slot }) => slot)).size).toBe(3);
  expect(assignmentCost(assignment)).toBeCloseTo(0 + 0.1 + 0.2);
  expect(assignmentCost(cheapestComplete(example))).toBeCloseTo(0.3);
});

it('keeps input and column order on ties and treats the cut-off as a priority rather than a ban', () => {
  const equal = {
    ...example,
    costs: Object.fromEntries(Object.keys(example.costs).map((key) => [key, 1])),
  };
  expect(acceptableCounts(equal).map(({ count }) => count)).toEqual([0, 0, 0]);
  expect(allocate(equal)).toEqual([
    { unitId: 'Ari', slot: 0, slotRole: 'front', cost: 1 },
    { unitId: 'Bryn', slot: 1, slotRole: 'flank', cost: 1 },
    { unitId: 'Cleo', slot: 2, slotRole: 'rear', cost: 1 },
  ]);
  const unsuitable = {
    ...example,
    costs: { ...example.costs, 'cost.medic.front': 3, 'cost.medic.flank': 3, 'cost.medic.rear': 3 },
  };
  expect(acceptableCounts(unsuitable)[2]).toEqual({ id: 'Cleo', count: 0 });
  expect(allocate(unsuitable)).toEqual([
    { unitId: 'Cleo', slot: 0, slotRole: 'front', cost: 3 },
    { unitId: 'Bryn', slot: 1, slotRole: 'flank', cost: 4 },
    { unitId: 'Ari', slot: 2, slotRole: 'rear', cost: 0.3 },
  ]);
});

it('demonstrates a non-optimal greedy result by changing only Ari’s flank cost', () => {
  const changedParameters: StudyParameters = {
    ...parameters,
    'cost.reserve.flank': parameters['comparisonFlankCost'],
  };
  expect(
    Object.keys(parameters).filter((key) => parameters[key] !== changedParameters[key]),
  ).toEqual(['cost.reserve.flank']);
  const changed = readSlotExample(changedParameters);
  expect(acceptableCounts(changed)).toEqual(acceptableCounts(example));
  expect(allocate(changed).map(({ unitId, slot }) => ({ unitId, slot }))).toEqual(
    allocate(example).map(({ unitId, slot }) => ({ unitId, slot })),
  );
  expect(assignmentCost(allocate(changed))).toBeCloseTo(0 + 0.1 + 0.9);
  expect(cheapestComplete(changed)).toEqual([
    { unitId: 'Ari', slot: 2, slotRole: 'rear', cost: 0.3 },
    { unitId: 'Bryn', slot: 0, slotRole: 'front', cost: 0 },
    { unitId: 'Cleo', slot: 1, slotRole: 'flank', cost: 0.4 },
  ]);
  // The six distinct full allocations can be checked directly from the changed table.
  const totals = [
    0.1 + 4 + 0.1,
    0.1 + 6 + 0.4,
    0.9 + 0 + 0.1,
    0.9 + 6 + 5,
    0.3 + 0 + 0.4,
    0.3 + 4 + 5,
  ];
  expect(assignmentCost(cheapestComplete(changed))).toBeCloseTo(Math.min(...totals));
  expect(assignmentCost(allocate(changed)) - assignmentCost(cheapestComplete(changed))).toBeCloseTo(
    0.3,
  );
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series.map(({ values }) => values)).toEqual([
    [0, 0, 0.1, 0.1 + 0.2],
    [0, 0, 0.1, 1],
  ]);
  expect(comparison?.timeline.reference).toBeCloseTo(0.7);
  expect(comparison?.findings.join(' ')).toContain('0.30 less');
});

it('reveals real reservation links, with the full cost table beside the selected decision', () => {
  const run = model(parameters);
  expect(run.motion.frames).toHaveLength(4);
  expect(run.motion.frames.map(({ seconds }) => seconds)).toEqual([0, 1, 2, 3]);
  expect(run.initialStep).toBe(2);
  expect(run.moments).toHaveLength(4);
  expect(run.motion.frames.map(({ links }) => links?.length)).toEqual([0, 1, 2, 3]);
  expect(run.motion.frames[2].links).toEqual([
    { from: { x: -4, y: 0 }, to: { x: 4, y: -2 }, tone: 'actual' },
    { from: { x: -4, y: 2 }, to: { x: 4, y: 2 }, tone: 'actual' },
  ]);
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values['counts']).toBe('Ari 3, Bryn 1, Cleo 2');
  expect(selected.values['order']).toBe('Bryn → Cleo → Ari');
  expect(selected.values['choices']).toBe('flank: 0.40; rear: 0.10');
  expect(selected.worked?.lines.join(' ')).toContain('0.00 + 0.10 = 0.10');
  expect(selected.values['costTable']).toBe(
    'Ari: 0.10 | 0.20 | 0.30; Bryn: 0.00 | 4.00 | 6.00; Cleo: 5.00 | 0.40 | 0.10',
  );
  const drawing = motionDrawing(run.motion, run.initialStep);
  expect(drawing.bodies).toHaveLength(3);
  expect(drawing.marks.every(({ shape }) => shape === 'ring')).toBe(true);
  expect(drawing.links).toHaveLength(2);
  const comparison = run.comparison;
  if (!comparison) throw new Error('The study requires a changed-table comparison.');
  const chart = timelineDrawing(comparison.timeline, null);
  expect(chart.xTicks.map(({ label }) => label)).toEqual(['0', '1', '2', '3']);
  expect(chart.referencePath).not.toBeNull();
});

it('keeps allocation independent of geometry and supplies a complete text equivalent at every decision', () => {
  const run = model(parameters);
  const moved = readSlotExample({ ...parameters, unitX: -14 });
  expect(allocate(moved)).toEqual(allocate(example));
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toEqual(run.motion.frames[0].bodies);
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    for (const position of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(position.x).toBeGreaterThan(run.motion.bounds.minX);
      expect(position.x).toBeLessThan(run.motion.bounds.maxX);
      expect(position.y).toBeGreaterThan(run.motion.bounds.minY);
      expect(position.y).toBeLessThan(run.motion.bounds.maxY);
    }
  }
  expect(model(Object.freeze({ ...parameters }))).toEqual(run);
});

it('changes the visible order and links at the live cost cut-off, with a greedy failure before it', () => {
  const input = model(parameters).inputs?.[0];
  expect(input).toEqual({
    name: 'cost.reserve.flank',
    label: 'Ari’s flank cost',
    unit: 'cost',
    min: 0.1,
    max: 1.2,
    step: 0.1,
  });
  if (!input) throw new Error('The flank cost must be adjustable.');
  const low = model({ ...parameters, [input.name]: input.min });
  const high = model({ ...parameters, [input.name]: input.max });
  expect(low.motion.frames[2].values['order']).toBe('Bryn → Cleo → Ari');
  expect(high.motion.frames[2].values['counts']).toBe('Ari 2, Bryn 1, Cleo 2');
  expect(high.motion.frames[2].values['order']).toBe('Bryn → Ari → Cleo');
  expect(high.motion.frames[2].note).toContain('Ari reserves the rear');
  expect(high.moments[2].label).toBe('Ari chooses');
  expect(low.motion.frames[3].links).not.toEqual(high.motion.frames[3].links);
  expect(low.timeline?.series[0].values[3]).toBeCloseTo(0.2);
  expect(high.timeline?.series[0].values[3]).toBeCloseTo(0.7);
  const expensive = model({ ...parameters, [input.name]: 0.9 });
  expect(expensive.motion.frames[3].values['rosterOutcome']).toBe(
    'the greedy roster costs 0.30 more than the minimum',
  );
  expect(expensive.motion.frames[3].note).toContain('more expensive roster');
  expect(expensive.timeline?.series[0].values[3]).toBe(1);
  expect(expensive.motion.frames[3].worked?.lines.join(' ')).toContain('greedy excess 0.30');
  expect(expensive.comparison?.title).toContain('same flank cost');
  expect(expensive.comparison?.timeline.series[0].values).toEqual(
    expensive.comparison?.timeline.series[1].values,
  );
});

it('keeps every offered cost step readable, labelled, bounded and consistent with the prose', () => {
  const input = model(parameters).inputs?.[0];
  if (!input) throw new Error('The flank cost must be adjustable.');
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (let tick = 0; tick <= Math.round((input.max - input.min) / input.step); tick++) {
    const value = Number((input.min + tick * input.step).toFixed(2));
    const run = model({ ...parameters, [input.name]: value });
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(run.moments.every(({ step }) => step >= 0 && step < run.motion.frames.length)).toBe(
      true,
    );
    for (const [stage, frame] of run.motion.frames.entries()) {
      expect(frame.note).toBeTruthy();
      expect(frame.note?.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
      expect(frame.note).not.toMatch(/[\d();]/);
      expect(frame.note?.match(/[.!?]/g)).toHaveLength(1);
      for (const text of prose) expect(fillValues(text, frame.values)).not.toMatch(/\{[a-zA-Z]/);
      const equivalent = fillValues(record.visual.textEquivalent, frame.values);
      expect(equivalent).not.toMatch(/\(-?\d/);
      expect(equivalent.length).toBeLessThan(280);
      expect(frame.values['total']).toBe(run.timeline?.series[0].values[stage].toFixed(2));
      const drawing = motionDrawing(run.motion, stage);
      expect(drawing.bodies.map(({ label }) => label)).toEqual(['Ari', 'Bryn', 'Cleo']);
      expect(drawing.marks.map(({ label }) => label)).toEqual(['Front', 'Flank', 'Rear']);
      const labels = [...drawing.bodies, ...drawing.marks];
      for (const [index, label] of labels.entries()) {
        for (const other of labels.slice(index + 1)) {
          expect(
            Math.abs(label.x - other.x) > 80 || Math.abs(label.labelY - other.labelY) > 24,
          ).toBe(true);
        }
      }
      for (const position of [...frame.bodies, ...(frame.marks ?? [])]) {
        expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true);
        expect(
          position.x >= run.motion.bounds.minX &&
            position.x <= run.motion.bounds.maxX &&
            position.y >= run.motion.bounds.minY &&
            position.y <= run.motion.bounds.maxY,
        ).toBe(true);
      }
      const displayed = [
        ...Object.values(frame.values),
        frame.note ?? '',
        frame.worked?.title ?? '',
        ...(frame.worked?.lines ?? []),
        frame.worked?.note ?? '',
      ];
      expect(displayed.join(' ')).not.toMatch(/\d+\.\d{3,}/);
    }
    expect(
      fillValues(record.example.description, run.motion.frames[run.initialStep].values),
    ).toContain(value.toFixed(2));
    const comparisonText = [
      run.caption,
      run.comparison?.intro ?? '',
      ...(run.comparison?.findings ?? []),
      run.comparison?.note ?? '',
    ].join(' ');
    expect(comparisonText).not.toMatch(/\d+\.\d{3,}/);
  }
});
