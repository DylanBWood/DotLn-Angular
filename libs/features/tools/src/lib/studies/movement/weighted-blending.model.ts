import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './weighted-blending.presentation';
import { blendingSamples, readParameters } from './weighted-blending.simulation';

export { blendingFrames, calculateBlendingStep, createNia } from './weighted-blending.simulation';

export type { BlendingStep, WeightedBlendingParameters } from './weighted-blending.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, blendingSamples(example), t);
};
