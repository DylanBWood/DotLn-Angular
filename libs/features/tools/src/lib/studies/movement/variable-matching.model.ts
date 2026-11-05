import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './variable-matching.presentation';
import { readParameters } from './variable-matching.simulation';

export {
  type VariableMatchingParameters,
  type VariableMatchingState,
  type VariableMatchingStep,
  calculateVariableMatchingStep,
  variableMatchingFrames,
} from './variable-matching.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
