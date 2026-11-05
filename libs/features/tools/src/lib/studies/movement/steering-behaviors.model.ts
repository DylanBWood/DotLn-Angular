import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './steering-behaviors.presentation';
import { readParameters } from './steering-behaviors.simulation';

export {
  type BehaviourParameters,
  type BehaviourState,
  type BehaviourStep,
  calculateBehaviourStep,
  behaviourSteps,
} from './steering-behaviors.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
