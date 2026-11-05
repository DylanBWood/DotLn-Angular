import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './flocking.presentation';
import { flockingSamples, readFlockingParameters } from './flocking.simulation';

export { flockNote } from './flocking.presentation';

export {
  flockingFrames,
  initialWalkers,
  nearestPair,
  readFlock,
  readFlockingParameters,
  stepFlock,
  velocitySpread,
} from './flocking.simulation';

export type { FlockingParameters, FlockingReading, Walker } from './flocking.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const p = readFlockingParameters(parameters);
  return present(p, flockingSamples(p), t);
};
