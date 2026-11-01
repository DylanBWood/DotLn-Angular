import type { StudyParameters } from '@dotln-angular/models';
import { add, advanceFormation, centroid, distance, length } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  anchorLag,
  arrivalSteps,
  calculateGroupStep,
  groupStates,
  initialGroup,
  maxSlotError,
  model,
  readGroupExample,
} from './group-movement.model';

const record = await loadStudy('aifg-b:354');
const parameters: StudyParameters = {
  startX: 0,
  goalX: 16,
  spacing: 2.5,
  anchorSpeed: 0.4,
  fastAnchorSpeed: 1.5,
  escortSpeed: 5,
  medicSpeed: 3,
  maxAcceleration: 8,
  slowRadius: 3,
  targetRadius: 0.2,
  responseTime: 0.4,
  lagLimit: 2,
  slotErrorBudget: 2,
  timeStep: 0.1,
  steps: 230,
  arrivalDistance: 0.9,
  arrivalSpeed: 0.15,
  radius: 0.25,
  velocityArrowSeconds: 0.5,
  enginePlanningSeconds: 0.25,
  engineAnchorPull: 0.02,
};
const example = readGroupExample(parameters);

it('uses the draft Lantern squad record and exactly its parameters', () => {
  expect(record.id).toBe('aifg-b:354');
  expect(record.example.parameters).toEqual(parameters);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('starts at centred distinct slots, with followers reading the old anchor before it moves', () => {
  const start = initialGroup(example);
  expect(start.formation.slots).toEqual([
    { x: 0, y: -2.5 },
    { x: 0, y: 0 },
    { x: 0, y: 2.5 },
  ]);
  expect(centroid(start.formation.slots)).toEqual({ x: 0, y: 0 });
  expect(start.members.map(({ maxSpeed }) => maxSpeed)).toEqual([5, 3, 5]);
  const first = calculateGroupStep(start, example);
  expect(first.targets).toEqual(start.members.map(({ position }) => position));
  expect(first.accelerations).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  expect(first.next.members.map(({ position }) => position)).toEqual(
    start.members.map(({ position }) => position),
  );
  expect(first.next.formation.anchorVelocity.x).toBeCloseTo(0.4 / 0.25);
  expect(first.next.formation.anchor.x).toBeCloseTo(1.6 * 0.1 * (1 - 0.02));
});

it('works through the medic’s first movement and the following anchor moderation by hand', () => {
  const first = calculateGroupStep(initialGroup(example), example).next;
  const second = calculateGroupStep(first, example);
  const desiredMedic = (3 * (0.1568 - 0.1)) / (3 - 0.1);
  const accelerationMedic = desiredMedic / 0.4;
  expect(second.accelerations[1].x).toBeCloseTo(0.1468965517241379);
  expect(second.accelerations[1].x).toBeCloseTo(accelerationMedic);
  expect(second.next.members[1].velocity.x).toBeCloseTo(accelerationMedic * 0.1);
  expect(second.next.members[1].position.x).toBeCloseTo(0.001468965517241379);
  const escortX = ((5 * (0.1568 - 0.1)) / (3 - 0.1) / 0.4) * 0.1 * 0.1;
  expect(second.next.members[0].position.x).toBeCloseTo(escortX);
  const meanX = (escortX * 2 + second.next.members[1].position.x) / 3;
  expect(second.next.formation.anchor.x).toBeCloseTo((0.1568 + 1.6 * 0.1) * 0.98 + meanX * 0.02);
  expect(second.next.formation).toEqual(
    advanceFormation(first.formation, second.next.members, { x: 16, y: 0 }, 0.1),
  );
});

it('caps acceleration, brakes inside the stop distance and does not declare arrival on proximity alone', () => {
  const start = initialGroup(example);
  const displaced = {
    ...start,
    members: start.members.map((member, index) =>
      index === 0 ? { ...member, position: { ...member.position, x: -10 } } : member,
    ),
  };
  const capped = calculateGroupStep(displaced, example);
  expect(capped.accelerations[0].x).toBe(8);
  expect(capped.next.members[0].velocity.x).toBeCloseTo(0.8);
  expect(capped.next.members[0].position.x).toBeCloseTo(-9.92);
  const passing = {
    ...start,
    members: start.members.map((member) => ({ ...member, velocity: { x: 1, y: 0 } })),
  };
  const braking = calculateGroupStep(passing, example);
  expect(braking.accelerations[1].x).toBe(-2.5);
  expect(braking.next.members[1].velocity.x).toBe(0.75);
  expect(braking.next.members[1].position.x).toBeCloseTo(0.075);
  const atBeacon = {
    ...passing,
    members: passing.members.map((member, index) => ({
      ...member,
      position: add({ x: 16, y: 0 }, start.formation.slots[index]),
    })),
  };
  expect(arrivalSteps([atBeacon], example)).toEqual([null, null, null]);
  expect(
    arrivalSteps(
      [
        {
          ...atBeacon,
          members: atBeacon.members.map((member) => ({ ...member, velocity: { x: 0, y: 0 } })),
        },
      ],
      example,
    ),
  ).toEqual([0, 0, 0]);
});

it('keeps the normal march within its shape allowance and meets the sampled arrival test without snapping', () => {
  const states = groupStates(example);
  expect(states).toHaveLength(231);
  expect(Math.max(...states.map(maxSlotError))).toBeCloseTo(1.449484923002245);
  expect(arrivalSteps(states, example)).toEqual([202, 207, 202]);
  for (const [step, state] of states.entries()) {
    expect(state.formation.assignment).toEqual(states[0].formation.assignment);
    expect(maxSlotError(state)).toBeLessThan(example.slotErrorBudget);
    expect(anchorLag(state)).toBeLessThanOrEqual(example.lagLimit + 1e-10);
    for (const [index, member] of state.members.entries()) {
      expect(member.position.y).toBeCloseTo(state.formation.slots[index].y);
      expect(length(member.velocity)).toBeLessThanOrEqual(member.maxSpeed + 1e-10);
      if (step > 0)
        expect(
          distance(member.velocity, states[step - 1].members[index].velocity) / example.timeStep,
        ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    }
  }
  const last = states[states.length - 1];
  for (const [index, member] of last.members.entries()) {
    const remaining = distance(member.position, add({ x: 16, y: 0 }, last.formation.slots[index]));
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThan(example.arrivalDistance);
    expect(length(member.velocity)).toBeGreaterThan(0);
    expect(length(member.velocity)).toBeLessThan(example.arrivalSpeed);
  }
  expect(last.members[1].position.x).toBeCloseTo(15.20438331189256);
  // Different personal speed limits produce different tracking gaps, even at nearly equal speeds.
  expect(states[30].members[1].position.x).toBeLessThan(states[30].members[0].position.x);
  expect(states[30].members[1].velocity.x).toBeCloseTo(states[30].members[0].velocity.x, 2);
});

it('shows a faster anchor exceeding an individual error allowance while respecting the bound on the mean', () => {
  const fastExample = { ...example, anchorSpeed: example.fastAnchorSpeed };
  expect(
    Object.keys(example).filter(
      (key) =>
        example[key as keyof typeof example] !== fastExample[key as keyof typeof fastExample],
    ),
  ).toEqual(['anchorSpeed']);
  const normal = groupStates(example);
  const fast = groupStates(fastExample);
  expect(fast[0].members).toEqual(normal[0].members);
  const errors = fast.map(maxSlotError);
  expect(Math.max(...errors)).toBeCloseTo(2.7095000845509087);
  expect(errors.indexOf(Math.max(...errors))).toBe(28);
  expect(maxSlotError(fast[28])).toBeGreaterThan(example.slotErrorBudget);
  expect(anchorLag(fast[28])).toBeCloseTo(2);
  for (const state of fast) {
    expect(anchorLag(state)).toBeLessThanOrEqual(example.lagLimit + 1e-10);
    for (const member of state.members)
      expect(length(member.velocity)).toBeLessThanOrEqual(member.maxSpeed + 1e-10);
  }
  expect(arrivalSteps(fast, fastExample)).toEqual([81, 87, 81]);
  expect((87 - 81) * example.timeStep).toBeCloseTo(0.6);
  expect((207 - 202) * example.timeStep).toBe(0.5);
  const run = model(parameters);
  expect(run.comparison?.timeline.series.map(({ values }) => values)).toEqual([
    normal.map(maxSlotError),
    fast.map(maxSlotError),
  ]);
  expect(run.comparison?.findings.join(' ')).toContain('2.71');
});

it('cannot deliver the squad when the medic cannot move', () => {
  const blocked = { ...example, medicSpeed: 0 };
  const states = groupStates(blocked);
  const last = states[states.length - 1];
  expect(states.every(({ members }) => members[1].position.x === 0)).toBe(true);
  expect(last.formation.anchor.x).toBeLessThan(example.goalX - example.arrivalDistance);
  expect(maxSlotError(last)).toBeGreaterThan(example.lagLimit);
  expect(arrivalSteps(states, blocked)).toEqual([null, null, null]);
});

it('draws and describes the same selected moment, with finite bounds for every mark and vector', () => {
  const run = model(Object.freeze({ ...parameters }));
  expect(run).toEqual(model(parameters));
  expect(run.initialStep).toBe(27);
  expect(run.moments.map(({ step }) => step)).toEqual([0, 1, 27, 207, 230]);
  expect(run.timeline?.series.every(({ values }) => values.length === 231)).toBe(true);
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(3);
    for (const name of names) expect(frame.values[name], name).toBeDefined();
    const positions = [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
    ];
    for (const position of positions) {
      expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true);
      expect(position.x).toBeGreaterThan(run.motion.bounds.minX);
      expect(position.x).toBeLessThan(run.motion.bounds.maxX);
      expect(position.y).toBeGreaterThan(run.motion.bounds.minY);
      expect(position.y).toBeLessThan(run.motion.bounds.maxY);
    }
    expect(frame.links?.slice(0, 3).map(({ to }) => to)).toEqual(
      frame.marks?.slice(0, 3).map(({ x, y }) => ({ x, y })),
    );
  }
  const selected = run.motion.frames[27];
  expect(selected.seconds).toBeCloseTo(2.7);
  expect(selected.values['slotError']).toBe('1.45');
  expect(run.motion.frames[1].worked?.lines.join(' ')).toContain('0.15');
  expect(run.motion.frames[230].worked?.note).toContain('previews one more update');
  expect(motionDrawing(run.motion, run.initialStep).links).toHaveLength(5);
  const comparison = run.comparison;
  if (!comparison) throw new Error('The study requires the faster-anchor comparison.');
  const chart = timelineDrawing(comparison.timeline, null);
  expect(chart.referencePath).not.toBeNull();
  expect(chart.marks).toHaveLength(2);
  expect(chart.series.every(({ points }) => !points.includes('NaN'))).toBe(true);
});

it('explains the relative positions and the medic’s largest gap instead of listing coordinates', () => {
  const run = model(parameters);
  const selected = run.motion.frames[run.initialStep];
  const equivalent = fillValues(record.visual.textEquivalent, selected.values);
  expect(equivalent).toBe(
    'The medic trails both escorts by 0.55 units. The medic has the largest slot gap, at 1.45 units; the anchor is 1.08 units from the squad’s mean.',
  );
  expect(equivalent).not.toMatch(/\(-?\d|velocity/);
  expect(selected.worked?.lines[0]).toContain('North escort: position (');
  expect(selected.worked?.lines[1]).toContain('Medic: position (');
  expect(selected.worked?.lines[2]).toContain('South escort: position (');
  expect(run.motion.frames[0].note).toContain('anchor must move');
  expect(run.motion.frames[1].note).toContain('before the followers react');
  expect(run.motion.frames[27].note).toContain('lower top speed');
  expect(run.motion.frames[160].note).toContain('anchor slows');
  expect(run.motion.frames[230].note).toContain('passes the arrival test');
});

it('lets anchor pace visibly breach the shape allowance and updates the explanation at both slider ends', () => {
  const input = model(parameters).inputs?.[0];
  expect(input).toEqual({
    name: 'anchorSpeed',
    label: 'Anchor pace',
    unit: 'units/planning step',
    min: 0.4,
    max: 1.5,
    step: 0.1,
  });
  if (!input) throw new Error('The anchor pace must be adjustable.');
  const low = model({ ...parameters, [input.name]: input.min });
  const high = model({ ...parameters, [input.name]: input.max });
  expect(low.motion.frames[30].bodies[1].x).toBeCloseTo(2.7667321461520906);
  expect(high.motion.frames[30].bodies[1].x).toBeCloseTo(5.8143590380453505);
  expect(low.motion.frames[low.initialStep].values['slotError']).toBe('1.45');
  expect(high.motion.frames[high.initialStep].values['slotError']).toBe('2.71');
  expect(high.motion.frames[high.initialStep].values['anchorLag']).toBe('2.00');
  expect(high.motion.frames[high.initialStep].note).toContain('fallen too far behind');
  expect(fillValues(record.example.description, low.motion.frames[0].values)).toContain(
    'stays within',
  );
  expect(fillValues(record.example.description, high.motion.frames[0].values)).toContain('exceeds');
  expect(fillValues(record.limits[1], low.motion.frames[0].values)).toContain('0.50 s');
  expect(fillValues(record.limits[1], high.motion.frames[0].values)).toContain('0.60 s');
  expect(high.comparison?.title).toContain('same anchor pace');
  expect(high.comparison?.timeline.series[0].values).toEqual(
    high.comparison?.timeline.series[1].values,
  );
});

it('keeps every offered pace finite, labelled and readable through the whole journey', () => {
  const input = model(parameters).inputs?.[0];
  if (!input) throw new Error('The anchor pace must be adjustable.');
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (let tick = 0; tick <= Math.round((input.max - input.min) / input.step); tick++) {
    const value = Number((input.min + tick * input.step).toFixed(2));
    const run = model({ ...parameters, [input.name]: value });
    expect(run.motion.frames.length).toBeLessThanOrEqual(240);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    expect(run.moments.every(({ step }) => step >= 0 && step < run.motion.frames.length)).toBe(
      true,
    );
    for (const [step, frame] of run.motion.frames.entries()) {
      expect(frame.note).toBeTruthy();
      expect(frame.note?.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
      expect(frame.note).not.toMatch(/[\d();]/);
      expect(frame.note?.match(/[.!?]/g)).toHaveLength(1);
      for (const text of prose) expect(fillValues(text, frame.values)).not.toMatch(/\{[a-zA-Z]/);
      const equivalent = fillValues(record.visual.textEquivalent, frame.values);
      expect(equivalent).not.toMatch(/\(-?\d|velocity/);
      expect(equivalent.length).toBeLessThan(240);
      const largestDrawnGap = Math.max(
        ...(frame.links ?? []).slice(0, 3).map(({ from, to }) => distance(from, to)),
      );
      expect(run.timeline?.series[0].values[step]).toBeCloseTo(largestDrawnGap);
      expect(frame.values['slotError']).toBe(largestDrawnGap.toFixed(2));
      const positions = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
      ];
      for (const position of positions) {
        expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true);
        expect(
          position.x >= run.motion.bounds.minX &&
            position.x <= run.motion.bounds.maxX &&
            position.y >= run.motion.bounds.minY &&
            position.y <= run.motion.bounds.maxY,
        ).toBe(true);
      }
      const drawing = motionDrawing(run.motion, step);
      expect(drawing.bodies.map(({ label }) => label)).toEqual(['North', 'Medic', 'South']);
      expect(drawing.marks.filter(({ label }) => label).map(({ label }) => label)).toEqual([
        'Anchor',
        'Beacon',
      ]);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label);
      for (const [index, label] of labels.entries()) {
        for (const other of labels.slice(index + 1))
          expect(Math.abs(label.labelY - other.labelY)).toBeGreaterThan(24);
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
    const comparisonText = [
      run.caption,
      run.comparison?.intro ?? '',
      ...(run.comparison?.findings ?? []),
      run.comparison?.note ?? '',
    ].join(' ');
    expect(comparisonText).not.toMatch(/\d+\.\d{3,}/);
  }
});
