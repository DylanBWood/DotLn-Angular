import type { Routes } from '@angular/router';

import { BoardPage } from './containers/board-page/board-page';
import { provideBoardFeature } from './providers/provide-board-feature';

export const boardRoutes: Routes = [
  { path: '', component: BoardPage, providers: [provideBoardFeature()] },
];
