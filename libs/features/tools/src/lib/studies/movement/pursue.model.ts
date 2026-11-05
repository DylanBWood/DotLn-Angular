import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './pursue.presentation';
import { pursueFrames, readParameters } from './pursue.simulation';

export { calculatePursueStep, predictionTime, pursueFrames, runnerAt } from './pursue.simulation';

export type { PursueFrame, PursueParameters, PursueStep, RunnerState } from './pursue.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, pursueFrames(example), t);
};
