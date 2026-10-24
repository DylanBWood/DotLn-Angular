import { provideBoardDataAccess } from '@dotln-angular/board-data-access';

import { BoardFacade } from '../facades/board.facade';

export function provideBoardFeature() {
  return [...provideBoardDataAccess(), BoardFacade];
}
