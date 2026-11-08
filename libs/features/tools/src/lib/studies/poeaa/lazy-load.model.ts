import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './lazy-load.presentation';
import { lazyLoadRun, readParameters } from './lazy-load.simulation';

export {
  afterEachReading,
  chunkOf,
  lazyLoadRun,
  request,
  settle,
  summaryRead,
} from './lazy-load.simulation';

export type { LazyLoadStep, StudyLoader } from './lazy-load.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: lazyLoadRun(example), parameters }, t);
};
