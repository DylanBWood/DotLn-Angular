import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { animationFrames, pairwise, type Subscription } from 'rxjs';

import {
  availableCatalogOptions,
  catalogShelf,
  CatalogStore,
  CatalogToken,
  contentsFor,
  emptyCatalogFilters,
  filterCatalog,
  isCatalogFilters,
  searchReadings,
  studiedIds,
  workTitle,
} from '@dotln-angular/catalog';
import { catalogPageEvents } from '@dotln-angular/events';
import { translateSignal } from '@dotln-angular/i18n';
import type { CatalogFilters, ConceptStudy, ToolId, WorkSlug } from '@dotln-angular/models';

import { clampStep, mapStudy } from '../mappers/study-mapper';
import type { StudyModel, StudyModelFunction } from '../studies/study-model';
import { studyModels } from '../studies/study-models';
import type { StudyDisclosure, StudyIntent, StudyView, StudyVisualView } from '../types';

/** Search results shown on one page. */
const resultsPerPage = 30;

/** Where the open reading's study has got to. */
type StudyLoad =
  | { readonly status: 'none' | 'loading' | 'failed' }
  | {
      readonly status: 'ready';
      readonly record: ConceptStudy;
      readonly run: StudyModelFunction | null;
    };

/** The longest gap a running example counts, so a hidden tab does not jump when it returns. */
const longestFrameMs = 100;

@Injectable()
export class ToolsFacade {
  readonly #store = inject(CatalogStore);
  readonly #dispatcher = inject(Dispatcher);
  readonly #catalog = inject(CatalogToken);
  readonly #studyStep = signal<number | null>(null);
  readonly #studyView = signal<StudyVisualView>('motion');
  readonly #expandedStudy = signal<readonly StudyDisclosure[]>([]);
  readonly #playing = signal(false);
  readonly #inputs = signal<Readonly<Record<string, number>>>({});
  #playback: Subscription | null = null;
  readonly #motionPreference =
    inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
  readonly #reducedMotion = signal(this.#motionPreference?.matches ?? false);
  // The record and its drawing's model load together when a reading opens.
  readonly #studyLoad = signal<StudyLoad>({ status: 'none' });
  readonly #studyAttempt = signal(0);
  /** The example run from the record's parameters, with any a reader has changed. */
  readonly #studyRun = computed(
    (): { readonly model: StudyModel | null; readonly failed: boolean } => {
      const load = this.#studyLoad();
      if (load.status !== 'ready' || !load.run) return { model: null, failed: false };
      try {
        return {
          model: load.run({ ...load.record.example.parameters, ...this.#inputs() }),
          failed: false,
        };
      } catch {
        // A model that throws costs its own study, never the page around it.
        return { model: null, failed: true };
      }
    },
  );
  readonly #studyModel = computed(() => this.#studyRun().model);
  readonly #studyStatus = computed(() =>
    this.#studyRun().failed ? 'failed' : this.#studyLoad().status,
  );
  readonly #studyViewModel = computed((): StudyView | null => {
    const load = this.#studyLoad();
    if (load.status !== 'ready' || this.#studyRun().failed) return null;
    return mapStudy(
      { record: load.record, model: this.#studyModel() },
      {
        step: this.#studyStep(),
        view: this.#studyView(),
        expanded: this.#expandedStudy(),
        playing: this.#reducedMotion() ? null : this.#playing(),
        inputs: this.#inputs(),
      },
      this.#store.tools(),
      this.#studiedTools(),
    );
  });
  readonly #all = translateSignal('tools.filters.all');
  readonly #studiedLabels = {
    studied: translateSignal('tools.filters.studiedValues.studied'),
    unstudied: translateSignal('tools.filters.studiedValues.unstudied'),
  };
  readonly #facets = [
    { key: 'work' as const, label: translateSignal('tools.filters.work') },
    { key: 'kind' as const, label: translateSignal('tools.filters.kind') },
    { key: 'status' as const, label: translateSignal('tools.filters.status') },
    { key: 'studied' as const, label: translateSignal('tools.filters.studied') },
  ];
  readonly #optionLabel = (key: keyof CatalogFilters, value: string) => {
    if (key === 'work') return workTitle(value as WorkSlug);
    if (key === 'studied') return this.#studiedLabels[value as 'studied' | 'unstudied']();
    return value;
  };
  readonly #facetModels = computed(() => {
    const options = availableCatalogOptions(this.#store.tools());
    return this.#facets.map(({ key, label }) => ({
      key,
      label: label(),
      options: [
        { id: '', label: this.#all() },
        ...options[key].map((value) => ({ id: value, label: this.#optionLabel(key, value) })),
      ],
    }));
  });
  readonly #studied = computed(() => studiedIds(this.#store.summary()));
  readonly #shelf = computed(() => catalogShelf(this.#store.tools(), this.#store.summary()));
  readonly #workTitles = computed((): Readonly<Partial<Record<WorkSlug, string>>> =>
    Object.fromEntries(this.#shelf().map(({ work, title }) => [work, title])),
  );
  readonly #contents = computed(() => {
    const work = this.#store.work();
    return work ? contentsFor(work)(this.#store.tools()) : [];
  });
  /** The open work's studied concepts, in the contents' order. */
  readonly #studiedTools = computed(() =>
    this.#contents().flatMap(({ sections }) =>
      sections.flatMap((section) => section.tools.filter((tool) => this.#studied().has(tool.id))),
    ),
  );
  readonly #results = computed(() =>
    filterCatalog(
      searchReadings(this.#store.tools(), this.#store.query()),
      this.#store.filters(),
      this.#studied(),
    ),
  );
  /** True once there is a catalog to find a reading in. */
  readonly loaded = computed(() => this.#store.tools().length > 0);
  readonly vm = computed(() => {
    const tools = this.#store.tools();
    const work = this.#store.work();
    const results = this.#results();
    const pages = Math.max(1, Math.ceil(results.length / resultsPerPage));
    const page = Math.min(this.#store.page(), pages - 1);
    const selected = tools.find((tool) => tool.id === this.#store.selectedId()) ?? null;
    const filters = this.#store.filters();
    return {
      shelf: this.#shelf(),
      workTitles: this.#workTitles(),
      work,
      workTitle: work ? workTitle(work) : '',
      contents: this.#contents(),
      chapter: this.#store.chapter(),
      section: this.#store.section(),
      selected,
      studied: this.#studied(),
      studiedTools: this.#studiedTools(),
      study: this.#studyViewModel(),
      studyStatus: this.#studyStatus(),
      history: this.#store.history().flatMap((id) => {
        const tool = tools.find((tool) => tool.id === id);
        return tool ? [tool] : [];
      }),
      canReturn: this.#store.backStack().length > 0,
      query: this.#store.query(),
      rows: results.slice(page * resultsPerPage, (page + 1) * resultsPerPage),
      total: results.length,
      catalogTotal: tools.length,
      page,
      pages,
      filters,
      filterValues: {
        ...filters,
        work: filters.work ? workTitle(filters.work) : null,
        studied: filters.studied ? this.#studiedLabels[filters.studied]() : null,
      },
      facets: this.#facetModels(),
      loading: this.#store.loading(),
      failed: this.#store.failure() !== null,
      summaryFailed: this.#store.summaryFailure() !== null,
    };
  });

  constructor() {
    this.#dispatcher.dispatch(catalogPageEvents.opened());
    const motionChanged = () => {
      this.#reducedMotion.set(this.#motionPreference?.matches ?? false);
      if (this.#reducedMotion()) this.#stopPlaying();
    };
    this.#motionPreference?.addEventListener('change', motionChanged);
    inject(DestroyRef).onDestroy(() => {
      this.#stopPlaying();
      this.#motionPreference?.removeEventListener('change', motionChanged);
    });
    effect(() => {
      const id = this.#store.selectedId();
      this.#studyAttempt();
      untracked(() => void this.#loadStudy(id));
    });
  }
  /** Loads a reading's study. A later reading that takes over leaves this one's answer unused. */
  async #loadStudy(id: ToolId | null) {
    this.#studyLoad.set({ status: id ? 'loading' : 'none' });
    if (!id) return;
    const current = () => this.#store.selectedId() === id;
    try {
      const record = await this.#catalog.study(id);
      const path = record?.visual?.model;
      const load = path ? studyModels[path] : undefined;
      if (path && !load) throw new Error(`No model is listed for ${path}.`);
      const module = await load?.();
      if (!current()) return;
      this.#studyLoad.set(
        record ? { status: 'ready', record, run: module?.model ?? null } : { status: 'none' },
      );
    } catch {
      if (current()) this.#studyLoad.set({ status: 'failed' });
    }
  }
  studyIntent(intent: StudyIntent) {
    if (intent.kind === 'view') this.#studyView.set(intent.view);
    else if (intent.kind === 'expand') this.#expandStudy(intent.section, intent.open);
    else if (intent.kind === 'play') this.#play(intent.playing);
    else if (intent.kind === 'input') this.#changeInput(intent.name, intent.value);
    else if (intent.kind === 'resetInputs') this.#changeInputs({});
    else {
      this.#stopPlaying();
      this.#scrubStudy(intent.step);
    }
  }
  /** Loads the study again, from the record's own inputs in case a changed one failed. */
  retryStudy() {
    this.#inputs.set({});
    this.#studyAttempt.update((attempt) => attempt + 1);
  }
  retrySummary() {
    this.#dispatcher.dispatch(catalogPageEvents.summaryRetryRequested());
  }
  #expandStudy(section: StudyDisclosure, open: boolean) {
    this.#expandedStudy.update((sections) =>
      open ? [...new Set([...sections, section])] : sections.filter((value) => value !== section),
    );
  }
  #scrubStudy(step: number) {
    const model = this.#studyModel();
    if (Number.isFinite(step) && model) this.#studyStep.set(clampStep(model, step));
  }
  #changeInput(name: string, value: number) {
    if (Number.isFinite(value)) this.#changeInputs({ ...this.#inputs(), [name]: value });
  }
  #changeInputs(inputs: Readonly<Record<string, number>>) {
    this.#stopPlaying();
    this.#inputs.set(inputs);
  }
  #stopPlaying() {
    this.#playback?.unsubscribe();
    this.#playback = null;
    this.#playing.set(false);
  }
  /** Runs the example from the selected moment on the reader's command, at its own pace. */
  #play(playing: boolean) {
    this.#stopPlaying();
    const model = this.#studyModel();
    if (!playing || !model || this.#reducedMotion()) return;
    const { frames } = model.motion;
    const last = frames.length - 1;
    const current = clampStep(model, this.#studyStep());
    const start = current === last ? 0 : current;
    this.#studyStep.set(start);
    let clock = frames[start].seconds;
    let step = start;
    this.#playing.set(true);
    this.#playback = animationFrames()
      .pipe(pairwise())
      .subscribe(([before, now]) => {
        clock += Math.min(now.timestamp - before.timestamp, longestFrameMs) / 1000;
        while (step < last && frames[step + 1].seconds <= clock) step++;
        this.#studyStep.set(step);
        if (step === last) this.#stopPlaying();
      });
  }
  #leaveStudy() {
    this.#stopPlaying();
    this.#inputs.set({});
    this.#expandedStudy.set([]);
    this.#studyStep.set(null);
    this.#studyView.set('motion');
  }
  /**
   * Brings the reading in line with the address and says whether it changed. Reaching the
   * reading the return stack holds next is going back, by the browser or by the page.
   */
  arrive(id: string | undefined): boolean {
    return untracked(() => {
      const selected = this.#store.selectedId();
      if ((id ?? null) === selected) return false;
      const known = this.#store.tools().find((tool) => tool.id === id);
      if (!known) {
        if (selected) this.#dispatcher.dispatch(catalogPageEvents.readingClosed());
      } else if (this.#store.backStack().at(-1) === known.id) {
        this.#dispatcher.dispatch(catalogPageEvents.readingReturned());
      } else {
        this.#dispatcher.dispatch(catalogPageEvents.conceptOpened(known.id));
      }
      this.#leaveStudy();
      return true;
    });
  }
  chooseWork(work: WorkSlug) {
    this.#dispatcher.dispatch(catalogPageEvents.workChosen(work));
  }
  chooseChapter(chapter: string) {
    this.#dispatcher.dispatch(catalogPageEvents.chapterChosen(chapter));
  }
  chooseSection(section: string) {
    this.#dispatcher.dispatch(catalogPageEvents.sectionChosen(section));
  }
  open(id: ToolId) {
    const previous = this.#store.selectedId();
    this.#dispatcher.dispatch(catalogPageEvents.conceptOpened(id));
    if (this.#store.selectedId() !== previous) this.#leaveStudy();
  }
  /** Returns to the previous reading and names it, so the address can follow. */
  back(): ToolId | null {
    const previous = this.#store.selectedId();
    this.#dispatcher.dispatch(catalogPageEvents.readingReturned());
    const reading = this.#store.selectedId();
    if (reading !== previous) this.#leaveStudy();
    return reading;
  }
  search(query: string) {
    this.#dispatcher.dispatch(catalogPageEvents.searched(query));
  }
  filter(key: keyof CatalogFilters, value: string) {
    const filters = { ...this.#store.filters(), [key]: value === '' ? null : value };
    if (isCatalogFilters(filters))
      this.#dispatcher.dispatch(catalogPageEvents.filtersChanged(filters));
  }
  reset() {
    this.#dispatcher.dispatch(catalogPageEvents.filtersChanged(emptyCatalogFilters));
  }
  retry() {
    this.#dispatcher.dispatch(catalogPageEvents.retryRequested());
  }
  page(index: number) {
    if (index >= 0 && index < this.vm().pages)
      this.#dispatcher.dispatch(catalogPageEvents.pageChanged(index));
  }
}
