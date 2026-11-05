import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './equilibrium-fallback.presentation';
import { equilibriumSteps, readParameters } from './equilibrium-fallback.simulation';

export { calculateEquilibriumStep, equilibriumSteps } from './equilibrium-fallback.simulation';

export type {
  EquilibriumParameters,
  EquilibriumState,
  EquilibriumStep,
} from './equilibrium-fallback.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, equilibriumSteps(example), t);
};
