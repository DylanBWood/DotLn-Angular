import type { Routes } from '@angular/router';

import { BasePaths } from '@dotln-angular/core';
import { NotFoundPage } from '@dotln-angular/dotln/shell';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: BasePaths.Board },
  {
    path: BasePaths.Board,
    loadChildren: () => import('@dotln-angular/board').then(({ boardRoutes }) => boardRoutes),
  },
  {
    path: BasePaths.Scene,
    loadChildren: () => import('@dotln-angular/scene').then(({ sceneRoutes }) => sceneRoutes),
  },
  {
    path: BasePaths.Machinery,
    loadChildren: () =>
      import('@dotln-angular/machinery').then(({ machineryRoutes }) => machineryRoutes),
  },
  {
    path: BasePaths.Tools,
    loadChildren: () => import('@dotln-angular/tools').then(({ toolsRoutes }) => toolsRoutes),
  },
  {
    path: '**',
    component: NotFoundPage,
  },
];
