import type { StudyParameters } from '@dotln-angular/models';
import { centroid, length } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  flockingFrames,
  initialWalkers,
  model,
  nearestPair,
  readFlock,
  readFlockingParameters,
  stepFlock,
  velocitySpread,
} from './flocking.model';

const record = await loadStudy('aifg-a:145');
const parameters: StudyParameters = {
  startX: 0,
  spacing: 4,
  middleSpeed: 2,
  cruiseSpeed: 4,
  cruiseWeight: 1,
  neighbourRadius: 12,
  separationThreshold: 8,
  separationWeight: 1,
  cohesionWeight: 1,
  alignmentWeight: 1,
  slowRadius: 12,
  responseTime: 1,
  maxSpeed: 6,
  maxAcceleration: 6,
  radius: 0.8,
  crossingX: 30,
  timeStep: 0.1,
  steps: 200,
  crowdedSeparationWeight: 0,
};
const p = readFlockingParameters(parameters);

it('uses exactly the draft record’s parameters and pairs each mechanism step with its code', () => {
  expect(record.id).toBe('aifg-a:145');
  expect(record.example.parameters).toEqual(parameters);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.executable?.module).toBe(record.visual?.model);
});

it('works Mara’s first update by hand, including cancellation and velocity matching', () => {
  const initial = initialWalkers(p);
  const r = readFlock(initial, 0, p);
  expect(r.neighbours.map(({ id }) => id)).toEqual(['Ivo', 'Noor']);
  expect(r.centre).toEqual({ x: 0, y: 2 });
  expect(r.meanVelocity).toEqual({ x: 1, y: 0 });
  // Ivo is four units away: 6 × (8 − 4) / 8 = 3. Noor is at the threshold.
  expect(r.separation).toEqual({ x: 0, y: -3 });
  expect(r.cohesion).toEqual({ x: 0, y: 3 });
  expect(r.alignment).toEqual({ x: 1, y: 0 });
  expect(r.cruise).toEqual({ x: 4, y: 0 });
  expect(r.acceleration).toEqual({ x: 5, y: 0 });
  const next = stepFlock(initial, p);
  expect(next[0].velocity).toEqual({ x: 0.5, y: 0 });
  expect(next[0].position).toEqual({ x: 0.05, y: -4 });
  expect(next[1].velocity.x).toBeCloseTo(1.8);
  expect(next[1].position.x).toBeCloseTo(0.18);
  expect(velocitySpread(initial)).toBeCloseTo(Math.sqrt(8 / 9));
});

it('reads one immutable snapshot and does not depend on visiting separated walkers in order', () => {
  const initial = initialWalkers(p);
  const saved = structuredClone(initial);
  const next = stepFlock(initial, p);
  expect(initial).toEqual(saved);
  const reversed = [...stepFlock([...initial].reverse(), p)].reverse();
  expect(reversed).toEqual(next);
});

it('crosses the field with converging velocities while retaining room and obeying motion limits', () => {
  const states = flockingFrames(p);
  expect(states).toHaveLength(p.steps + 1);
  expect(centroid(states[p.steps].map(({ position }) => position)).x).toBeGreaterThan(p.crossingX);
  expect(velocitySpread(states[p.steps])).toBeLessThan(0.01);
  for (const bodies of states) {
    expect(nearestPair(bodies)).toBeGreaterThanOrEqual(p.spacing - 1e-10);
    for (const [index, body] of bodies.entries()) {
      expect(length(body.velocity)).toBeLessThanOrEqual(p.maxSpeed + 1e-10);
      expect(length(readFlock(bodies, index, p).acceleration)).toBeLessThanOrEqual(
        p.maxAcceleration + 1e-10,
      );
    }
  }
  const saturated = readFlock(initialWalkers(p), 0, { ...p, separationWeight: 5, cruiseWeight: 5 });
  expect(length(saturated.acceleration)).toBeCloseTo(p.maxAcceleration);
});

it('makes piling up visible after changing only the separation weight', () => {
  const normal = flockingFrames(p);
  const crowdedP = { ...p, separationWeight: p.crowdedSeparationWeight };
  const crowded = flockingFrames(crowdedP);
  expect(crowded[0]).toEqual(normal[0]);
  expect(readFlock(crowded[0], 0, crowdedP).acceleration).toEqual({ x: 5, y: 3 });
  expect(crowded[1][0].position.y).toBeCloseTo(-3.97);
  expect(Math.min(...normal.map(nearestPair))).toBeGreaterThan(2 * p.radius);
  expect(Math.min(...crowded.map(nearestPair))).toBeLessThan(2 * p.radius);
  expect(velocitySpread(crowded[p.steps])).toBeLessThan(0.01);
  const comparison = model(parameters).comparison;
  expect(comparison?.timeline.series[0].values).toEqual(normal.map(nearestPair));
  expect(comparison?.timeline.series[1].values).toEqual(crowded.map(nearestPair));
  expect(comparison?.timeline.reference).toBe(1.6);
  expect(comparison?.findings[0]).toContain(
    '4.00 units at separation weight 1.00 and 0.05 at weight 0.00',
  );
});

it('can remain motionless in a nontrivial blending equilibrium without a crossing drive', () => {
  const resting = { ...p, middleSpeed: 0, cruiseWeight: 0 };
  const initial = initialWalkers(resting);
  const reading = readFlock(initial, 0, resting);
  expect(length(reading.separation)).toBe(3);
  expect(length(reading.cohesion)).toBe(3);
  expect(reading.alignment).toEqual({ x: 0, y: 0 });
  expect(reading.acceleration).toEqual({ x: 0, y: 0 });
  expect(
    flockingFrames(resting).every((bodies) => JSON.stringify(bodies) === JSON.stringify(initial)),
  ).toBe(true);
});

it('silences social terms for an empty neighbourhood and excludes the radius boundary', () => {
  const isolated = readFlock(initialWalkers(p), 0, { ...p, neighbourRadius: p.spacing });
  expect(isolated.neighbours).toEqual([]);
  expect(isolated.separation).toEqual({ x: 0, y: 0 });
  expect(isolated.cohesion).toEqual({ x: 0, y: 0 });
  expect(isolated.alignment).toEqual({ x: 0, y: 0 });
  expect(isolated.acceleration).toEqual({ x: 4, y: 0 });
});

it('does not promise collision prevention between samples for a fast crossing', () => {
  const fastP = { ...p, maxSpeed: 100, cruiseWeight: 0, cohesionWeight: 0, alignmentWeight: 0 };
  const fast = initialWalkers(fastP).map((body, index) => ({
    ...body,
    velocity: { x: 0, y: index === 0 ? 100 : index === 2 ? -100 : 0 },
  }));
  const next = stepFlock(fast, fastP);
  expect(nearestPair(fast)).toBeGreaterThan(2 * p.radius);
  expect(nearestPair(next)).toBeGreaterThan(2 * p.radius);
  expect(next[0].position.y).toBeGreaterThan(next[2].position.y);
  expect(next[0].position.y).toBeGreaterThan(next[1].position.y);
});

it('supplies every prose value, keeps all geometry inside bounds and plots the same run', () => {
  const run = model(parameters);
  expect(model(parameters)).toEqual(run);
  expect(run.motion.frames.length).toBeLessThanOrEqual(240);
  expect(run.moments).toHaveLength(4);
  expect(run.initialStep).toBe(0);
  const templates = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const bounds = run.motion.bounds;
  const states = flockingFrames(p);
  for (const [step, frame] of run.motion.frames.entries()) {
    for (const template of templates) {
      for (const key of placeholdersIn(template)) expect(frame.values[key], key).toBeDefined();
      expect(fillValues(template, frame.values)).not.toMatch(/\{[a-zA-Z]/);
    }
    const points = [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
      ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y + radius },
      ]),
      ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
    ];
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(point.x).toBeLessThanOrEqual(bounds.maxX);
      expect(point.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(point.y).toBeLessThanOrEqual(bounds.maxY);
    }
    expect(frame.bodies).toHaveLength(3);
    expect(motionDrawing(run.motion, step).vectors).toHaveLength(5);
    expect(run.timeline?.series[0].values[step]).toBeCloseTo(velocitySpread(states[step]));
    expect(frame.worked?.lines.length).toBeGreaterThan(0);
  }
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
  const start = run.motion.frames[0];
  expect(start.worked?.lines.join(' ')).toContain('6.00 × (8.00 − 4.00) / 8.00 = 3.00');
  expect(start.worked?.lines.join(' ')).toContain('(0.00, 0.00) + (5.00, 0.00) × 0.10');
  if (!run.timeline || !run.comparison) throw new Error('Flocking has both charts.');
  for (const chart of [run.timeline, run.comparison.timeline]) {
    const drawing = timelineDrawing(chart, run.initialStep);
    expect(drawing.series.every(({ points }) => !/NaN|Infinity/.test(points))).toBe(true);
    expect(chart.series.every(({ values }) => values.length === chart.seconds.length)).toBe(true);
  }
});

it('separates the opening contributions into named rows with visible arrowheads', () => {
  const run = model(parameters);
  const first = run.motion.frames[0];
  const vectors = first.vectors ?? [];
  expect(new Set(vectors.map(({ y }) => y)).size).toBe(5);
  expect(vectors[2]).toMatchObject({ dx: 1, dy: 0 });
  expect(vectors[3]).toMatchObject({ dx: 4, dy: 0 });
  expect(vectors[4]).toMatchObject({ dx: 5, dy: 0 });
  expect(motionDrawing(run.motion, 0).vectors.every(({ head }) => head !== null)).toBe(true);
  expect(first.marks?.flatMap(({ label }) => label ?? [])).toEqual(
    expect.arrayContaining([
      'Mara',
      'Ivo',
      'Noor',
      'Centre',
      'Separation',
      'Cohesion',
      'Match',
      'Crossing',
      'Result',
    ]),
  );
});

it('uses live controls to expose piling up and a crossing that fades before the field line', () => {
  const inputs = model(parameters).inputs ?? [];
  expect(inputs.map(({ name }) => name)).toEqual(['separationWeight', 'cruiseWeight']);
  const withoutSeparation = model({ ...parameters, separationWeight: 0 });
  const strongSeparation = model({ ...parameters, separationWeight: 2 });
  expect(withoutSeparation.motion.frames[0].vectors?.[0].dy).toBeCloseTo(0);
  expect(strongSeparation.motion.frames[0].vectors?.[0].dy).toBe(-6);
  expect(withoutSeparation.motion.frames.at(-1)?.values['gap']).not.toBe(
    strongSeparation.motion.frames.at(-1)?.values['gap'],
  );
  expect(withoutSeparation.motion.frames.at(-1)?.note).toContain('piling up');
  expect(withoutSeparation.comparison?.intro).toContain('curves coincide');
  expect(withoutSeparation.comparison?.timeline.series[0].values).toEqual(
    withoutSeparation.comparison?.timeline.series[1].values,
  );
  const noDrive = model({ ...parameters, cruiseWeight: 0 });
  const strongDrive = model({ ...parameters, cruiseWeight: 2 });
  const finalX = (run: ReturnType<typeof model>) =>
    centroid((run.motion.frames.at(-1)?.bodies ?? []).map(({ x, y }) => ({ x, y }))).x;
  expect(finalX(noDrive)).toBeLessThan(p.crossingX);
  expect(finalX(strongDrive)).toBeGreaterThan(p.crossingX);
  expect(noDrive.motion.frames.at(-1)?.note).toContain('almost still');
  expect(noDrive.moments.some(({ label }) => label === 'Still short of the field line')).toBe(true);
  expect(noDrive.motion.frames[0].values['cruiseWeight']).toBe('0.00');
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
