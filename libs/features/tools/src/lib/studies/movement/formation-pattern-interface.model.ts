import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './formation-pattern-interface.presentation';
import { readRosterParameters, rosterSamples } from './formation-pattern-interface.simulation';

export {
  advanceRosterMembers,
  createRosterPattern,
  readRosterParameters,
  rosterCentreGap,
  rosterMemberMean,
  rosterStates,
  rosterTargetGap,
  rosterTargetMean,
} from './formation-pattern-interface.simulation';

export type {
  RosterParameters,
  RosterPattern,
  RosterState,
} from './formation-pattern-interface.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readRosterParameters(parameters);
  return present(example, rosterSamples(example), t);
};
