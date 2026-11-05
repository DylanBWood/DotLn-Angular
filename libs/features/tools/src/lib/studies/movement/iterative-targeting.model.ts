import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './iterative-targeting.presentation';
import { readParameters } from './iterative-targeting.simulation';

export {
  type IterativeTargetingParameters,
  type TargetFlightPoint,
  type TargetFlight,
  type TargetingAttempt,
  type TargetingResult,
  targetFlightStep,
  simulateTargetFlight,
  searchTarget,
} from './iterative-targeting.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
