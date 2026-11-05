import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './kinematic-wander.presentation';
import { readParameters } from './kinematic-wander.simulation';

export {
  type KinematicWanderParameters,
  type KinematicWanderState,
  applyKinematicWander,
  kinematicWanderStep,
  kinematicWanderFrames,
  kinematicReversals,
} from './kinematic-wander.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
