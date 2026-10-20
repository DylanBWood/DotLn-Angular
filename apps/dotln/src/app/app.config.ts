import { ApplicationConfig } from '@angular/core';
import { provideDotlnCore, provideDotlnI18n } from '@dotln-angular/core';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideDotlnCore({ environment, routes: appRoutes }), provideDotlnI18n()],
};
