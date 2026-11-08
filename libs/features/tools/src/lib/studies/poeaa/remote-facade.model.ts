import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './remote-facade.presentation';
import { boardSources, readParameters, remoteFacadeRun } from './remote-facade.simulation';

export {
  boardPanels,
  boardSources,
  oneByOneCalls,
  readPanel,
  readParameters,
  remoteFacadeRun,
  walkRounds,
} from './remote-facade.simulation';

export type { RemoteFacadeParameters, RemoteFacadeStep } from './remote-facade.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present(
    { example, sources: boardSources(example), steps: remoteFacadeRun(example), parameters },
    t,
  );
};
