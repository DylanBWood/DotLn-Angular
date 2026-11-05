import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './separation.presentation';
import { readParameters, separationSamples } from './separation.simulation';

export {
  calculateSeparationStep,
  createShelfPair,
  separationFrames,
} from './separation.simulation';

export type { SeparationParameters, SeparationStep, ShelfPair } from './separation.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, separationSamples(example, 2), t);
};
