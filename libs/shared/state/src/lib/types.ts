import type { AppError } from '@dotln-angular/models';

export type ErrorNotice = AppError & {
  readonly source: 'http' | 'application';
};
