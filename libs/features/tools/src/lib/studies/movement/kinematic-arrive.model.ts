import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './kinematic-arrive.presentation';
import { readParameters } from './kinematic-arrive.simulation';

export {
  type KinematicArriveParameters,
  type KinematicArriveStep,
  type KinematicArriveSample,
  calculateKinematicArriveStep,
  kinematicArriveSamples,
} from './kinematic-arrive.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
