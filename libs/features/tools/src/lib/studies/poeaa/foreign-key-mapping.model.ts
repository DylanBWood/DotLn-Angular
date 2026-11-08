import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './foreign-key-mapping.presentation';
import { catalogOf, foreignKeyRun, readParameters } from './foreign-key-mapping.simulation';

export {
  catalogOf,
  catalogRows,
  emptyLoader,
  follow,
  foreignKeyRun,
  load,
  placeOf,
  readParameters,
  rowByKey,
} from './foreign-key-mapping.simulation';

export type { ForeignKeyStep, Loader, RowId } from './foreign-key-mapping.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  // The comparison's runs differ from the example only in the identity map, so the example's own
  // run is whichever of them it chose.
  const through = foreignKeyRun({ ...example, identityMap: true });
  const without = foreignKeyRun({ ...example, identityMap: false });
  return present(
    {
      example,
      catalog: catalogOf(example),
      steps: example.identityMap ? through : without,
      through,
      without,
      parameters,
    },
    t,
  );
};
