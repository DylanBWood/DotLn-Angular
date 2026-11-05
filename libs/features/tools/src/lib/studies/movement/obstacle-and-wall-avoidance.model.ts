import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './obstacle-and-wall-avoidance.presentation';
import { readParameters } from './obstacle-and-wall-avoidance.simulation';

export {
  type WallAvoidanceParameters,
  type WallAvoidanceState,
  type WallRayHit,
  type WallAvoidanceStep,
  wallClearance,
  castWallRay,
  initialWallAvoidanceState,
  calculateWallAvoidanceStep,
  wallAvoidanceFrames,
} from './obstacle-and-wall-avoidance.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
