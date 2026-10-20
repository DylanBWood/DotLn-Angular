import { Route } from '@angular/router';
import { BasePaths } from '@dotln-angular/core';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: BasePaths.Home },
  { path: BasePaths.Home, loadComponent: () => import('./home').then(({ Home }) => Home) },
];
