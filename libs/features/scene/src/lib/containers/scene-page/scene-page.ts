import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import { DotlnVisuallyHidden } from '@dotln-angular/ui';

import { FieldTools } from '../../composites/field-tools/field-tools';
import { GeometryList } from '../../composites/geometry-list/geometry-list';
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

// The Tile graph's reading in the catalog, which the cell size control names and links.
const tileGraphId = 'aifg-a:247';

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
    .tile-graph {
      color: var(--dotln-ink);
    }
    .tile-graph:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 1px;
    }
    .text-layer {
      display: grid;
      gap: var(--dotln-space-4);
      align-content: start;
      min-inline-size: 0;
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
    FieldTools,
    GeometryList,
    InstrumentStrip,
    NoticeMapper,
    RouterLink,
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
  protected readonly tileGraph = buildRoute(BasePaths.Tools, {
    child: ChildPaths.Reading,
    params: { toolId: tileGraphId },
  }).commands;

  constructor() {
    // The scene outlives this page so a visit to the catalog keeps it; nothing runs unwatched.
    inject(DestroyRef).onDestroy(() => this.facade.pause());
  }
}
