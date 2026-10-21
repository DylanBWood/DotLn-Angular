import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  inject,
  Injectable,
  Injector,
  signal,
} from '@angular/core';

import type { Link, PanelId } from '@dotln-angular/models';

import { BoardFixtureToken } from '../models/board-fixture-token';
import type { BoardViewModel } from '../models/board-view-model';

@Injectable()
export class BoardFacade {
  readonly #document = inject(BoardFixtureToken);
  readonly #dom = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  #focusFrame: number | null = null;
  readonly #destroyRef = inject(DestroyRef);
  readonly #selectedPanel = signal<PanelId>('actors');
  readonly vm = computed<BoardViewModel>(() => {
    const document = this.#document;
    const targets = new Map<string, PanelId | null>();
    if (document.viewModelVersion !== 'uifa-board-v1') {
      return {
        document,
        compatible: false,
        selectedPanel: this.#selectedPanel(),
        tabs: [],
        availableSources: 0,
        unavailableSources: 0,
        targets,
      };
    }
    for (const panel of document.panels) {
      targets.set(panel.id, panel.id);
      for (const section of panel.sections) {
        targets.set(section.id, panel.id);
        for (const row of section.rows) {
          targets.set(row.id, panel.id);
          for (const cell of row.cells) targets.set(`${row.id}:${cell.key}`, panel.id);
        }
      }
    }
    for (const evidence of document.evidence) targets.set(evidence.id, null);
    for (const source of document.sources) targets.set(source.ref, null);
    return {
      document,
      compatible: true,
      selectedPanel: this.#selectedPanel(),
      tabs: document.panels.map((panel) => ({ id: panel.id, label: panel.title })),
      availableSources: document.sources.filter((source) => source.status === 'available').length,
      unavailableSources: document.sources.filter((source) => source.status === 'unavailable')
        .length,
      targets,
    };
  });

  constructor() {
    this.#destroyRef.onDestroy(() => {
      if (this.#focusFrame !== null) this.#dom.defaultView?.cancelAnimationFrame(this.#focusFrame);
    });
  }

  selectPanel(id: string | undefined) {
    if (this.#document.viewModelVersion !== 'uifa-board-v1') return;
    const panel = this.#document.panels.find((candidate) => candidate.id === id);
    if (panel) this.#selectedPanel.set(panel.id);
  }

  follow(link: Link) {
    const vm = this.vm();
    if (!vm.compatible || !vm.targets.has(link.target)) return;
    const panel = vm.targets.get(link.target);
    if (panel) this.selectPanel(panel);
    afterNextRender(
      () => {
        const window = this.#dom.defaultView;
        if (!window) return;
        if (this.#focusFrame !== null) window.cancelAnimationFrame(this.#focusFrame);
        // Aria's lazy panel and visibility effects finish before the next layout frame.
        this.#focusFrame = window.requestAnimationFrame(() => {
          this.#focusFrame = null;
          const target = this.#dom.getElementById(link.target);
          if (!target) return;
          for (let parent = target.parentElement; parent; parent = parent.parentElement) {
            if (parent instanceof HTMLDetailsElement) parent.open = true;
          }
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
      },
      { injector: this.#injector },
    );
  }
}
