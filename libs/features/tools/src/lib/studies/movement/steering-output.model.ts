import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './steering-output.presentation';
import { readParameters } from './steering-output.simulation';

export {
  type OutputParameters,
  type SteeringOutput,
  type OutputState,
  type OutputStep,
  outputAt,
  applySteeringOutput,
  outputSteps,
} from './steering-output.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
