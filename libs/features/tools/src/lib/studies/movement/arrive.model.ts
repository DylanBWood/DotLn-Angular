import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './arrive.presentation';
import { arriveSamples, readParameters } from './arrive.simulation';

export {
  arriveFrames,
  calculateArriveStep,
  desiredVelocity,
  stepArrive,
} from './arrive.simulation';

export type { ArriveParameters, ArriveState, ArriveStep } from './arrive.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, arriveSamples(example), t);
};
