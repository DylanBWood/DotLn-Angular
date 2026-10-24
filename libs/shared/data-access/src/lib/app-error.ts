import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import type { AppError } from '@dotln-angular/models';

export function toAppError(
  error: unknown,
  correlationId: string = crypto.randomUUID(),
  url?: string,
): AppError {
  if (isAppError(error)) return error;

  const context = { correlationId, url };
  if (error instanceof TimeoutError)
    return { ...context, kind: 'timeout', message: 'The request timed out.' };

  if (error instanceof HttpErrorResponse)
    return error.status === 0
      ? { ...context, kind: 'network', message: 'The service could not be reached.' }
      : {
          ...context,
          kind: 'http',
          status: error.status,
          message: `The service returned HTTP ${error.status}.`,
        };

  return { ...context, kind: 'unknown', message: 'An unexpected error occurred.' };
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'correlationId' in error &&
    'message' in error &&
    ['http', 'network', 'timeout', 'unknown'].includes(String(error.kind))
  );
}
