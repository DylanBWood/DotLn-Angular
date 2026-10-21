import { inject, InjectionToken } from '@angular/core';

const token = new InjectionToken<string>('dotln-angular.fixture');
export class Example {
  readonly value = inject(token);
}
