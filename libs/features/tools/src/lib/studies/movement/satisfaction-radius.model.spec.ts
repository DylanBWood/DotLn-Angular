import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { SatisfactionRadiusParameters } from './satisfaction-radius.model';
import {
  calculateSatisfactionRadiusStep,
  model,
  satisfactionRadiusSamples,
} from './satisfaction-radius.model';

const example: SatisfactionRadiusParameters = {
  start: 0,
  target: 10.5,
  speed: 2,
  satisfactionRadius: 0.5,
  timeStep: 0.5,
  steps: 28,
  comparisonRadius: 0,
};
const parameters: StudyParameters = { ...example };

function motionOf(input: StudyParameters = parameters): MotionStudyModel {
  return model(input);
}

it('uses the catalogue example parameters', async () => {
  const record = await createCatalogLoader().study('aifg-a:102');
  expect(record?.example.parameters).toEqual(parameters);
  expect(record?.pseudocode.executable?.module).toContain('satisfaction-radius.model.ts');
});

it('accepts equality at either edge and preserves the error instead of snapping', () => {
  expect(calculateSatisfactionRadiusStep(10, example)).toEqual({
    offset: 0.5,
    distance: 0.5,
    accepted: true,
    velocity: 0,
    nextPosition: 10,
  });
  expect(calculateSatisfactionRadiusStep(11, example)).toMatchObject({
    offset: -0.5,
    accepted: true,
    velocity: 0,
    nextPosition: 11,
  });
  expect(calculateSatisfactionRadiusStep(10.5, example, 0)).toMatchObject({
    distance: 0,
    accepted: true,
    velocity: 0,
  });
});

it('takes full strides outside and stops at the first accepted sample', () => {
  expect(calculateSatisfactionRadiusStep(9, example)).toMatchObject({
    distance: 1.5,
    accepted: false,
    velocity: 2,
    nextPosition: 10,
  });
  expect(calculateSatisfactionRadiusStep(12, example)).toMatchObject({
    accepted: false,
    velocity: -2,
    nextPosition: 11,
  });
  const samples = satisfactionRadiusSamples(example);
  expect(samples).toHaveLength(example.steps + 1);
  expect(samples.slice(0, 11).map((sample) => sample.position)).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  expect(samples.slice(0, 10).every((sample) => sample.velocity === 2)).toBe(true);
  expect(samples.slice(10).every((sample) => sample.position === 10 && sample.velocity === 0)).toBe(
    true,
  );
  expect(samples.at(-1)?.distance).toBe(0.5);
});

it('exposes jitter when zero radius demands a sample the fixed stride cannot reach', () => {
  const exact = satisfactionRadiusSamples(example, example.comparisonRadius);
  expect(exact.slice(10, 15).map((sample) => sample.position)).toEqual([10, 11, 10, 11, 10]);
  expect(exact.slice(10, 15).map((sample) => sample.velocity)).toEqual([2, -2, 2, -2, 2]);
  expect(exact.every((sample) => !sample.accepted)).toBe(true);
  expect(exact.slice(10).every((sample) => sample.distance === 0.5)).toBe(true);
  const main = satisfactionRadiusSamples(example);
  expect(exact.slice(0, 11).map((sample) => sample.position)).toEqual(
    main.slice(0, 11).map((sample) => sample.position),
  );
});

it('does not count crossing the region between samples as acceptance', () => {
  const narrow = { ...example, satisfactionRadius: 0.4 };
  const crossing = calculateSatisfactionRadiusStep(10, narrow);
  expect(crossing.accepted).toBe(false);
  expect(crossing.nextPosition).toBe(11);
  expect(calculateSatisfactionRadiusStep(crossing.nextPosition, narrow).accepted).toBe(false);
  expect(satisfactionRadiusSamples(narrow).every((sample) => !sample.accepted)).toBe(true);
});

it('shows how an oversized region can accept the starting place', () => {
  const wide = { ...example, satisfactionRadius: example.target - example.start };
  expect(
    satisfactionRadiusSamples(wide).every(
      (sample) => sample.accepted && sample.position === example.start,
    ),
  ).toBe(true);
});

it('connects the selected moment to its arithmetic, text and both charts', () => {
  const run = motionOf();
  expect(run.initialStep).toBe(10);
  const frame = run.motion.frames[run.initialStep];
  expect(frame.seconds).toBe(5);
  expect(frame.bodies[0].x).toBe(10);
  expect(frame.vectors?.[0].dx).toBe(0);
  expect(frame.values).toMatchObject({
    position: '10.000',
    distance: '0.500',
    satisfactionRadius: '0.500',
    lowerEdge: '10.000',
    upperEdge: '11.000',
    accepted: 'accepted',
    velocity: '0.000',
  });
  expect(frame.worked?.lines).toContain('0.500 ≤ 0.500 is true.');
  expect(frame.note).toContain('including its boundary');
  expect(run.timeline?.series[0].values[10]).toBe(0.5);
  expect(run.timeline?.reference).toBe(0.5);
  expect(run.comparison?.timeline.series[1].values[11]).toBe(11);
  expect(run.comparison?.findings.join(' ')).toContain('never accepts a sampled position');
});

it('updates the region when its input changes and keeps the drawing in bounds', () => {
  const run = motionOf({ ...parameters, satisfactionRadius: 2 });
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  expect(run.motion.frames[0].values['satisfactionRadius']).toBe('2.000');
  expect(run.timeline?.reference).toBe(2);
  for (const frame of run.motion.frames) {
    expect(frame.bodies[0].x).toBeGreaterThanOrEqual(minX);
    expect(frame.bodies[0].x).toBeLessThanOrEqual(maxX);
    for (const zone of frame.zones ?? []) {
      expect(zone.x - zone.radius).toBeGreaterThanOrEqual(minX);
      expect(zone.x + zone.radius).toBeLessThanOrEqual(maxX);
      expect(zone.y - zone.radius).toBeGreaterThanOrEqual(minY);
      expect(zone.y + zone.radius).toBeLessThanOrEqual(maxY);
    }
  }
  expect(motionOf({ ...parameters, satisfactionRadius: 0 }).comparison?.findings).toEqual([
    'Both radii are equal, so the comparison runs coincide.',
  ]);
  expect(model(parameters)).toEqual(model(parameters));
});
