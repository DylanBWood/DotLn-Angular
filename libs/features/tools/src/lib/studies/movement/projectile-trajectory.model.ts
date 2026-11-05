import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './projectile-trajectory.presentation';
import { readParameters } from './projectile-trajectory.simulation';

export {
  type ProjectileParameters,
  type ProjectileLanding,
  type ProjectileState,
  predictProjectileLanding,
  projectileAt,
  projectileFrames,
} from './projectile-trajectory.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
