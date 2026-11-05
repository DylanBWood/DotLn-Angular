import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './blending-versus-arbitration.presentation';
import { readParameters } from './blending-versus-arbitration.simulation';

export {
  type CombinationParameters,
  type CombinationState,
  type CombinedRequests,
  type CombinationStep,
  marshalSignal,
  combineRequests,
  calculateCombinationStep,
  combinationStates,
} from './blending-versus-arbitration.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
