import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { creatureNote as describeCreatureNote, present } from './making-the-creatures.presentation';
import {
  type Creature,
  type CreatureParameters,
  creatureSamples,
  readCreature,
  readCreatureParameters,
} from './making-the-creatures.simulation';

/** Standalone callers have a state; the composed model passes its retained reading directly. */
export const creatureNote = (
  t: StudyTranslate,
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
): string =>
  describeCreatureNote(t, {
    creatures,
    step,
    example: p,
    reading: readCreature(creatures, 0, step * p.timeStep, p),
  });

export {
  creatureFrames,
  initialCreatures,
  playerAt,
  readCreature,
  readCreatureParameters,
  speciesTravel,
  stepCreatures,
} from './making-the-creatures.simulation';

export type {
  Creature,
  CreatureParameters,
  CreatureReading,
} from './making-the-creatures.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const p = readCreatureParameters(parameters);
  return present(p, creatureSamples(p), t);
};
