import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import { DotlnVisuallyHidden } from '@dotln-angular/ui';

import { InstrumentStrip } from '../../composites/instrument-strip/instrument-strip';
import { ToolLog } from '../../composites/tool-log/tool-log';
import { ToolboxRail } from '../../composites/toolbox-rail/toolbox-rail';
import { TrialCompare } from '../../composites/trial-compare/trial-compare';
import { UnitInspector } from '../../composites/unit-inspector/unit-inspector';
import { UnitList } from '../../composites/unit-list/unit-list';
import { SceneFacade } from '../../facades/scene.facade';
import { SceneLayout } from '../../layouts/scene-layout/scene-layout';
import { CoachMapper } from '../../mappers/coach-mapper/coach-mapper';
import { NoticeMapper } from '../../mappers/notice-mapper/notice-mapper';
import { SceneCanvas } from '../../wrappers/scene-canvas/scene-canvas';

@Component({
  selector: 'scene-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scene-page.html',
  styles: `
    :host {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-block-size: 0;
    }
  `,
  host: {
    'data-skin': 'field',
    'data-full-bleed': '',
    '(keydown.tab)': 'facade.noteKeyboard()',
    '(keydown.escape)': 'facade.clearSelection()',
  },
  imports: [
    CoachMapper,
    DotlnVisuallyHidden,
    InstrumentStrip,
    NoticeMapper,
    SceneCanvas,
    SceneLayout,
    TPipe,
    ToolLog,
    ToolboxRail,
    TrialCompare,
    UnitInspector,
    UnitList,
  ],
})
export class ScenePage {
  protected readonly facade = inject(SceneFacade);
  protected readonly vm = this.facade.vm;

  constructor() {
    // The scene outlives this page so a visit to the catalog keeps it; nothing runs unwatched.
    inject(DestroyRef).onDestroy(() => this.facade.pause());
  }
}
