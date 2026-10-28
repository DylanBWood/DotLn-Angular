import type { Routes } from '@angular/router';

import { provideCatalog } from '@dotln-angular/catalog';
import { ChildPaths } from '@dotln-angular/core';

import { CatalogPage } from './containers/catalog-page/catalog-page';
import { ToolsHome } from './containers/tools-home/tools-home';

// One catalog store serves the Tools home and the catalog page, so both read and persist
// the same state; each page's opening load is answered from the loader's cache after the
// first fetch.
export const toolsRoutes: Routes = [
  {
    path: '',
    providers: [provideCatalog()],
    children: [
      { path: ChildPaths.Root, pathMatch: 'full', component: ToolsHome },
      { path: ChildPaths.Catalog, component: CatalogPage },
    ],
  },
];
