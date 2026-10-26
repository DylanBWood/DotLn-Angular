import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Tool } from '@dotln-angular/models';

@Component({
  selector: 'tools-tool-faces',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tool-faces.html',
  styles: `
    :host { display: block; min-inline-size: 0; overflow-wrap: anywhere; }
    h2 { margin-block: 0 0.5rem; font-size: 1.25rem; }
    dl { margin: 0; }
    dt { font-weight: 650; margin-block-start: 1.25rem; }
    dd { margin: 0.4rem 0 0; }
    ul { padding-inline-start: 1.2rem; }
    .value { margin-inline-end: 0.5rem; }
    .parameter { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  `,
  imports: [TPipe],
})
export class ToolFaces {
  readonly tool = input.required<Tool>();
}
