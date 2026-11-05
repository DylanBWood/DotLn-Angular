import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './motor-control.presentation';
import { readParameters } from './motor-control.simulation';

export {
  type MotorControlParameters,
  type MotorControlState,
  type MotorControlStep,
  motorControlStep,
  motorControlFrames,
} from './motor-control.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
