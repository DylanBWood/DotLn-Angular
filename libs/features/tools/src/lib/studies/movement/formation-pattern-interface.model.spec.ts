import type { StudyParameters } from '@dotln-angular/models';
import { distance, length, slotPosition, subtract } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import {
  advanceRosterMembers,
  createRosterPattern,
  model,
  readRosterParameters,
  rosterCentreGap,
  rosterStates,
  rosterTargetGap,
} from './formation-pattern-interface.model';

const record = await loadStudy('aifg-a:181');

const parameters: StudyParameters = record.example.parameters;
const example = readRosterParameters(parameters);

it('checks capacity and indexed access instead of inventing a place for an unsupported member', () => {
  const pattern = createRosterPattern(example.pattern, example.capacity, example.spacing);
  expect(pattern.supportsSlots(3)).toBe(true);
  expect(pattern.supportsSlots(2)).toBe(true);
  for (const count of [0, -1, 1.5, 4]) expect(pattern.supportsSlots(count)).toBe(false);
  expect(pattern.slotOffset(0)).toEqual({ x: 2, y: 0 });
  expect(pattern.slotOffset(1)).toEqual({ x: -1, y: 3 });
  expect(pattern.slotOffset(2)).toEqual({ x: -1, y: -3 });
  expect(() => pattern.slotOffset(3)).toThrow('no such slot');
  expect(() => pattern.slotOffset(-1)).toThrow('no such slot');
  expect(pattern.driftOffset([0, 1, 2])).toEqual({ x: 0, y: 0 });
  expect(pattern.driftOffset([1, 2])).toEqual({ x: -1, y: 0 });
  const crowded = createRosterPattern(example.pattern, example.capacity, example.memberRadius / 2);
  expect(crowded.supportsSlots(example.capacity)).toBe(true);
  expect(distance(crowded.slotOffset(1), crowded.slotOffset(2))).toBeLessThan(
    example.memberRadius * 2,
  );
});

it('retains the wing identities and works the departure without teleporting a member', () => {
  const states = rosterStates(example);
  expect(states).toHaveLength(121);
  expect(states[example.releaseStep - 1].members).toHaveLength(3);
  const released = states[example.releaseStep];
  expect(released.members.map(({ id }) => id)).toEqual(['port', 'starboard']);
  expect(released.formation.assignment.map(({ unitId, slot }) => [unitId, slot])).toEqual([
    ['port', 1],
    ['starboard', 2],
  ]);
  expect(released.drift).toEqual({ x: -1, y: 0 });
  expect(released.members[0].position.x).toBeCloseTo(9, 10);
  expect(released.members[0].position.y).toBeCloseTo(13, 10);
  const target = slotPosition(released.formation, 1);
  expect(target.x).toBeCloseTo(10, 10);
  expect(target.y).toBeCloseTo(13, 10);
  expect(rosterTargetGap(released)).toBeCloseTo(0, 10);
  expect(rosterCentreGap(released)).toBeCloseTo(1, 10);
  // Gap 1, desired speed 2 * 1 / 2 = 1; acceleration 1 / 0.5 = 2.
  const next = advanceRosterMembers(released, example)[0];
  expect(next.velocity.x).toBeCloseTo(0.2, 10);
  expect(next.position.x).toBeCloseTo(9.02, 10);
  expect(states[example.releaseStep + 1].members[0].position.x).toBeCloseTo(9.02, 10);
});

it('rotates the corrected local offsets and exposes the error of subtracting local drift in world axes', () => {
  const turned = rosterStates(example)[example.turnEndStep];
  expect(turned.angle).toBeCloseTo(Math.PI / 2, 12);
  const corrected = slotPosition(turned.formation, 1);
  expect(corrected.x).toBeCloseTo(7, 8);
  expect(corrected.y).toBeCloseTo(10, 8);
  const raw = slotPosition({ ...turned.formation, slots: turned.rawSlots }, 1);
  expect(raw.x).toBeCloseTo(7, 8);
  expect(raw.y).toBeCloseTo(9, 8);
  const wrong = subtract(raw, turned.drift);
  expect(wrong.x).toBeCloseTo(8, 8);
  expect(wrong.y).toBeCloseTo(9, 8);
  expect(distance(wrong, corrected)).toBeCloseTo(Math.sqrt(2), 8);
  expect(rosterTargetGap(turned)).toBeCloseTo(0, 10);
});

it('keeps geometry independent of motor speed and bounds finite member tracking', () => {
  const states = rosterStates(example);
  const stopped = rosterStates({ ...example, memberSpeed: 0 });
  for (const [step, state] of states.entries()) {
    expect(stopped[step].drift).toEqual(state.drift);
    expect(stopped[step].formation.slots).toEqual(state.formation.slots);
    expect(rosterTargetGap(state)).toBeCloseTo(0, 10);
    expect(state.formation.anchor).toEqual({ x: 10, y: 10 });
    for (const member of state.members) {
      expect(length(member.velocity)).toBeLessThanOrEqual(example.memberSpeed + 1e-10);
      if (step > 0) {
        const before = states[step - 1].members.find(({ id }) => id === member.id);
        if (!before) throw new Error('Only departures occur in this roster.');
        expect(distance(member.velocity, before.velocity) / example.timeStep).toBeLessThanOrEqual(
          example.memberAcceleration + 1e-10,
        );
      }
    }
  }
  expect(rosterCentreGap(states[example.steps])).toBeLessThan(0.03);
  expect(rosterCentreGap(stopped[example.steps])).toBeCloseTo(1, 10);
});

it('isolates persistent geometric bias by disabling only drift subtraction', () => {
  const corrected = rosterStates(example);
  const raw = rosterStates({ ...example, driftCorrection: example.comparisonCorrection });
  expect(raw.slice(0, example.releaseStep)).toEqual(corrected.slice(0, example.releaseStep));
  expect(raw[example.releaseStep].members).toEqual(corrected[example.releaseStep].members);
  for (const [step, state] of raw.entries()) {
    expect(state.drift).toEqual(corrected[step].drift);
    expect(state.formation.assignment).toEqual(corrected[step].formation.assignment);
    if (step >= example.releaseStep) expect(rosterTargetGap(state)).toBeCloseTo(1, 8);
  }
  expect(rosterCentreGap(raw[example.steps])).toBeCloseTo(1, 1);
  expect(rosterCentreGap(raw[example.steps])).toBeGreaterThan(
    rosterCentreGap(corrected[example.steps]) + 0.9,
  );
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(corrected.map(rosterCentreGap));
  expect(comparison?.timeline.series[1].values).toEqual(raw.map(rosterCentreGap));
  expect(comparison?.findings[1]).toContain('target mean itself remains 1.00 units');
});

it('supports the reading with complete frame values, a worked release and inspectable drawings', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.initialStep).toBe(example.releaseStep);
  expect(run.moments.map(({ step }) => step)).toEqual([0, 20, 40, 60, 120]);
  const released = run.motion.frames[run.initialStep];
  expect(released.seconds).toBe(2);
  expect(released.values['occupiedSlots']).toBe('1, 2');
  expect(released.values['driftPosition']).toBe('(-1.00, 0.00)');
  expect(released.values['centreGap']).toBe('1.00');
  expect(released.worked?.lines.join(' ')).toContain('Drift x = (-1.00 + -1.00) / 2 = -1.00');
  expect(released.worked?.lines.join(' ')).toContain('(9.02, 13.00)');
  const placeholders = [...JSON.stringify(record).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(
    (match) => match[1],
  );
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const [step, frame] of run.motion.frames.entries()) {
    for (const name of placeholders) expect(frame.values[name], name).toBeDefined();
    expect(frame.bodies).toHaveLength(step < example.releaseStep ? 3 : 2);
    expect(frame.marks?.filter(({ shape }) => shape === 'ring')).toHaveLength(frame.bodies.length);
    for (const position of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(position.x).toBeGreaterThanOrEqual(minX);
      expect(position.x).toBeLessThanOrEqual(maxX);
      expect(position.y).toBeGreaterThanOrEqual(minY);
      expect(position.y).toBeLessThanOrEqual(maxY);
    }
  }
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([121, 121, 121]);
  expect(run.timeline?.series[0].values[20]).toBe(1);
  expect(run.timeline?.series[1].values[20]).toBeCloseTo(0, 10);
  expect(run.timeline?.series[2].values[20]).toBeCloseTo(1, 10);
  expect(motionDrawing(run.motion, run.initialStep).bodies).toHaveLength(2);
  if (!run.timeline || !run.comparison) throw new Error('The pattern needs its two charts.');
  expect(timelineDrawing(run.timeline, run.initialStep).cursorX).not.toBeNull();
  expect(timelineDrawing(run.comparison.timeline, null).series).toHaveLength(2);
});

it('lets spacing change the departure drift and correction remove its visible centre bias', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['spacing', 'driftCorrection']);
  const spacing = inputs.find(({ name }) => name === 'spacing');
  const correction = inputs.find(({ name }) => name === 'driftCorrection');
  if (!spacing || !correction)
    throw new Error('The pattern needs geometry and correction controls.');
  const narrow = model({ ...parameters, spacing: spacing.min }).motion.frames[example.releaseStep];
  const wide = model({ ...parameters, spacing: spacing.max }).motion.frames[example.releaseStep];
  expect(narrow.values['driftLength']).toBe('0.67');
  expect(wide.values['driftLength']).toBe('1.33');
  expect(narrow.marks?.filter(({ shape }) => shape === 'ring')[0].y).toBeCloseTo(12, 10);
  expect(wide.marks?.filter(({ shape }) => shape === 'ring')[0].y).toBeCloseTo(14, 10);
  const corrected = model({ ...parameters, driftCorrection: correction.max });
  const raw = model({ ...parameters, driftCorrection: correction.min });
  const chosen = corrected.motion.frames[example.releaseStep];
  const uncorrected = raw.motion.frames[example.releaseStep];
  expect(chosen.values['targetGap']).toBe('0.00');
  expect(uncorrected.values['targetGap']).toBe('1.00');
  expect(chosen.values['correctionState']).toBe('on');
  expect(uncorrected.values['correctionState']).toBe('off');
  expect(chosen.note).toContain('targets shift towards the anchor');
  expect(uncorrected.note).toContain('targets off-centre');
  expect(raw.motion.frames.at(-1)?.note).toContain('still displaced');
  expect(corrected.timeline?.series[1].values[example.releaseStep]).toBeCloseTo(0, 10);
  expect(raw.timeline?.series[1].values[example.releaseStep]).toBeCloseTo(1, 10);
  expect(raw.comparison?.intro).toContain('from 0.00 to 1.00');
  expect(raw.comparison?.timeline.series[0].values).toEqual(
    corrected.comparison?.timeline.series[0].values,
  );
  expect(raw.comparison?.timeline.series[1].values).toEqual(
    corrected.comparison?.timeline.series[1].values,
  );
});

it('explains the opening coincidence and names the anchor and occupied slots without a coordinate inventory', () => {
  const run = model(parameters);
  const released = run.motion.frames[run.initialStep];
  const rawDots = released.marks?.filter(({ tone }) => tone === 'muted') ?? [];
  for (const [index, member] of released.bodies.entries())
    expect(distance(member, rawDots[index])).toBeLessThan(1e-10);
  expect(run.caption).toContain('escort centres cover the muted dots');
  expect(released.values['patternRelationship']).toContain(
    'still occupy their old target positions',
  );
  expect(released.marks?.find(({ shape }) => shape === 'cross')?.label).toBe('Anchor');
  expect(released.marks?.filter(({ shape }) => shape === 'ring').map(({ label }) => label)).toEqual(
    ['Slot 1', 'Slot 2'],
  );
  expect(record.visual?.textEquivalent).not.toMatch(/Positions|\([{}a-zA-Z0-9., -]+\)/);
  expect(record.limits).toHaveLength(4);
  expect(record.limits.join(' ')).not.toContain(
    'The anchor remains fixed while its heading is scripted',
  );
});

it('keeps every frame readable and bounded at both ends of each live input', () => {
  const inputs = model(parameters).inputs ?? [];
  const placeholders = [...JSON.stringify(record).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(
    (match) => match[1],
  );
  for (const input of inputs)
    for (const value of [input.min, input.max]) {
      const run = model({ ...parameters, [input.name]: value });
      expect(run.initialStep).toBeGreaterThanOrEqual(0);
      expect(run.initialStep).toBeLessThan(run.motion.frames.length);
      for (const moment of run.moments) {
        expect(moment.step).toBeGreaterThanOrEqual(0);
        expect(moment.step).toBeLessThan(run.motion.frames.length);
      }
      const { minX, maxX, minY, maxY } = run.motion.bounds;
      for (const [step, frame] of run.motion.frames.entries()) {
        expect(frame.note).toBeTruthy();
        expect(frame.note).not.toMatch(/[0-9()]/);
        expect(frame.note?.match(/[.!?]/g)).toHaveLength(1);
        for (const name of placeholders) expect(frame.values[name], name).toBeDefined();
        const displayed = [
          ...Object.values(frame.values),
          frame.worked?.title ?? '',
          ...(frame.worked?.lines ?? []),
        ].join(' ');
        for (const match of displayed.matchAll(/-?\d+\.(\d+)/g))
          expect(match[1].length).toBeLessThanOrEqual(2);
        const points = [
          ...frame.bodies,
          ...(frame.marks ?? []),
          ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
          ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
        ];
        for (const { x, y } of points) {
          expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          expect(x >= minX && x <= maxX && y >= minY && y <= maxY).toBe(true);
        }
        const drawing = motionDrawing(run.motion, step);
        const labels = [...drawing.bodies, ...drawing.marks].filter((entry) => entry.label);
        for (const [index, label] of labels.entries())
          for (const other of labels.slice(index + 1))
            if (Math.abs(label.labelY - other.labelY) < 24)
              expect(Math.abs(label.x - other.x)).toBeGreaterThan(
                ((label.label?.length ?? 0) + (other.label?.length ?? 0)) * 7.2,
              );
      }
    }
});
