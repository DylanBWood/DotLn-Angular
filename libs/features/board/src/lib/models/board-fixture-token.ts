import { InjectionToken } from '@angular/core';

import type { BoardInput } from './board-view-model';

export const BoardFixtureToken = new InjectionToken<BoardInput>(
  'dotln-angular.features.board.fixture',
);
