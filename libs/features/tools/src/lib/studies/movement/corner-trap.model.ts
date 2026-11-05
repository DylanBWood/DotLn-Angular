import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './corner-trap.presentation';
import { readParameters } from './corner-trap.simulation';

export {
  type CornerParameters,
  type CornerState,
  type CornerRay,
  type CornerStep,
  rayWallHit,
  calculateCornerStep,
  cornerStates,
} from './corner-trap.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
