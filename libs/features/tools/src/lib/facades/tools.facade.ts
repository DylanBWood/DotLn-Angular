import { computed, inject, Injectable, signal } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';

import {
  availableCatalogOptions,
  catalogShelf,
  CatalogStore,
  contentsFor,
  emptyCatalogFilters,
  filterCatalog,
  isCatalogFilters,
  searchReadings,
  workTitle,
} from '@dotln-angular/catalog';
import { catalogPageEvents } from '@dotln-angular/events';
import { translateSignal } from '@dotln-angular/i18n';
import type { CatalogFilters, ToolId, WorkSlug } from '@dotln-angular/models';

import {
  arriveCalculationView,
  arriveExample,
  arriveFrames,
  arriveStudyId,
  desiredVelocity,
} from '../arrive-example';
import { arriveLimitExampleView } from '../arrive-limit-example';
import type { ArriveStudyView, StudySection, StudyStreamView } from '../types';

/** Search results shown on one page. */
const resultsPerPage = 30;

@Injectable()
export class ToolsFacade {
  readonly #studyStep = signal(75);
  readonly #studyView = signal<'motion' | 'velocity'>('motion');
  readonly #streamView = signal<StudyStreamView>('flow');
  readonly #expandedStudy = signal<readonly StudySection[]>([]);
  readonly #limitsOpen = computed(() => this.#expandedStudy().includes('limits'));
  readonly #limitExample = computed(() => (this.#limitsOpen() ? arriveLimitExampleView() : null));
  readonly #frames = arriveFrames();
  readonly #currentCalculation = computed(() => {
    if (!this.#expandedStudy().includes('algorithm')) return null;
    const step = this.#studyStep();
    return arriveCalculationView(this.#frames[step], step);
  });
  readonly #velocityCurves = {
    actual: this.#frames
      .map(
        (frame, step) =>
          `${40 + (step / arriveExample.steps) * 520},${250 - frame.velocity * 12.5}`,
      )
      .join(' '),
    desired: this.#frames
      .map(
        (frame, step) =>
          `${40 + (step / arriveExample.steps) * 520},${250 - desiredVelocity(frame.position) * 12.5}`,
      )
      .join(' '),
  };
  readonly #study = computed<ArriveStudyView>(() => {
    const step = this.#studyStep();
    const frame = this.#frames[step];
    const distance = Math.abs(arriveExample.target - frame.position);
    const desired = desiredVelocity(frame.position);
    const x = 40 + frame.position * 3.8;
    return {
      currentCalculation: this.#currentCalculation(),
      limitExample: this.#limitExample(),
      activeView: this.#studyView(),
      streamView: this.#streamView(),
      expanded: this.#expandedStudy(),
      step,
      steps: arriveExample.steps,
      seconds: (step * arriveExample.timeStep).toFixed(1),
      distance: distance.toFixed(1),
      speed: Math.abs(frame.velocity).toFixed(1),
      desired: Math.abs(desired).toFixed(1),
      x,
      actualEnd: x + frame.velocity * 4,
      desiredEnd: x + desired * 4,
      phase:
        distance === 0 && frame.velocity === 0
          ? 'settled'
          : step === 0
            ? 'start'
            : distance < arriveExample.slowRadius
              ? 'slow'
              : 'cruise',
      trail: this.#frames
        .slice(Math.max(0, step - 24), step)
        .filter((_frame, index) => index % 3 === 0)
        .map((point) => 40 + point.position * 3.8),
      velocityPlot: {
        origin: 0,
        ...this.#velocityCurves,
        cursorX: 40 + (step / arriveExample.steps) * 520,
        actualY: 250 - frame.velocity * 12.5,
        desiredY: 250 - desired * 12.5,
        maxSpeed: arriveExample.maxSpeed,
        seconds: arriveExample.steps * arriveExample.timeStep,
      },
    };
  });
  readonly #store = inject(CatalogStore);
  readonly #dispatcher = inject(Dispatcher);
  readonly #all = translateSignal('tools.filters.all');
  readonly #facets = [
    { key: 'work' as const, label: translateSignal('tools.filters.work') },
    { key: 'kind' as const, label: translateSignal('tools.filters.kind') },
    { key: 'status' as const, label: translateSignal('tools.filters.status') },
  ];
  readonly #facetModels = computed(() => {
    const options = availableCatalogOptions(this.#store.tools());
    return this.#facets.map(({ key, label }) => ({
      key,
      label: label(),
      options: [
        { id: '', label: this.#all() },
        ...options[key].map((value) => ({
          id: value,
          label: key === 'work' ? workTitle(value as WorkSlug) : value,
        })),
      ],
    }));
  });
  readonly #shelf = computed(() => catalogShelf(this.#store.tools()));
  readonly #workTitles = computed((): Readonly<Partial<Record<WorkSlug, string>>> =>
    Object.fromEntries(this.#shelf().map(({ work, title }) => [work, title])),
  );
  readonly #contents = computed(() => {
    const work = this.#store.work();
    return work ? contentsFor(work)(this.#store.tools()) : [];
  });
  readonly #results = computed(() =>
    filterCatalog(searchReadings(this.#store.tools(), this.#store.query()), this.#store.filters()),
  );
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
      study: selected?.id === arriveStudyId ? this.#study() : null,
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
      },
      facets: this.#facetModels(),
      loading: this.#store.loading(),
      failed: this.#store.failure() !== null,
    };
  });

  constructor() {
    this.#dispatcher.dispatch(catalogPageEvents.opened());
  }
  expandStudy(section: StudySection, open: boolean) {
    this.#expandedStudy.update((sections) =>
      open ? [...new Set([...sections, section])] : sections.filter((value) => value !== section),
    );
  }
  viewStudy(view: 'motion' | 'velocity') {
    this.#studyView.set(view);
  }
  viewStudyStream(view: StudyStreamView) {
    this.#streamView.set(view);
  }
  scrubStudy(step: number) {
    if (Number.isFinite(step))
      this.#studyStep.set(Math.max(0, Math.min(arriveExample.steps, Math.round(step))));
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
    if (this.#store.selectedId() !== previous) this.#expandedStudy.set([]);
  }
  follow(id: ToolId) {
    const previous = this.#store.selectedId();
    this.#dispatcher.dispatch(catalogPageEvents.relationFollowed(id));
    if (this.#store.selectedId() !== previous) this.#expandedStudy.set([]);
  }
  back() {
    const previous = this.#store.selectedId();
    this.#dispatcher.dispatch(catalogPageEvents.readingReturned());
    if (this.#store.selectedId() !== previous) this.#expandedStudy.set([]);
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
