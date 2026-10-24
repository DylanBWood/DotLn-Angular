import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';

import { errorEvents } from '@dotln-angular/events';

@Injectable()
export class DotlnErrorHandler extends ErrorHandler {
  readonly #dispatcher = inject(Dispatcher);

  override handleError(error: unknown) {
    super.handleError(error);

    this.#dispatcher.dispatch(
      errorEvents.unhandled({
        kind: 'unknown',
        message: 'An unexpected application error occurred.',
        correlationId: crypto.randomUUID(),
      }),
    );
  }
}
