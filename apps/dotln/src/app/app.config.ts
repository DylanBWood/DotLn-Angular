import { ApplicationConfig } from '@angular/core';

import { provideDotlnCore, provideDotlnI18n } from '@dotln-angular/core';
import { provideDotlnHttp, provideDotlnStorage } from '@dotln-angular/data-access';
import { provideDotlnState } from '@dotln-angular/state';
import { provideDotlnUi } from '@dotln-angular/ui';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDotlnCore({ environment, routes: appRoutes }),
    provideDotlnHttp(),
    provideDotlnStorage(),
    provideDotlnState(),
    provideDotlnI18n(),
    provideDotlnUi(),
  ],
};
