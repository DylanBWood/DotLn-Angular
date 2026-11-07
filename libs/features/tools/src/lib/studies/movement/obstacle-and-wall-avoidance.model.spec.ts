import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { distance, dot, length } from '@dotln-angular/scene-engine';

import { loadStudy, studyTranslate } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import {
  calculateWallAvoidanceStep,
  castWallRay,
  initialWallAvoidanceState,
  model,
  wallAvoidanceFrames,
  type WallAvoidanceParameters,
  wallClearance,
} from './obstacle-and-wall-avoidance.model';

const example: WallAvoidanceParameters = {
  startX: 0,
  startY: 0,
  velocityX: 4,
  velocityY: 0,
  goalX: 18,
  goalY: 15,
  wallX: 10,
  wallBottom: -6,
  wallTop: 6,
  radius: 1,
  rayLength: 9,
  avoidDistance: 6,
  comparisonRayLength: 1,
  comparisonGoalY: 0,
  maxSpeed: 4,
  maxAcceleration: 8,
  timeStep: 0.1,
  steps: 80,
  velocitySeconds: 1,
  accelerationSecondsSquared: 0.25,
};
const headOn: WallAvoidanceParameters = { ...example, goalY: 0, rayLength: 8 };
const parameters: StudyParameters = { ...example };
const wallFrom = { x: 10, y: -6 };
const wallTo = { x: 10, y: 6 };

it('attaches this executable study and its parameters to Obstacle and wall avoidance', async () => {
  const record = await createCatalogLoader().study('aifg-a:137');
  expect(record?.slug).toBe('obstacle-and-wall-avoidance');
  expect(record?.example.parameters).toEqual(example);
  expect(record?.nearby.map((nearby) => nearby.id)).toContain('aifg-a:139');
  expect(record?.pseudocode.executable?.module).toContain('obstacle-and-wall-avoidance.model.ts');
});

it('casts a genuine finite ray and derives a unit surface normal from the segment', () => {
  const hit = castWallRay({ x: 2, y: 0 }, { x: 12, y: 5 }, wallFrom, wallTo);
  expect(hit).not.toBeNull();
  expect(hit?.rayFraction).toBeCloseTo(0.8);
  expect(hit?.wallFraction).toBeCloseTo(10 / 12);
  expect(hit?.point.x).toBeCloseTo(10);
  expect(hit?.point.y).toBeCloseTo(4);
  expect(hit?.normal.x).toBe(-1);
  expect(hit?.normal.y).toBeCloseTo(0);
  expect(length(hit?.normal ?? { x: 0, y: 0 })).toBeCloseTo(1);
  expect(dot(hit?.normal ?? { x: 0, y: 0 }, { x: 10, y: 5 })).toBeLessThan(0);
  const reverse = castWallRay({ x: 12, y: 0 }, { x: 8, y: 0 }, wallFrom, wallTo);
  expect(reverse?.normal.x).toBe(1);
  const endpoint = castWallRay({ x: 2, y: 6 }, { x: 10, y: 6 }, wallFrom, wallTo);
  expect(endpoint?.rayFraction).toBe(1);
  expect(endpoint?.wallFraction).toBe(1);
});

it('rejects hits beyond either segment, behind the ray, and parallel or collinear travel', () => {
  expect(castWallRay({ x: 0, y: 0 }, { x: 8, y: 0 }, wallFrom, wallTo)).toBeNull();
  expect(castWallRay({ x: 0, y: 7 }, { x: 12, y: 7 }, wallFrom, wallTo)).toBeNull();
  expect(castWallRay({ x: 11, y: 0 }, { x: 12, y: 0 }, wallFrom, wallTo)).toBeNull();
  expect(castWallRay({ x: 9, y: 0 }, { x: 9, y: 5 }, wallFrom, wallTo)).toBeNull();
  expect(castWallRay({ x: 10, y: 0 }, { x: 10, y: 5 }, wallFrom, wallTo)).toBeNull();
  const edgeCentre = { x: 9.5, y: 6.5 };
  expect(distance(edgeCentre, wallTo)).toBeLessThan(example.radius);
  expect(castWallRay(edgeCentre, { x: 17.5, y: 6.5 }, wallFrom, wallTo)).toBeNull();
});

it('constructs the normal-offset target and actually uses it to reverse the engine pull', () => {
  const start = initialWallAvoidanceState(headOn);
  const first = calculateWallAvoidanceStep(start, headOn);
  expect(first.rayEnd).toEqual({ x: 8, y: 0 });
  expect(first.hit).toBeNull();
  expect(first.selectedTarget).toEqual({ x: 18, y: 0 });
  expect(first.acceleration.x).toBe(8);
  expect(first.next.velocity.x).toBe(4);
  const earlyHit = calculateWallAvoidanceStep({ ...start, position: { x: 2, y: 0 } }, headOn);
  expect(earlyHit.hit?.point).toEqual({ x: 10, y: 0 });
  expect(earlyHit.avoidanceTarget).toEqual({ x: 4, y: 0 });
  expect(earlyHit.acceleration.x).toBe(8);
  const braking = calculateWallAvoidanceStep({ ...start, position: { x: 4.4, y: 0 } }, headOn);
  expect(braking.avoidanceTarget?.x).toBeCloseTo(4);
  expect(braking.acceleration.x).toBe(-8);
  expect(braking.next.velocity.x).toBeCloseTo(3.2);
  expect(braking.next.position.x).toBeCloseTo(4.72);
  expect(braking.clearance).toBeCloseTo(4.6);
});

it('retains the last travel direction for its ray while momentarily stopped', () => {
  const stopped = {
    position: { x: 5.2, y: 0 },
    velocity: { x: 0, y: 0 },
    heading: { x: 1, y: 0 },
  };
  const calculation = calculateWallAvoidanceStep(stopped, headOn);
  expect(calculation.rayEnd.x).toBeCloseTo(13.2);
  expect(calculation.hit?.point.x).toBeCloseTo(10);
  expect(calculation.acceleration.x).toBe(-8);
  expect(calculation.next.velocity.x).toBeCloseTo(-0.8);
  expect(calculation.next.heading).toEqual({ x: -1, y: 0 });
});

it('turns on a glancing ray hit and clears the finite wall with its whole disc', () => {
  const states = wallAvoidanceFrames(example);
  const calculations = states.map((state) => calculateWallAvoidanceStep(state, example));
  expect(states).toHaveLength(example.steps + 1);
  expect(Math.min(...calculations.map((calculation) => calculation.clearance))).toBeGreaterThan(0);
  expect(
    calculations.some(
      (calculation) =>
        calculation.hit !== null &&
        calculation.acceleration.y > Math.abs(calculation.acceleration.x),
    ),
  ).toBe(true);
  expect(
    states.some(
      ({ position }) => position.x > example.wallX && position.y > example.wallTop + example.radius,
    ),
  ).toBe(true);
  expect(states.at(-1)?.position.x).toBeGreaterThan(example.wallX);
  for (const [index, state] of states.entries()) {
    expect(length(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-10);
    expect(length(calculations[index].acceleration)).toBeLessThanOrEqual(
      example.maxAcceleration + 1e-10,
    );
    // Inspect the swept segment between updates as well as the plotted samples.
    const next = states[index + 1];
    if (next)
      for (let part = 0; part <= 10; part++)
        expect(
          wallClearance(
            {
              x: state.position.x + ((next.position.x - state.position.x) * part) / 10,
              y: state.position.y + ((next.position.y - state.position.y) * part) / 10,
            },
            example,
          ),
        ).toBeGreaterThan(0);
  }
});

it('retains the dead-on failure when only the delivery height changes', () => {
  const straight = wallAvoidanceFrames({
    ...example,
    goalY: example.comparisonGoalY,
  });
  expect(straight.every(({ position }) => position.y === 0)).toBe(true);
  expect(straight.at(-1)?.position.x).toBeLessThan(example.wallX);
  expect(straight.some(({ velocity }) => velocity.x < 0)).toBe(true);
});

it('compares exactly the same destination and motion with a ray too short to hit', () => {
  const run = model(parameters, studyTranslate);
  const short = wallAvoidanceFrames(example, example.comparisonRayLength);
  expect(
    short.every(
      (state) =>
        calculateWallAvoidanceStep(state, example, example.comparisonRayLength).hit === null,
    ),
  ).toBe(true);
  expect(run.comparison?.timeline.series[1].values).toEqual(
    short.map(({ position }) => wallClearance(position, example)),
  );
  if (!run.comparison) throw new Error('The wall run needs its short-ray comparison.');
  expect(Math.min(...run.comparison.timeline.series[0].values)).toBeCloseTo(0.118665, 5);
  expect(Math.min(...run.comparison.timeline.series[1].values)).toBeCloseTo(-0.082825, 5);
  expect(run.comparison?.findings[1]).toContain('2 of 81 frames; the comparison ray hits on 0');
  expect(run.comparison?.findings[1]).toContain('6.47 degrees');
});

it('states the limited default effect and the measured longer-ray overlap', () => {
  const run = model(parameters, studyTranslate);
  expect(run.moments.slice(0, 2)).toEqual([
    { label: 'Ray first hits', step: 5 },
    { label: 'Ray misses again', step: 7 },
  ]);
  expect(run.caption).toContain('seeking the offset delivery causes most of the turn');
  expect(run.motion.frames[0].values['longRayOverlap']).toBe('0.74');
  for (const rayLength of [10, 10.5, 11, 11.5, 12]) {
    const states = wallAvoidanceFrames(example, rayLength);
    const clearance = Math.min(...states.map(({ position }) => wallClearance(position, example)));
    expect(clearance).toBeCloseTo(-0.739372, 5);
  }
});

it('measures the finite wall at either side and round an end', () => {
  expect(wallClearance({ x: 12, y: 0 }, example)).toBe(1);
  expect(wallClearance({ x: 10, y: 8 }, example)).toBe(1);
  expect(wallClearance({ x: 9.5, y: 6.5 }, example)).toBeCloseTo(Math.sqrt(0.5) - 1);
  expect(wallClearance({ x: 10, y: 0 }, example)).toBe(-1);
});

it('changes only ray length to expose body overlap, without a hidden wall clamp', () => {
  const normal = wallAvoidanceFrames(headOn);
  const short = wallAvoidanceFrames(headOn, example.comparisonRayLength);
  expect(short).toEqual(wallAvoidanceFrames({ ...headOn, rayLength: example.comparisonRayLength }));
  expect(short[0]).toEqual(normal[0]);
  const clearance = short.map((state) => example.wallX - state.position.x - example.radius);
  expect(Math.min(...clearance)).toBeLessThan(0);
  const firstOverlap = clearance.findIndex((value) => value < 0);
  expect(firstOverlap).toBeGreaterThan(0);
  expect(short[firstOverlap].position.x).toBeLessThan(example.wallX);
  expect(length(short[firstOverlap].velocity)).toBeGreaterThan(0);
});

it('draws its ray as a link and supplies every selected-frame text-equivalent value', async () => {
  const run = model(parameters, studyTranslate);
  const record = await loadStudy('aifg-a:137');
  const names = [...(record?.visual?.textEquivalent.matchAll(/\{([^}]+)\}/g) ?? [])].map(
    (match) => match[1],
  );
  expect(names).toContain('rayEnd');
  for (const [index, frame] of run.motion.frames.entries()) {
    for (const name of names) expect(frame.values[name]).toBeDefined();
    const rayLink = frame.links?.find((link) => link.tone === 'desired');
    expect(rayLink?.from.x).toBe(frame.bodies[0].x);
    expect(rayLink?.from.y).toBe(frame.bodies[0].y);
    expect(rayLink?.to.x).toBeCloseTo(Number(frame.values['rayEnd'].slice(1).split(',')[0]), 2);
    expect(motionDrawing(run.motion, index).links.length).toBeGreaterThanOrEqual(2);
    for (const point of [
      ...frame.bodies,
      ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ]) {
      expect(point.x).toBeGreaterThan(run.motion.bounds.minX);
      expect(point.x).toBeLessThan(run.motion.bounds.maxX);
      expect(point.y).toBeGreaterThan(run.motion.bounds.minY);
      expect(point.y).toBeLessThan(run.motion.bounds.maxY);
    }
  }
  const selected = run.motion.frames[run.initialStep];
  expect(selected.values['normal']).toBe('(-1.00, 0.00)');
  expect(selected.values['avoidanceTarget']).toMatch(/^\(4\.00, [1-9]/);
  expect(selected.worked?.lines.join(' ')).toContain('Engine seek');
  expect(run.timeline?.reference).toBe(0);
  expect(run.timeline?.series[0].values).toHaveLength(81);
  expect(run.comparison?.timeline.series.map((series) => series.values.length)).toEqual([81, 81]);
  expect(Math.min(...(run.comparison?.timeline.series[1].values ?? []))).toBeLessThan(0);
  expect(run.moments).toHaveLength(4);
});

it('is deterministic and calls out equal ray lengths in its comparison', () => {
  expect(model(parameters, studyTranslate)).toEqual(model(parameters, studyTranslate));
  const same = model({ ...parameters, rayLength: example.comparisonRayLength }, studyTranslate);
  expect(same.comparison?.findings).toContain(
    'Both ray lengths are equal, so these are the same run.',
  );
});

it('offers only hit and turn moments that occur in the selected run', () => {
  const missed = model({ ...parameters, rayLength: 0.5 }, studyTranslate);
  expect(missed.motion.frames.every((frame) => frame.values['rayStatus'] === 'no hit')).toBe(true);
  expect(missed.moments.map((moment) => moment.label)).toEqual([
    'Start · ray misses',
    'Smallest clearance',
    'End of run',
  ]);
  const straight = model({ ...parameters, goalY: 0 }, studyTranslate);
  expect(straight.moments.every((moment) => moment.label !== 'Turning along the wall')).toBe(true);
  const rayMiss = straight.moments.find((moment) => moment.label === 'Ray misses again');
  if (rayMiss) expect(straight.motion.frames[rayMiss.step].values['rayStatus']).toBe('no hit');
});

it('translates presentation at the boundary while preserving computed motion', () => {
  const english = model(parameters, studyTranslate);
  const translated = model(
    parameters,
    (key, values) => `translated: ${studyTranslate(key, values)}`,
  );

  expect(translated.caption).toBe(`translated: ${english.caption}`);
  expect(translated.motion.frames[0].note).toMatch(/^translated: /);
  expect(translated.motion.frames[0].worked?.title).toMatch(/^translated: /);
  expect(translated.timeline?.title).toMatch(/^translated: /);
  expect(translated.comparison?.title).toMatch(/^translated: /);
  expect(translated.motion.bounds).toEqual(english.motion.bounds);
  expect(
    translated.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  ).toEqual(
    english.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  );
});
