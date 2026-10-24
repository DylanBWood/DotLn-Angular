import { bootstrapApplication } from '@angular/platform-browser';

import { startMocks } from '@dotln-angular/data-access';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

declare const DOTLN_MOCKS_ENABLED: boolean;

async function bootstrap() {
  if (DOTLN_MOCKS_ENABLED && environment.mocks) await startMocks(() => import('./mocks/browser'));
  await bootstrapApplication(App, appConfig);
}

void bootstrap().catch((error) => console.error(error));
