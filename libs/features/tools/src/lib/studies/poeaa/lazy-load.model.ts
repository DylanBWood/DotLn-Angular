import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './lazy-load.presentation';
import { lazyLoadRun, readParameters } from './lazy-load.simulation';

export {
  afterEachReading,
  chunkOf,
  lazyLoadRun,
  readParameters,
  request,
  settle,
  summaryRead,
} from './lazy-load.simulation';

export type { LazyLoadStep, StudyLoader } from './lazy-load.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  // The comparison's runs differ from the example only in how the work is split, so the example's
  // own run is whichever of them it chose.
  const perWork = lazyLoadRun({ ...example, chunkPerStudy: false });
  const perStudy = lazyLoadRun({ ...example, chunkPerStudy: true });
  return present(
    {
      example,
      steps: example.chunkPerStudy ? perStudy : perWork,
      perWork,
      perStudy,
      parameters,
    },
    t,
  );
};
