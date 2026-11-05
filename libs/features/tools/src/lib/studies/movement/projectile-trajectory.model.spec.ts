import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import {
  model,
  predictProjectileLanding,
  projectileAt,
  projectileFrames,
  type ProjectileParameters,
} from './projectile-trajectory.model';

const example: ProjectileParameters = {
  startX: 0,
  launchHeight: 10,
  horizontalSpeed: 12,
  verticalSpeed: 10,
  gravity: 10,
  landingHeight: 0,
  unreachableHeight: 18,
  timeStep: 0.1,
  steps: 36,
};
const parameters: StudyParameters = { ...example };

it('uses the dock-flare record parameters and links forward to choosing a launch', async () => {
  const record = await createCatalogLoader().study('aifg-a:162');
  expect(record?.slug).toBe('projectile-trajectory');
  expect(record?.example.parameters).toEqual(parameters);
  expect(record?.nearby.map(({ id }) => id)).toContain('aifg-a:163');
});

it('uses the same time for the two independent axes', () => {
  expect(projectileAt(example, 0)).toEqual({
    seconds: 0,
    x: 0,
    height: 10,
    verticalVelocity: 10,
    landed: false,
  });
  expect(projectileAt(example, 0.1).x).toBeCloseTo(1.2);
  expect(projectileAt(example, 0.1).height).toBeCloseTo(10.95);
  expect(projectileAt(example, 0.1).verticalVelocity).toBe(9);
  expect(projectileAt(example, 1)).toMatchObject({
    x: 12,
    height: 15,
    verticalVelocity: 0,
    landed: false,
  });
  expect(projectileAt(example, 2)).toMatchObject({
    x: 24,
    height: 10,
    verticalVelocity: -10,
    landed: false,
  });
});

it('solves the actual landing and inserts it between the fixed preview samples', () => {
  const landing = predictProjectileLanding(example);
  expect(landing.discriminant).toBe(300);
  expect(landing.apexHeight).toBe(15);
  expect(landing.time).toBeCloseTo(1 + Math.sqrt(3), 12);
  expect(landing.x).toBeCloseTo(12 * (1 + Math.sqrt(3)), 12);
  expect(landing.impactVerticalVelocity).toBeCloseTo(-10 * Math.sqrt(3), 12);
  const frames = projectileFrames(example);
  expect(frames).toHaveLength(29);
  expect(frames.at(-2)?.seconds).toBeCloseTo(2.7);
  expect(frames.at(-2)?.height).toBeCloseTo(0.55);
  expect(frames.at(-1)?.seconds).toBe(landing.time);
  expect(frames.at(-1)?.x).toBe(landing.x);
  expect(frames.at(-1)).toMatchObject({
    height: 0,
    verticalVelocity: 0,
    landed: true,
  });
  expect(projectileAt(example, 100)).toEqual(frames.at(-1));
  expect(frames.some(({ height }) => height < 0)).toBe(false);
});

it('rejects unreachable heights and past roots instead of inventing a landing', () => {
  expect(predictProjectileLanding(example, 18)).toEqual({
    discriminant: -60,
    time: null,
    x: null,
    impactVerticalVelocity: null,
    apexHeight: 15,
  });
  const raised = { ...example, landingHeight: 18 };
  expect(projectileFrames(raised)).toHaveLength(37);
  expect(projectileFrames(raised).every(({ landed }) => !landed)).toBe(true);
  expect(projectileAt(raised, 3.6).height).toBeCloseTo(-18.8);
  expect(predictProjectileLanding({ ...example, verticalSpeed: -10 }, 12).time).toBeNull();
});

it('distinguishes an apex touch, an upward launch on a surface, and immediate downward contact', () => {
  expect(predictProjectileLanding(example, 15)).toMatchObject({
    discriminant: 0,
    time: 1,
    x: 12,
  });
  expect(predictProjectileLanding({ ...example, launchHeight: 0 }).time).toBe(2);
  expect(projectileAt({ ...example, launchHeight: 0, verticalSpeed: -10 }, 0)).toMatchObject({
    height: 0,
    verticalVelocity: 0,
    landed: true,
  });
});

it('does not relabel a time-limited preview as contact', () => {
  const short = { ...example, steps: 10 };
  expect(predictProjectileLanding(short).time).toBeGreaterThan(1);
  expect(projectileFrames(short).at(-1)).toMatchObject({
    seconds: 1,
    height: 15,
    landed: false,
  });
  expect(model({ ...short }, studyTranslate).moments.at(-1)?.label).toBe('Preview ends');
});

it('explains the apex, exact contact and the raised-plane failure from its computed states', () => {
  const run = model(parameters, studyTranslate);
  expect(run).toEqual(model(parameters, studyTranslate));
  expect(run.initialStep).toBe(10);
  expect(run.motion.frames[10].values).toMatchObject({
    time: '1.00',
    x: '12.00',
    height: '15.00',
    verticalVelocity: '0.00',
  });
  expect(run.motion.frames[10].vectors?.[0].dx).toBeCloseTo(1.2);
  expect(run.motion.frames[10].vectors?.[0].dy).toBeCloseTo(0);
  expect(run.motion.frames[10].worked?.note).toContain('horizontal velocity continues');
  expect(run.motion.frames.at(-1)?.worked?.title).toBe('The exact landing event');
  expect(run.motion.frames.at(-1)?.values['landingResult']).toContain('32.78');
  expect(run.timeline?.seconds).toHaveLength(run.motion.frames.length);
  expect(run.comparison?.findings.join(' ')).toContain('3.00 m above the 15.00 m apex');
  expect(run.comparison?.timeline.series[1].values.every((value) => value < 0)).toBe(true);
  expect(Math.max(...(run.comparison?.timeline.series[1].values ?? []))).toBeCloseTo(-3);
});

it('keeps changed-height drawings bounded and removes the cross when no encounter exists', () => {
  for (const landingHeight of [0, 10, 15, 18]) {
    const run = model({ ...parameters, landingHeight }, studyTranslate);
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    expect(run.motion.frames.length).toBeLessThanOrEqual(240);
    for (const frame of run.motion.frames) {
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({
          x: x + dx,
          y: y + dy,
        })),
      ];
      for (const point of points) {
        expect(point.x).toBeGreaterThanOrEqual(minX);
        expect(point.x).toBeLessThanOrEqual(maxX);
        expect(point.y).toBeGreaterThanOrEqual(minY);
        expect(point.y).toBeLessThanOrEqual(maxY);
      }
    }
    if (landingHeight === 18) {
      expect(
        run.motion.frames.every(({ marks }) => marks?.every(({ shape }) => shape !== 'cross')),
      ).toBe(true);
      expect(run.motion.frames[0].note).toContain('No landing cross');
      expect(run.timeline?.yRange?.[1]).toBeGreaterThanOrEqual(18);
      expect(run.comparison?.timeline.yRange?.[1]).toBeGreaterThanOrEqual(0);
      expect(run.comparison?.findings).toEqual([
        'Both selections now name the same height, so the two runs coincide.',
      ]);
    }
  }
});

it('supplies every prose placeholder at every selectable frame', async () => {
  const record = await createCatalogLoader().study('aifg-a:162');
  if (!record) throw new Error('The projectile trajectory study must be registered.');
  const prose = JSON.stringify([
    record.intuition,
    record.example.description,
    record.mechanism,
    record.visual,
  ]);
  const names = [...prose.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]);
  for (const frame of model(parameters, studyTranslate).motion.frames)
    for (const name of names) expect(frame.values[name]).toBeDefined();
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
