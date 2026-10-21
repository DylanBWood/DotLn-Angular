import type { Routes } from '@angular/router';

import { BasePaths } from '@dotln-angular/core';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: BasePaths.Board },
  {
    path: BasePaths.Board,
    loadChildren: () => import('@dotln-angular/board').then(({ boardRoutes }) => boardRoutes),
  },
];
