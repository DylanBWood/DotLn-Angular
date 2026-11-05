import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './velocity-matching.presentation';
import { readParameters, velocityMatchingSamples } from './velocity-matching.simulation';

export {
  calculateVelocityMatchingStep,
  velocityMatchingFrames,
} from './velocity-matching.simulation';

export type {
  VelocityMatchingParameters,
  VelocityMatchingState,
  VelocityMatchingStep,
} from './velocity-matching.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, velocityMatchingSamples(example), t);
};
