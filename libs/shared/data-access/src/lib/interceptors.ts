import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError, throwError, timeout } from 'rxjs';

import { EnvironmentConfigToken } from '@dotln-angular/core';
import { errorEvents } from '@dotln-angular/events';

import { toAppError } from './app-error';
import { RequestCorrelationToken, RequestTimeoutToken } from './http-context';

export const baseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(request.url) || request.url.startsWith('//'))
    return next(request);

  const config = inject(EnvironmentConfigToken);
  const document = inject(DOCUMENT);
  const base = new URL(config.apiBaseUrl.replace(/\/?$/, '/'), document.baseURI);

  return next(request.clone({ url: new URL(request.url.replace(/^\//, ''), base).href }));
};

export const timeoutInterceptor: HttpInterceptorFn = (request, next) => {
  const duration =
    request.context.get(RequestTimeoutToken) || inject(EnvironmentConfigToken).requestTimeoutMs;

  return next(request).pipe(timeout({ each: duration }));
};

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const dispatcher = inject(Dispatcher);
  const correlationId = request.context.get(RequestCorrelationToken);

  return next(request).pipe(
    catchError((error) => {
      const mapped = toAppError(error, correlationId, request.url);
      dispatcher.dispatch(errorEvents.httpFailed(mapped));
      return throwError(() => mapped);
    }),
  );
};
