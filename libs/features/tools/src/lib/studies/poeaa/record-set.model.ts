import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './record-set.presentation';
import { readParameters, recordSetRun } from './record-set.simulation';

export {
  addRow,
  deleteRow,
  fill,
  matches,
  readParameters,
  recordSetRun,
  rivalSave,
  setValue,
  writeRow,
} from './record-set.simulation';

export type { CompositionTable, RecordSet, RecordSetStep } from './record-set.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: recordSetRun(example), parameters }, t);
};
