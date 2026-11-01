import type { StudyParameters } from '@dotln-angular/models';
import { centroid, distance, length, slotPosition } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import {
  calculateEscortStep,
  escortLag,
  escortSlotError,
  escortStates,
  initialEscort,
  model,
  readEscortParameters,
} from './two-level-formation-steering.model';

const record = await loadStudy('aifg-a:177');

const parameters: StudyParameters = record.example.parameters;
const example = readEscortParameters(parameters);

it('starts the named escort in distinct, centred engine slots', () => {
  const start = initialEscort(example);
  expect(start.formation.slots).toEqual([
    { x: 2, y: 0 },
    { x: -1, y: 3 },
    { x: -1, y: -3 },
  ]);
  expect(start.formation.assignment.map(({ unitId, slot }) => [unitId, slot])).toEqual([
    ['lantern', 0],
    ['port', 1],
    ['starboard', 2],
  ]);
  expect(centroid(start.members.map(({ position }) => position))).toEqual({ x: 0, y: 0 });
  expect(escortLag(start)).toBe(0);
  expect(escortSlotError(start)).toBe(0);
});

it('works the first pull and the next member update with numbers from the record', () => {
  const first = calculateEscortStep(initialEscort(example), example);
  // The members already occupy their old slots, so only the anchor moves on this update.
  expect(first.next.members.map(({ velocity }) => velocity)).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  expect(first.next.formation.anchorVelocity.x).toBeCloseTo(24 * 0.1, 12);
  expect(first.proposed.x).toBeCloseTo(0.24, 12);
  expect(first.pulled.x).toBeCloseTo(0.24 * 0.98, 12);
  expect(first.next.formation.anchor.x).toBeCloseTo(0.2352, 12);
  expect(first.capped).toBe(false);

  const second = calculateEscortStep(first.next, example);
  // Desired speed = 2 * (0.2352 / 2), acceleration = 0.2352 / 0.5.
  expect(second.next.members[0].velocity.x).toBeCloseTo(0.04704, 12);
  expect(second.next.members[0].position.x).toBeCloseTo(2.004704, 12);
  expect(second.mean.x).toBeCloseTo(0.004704, 12);
  expect(second.proposed.x).toBeCloseTo(0.7152, 12);
  expect(second.next.formation.anchor.x).toBeCloseTo(0.70099008, 12);
  expect(second.next.formation.anchor.x).not.toBeCloseTo(0.700896, 8);
});

it('caps position against the updated member mean without resetting planning velocity', () => {
  const start = initialEscort(example);
  const ahead = { ...start, formation: { ...start.formation, anchor: { x: 10, y: 0 } } };
  const calculation = calculateEscortStep(ahead, example);
  // Each member moves 4 * 0.1 * 0.1 = 0.04 towards its old, displaced slot.
  expect(calculation.mean.x).toBeCloseTo(0.04, 12);
  expect(calculation.proposed.x).toBeCloseTo(10.24, 12);
  expect(calculation.pulled.x).toBeCloseTo(10.036, 12);
  expect(calculation.pulledLag).toBeCloseTo(9.996, 12);
  expect(calculation.capped).toBe(true);
  expect(calculation.next.formation.anchor.x).toBeCloseTo(4.04, 12);
  expect(calculation.next.formation.anchorVelocity.x).toBeCloseTo(2.4, 12);
  expect(escortLag(calculation.next)).toBeCloseTo(example.lagLimit, 12);
  expect(slotPosition(calculation.next.formation, 0).x).toBeCloseTo(6.04, 12);
});

it('keeps actual lag bounded and preserves the equally paced wedge through the crossing', () => {
  const states = escortStates(example);
  expect(states).toHaveLength(example.steps + 1);
  for (const [step, state] of states.entries()) {
    expect(escortLag(state)).toBeLessThanOrEqual(example.lagLimit + 1e-10);
    expect(escortSlotError(state)).toBeCloseTo(escortLag(state), 10);
    expect(centroid(state.formation.slots).x).toBeCloseTo(0, 12);
    for (const [index, member] of state.members.entries()) {
      expect(member.position.y).toBeCloseTo(state.formation.slots[index].y, 12);
      expect(length(member.velocity)).toBeLessThanOrEqual(example.memberSpeed + 1e-10);
      if (step > 0) {
        expect(
          distance(member.velocity, states[step - 1].members[index].velocity) / example.timeStep,
        ).toBeLessThanOrEqual(example.memberAcceleration + 1e-10);
        expect(member.position.x).toBeGreaterThanOrEqual(
          states[step - 1].members[index].position.x,
        );
      }
    }
  }
  const last = states[example.steps];
  expect(last.formation.anchor.x).toBeGreaterThan(10);
  expect(last.formation.anchor.x).toBeLessThan(example.objectiveX);
  expect(last.formation.anchorVelocity.x).toBeCloseTo(8, 10);
  const actualAnchorSpeed =
    (last.formation.anchor.x - states[example.steps - 1].formation.anchor.x) / example.timeStep;
  expect(actualAnchorSpeed).toBeLessThanOrEqual(example.memberSpeed + 1e-8);
});

it('shows the failure from changing only the lag limit while retaining the gentle pull', () => {
  const tight = escortStates(example);
  const loose = escortStates({ ...example, lagLimit: example.comparisonLagLimit });
  const motionBeforeClip = (state: (typeof tight)[number]) => ({
    members: state.members,
    anchor: state.formation.anchor,
    velocity: state.formation.anchorVelocity,
  });
  expect(loose.slice(0, 8).map(motionBeforeClip)).toEqual(tight.slice(0, 8).map(motionBeforeClip));
  expect(Math.max(...tight.map(escortSlotError))).toBeCloseTo(4, 10);
  expect(Math.max(...loose.map(escortSlotError))).toBeCloseTo(12, 10);
  expect(loose[example.steps].formation.anchor.x).toBeGreaterThan(
    tight[example.steps].formation.anchor.x,
  );
  for (const state of loose) expect(escortLag(state)).toBeLessThanOrEqual(12 + 1e-10);
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(tight.map(escortSlotError));
  expect(comparison?.timeline.series[1].values).toEqual(loose.map(escortSlotError));
  expect(comparison?.findings[0]).toContain('4.00 units with the tight limit and 12.00');
});

it('does not mistake a bound on the mean for a bound on every member', () => {
  const start = initialEscort(example);
  const scattered = {
    ...start,
    members: start.members.map((member, index) => ({
      ...member,
      position: { x: index === 0 ? -10 : 5, y: member.position.y },
    })),
  };
  expect(escortLag(scattered)).toBe(0);
  expect(distance(scattered.members[0].position, slotPosition(scattered.formation, 0))).toBe(12);
  expect(escortSlotError(scattered)).toBe(8);
});

it('fades the anchor speed request near the beacon and brakes inside its stop radius', () => {
  const start = initialEscort(example);
  const near = (anchorX: number) => ({
    formation: { ...start.formation, anchor: { x: anchorX, y: 0 }, anchorVelocity: { x: 4, y: 0 } },
    members: start.members.map((member) => ({
      ...member,
      position: { x: member.position.x + anchorX, y: member.position.y },
    })),
  });
  // Halfway through the 0.5–6 unit fade, the speed request is half of 8 units/s.
  const halfway = calculateEscortStep(near(36.75), example);
  expect(halfway.next.formation.anchorVelocity.x).toBeCloseTo(4, 12);
  expect(halfway.proposed.x).toBeCloseTo(37.15, 12);
  const atStop = near(39.5);
  const stopped = calculateEscortStep(
    { ...atStop, formation: { ...atStop.formation, anchorVelocity: { x: 2, y: 0 } } },
    example,
  );
  expect(stopped.next.formation.anchorVelocity.x).toBeCloseTo(0, 12);
  expect(stopped.next.formation.anchor.x).toBeCloseTo(39.5, 12);
});

it('applies the pull once per update and refuses stale engine arithmetic', () => {
  const idleExample = {
    ...example,
    anchorSpeed: 0,
    memberSpeed: 0,
    lagLimit: example.comparisonLagLimit,
  };
  const initial = initialEscort(idleExample);
  const start = { ...initial, formation: { ...initial.formation, anchor: { x: 10, y: 0 } } };
  const whole = calculateEscortStep(start, idleExample).next;
  const halfExample = { ...idleExample, timeStep: example.timeStep / 2 };
  const half = calculateEscortStep(calculateEscortStep(start, halfExample).next, halfExample).next;
  // With no motion or cap, one pull leaves 10 * 0.98; two leave 10 * 0.98 squared.
  expect(whole.formation.anchor.x).toBeCloseTo(9.8, 12);
  expect(half.formation.anchor.x).toBeCloseTo(9.604, 12);
  expect(() => model({ ...parameters, anchorPull: 0.03 })).toThrow('fixed anchor rule');
});

it('connects the prose, selected cap, drawings and chart to the same deterministic run', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.initialStep).toBe(8);
  expect(run.motion.frames).toHaveLength(121);
  expect(run.moments.length).toBeGreaterThanOrEqual(3);
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values['lag']).toBe('4.00');
  // Keep the anchor visibly separate from the front escort when the lag cap acts.
  expect(distance(selected.bodies[0], selected.bodies[3])).toBeCloseTo(2, 10);
  expect(selected.worked?.lines.at(-1)).toContain('Clip that gap to 4.00');
  expect(run.motion.frames[0].values['requestedSpeed']).toBe('8.00');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('0.24');
  const placeholders = [...JSON.stringify(record).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(
    (match) => match[1],
  );
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    for (const name of placeholders) expect(frame.values[name], name).toBeDefined();
    for (const position of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(position.x).toBeGreaterThanOrEqual(minX);
      expect(position.x).toBeLessThanOrEqual(maxX);
      expect(position.y).toBeGreaterThanOrEqual(minY);
      expect(position.y).toBeLessThanOrEqual(maxY);
    }
    expect(frame.bodies).toHaveLength(4);
    expect(frame.marks?.filter(({ shape }) => shape === 'ring')).toHaveLength(3);
  }
  expect(run.timeline?.series[0].values).toEqual(escortStates(example).map(escortLag));
  expect(motionDrawing(run.motion, run.initialStep).bodies).toHaveLength(4);
  if (!run.timeline || !run.comparison) throw new Error('The escort needs its two charts.');
  expect(timelineDrawing(run.timeline, run.initialStep).cursorX).not.toBeNull();
  expect(timelineDrawing(run.comparison.timeline, null).series).toHaveLength(2);
});

it('lets a looser lag limit visibly stretch the escort and faster motors advance the whole group', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['lagLimit', 'memberSpeed']);
  const lagInput = inputs.find(({ name }) => name === 'lagLimit');
  const speedInput = inputs.find(({ name }) => name === 'memberSpeed');
  if (!lagInput || !speedInput) throw new Error('The escort needs lag and motor controls.');
  const tight = model({ ...parameters, lagLimit: lagInput.min });
  const loose = model({ ...parameters, lagLimit: lagInput.max });
  expect(tight.motion.frames.at(-1)?.values['lag']).toBe('4.00');
  expect(loose.motion.frames.at(-1)?.values['lag']).toBe('10.00');
  expect(Math.max(...(loose.timeline?.series[1].values ?? []))).toBeCloseTo(10, 10);
  expect(Math.max(...(tight.timeline?.series[1].values ?? []))).toBeCloseTo(4, 10);
  const slow = model({ ...parameters, memberSpeed: speedInput.min });
  const fast = model({ ...parameters, memberSpeed: speedInput.max });
  const slowLast = slow.motion.frames.at(-1);
  const fastLast = fast.motion.frames.at(-1);
  if (!slowLast || !fastLast) throw new Error('Each motor setting needs a final frame.');
  expect(fastLast.bodies[0].x - slowLast.bodies[0].x).toBeGreaterThan(15);
  expect(fastLast.bodies[3].x - slowLast.bodies[3].x).toBeGreaterThan(15);
});

it('keeps notes, displayed precision, labels and every drawn extent sound throughout the input ranges', () => {
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
          ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
            { x: x - radius, y: y - radius },
            { x: x + radius, y: y + radius },
          ]),
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
      expect(
        run.motion.frames[run.initialStep].bodies.find(({ id }) => id === 'anchor')?.label,
      ).toBe('Anchor');
    }
  expect(record.visual?.textEquivalent).not.toMatch(/Position|Positions|\([{}a-zA-Z0-9., -]+\)/);
});
