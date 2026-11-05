import { createCatalogLoader } from '@dotln-angular/catalog';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { model as alignModel } from './align.model';
import { model as arriveModel } from './arrive.model';
import { model as equilibriumFallbackModel } from './equilibrium-fallback.model';
import { model as faceModel } from './face.model';
import { model as fixedFormationsModel } from './fixed-formations.model';
import { model as flockingModel } from './flocking.model';
import { model as formationPatternInterfaceModel } from './formation-pattern-interface.model';
import { model as groupMovementModel } from './group-movement.model';
import { model as makingTheCreaturesModel } from './making-the-creatures.model';
import {
  boundsOfPoints,
  decimal,
  fixed,
  motionPoints,
  pair,
  rounded,
  vectorText,
} from './presentation';
import { model as prioritySteeringModel } from './priority-steering.model';
import { model as pursueModel } from './pursue.model';
import { model as scalableFormationsModel } from './scalable-formations.model';
import { model as seekModel } from './seek.model';
import { model as separationModel } from './separation.model';
import { model as slotAssignmentModel } from './slot-assignment.model';
import { model as steeringPipelineModel } from './steering-pipeline.model';
import { model as twoLevelFormationSteeringModel } from './two-level-formation-steering.model';
import { model as velocityMatchingModel } from './velocity-matching.model';
import { model as wanderModel } from './wander.model';
import { model as weightedBlendingModel } from './weighted-blending.model';

const examples = [
  { slug: 'align', id: 'aifg-a:116', model: alignModel },
  { slug: 'arrive', id: 'aifg-a:112', model: arriveModel },
  { slug: 'equilibrium-fallback', id: 'aifg-a:151', model: equilibriumFallbackModel },
  { slug: 'face', id: 'aifg-a:123', model: faceModel },
  { slug: 'fixed-formations', id: 'aifg-a:174', model: fixedFormationsModel },
  { slug: 'flocking', id: 'aifg-a:145', model: flockingModel },
  { slug: 'formation-pattern-interface', id: 'aifg-a:181', model: formationPatternInterfaceModel },
  { slug: 'group-movement', id: 'aifg-b:354', model: groupMovementModel },
  { slug: 'making-the-creatures', id: 'aifg-b:373', model: makingTheCreaturesModel },
  { slug: 'priority-steering', id: 'aifg-a:149', model: prioritySteeringModel },
  { slug: 'pursue', id: 'aifg-a:120', model: pursueModel },
  { slug: 'scalable-formations', id: 'aifg-a:175', model: scalableFormationsModel },
  { slug: 'seek', id: 'aifg-a:110', model: seekModel },
  { slug: 'separation', id: 'aifg-a:131', model: separationModel },
  { slug: 'slot-assignment', id: 'aifg-a:186', model: slotAssignmentModel },
  { slug: 'steering-pipeline', id: 'aifg-a:153', model: steeringPipelineModel },
  { slug: 'two-level-formation-steering', id: 'aifg-a:177', model: twoLevelFormationSteeringModel },
  { slug: 'velocity-matching', id: 'aifg-a:118', model: velocityMatchingModel },
  { slug: 'wander', id: 'aifg-a:125', model: wanderModel },
  { slug: 'weighted-blending', id: 'aifg-a:144', model: weightedBlendingModel },
] as const;

const positionsOf = (run: MotionStudyModel) =>
  run.motion.frames.map(({ seconds, bodies, vectors }) => ({
    seconds,
    bodies: bodies.map(({ id, x, y, heading }) => ({ id, x, y, heading })),
    vectors,
  }));

it.each(examples)(
  'translates $slug presentation while keeping its movement and charts',
  async ({ slug, id, model }) => {
    const record = await createCatalogLoader().study(id);
    if (!record) throw new Error('The movement translation regression needs its catalog record.');
    const english = model(record.example.parameters, studyTranslate);
    const translated: StudyTranslate = (key, values) => {
      expect(key.startsWith(`studyAifg.${slug}.`)).toBe(true);
      return `localized:${studyTranslate(key, values)}`;
    };
    const localized = model(record.example.parameters, translated);

    expect(localized.caption).toBe(`localized:${english.caption}`);
    expect(english.caption).not.toContain('studyAifg.');
    for (const moment of localized.moments) expect(moment.label).toMatch(/^localized:/);
    for (const item of localized.legend) expect(item.label).toMatch(/^localized:/);
    for (const input of localized.inputs ?? []) {
      expect(input.label).toMatch(/^localized:/);
      expect(input.unit).toMatch(/^localized:/);
    }
    for (const frame of localized.motion.frames) {
      if (frame.note) expect(frame.note).toMatch(/^localized:/);
      if (frame.worked) {
        expect(frame.worked.title).toMatch(/^localized:/);
        if (frame.worked.note) expect(frame.worked.note).toMatch(/^localized:/);
      }
      if (frame.values['activeGroup']) expect(frame.values['activeGroup']).toMatch(/^localized:/);
    }

    expect(positionsOf(localized)).toEqual(positionsOf(english));
    expect(localized.timeline?.series.map(({ values }) => values)).toEqual(
      english.timeline?.series.map(({ values }) => values),
    );
    expect(localized.comparison?.timeline.series.map(({ values }) => values)).toEqual(
      english.comparison?.timeline.series.map(({ values }) => values),
    );
  },
);

it('keeps each authored rounding mode, including near-zero cutoffs and trailing digits', () => {
  expect(fixed(-0.001)).toBe('0.00');
  expect(decimal(-0.001)).toBe('-0.00');
  expect(decimal(-0.001, 2, 0.005)).toBe('0.00');
  expect(decimal(-0.001, 2, 0.000005)).toBe('-0.00');
  expect(decimal(1.23456, 4)).toBe('1.2346');
  expect(pair({ x: -0.001, y: 1 })).toBe('(0.00, 1.00)');
  expect(vectorText({ x: -0.001, y: 1 })).toBe('(-0.00, 1.00)');
  expect(rounded(1.2)).toBe('1.2');
});

it('fits the same motion samples and arrow tips with the caller’s padding', () => {
  const points = motionPoints([
    {
      seconds: 0,
      values: {},
      bodies: [{ id: 'body', x: 2, y: 3 }],
      marks: [{ x: 7, y: -2, shape: 'cross' }],
      vectors: [{ x: 2, y: 3, dx: -4, dy: 1, tone: 'actual' }],
    },
  ]);
  expect(points).toEqual([
    { id: 'body', x: 2, y: 3 },
    { x: 7, y: -2, shape: 'cross' },
    { x: -2, y: 4 },
  ]);
  expect(boundsOfPoints(points, 2)).toEqual({ minX: -4, maxX: 9, minY: -4, maxY: 6 });
});
