import type { StudyParameters } from '@dotln-angular/models';
import { distance, length, sine } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  creatureFrames,
  initialCreatures,
  model,
  playerAt,
  readCreature,
  readCreatureParameters,
  speciesTravel,
  stepCreatures,
} from './making-the-creatures.model';

const record = await loadStudy('aifg-b:373');
const parameters: StudyParameters = {
  startX: 0,
  sheepOffset: 3,
  goatOffset: 9,
  playerStartX: -10,
  playerY: -3,
  playerSpeed: 1.3,
  neighbourRadius: 24,
  separationThreshold: 8,
  separationWeight: 1.5,
  cohesionWeight: 0.5,
  alignmentWeight: 1,
  sheepWanderWeight: 0.2,
  goatWanderWeight: 0.5,
  sheepFleeWeight: 1.5,
  goatFleeWeight: 0.5,
  fleeScale: 1,
  unresponsiveFleeScale: 0,
  fleeRadius: 20,
  wanderRadius: 3,
  wanderOffset: 6,
  wanderAmplitude: 0.6,
  wanderRate: 0.8,
  slowRadius: 12,
  responseTime: 1,
  maxSpeed: 4,
  maxAcceleration: 4,
  radius: 0.7,
  timeStep: 0.1,
  steps: 160,
};
const p = readCreatureParameters(parameters);

it('uses exactly the draft record’s parameters and aligns its mechanism and code blocks', () => {
  expect(record.id).toBe('aifg-b:373');
  expect(record.example.parameters).toEqual(parameters);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
  expect(() => readCreatureParameters({ ...parameters, fleeRadius: 21 })).toThrow(
    'fixes fleeRadius at 20',
  );
});

it('works Fern’s first composition and integration by hand', () => {
  const initial = initialCreatures(p);
  const r = readCreature(initial, 0, 0, p);
  expect(r.neighbours.map(({ id }) => id)).toEqual(['Moss']);
  expect(r.centre).toEqual({ x: 0, y: 3 });
  expect(r.meanVelocity).toEqual({ x: 0, y: 0 });
  // Moss and Flint are six units away on opposite sides: their unit pushes cancel.
  expect(r.separation).toEqual({ x: 0, y: 0 });
  expect(r.cohesion).toEqual({ x: 0, y: 2 });
  expect(r.alignment).toEqual({ x: 0, y: 0 });
  expect(r.angle).toBe(0);
  expect(r.wandering).toEqual({ x: 1.6, y: 0 });
  // Kit is ten units west: 4 × (1 − 10 / 20) = 2 eastward acceleration.
  expect(r.fleeing).toEqual({ x: 2, y: 0 });
  expect(r.wanderWeight).toBe(0.2);
  expect(r.fleeWeight).toBe(1.5);
  expect(r.acceleration.x).toBeCloseTo(0.2 * 1.6 + 1.5 * 2);
  expect(r.acceleration.y).toBe(0.5 * 2);
  const next = stepCreatures(initial, 0, p)[0];
  expect(next.velocity.x).toBeCloseTo(0.332);
  expect(next.velocity.y).toBeCloseTo(0.1);
  expect(next.position.x).toBeCloseTo(0.0332);
  expect(next.position.y).toBeCloseTo(-2.99);
  expect(playerAt(p.timeStep, p).x).toBeCloseTo(-9.87);
});

it('uses species membership for company and all nearby creatures for separation', () => {
  const initial = initialCreatures(p);
  const sheep = readCreature(initial, 0, 0, p);
  const goat = readCreature(initial, 2, 0, p);
  expect(goat.neighbours.map(({ id }) => id)).toEqual(['Pebble']);
  expect(goat.wanderWeight).toBe(p.goatWanderWeight);
  expect(goat.fleeWeight).toBe(p.goatFleeWeight);
  expect(sheep.wanderWeight).toBeLessThan(goat.wanderWeight);
  expect(sheep.fleeWeight).toBeGreaterThan(goat.fleeWeight);
  expect(goat.separation).toEqual({ x: 0, y: -1 });
  const sheepAlone = readCreature(initial.slice(0, 2), 0, 0, p);
  expect(sheepAlone.separation).toEqual({ x: 0, y: -1 });
  const disconnected = readCreature(initial, 2, 0, { ...p, neighbourRadius: p.sheepOffset * 2 });
  expect(disconnected.neighbours).toEqual([]);
  expect(disconnected.cohesion).toEqual({ x: 0, y: 0 });
  expect(disconnected.alignment).toEqual({ x: 0, y: 0 });
  expect(disconnected.separation).toEqual({ x: 0, y: -1 });
});

it('uses a deterministic prescribed wobble, keeps stable signs and does not mutate the snapshot', () => {
  const initial = initialCreatures(p);
  const saved = structuredClone(initial);
  const fern = readCreature(initial, 0, 1, p);
  const moss = readCreature(initial, 1, 1, p);
  expect(fern.angle).toBeCloseTo(0.4304136545397136, 12);
  expect(fern.angle).toBe(p.wanderAmplitude * sine(p.wanderRate));
  expect(moss.angle).toBe(-fern.angle);
  const next = stepCreatures(initial, 1, p);
  expect(initial).toEqual(saved);
  const reversed = [...stepCreatures([...initial].reverse(), 1, p)].reverse();
  expect(reversed).toEqual(next);
  expect(creatureFrames(p)).toEqual(creatureFrames(p));
});

it('caps the five-term blend and speed while the responsive herd moves east', () => {
  const states = creatureFrames(p);
  expect(states).toHaveLength(p.steps + 1);
  expect(speciesTravel(states[p.steps], 'sheep', p)).toBeGreaterThan(
    speciesTravel(states[p.steps], 'goat', p),
  );
  expect(speciesTravel(states[p.steps], 'goat', p)).toBeGreaterThan(0);
  for (const [step, bodies] of states.entries()) {
    for (const [index, body] of bodies.entries()) {
      expect(length(body.velocity)).toBeLessThanOrEqual(p.maxSpeed + 1e-10);
      expect(
        length(readCreature(bodies, index, step * p.timeStep, p).acceleration),
      ).toBeLessThanOrEqual(p.maxAcceleration + 1e-10);
    }
  }
  const saturated = readCreature(states[0], 0, 0, { ...p, fleeScale: 100 });
  expect(length(saturated.acceleration)).toBeCloseTo(p.maxAcceleration);
});

it('lets Kit approach much more closely when only the flee scale is removed', () => {
  const normal = creatureFrames(p);
  const unresponsiveP = { ...p, fleeScale: p.unresponsiveFleeScale };
  const unresponsive = creatureFrames(unresponsiveP);
  expect(unresponsive[0]).toEqual(normal[0]);
  const first = readCreature(normal[0], 0, 0, p);
  const changed = readCreature(unresponsive[0], 0, 0, unresponsiveP);
  expect(changed.separation).toEqual(first.separation);
  expect(changed.cohesion).toEqual(first.cohesion);
  expect(changed.alignment).toEqual(first.alignment);
  expect(changed.wandering).toEqual(first.wandering);
  expect(changed.fleeing).toEqual(first.fleeing);
  expect(changed.fleeWeight).toBe(0);
  expect(changed.acceleration.x).toBeCloseTo(0.32);
  expect(unresponsive[1][0].position.x).toBeCloseTo(0.0032);
  const gaps = normal.map((bodies, step) =>
    distance(bodies[0].position, playerAt(step * p.timeStep, p)),
  );
  const ignoredGaps = unresponsive.map((bodies, step) =>
    distance(bodies[0].position, playerAt(step * p.timeStep, p)),
  );
  expect(Math.min(...gaps)).toBeGreaterThan(9);
  expect(Math.min(...ignoredGaps)).toBeLessThan(0.2);
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(gaps);
  expect(comparison?.timeline.series[1].values).toEqual(ignoredGaps);
  expect(comparison?.findings[0]).toContain('9.78 units at flee scale 1.00 and 0.17 at scale 0.00');
});

it('exposes flee’s distance boundary, missing direction at coincidence and dependence on the player’s side', () => {
  const initial = initialCreatures(p);
  expect(readCreature(initial, 0, 0, { ...p, playerStartX: -p.fleeRadius }).fleeing).toEqual({
    x: 0,
    y: 0,
  });
  expect(readCreature(initial, 0, 0, { ...p, playerStartX: p.startX }).fleeing).toEqual({
    x: 0,
    y: 0,
  });
  const otherSide = readCreature(initial, 0, 0, { ...p, playerStartX: -p.playerStartX });
  expect(otherSide.fleeing).toEqual({ x: -2, y: 0 });
  expect(otherSide.acceleration.x).toBeLessThan(0);
  const balanced = readCreature(initial, 0, 0, {
    ...p,
    playerStartX: -p.playerStartX,
    sheepFleeWeight: 0.16,
    separationWeight: 0,
    cohesionWeight: 0,
    alignmentWeight: 0,
  });
  expect(length(balanced.fleeing)).toBe(2);
  expect(length(balanced.wandering)).toBe(1.6);
  expect(length(balanced.acceleration)).toBeLessThan(1e-12);
});

it('silences player response outside its range without inventing a new creature state', () => {
  const distant = { ...p, playerStartX: -100, playerSpeed: 0 };
  const initial = initialCreatures(distant);
  expect(readCreature(initial, 0, 0, distant).fleeing).toEqual({ x: 0, y: 0 });
  expect(length(readCreature(initial, 0, 0, distant).wandering)).toBeGreaterThan(0);
  expect(creatureFrames(distant)).toEqual(creatureFrames({ ...distant, fleeScale: 0 }));
});

it('gives every selected moment complete prose values and geometry on the same chart scales', () => {
  const run = model(parameters);
  const states = creatureFrames(p);
  expect(model(parameters)).toEqual(run);
  expect(run.motion.frames.length).toBeLessThanOrEqual(240);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toHaveLength(4);
  const templates = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const bounds = run.motion.bounds;
  for (const [step, frame] of run.motion.frames.entries()) {
    for (const template of templates) {
      for (const key of placeholdersIn(template)) expect(frame.values[key], key).toBeDefined();
      expect(fillValues(template, frame.values)).not.toMatch(/\{[a-zA-Z]/);
    }
    const points = [
      ...frame.bodies,
      ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
      ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y + radius },
      ]),
    ];
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(point.x).toBeLessThanOrEqual(bounds.maxX);
      expect(point.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(point.y).toBeLessThanOrEqual(bounds.maxY);
    }
    expect(frame.bodies).toHaveLength(5);
    expect(motionDrawing(run.motion, step).vectors).toHaveLength(4);
    expect(run.timeline?.series[0].values[step]).toBe(speciesTravel(states[step], 'sheep', p));
    expect(run.timeline?.series[1].values[step]).toBe(speciesTravel(states[step], 'goat', p));
    expect(frame.worked?.lines.length).toBeGreaterThan(0);
  }
  expect(run.motion.frames[0].vectors?.[0]).toMatchObject({ dx: 0, dy: 4, tone: 'desired' });
  expect(run.motion.frames[0].values['social']).toBe('(0.00, 1.00)');
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain(
    '4.00 × max(0, 1 − 10.00 / 20.00) = 2.00',
  );
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(0.03, -2.99)');
  for (const { step } of run.moments) expect(run.motion.frames[step]).toBeDefined();
  if (!run.timeline || !run.comparison) throw new Error('Creature construction has both charts.');
  for (const chart of [run.timeline, run.comparison.timeline]) {
    expect(chart.series.every(({ values }) => values.length === chart.seconds.length)).toBe(true);
    expect(
      timelineDrawing(chart, run.initialStep).series.every(
        ({ points }) => !/NaN|Infinity/.test(points),
      ),
    ).toBe(true);
  }
});

it('separates the opening wander and flee requests into named rows with visible arrowheads', () => {
  const run = model(parameters);
  const first = run.motion.frames[0];
  const vectors = first.vectors ?? [];
  expect(new Set(vectors.map(({ y }) => y)).size).toBe(4);
  expect(vectors[1].dy).toBe(0);
  expect(vectors[1].dx).toBeCloseTo(1.28);
  expect(vectors[2]).toMatchObject({ dx: 12, dy: 0 });
  expect(motionDrawing(run.motion, 0).vectors.every(({ head }) => head !== null)).toBe(true);
  expect(first.marks?.flatMap(({ label }) => label ?? [])).toEqual(
    expect.arrayContaining([
      'Fern',
      'Moss',
      'Flint',
      'Pebble',
      'Kit',
      'Social',
      'Wander',
      'Flee',
      'Result',
    ]),
  );
  const text = fillValues(record.visual.textEquivalent, first.values);
  expect(text).toContain('Fern and Moss are linked as sheep');
  expect(text).toContain('Kit is behind the sheep and 10.00 units from Fern');
  expect(text).not.toMatch(/\(-?\d/);
});

it('reruns the player response and goat profile without changing the other starting requests', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['fleeScale', 'goatWanderWeight']);
  const noResponse = model({ ...parameters, fleeScale: 0 });
  const strongResponse = model({ ...parameters, fleeScale: 2 });
  expect(noResponse.motion.frames[0].vectors?.[2].dx).toBe(0);
  expect(strongResponse.motion.frames[0].vectors?.[2].dx).toBe(24);
  expect(noResponse.motion.frames[0].note).toContain('player response is off');
  expect(noResponse.motion.frames.at(-1)?.note).toContain('passed Fern');
  expect(noResponse.comparison?.intro).toContain('curves coincide');
  expect(noResponse.comparison?.timeline.series[0].values).toEqual(
    noResponse.comparison?.timeline.series[1].values,
  );
  expect(strongResponse.motion.frames.at(-1)?.values['sheepTravel']).not.toBe(
    noResponse.motion.frames.at(-1)?.values['sheepTravel'],
  );
  const quietGoats = model({ ...parameters, goatWanderWeight: 0 });
  const wanderingGoats = model({ ...parameters, goatWanderWeight: 1 });
  expect(quietGoats.motion.frames[0].values['goatWander']).toBe('0.00');
  expect(wanderingGoats.motion.frames[0].values['goatWander']).toBe('1.00');
  const quietFirst = quietGoats.motion.frames[1].bodies.find(({ id }) => id === 'Flint');
  const wanderingFirst = wanderingGoats.motion.frames[1].bodies.find(({ id }) => id === 'Flint');
  expect(quietFirst).toBeDefined();
  expect(wanderingFirst).toBeDefined();
  expect(wanderingFirst?.x).toBeGreaterThan(quietFirst?.x ?? Infinity);
  expect(quietGoats.timeline?.series[1].values).not.toEqual(
    wanderingGoats.timeline?.series[1].values,
  );
});

it('keeps notes, prose, labels and all geometry sound at input endpoints and combined extremes', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs).toHaveLength(2);
  const variants = [
    parameters,
    ...inputs.flatMap((input) =>
      [input.min, input.max].map((value) => ({ ...parameters, [input.name]: value })),
    ),
    ...[inputs[0].min, inputs[0].max].flatMap((first) =>
      [inputs[1].min, inputs[1].max].map((second) => ({
        ...parameters,
        [inputs[0].name]: first,
        [inputs[1].name]: second,
      })),
    ),
  ];
  const templates = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  for (const variant of variants) {
    const run = model(variant);
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(run.initialStep).toBeGreaterThanOrEqual(0);
    expect(run.initialStep).toBeLessThan(run.motion.frames.length);
    for (const { step } of run.moments) {
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThan(run.motion.frames.length);
    }
    for (const [step, frame] of run.motion.frames.entries()) {
      expect(frame.note).toBeTypeOf('string');
      expect(frame.note?.length).toBeLessThan(180);
      expect(frame.note).not.toMatch(/\(-?\d/);
      for (const template of templates)
        expect(fillValues(template, frame.values)).not.toMatch(/\{[a-zA-Z]/);
      const displayed = [
        ...Object.values(frame.values),
        frame.note ?? '',
        ...(frame.worked?.lines ?? []),
        ...templates.map((template) => fillValues(template, frame.values)),
      ].join(' ');
      expect(displayed).not.toMatch(/-?\d+\.\d{3,}/);
      expect(fillValues(record.visual.textEquivalent, frame.values)).not.toMatch(/\(-?\d/);
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
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
      const labels = [...drawing.bodies, ...drawing.marks].flatMap(({ x, labelY, label }) =>
        label ? [{ x, y: labelY, text: label }] : [],
      );
      const height = Number(drawing.viewBox.split(' ')[3]);
      for (const label of labels) {
        expect(label.x - label.text.length * 7.5).toBeGreaterThanOrEqual(0);
        expect(label.x + label.text.length * 7.5).toBeLessThanOrEqual(600);
        expect(label.y - 24).toBeGreaterThanOrEqual(0);
        expect(label.y + 4).toBeLessThanOrEqual(height);
      }
      // These conservative boxes also cover the larger text used on narrow screens.
      for (const [index, first] of labels.entries())
        for (const second of labels.slice(index + 1))
          expect(
            Math.abs(first.x - second.x) >= (first.text.length + second.text.length) * 7.5 ||
              Math.abs(first.y - second.y) >= 28,
            first.text + '/' + second.text,
          ).toBe(true);
    }
    expect(new Set(run.motion.frames.map(({ note }) => note)).size).toBeGreaterThan(1);
    for (const chart of [run.timeline, run.comparison?.timeline])
      if (chart) {
        expect(
          chart.series.every(
            ({ values }) => values.length === chart.seconds.length && values.every(Number.isFinite),
          ),
        ).toBe(true);
      }
  }
});
