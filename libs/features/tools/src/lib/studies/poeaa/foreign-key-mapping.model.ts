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
  rowByKey,
} from './foreign-key-mapping.simulation';

export type { ForeignKeyStep, Loader, RowId } from './foreign-key-mapping.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  const catalog = catalogOf(example);
  return present({ example, catalog, steps: foreignKeyRun(example), parameters }, t);
};
