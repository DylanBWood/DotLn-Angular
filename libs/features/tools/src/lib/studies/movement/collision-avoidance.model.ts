import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './collision-avoidance.presentation';
import { readParameters } from './collision-avoidance.simulation';

export {
  type CollisionAvoidanceParameters,
  type CollisionAgent,
  type CollisionState,
  type ClosestApproach,
  type CollisionAvoidanceStep,
  initialCollisionState,
  closestApproach,
  calculateCollisionAvoidanceStep,
  collisionAvoidanceFrames,
  minimumCollisionSeparation,
} from './collision-avoidance.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
