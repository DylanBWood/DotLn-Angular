import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './two-and-a-half-dimensions.presentation';
import { readParameters } from './two-and-a-half-dimensions.simulation';

export {
  type HalfDimensionsParameters,
  type CourierState,
  concourseHeight,
  initialCourierState,
  calculateCourierStep,
  courierStates,
} from './two-and-a-half-dimensions.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
