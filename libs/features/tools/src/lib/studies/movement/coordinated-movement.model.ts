import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './coordinated-movement.presentation';
import { readParameters } from './coordinated-movement.simulation';

export {
  type CoordinatedMovementParameters,
  type CoordinatedMovementState,
  initialCoordinatedMovement,
  coordinatedMovementStep,
  coordinatedMovementFrames,
  coordinationErrors,
} from './coordinated-movement.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
