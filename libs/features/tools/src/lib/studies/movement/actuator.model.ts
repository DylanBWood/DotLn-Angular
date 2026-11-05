import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './actuator.presentation';
import { readParameters } from './actuator.simulation';

export {
  type ActuatorParameters,
  type ActuatorState,
  type ActuatorStep,
  actuatorStep,
  actuatorFrames,
} from './actuator.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
