import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './the-firing-solution.presentation';
import { readParameters } from './the-firing-solution.simulation';

export {
  type FiringParameters,
  type FiringArc,
  type FiringSolution,
  type FiringPosition,
  solveFiringSolution,
  firingPositionAt,
  firingTimes,
} from './the-firing-solution.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
