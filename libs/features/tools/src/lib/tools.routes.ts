import type { Routes } from '@angular/router';

import { provideCatalog } from '@dotln-angular/catalog';
import { ChildPaths } from '@dotln-angular/core';

import { CatalogPage } from './containers/catalog-page/catalog-page';
import { ToolsHome } from './containers/tools-home/tools-home';

export const toolsRoutes: Routes = [
  { path: ChildPaths.Root, pathMatch: 'full', component: ToolsHome },
  { path: ChildPaths.Catalog, component: CatalogPage, providers: [provideCatalog()] },
];
