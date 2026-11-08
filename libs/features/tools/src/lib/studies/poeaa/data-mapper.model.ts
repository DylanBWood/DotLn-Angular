import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './data-mapper.presentation';
import { dataMapperRun, readParameters } from './data-mapper.simulation';

export {
  dataMapperRun,
  emptyMapper,
  find,
  placeOf,
  readParameters,
  rename,
  saveAll,
  storedLibrary,
  update,
} from './data-mapper.simulation';

export type { DataMapperStep, LibraryStorage, Mapper } from './data-mapper.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: dataMapperRun(example), parameters }, t);
};
