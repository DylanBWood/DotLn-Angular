import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';
import { EnvironmentConfig, provideEnvironmentConfig } from '../environment/environment-config';
import { provideAppBasePath } from '../paths/app-base-path';

export function provideDotlnCore(options: {
  readonly environment: EnvironmentConfig;
  readonly routes?: Routes;
}) {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(options.routes ?? [], withComponentInputBinding()),
    ...provideEnvironmentConfig(options.environment),
    ...provideAppBasePath(),
  ]);
}
