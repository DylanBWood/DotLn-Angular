import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './wander.presentation';
import { readParameters, wanderSamples } from './wander.simulation';

export { calculateWanderStep, initialWanderState, wanderFrames } from './wander.simulation';

export type { WanderParameters, WanderState, WanderStep } from './wander.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, wanderSamples(example), t);
};
