import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './flee.presentation';
import { readParameters } from './flee.simulation';

export {
  type FleeParameters,
  type FleeState,
  type FleeStep,
  calculateFleeStep,
  fleeFrames,
} from './flee.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
