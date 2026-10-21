import type { TemplateRef } from '@angular/core';

import type { Cell, Link } from '@dotln-angular/models';
import type { KeyValueContext } from '@dotln-angular/ui';

export interface LinkContext {
  readonly $implicit: Link;
}
export type CellTemplate = TemplateRef<KeyValueContext<Cell>>;
export type LinkTemplate = TemplateRef<LinkContext>;
