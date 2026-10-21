import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import {
  TRANSLOCO_LANG,
  TRANSLOCO_SCOPE,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';

@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe extends TranslocoPipe implements PipeTransform {
  constructor() {
    // An explicit factory also works when the catalog compiles this subclass with JIT.
    super(
      inject(TranslocoService),
      inject(TRANSLOCO_SCOPE, { optional: true }) ?? undefined,
      inject(TRANSLOCO_LANG, { optional: true }) ?? undefined,
      inject(ChangeDetectorRef),
    );
  }
}
