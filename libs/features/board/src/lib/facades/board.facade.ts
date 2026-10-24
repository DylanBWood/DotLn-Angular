import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { filter, map, startWith } from 'rxjs';

import { BoardStore } from '@dotln-angular/board-data-access';
import { BasePaths, EnvironmentConfigToken } from '@dotln-angular/core';
import { boardPageEvents, navigationEvents } from '@dotln-angular/events';
import type { BoardResponse, Link, PanelId } from '@dotln-angular/models';
import { FeatureFlagStore } from '@dotln-angular/state';

import type { BoardViewModel } from '../models/board-view-model';

@Injectable()
export class BoardFacade {
  readonly #store = inject(BoardStore);
  readonly #flags = inject(FeatureFlagStore);
  readonly #environment = inject(EnvironmentConfigToken);
  readonly #dispatcher = inject(Dispatcher);
  readonly #router = inject(Router);

  readonly #fragment = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#router.parseUrl(this.#router.url).fragment),
      startWith(this.#router.parseUrl(this.#router.url).fragment),
    ),
  );

  readonly #dom = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  #focusFrame: number | null = null;
  readonly #destroyRef = inject(DestroyRef);

  readonly vm = computed<BoardViewModel>(() => {
    const document: BoardResponse = this.#store.document() ?? {
      viewModelVersion: '',
      fidelity: 'lossy-read-only',
      panels: [],
      roleAnswers: [],
      sources: [],
      evidence: [],
    };
    const status = {
      loading: this.#store.loading(),
      error: this.#store.failure(),
      apiBaseUrl: this.#environment.apiBaseUrl,
      sourcesFooter: this.#flags.flags().sourcesFooter,
    };
    const targets = new Map<string, PanelId | null>();

    if (document.viewModelVersion !== 'uifa-board-v1') {
      return {
        document,
        compatible: false,
        selectedPanel: this.#store.selectedPanel(),
        ...status,
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

    const fragment = this.#fragment();

    return {
      document,
      compatible: true,
      selectedPanel: this.#store.selectedPanel(),
      ...status,
      sourcesFooter:
        status.sourcesFooter ||
        (fragment != null && targets.has(fragment) && targets.get(fragment) === null),
      tabs: document.panels.map((panel) => ({ id: panel.id, label: panel.title })),
      availableSources: document.sources.filter((source) => source.status === 'available').length,
      unavailableSources: document.sources.filter((source) => source.status === 'unavailable')
        .length,
      targets,
    };
  });

  constructor() {
    effect(() => {
      const fragment = this.#fragment();
      const document = this.#store.document();
      if (fragment && document) untracked(() => this.#focus({ label: '', target: fragment }));
    });

    this.#dispatcher.dispatch(boardPageEvents.opened());

    this.#destroyRef.onDestroy(() => {
      if (this.#focusFrame !== null) this.#dom.defaultView?.cancelAnimationFrame(this.#focusFrame);
    });
  }

  refresh() {
    this.#dispatcher.dispatch(boardPageEvents.refreshRequested());
  }

  selectPanel(id: string | undefined) {
    if (this.#selectPanel(id) && this.#fragment()) {
      this.#dispatcher.dispatch(
        navigationEvents.navigate({
          route: BasePaths.Board,
          queryParamsHandling: 'preserve',
        }),
      );
    }
  }

  #selectPanel(id: string | undefined): boolean {
    const document = this.#store.document();
    if (document?.viewModelVersion !== 'uifa-board-v1') return false;

    const panel = document.panels.find((candidate) => candidate.id === id);
    if (panel && panel.id !== this.#store.selectedPanel()) {
      this.#dispatcher.dispatch(boardPageEvents.panelSelected(panel.id));
      return true;
    }

    return false;
  }

  follow(link: Link) {
    if (!this.vm().targets.has(link.target)) return;

    this.#dispatcher.dispatch(
      navigationEvents.navigate({
        route: BasePaths.Board,
        fragment: link.target,
        queryParamsHandling: 'preserve',
      }),
    );
    this.#focus(link);
  }

  #focus(link: Link) {
    const vm = this.vm();
    if (!vm.compatible || !vm.targets.has(link.target)) return;

    const panel = vm.targets.get(link.target);
    if (panel) this.#selectPanel(panel);

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
