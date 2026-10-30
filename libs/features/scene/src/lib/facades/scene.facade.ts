import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import {
  BehaviorSubject,
  filter,
  map,
  merge,
  type Observable,
  scan,
  startWith,
  Subject,
} from 'rxjs';

import { CatalogToken, sceneTools } from '@dotln-angular/catalog';
import { scenePageEvents } from '@dotln-angular/events';
import type { Tool, ToolId, TransformKind } from '@dotln-angular/models';
import { encodeExport, parseExport, SceneStore } from '@dotln-angular/scene-data-access';
import type {
  Composition,
  CompositionStep,
  PreviewArrow,
  SceneFrame,
  SceneMetrics,
  SceneRun,
  SimulationState,
  SlotAssignment,
  StepPreview,
  UnitId,
  Vec2,
} from '@dotln-angular/scene-engine';
import {
  advanceRun,
  applyToRun,
  assignmentOf,
  frameOf,
  isAtRest,
  measure,
  objectiveKind,
  previewStep,
  refusalOf,
  runTrial,
  squadOf,
  startRun,
  unitsFollowingNothing,
} from '@dotln-angular/scene-engine';

import { SceneClock } from '../clock/scene-clock';
import { coachStep } from '../mappers/coach-step';
import { fieldRegions, mapRowViews, positionBucket } from '../mappers/frame-mapper';
import { mapInspector } from '../mappers/inspector-mapper';
import { mapLog } from '../mappers/log-mapper';
import {
  type InstrumentLabels,
  mapFormation,
  mapInstruments,
  mapTrial,
} from '../mappers/metric-mapper';
import { mapRailGroups } from '../mappers/rail-mapper';
import {
  arriveToolId,
  defaultParams,
  isRunnable,
  isTypedTool,
  mapToolToStep,
  type SceneTool,
  selectionProblem,
} from '../mappers/tool-mapper';
import {
  SceneDefinitionToken,
  SceneReducedMotionToken,
  SceneSeedSourceToken,
} from '../models/scene-tokens';
import type {
  InstrumentId,
  LabelSet,
  SceneNotice,
  SceneViewModel,
  UnitRow,
} from '../models/scene-view-model';
import type { SceneUnitStyle } from '../renderers/scene-renderer';
import { TextSceneRenderer } from '../renderers/text-scene-renderer';
import { MetricHistory } from './metric-history';
import { sceneLabels } from './scene-labels';

/** One change to the run, folded in turn with the clock's ticks. */
type RunCommand = (run: SceneRun) => SceneRun;

/** What the page shows of one moment, published in a single signal write. */
interface SceneSample {
  readonly simulation: SimulationState;
  readonly frame: SceneFrame;
  readonly metrics: SceneMetrics;
  readonly rows: readonly UnitRow[];
  readonly refusal: SceneRun['refusal'];
  readonly points: Readonly<Record<InstrumentId, string>>;
}

/** The tool last applied, the units it went on and how it was set. */
interface LiveTool {
  readonly toolId: string;
  readonly selection: readonly UnitId[];
  readonly params: Readonly<Record<string, number>>;
}

// The page is read rather than watched, so ten updates a second are plenty; the painter still
// shows every frame.
const framesPerSample = 6;
const trialFrames = 600;
const trialSampleEvery = 10;
const sceneWork = 'aifg';
const noArrows: readonly PreviewArrow[] = [];
const noSlots: readonly SlotAssignment[] = [];

const round = (value: number) => Math.round(value * 10) / 10;

// One past the highest in the list, which may have gaps where a composition could not be read.
const nextCompositionId = (compositions: readonly Composition[]) => {
  const taken = compositions.map(({ id }) => Number(/\d+$/.exec(id)?.[0] ?? 0));
  return `composition-${Math.max(0, ...taken) + 1}`;
};

const sameUnits = (a: readonly UnitId[], b: readonly UnitId[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

@Injectable()
export class SceneFacade {
  readonly #store = inject(SceneStore);
  readonly #dispatcher = inject(Dispatcher);
  readonly #catalog = inject(CatalogToken);
  readonly #router = inject(Router);
  readonly #clock = inject(SceneClock);
  readonly #baseDefinition = inject(SceneDefinitionToken);
  readonly #reducedMotion = inject(SceneReducedMotionToken);
  readonly #nextSeed = inject(SceneSeedSourceToken);
  readonly #labels = sceneLabels();

  readonly #commands = new Subject<RunCommand>();
  readonly #history = new MetricHistory();
  readonly #text = new TextSceneRenderer();
  readonly #run = new BehaviorSubject<SceneRun>(startRun(this.#baseDefinition));
  #emissions = 0;

  readonly #seed = signal(this.#baseDefinition.seed);
  readonly #definition = computed(() => ({ ...this.#baseDefinition, seed: this.#seed() }));
  readonly #feel = signal(false);
  readonly #selection = signal<readonly UnitId[]>([]);
  readonly #catalogStatus = signal<'loading' | 'ready' | 'failed'>('loading');
  readonly #tools = signal<readonly SceneTool[]>([]);
  readonly #chosenId = signal<ToolId | null>(null);
  readonly #params = signal<Readonly<Record<string, number>>>({});
  readonly #lastApplied = signal<LiveTool | null>(null);
  readonly #requestNotice = signal<SceneNotice | null>(null);
  readonly #importFailed = signal(false);
  readonly #playing = signal(false);
  readonly #labelSet = signal<LabelSet>('lifecycle');
  readonly #keyboard = signal(false);
  readonly #exported = signal<string | null>(null);
  readonly #ghostFrames = signal<readonly SceneFrame[]>([]);
  readonly #sample = signal<SceneSample>(this.#capture());

  // The URL this page was reached by: `?tool=` chooses a tool. Read from the router because this
  // facade outlives the routed component.
  readonly #query = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#router.parseUrl(this.#router.url).queryParamMap),
    ),
    { requireSync: true },
  );

  /** Every state the run passes through, for painting directly, outside change detection. */
  readonly frames$: Observable<SceneFrame> = this.#run.pipe(
    map(({ simulation }) => frameOf(simulation)),
  );

  readonly #chosenTool = computed(
    () => this.#tools().find((tool) => tool.id === this.#chosenId()) ?? null,
  );

  readonly #live = computed(() => {
    const applied = this.#lastApplied();
    return (
      applied !== null &&
      applied.toolId === this.#chosenId() &&
      sameUnits(applied.selection, this.#selection())
    );
  });

  readonly #unitStyles = computed<readonly SceneUnitStyle[]>(() => {
    const set = this.#labelSet();
    return this.#baseDefinition.units.map((unit) => ({
      id: unit.id,
      label: unit.labels[set] ?? unit.id,
      role: unit.labels[set] ?? 'executor',
    }));
  });

  // The step Apply would make, which takes its frame only when it is made.
  readonly #pendingStep = computed<CompositionStep | null>(() => {
    const tool = this.#chosenTool();
    const selection = this.#selection();
    if (tool === null || selectionProblem(tool, selection.length) !== null) return null;
    return mapToolToStep(tool, this.#params(), selection, 0);
  });

  readonly #preview = computed<StepPreview | null>(() => {
    const step = this.#pendingStep();
    return step === null ? null : previewStep(this.#sample().simulation, step);
  });

  // A preview's arrows and figures would trail behind units on the move.
  readonly #shownPreview = computed(() => (this.#playing() ? null : this.#preview()));

  readonly #slots = computed(() =>
    this.#live()
      ? assignmentOf(this.#sample().simulation, this.#selection())
      : (this.#preview()?.assignment ?? noSlots),
  );

  readonly #objectiveSet = computed(() => this.#sample().frame.objective !== null);

  readonly #rail = computed(() =>
    mapRailGroups({
      tools: this.#tools(),
      chosenId: this.#chosenId(),
      params: this.#params(),
      groupLabel: (group) => this.#labels.rail[group](),
      patternLabel: (name) => this.#choiceLabel(name),
    }),
  );

  readonly #inspector = computed(() => {
    const tool = this.#chosenTool();
    if (tool === null) return null;
    const transforms: Partial<Record<TransformKind, () => string>> = this.#labels.transforms;
    return mapInspector({
      tool,
      params: this.#params(),
      selectionCount: this.#selection().length,
      objectiveSet: this.#objectiveSet(),
      preview: this.#shownPreview(),
      refusal: this.#preview()?.refusal ?? null,
      slots: this.#slots(),
      slotsLive: this.#live(),
      units: this.#sample().frame.units,
      styles: this.#unitStyles(),
      transformLabel: (kind) => transforms[kind]?.() ?? kind,
      choiceLabel: (name) => this.#choiceLabel(name),
    });
  });

  readonly #log = computed(() =>
    mapLog({
      steps: this.#store.steps(),
      compositions: this.#store.compositions(),
      forkIndex: this.#store.forkIndex(),
      kept: this.#store.keptTrials().length,
      exported: this.#exported(),
      titleOf: (step) => this.#titleOf(step),
    }),
  );

  readonly #ghost = computed(() => (this.#store.trial() === null ? [] : this.#ghostFrames()));

  readonly #rowWords = {
    position: (bucket: UnitRow['position']) => this.#labels.positions[bucket](),
    speed: (bucket: UnitRow['speed']) => this.#labels.speeds[bucket](),
    activity: (activity: UnitRow['activity']) => this.#labels.activities[activity](),
  };

  readonly #instrumentLabels = computed<InstrumentLabels>(() => {
    const { instruments, instrumentUnits, unknown } = this.#labels;
    return {
      name: (id) => instruments[id](),
      unit: (id) => instrumentUnits[id](),
      unknown: unknown(),
    };
  });

  readonly vm = computed<SceneViewModel>(() => {
    const sample = this.#sample();
    const selection = this.#selection();
    const steps = this.#store.steps();
    const playing = this.#playing();
    const { frameNo, objective, field, units } = sample.frame;
    const instrumentLabels = this.#instrumentLabels();
    const trial = this.#store.trial();
    return {
      reducedMotion: this.#reducedMotion,
      rail: { status: this.#catalogStatus(), groups: this.#rail() },
      inspector: this.#inspector(),
      formation: mapFormation(sample.metrics, instrumentLabels.unknown),
      awaitingRun: this.#reducedMotion && !playing && steps.some((step) => step.at === frameNo),
      live: this.#live(),
      refusal: sample.refusal,
      notice: this.#notice(),
      instruments: mapInstruments(sample.metrics, sample.points, instrumentLabels),
      transport: {
        seed: this.#seed(),
        frameNo,
        playing,
        feel: this.#feel(),
        selected: selection.length,
        units: units.length,
        labelSet: this.#labelSet(),
        canSave: steps.length > 0,
        canCompare: this.#splitIndex() >= 0,
      },
      rows: mapRowViews(sample.rows, this.#unitStyles(), this.#rowWords),
      textLayerOpen: this.#reducedMotion || this.#keyboard(),
      objective:
        objective === null ? null : this.#labels.positions[positionBucket(objective, field)](),
      objectiveRegions: fieldRegions(field).map(({ bucket, point }) => ({
        id: bucket,
        label: this.#labels.positions[bucket](),
        point,
      })),
      note: this.#store.note(),
      coach: coachStep({
        selected: selection.length,
        toolChosen: this.#chosenId() !== null,
        steps,
        objectiveSet: objective !== null,
        compared: trial !== null || this.#store.keptTrials().length > 0,
      }),
      selection,
      arrows: this.#shownPreview()?.arrows ?? noArrows,
      ghostFrames: this.#ghost(),
      unitStyles: this.#unitStyles(),
      log: this.#log(),
      trial: trial === null ? null : mapTrial(trial, instrumentLabels),
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const ticks = this.#clock.ticks$.pipe(
      map(
        (steps): RunCommand =>
          (run) =>
            advanceRun(run, steps),
      ),
    );
    merge(ticks, this.#commands)
      .pipe(
        scan((run, command) => command(run), this.#run.value),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((run) => this.#receive(run));
    destroyRef.onDestroy(() => this.#clock.pause());

    // A tool named in the URL is honoured on every arrival, once the list it comes from is here.
    effect(() => {
      const requested = this.#query().get('tool');
      const ready = this.#catalogStatus() === 'ready';
      untracked(() => {
        if (requested === null) this.#requestNotice.set(null);
        else if (ready) void this.#honourRequest(requested);
      });
    });

    void this.#loadTools();
  }

  /** The painter takes every fold through `frames$`; the page takes a sample of them. */
  #receive(run: SceneRun) {
    this.#run.next(run);
    this.#history.record(measure(run.simulation, untracked(this.#selection)));
    this.#emissions += 1;
    const playing = untracked(this.#playing);
    if (playing && run.scheduled.length === 0 && isAtRest(run.simulation)) this.pause();
    else if (!playing || this.#emissions % framesPerSample === 0) this.#publish();
  }

  #capture(): SceneSample {
    const { simulation, refusal } = this.#run.value;
    const selection = untracked(this.#selection);
    const frame = frameOf(simulation);
    this.#text.draw(frame, selection);
    return {
      simulation,
      frame,
      metrics: measure(simulation, selection),
      rows: this.#text.rows,
      refusal,
      points: this.#history.points(),
    };
  }

  #publish() {
    this.#sample.set(this.#capture());
  }

  async #loadTools() {
    this.#catalogStatus.set('loading');
    try {
      const rows = await this.#catalog.load(sceneWork);
      this.#tools.set(sceneTools(sceneWork)(rows).filter(isRunnable));
      this.#catalogStatus.set('ready');
    } catch {
      this.#catalogStatus.set('failed');
    }
  }

  retryCatalog() {
    void this.#loadTools();
  }

  // Only the one list the rail shows can answer a URL. Anything else arrives with nothing chosen
  // and says why, reading the wider catalog only to name the reason.
  async #honourRequest(id: string) {
    const offered = this.#tools().find((tool) => tool.id === id);
    if (offered) {
      this.#choose(offered);
      return;
    }
    this.#chosenId.set(null);
    let rows: readonly Tool[] | null = null;
    try {
      rows = await this.#catalog.load();
    } catch {
      /* The notice below says the catalog could not be read. */
    }
    // The operator may have moved on while the wider catalog loaded.
    if (this.#query().get('tool') !== id || this.#chosenId() !== null) return;
    if (rows === null) {
      this.#requestNotice.set({ code: 'catalog-unavailable', id });
      return;
    }
    const known = rows.find((tool) => tool.id === id);
    if (!known) this.#requestNotice.set({ code: 'unknown-tool', id });
    else if (isTypedTool(known))
      this.#requestNotice.set({
        code: 'refused-tool',
        title: known.title,
        kind: known.faces.transform.kind,
      });
    else this.#requestNotice.set({ code: 'untyped-tool', title: known.title });
  }

  #notice(): SceneNotice | null {
    if (this.#requestNotice()) return this.#requestNotice();
    if (this.#importFailed()) return { code: 'import-failed' };
    if (this.#store.saveFailed()) return { code: 'save-failed' };
    return this.#store.storedIgnored() ? { code: 'stored-ignored' } : null;
  }

  // A named value the labels do not cover is the catalog's own word, shown as it stands.
  #choiceLabel(name: string) {
    const { patterns } = this.#labels;
    return name in patterns ? patterns[name as keyof typeof patterns]() : name;
  }

  #titleOf(step: CompositionStep) {
    if (step.kind === objectiveKind) return this.#labels.objectiveStep();
    return this.#tools().find((tool) => tool.id === step.toolId)?.title ?? step.toolId;
  }

  // Where the branch before a comparison ends: the fork if one was made, otherwise the last
  // equip, since an objective alone moves nothing.
  #splitIndex() {
    const steps = this.#store.steps();
    const forked = this.#store.forkIndex();
    if (forked !== null && forked < steps.length) return forked;
    return steps.map((step) => step.kind !== objectiveKind).lastIndexOf(true);
  }

  // Selection

  #select(ids: Iterable<UnitId>) {
    const chosen = new Set(ids);
    const selection = this.#baseDefinition.units.map(({ id }) => id).filter((id) => chosen.has(id));
    this.#selection.set(selection);
    this.#history.reset();
    this.#history.record(measure(this.#run.value.simulation, selection));
    this.#publish();
  }

  select(id: UnitId, additive = false) {
    if (additive) this.toggle(id);
    else this.#select([id]);
  }

  toggle(id: UnitId) {
    const selected = new Set(this.#selection());
    if (!selected.delete(id)) selected.add(id);
    this.#select(selected);
  }

  marquee(from: Vec2, to: Vec2, additive = false) {
    const left = Math.min(from.x, to.x);
    const right = Math.max(from.x, to.x);
    const top = Math.min(from.y, to.y);
    const bottom = Math.max(from.y, to.y);
    const inside = frameOf(this.#run.value.simulation)
      .units.filter(({ position: { x, y } }) => x >= left && x <= right && y >= top && y <= bottom)
      .map(({ id }) => id);
    this.#select(additive ? [...this.#selection(), ...inside] : inside);
  }

  /** Selects the group a unit moves with; a unit with none stands with its role. */
  selectSquad(id: UnitId) {
    const squad = squadOf(this.#run.value.simulation, id);
    if (squad.length > 0) {
      this.#select(squad);
      return;
    }
    const set = this.#labelSet();
    const roster = this.#baseDefinition.units;
    const label = roster.find((other) => other.id === id)?.labels[set];
    this.#select(roster.filter((other) => other.labels[set] === label).map((other) => other.id));
  }

  clearSelection() {
    this.#select([]);
  }

  // Tools

  // A tool already on these units opens as it was set, since that is what the units are doing.
  #choose(tool: SceneTool, pattern?: number) {
    this.#requestNotice.set(null);
    this.#chosenId.set(tool.id);
    const applied = this.#lastApplied();
    const params = this.#live() ? applied?.params : undefined;
    const base = params ?? defaultParams(tool.faces.transform);
    this.#params.set(pattern === undefined ? base : { ...base, pattern });
  }

  /** Chooses a tool from the rail; choosing the chosen tool again puts it down. */
  chooseTool(id: ToolId, pattern?: number) {
    if (id === this.#chosenId() && pattern === undefined) {
      this.#chosenId.set(null);
      return;
    }
    if (id === this.#chosenId() && pattern !== undefined) {
      this.setParam('pattern', pattern);
      this.commitParam();
      return;
    }
    const tool = this.#tools().find((candidate) => candidate.id === id);
    if (!tool) return;
    this.#choose(tool, pattern);
    if (pattern !== undefined) this.commitParam();
  }

  setParam(name: string, value: number) {
    this.#params.update((params) => ({ ...params, [name]: value }));
  }

  /** A finished change to a tool already on these units reaches them at once. */
  commitParam() {
    if (this.#live()) this.equip();
  }

  // A step records the true frame, not the sampled one the page shows, so a replay applies it at
  // exactly the moment the operator did.
  #currentFrame() {
    return this.#run.value.simulation.tick;
  }

  #apply(step: CompositionStep) {
    this.#commands.next((run) => applyToRun(run, step));
    const applied = refusalOf(this.#run.value.simulation, step) === null;
    if (applied) {
      this.#dispatcher.dispatch(scenePageEvents.stepApplied(step));
      if (!this.#reducedMotion) this.play();
    }
    this.#publish();
    return applied;
  }

  equip() {
    const pending = this.#pendingStep();
    if (pending === null) return;
    if (this.#apply({ ...pending, at: this.#currentFrame() }))
      this.#lastApplied.set({
        toolId: pending.toolId,
        selection: pending.selection,
        params: pending.params,
      });
  }

  setObjective(point: Vec2) {
    this.#apply({
      at: this.#currentFrame(),
      toolId: objectiveKind,
      kind: objectiveKind,
      selection: [],
      params: { x: round(point.x), y: round(point.y) },
    });
  }

  /**
   * The strategy game's order: go there. Sets the objective and gives the selected units Arrive;
   * units in a formation need no order, because their anchor follows the objective.
   */
  sendTo(point: Vec2) {
    this.setObjective(point);
    const arrive = this.#tools().find((tool) => tool.id === arriveToolId);
    const loose = unitsFollowingNothing(this.#run.value.simulation, this.#selection());
    if (arrive && loose.length > 0)
      this.#apply(
        mapToolToStep(arrive, defaultParams(arrive.faces.transform), loose, this.#currentFrame()),
      );
  }

  // Transport

  play() {
    this.#playing.set(true);
    this.#clock.play();
  }

  pause() {
    this.#stop();
    this.#publish();
  }

  step(steps = 1) {
    this.#clock.tick(steps);
  }

  toggleFeel() {
    this.#feel.update((feel) => !feel);
  }

  #stop() {
    this.#clock.pause();
    this.#playing.set(false);
  }

  /** Puts the field back to its first frame, with these steps still to come. */
  #rewind(steps: readonly CompositionStep[]) {
    const definition = this.#definition();
    this.#importFailed.set(false);
    this.#exported.set(null);
    this.#history.reset();
    this.#commands.next(() => startRun(definition, steps));
  }

  #runAfterRewind() {
    this.#publish();
    if (!this.#reducedMotion && this.#store.steps().length > 0) this.play();
  }

  /** Runs the composition again from the first frame; with feel on, from a fresh seed. */
  restart() {
    this.#stop();
    // The run goes back before the tool was applied, so it is on no units until it is applied.
    this.#lastApplied.set(null);
    if (this.#feel()) this.#seed.set(this.#nextSeed());
    this.#dispatcher.dispatch(scenePageEvents.trialClosed());
    this.#rewind(this.#store.steps());
    this.#runAfterRewind();
  }

  /** Puts the composition down and returns the field to idle. */
  clear() {
    this.#stop();
    this.#lastApplied.set(null);
    this.#rewind([]);
    this.#dispatcher.dispatch(scenePageEvents.runReset());
    this.#publish();
  }

  setLabelSet(set: LabelSet) {
    this.#labelSet.set(set);
  }

  noteKeyboard() {
    this.#keyboard.set(true);
  }

  // Trials

  fork() {
    this.#dispatcher.dispatch(scenePageEvents.branchForked());
  }

  /**
   * Runs the branch before the split against the branch after it over the next ten seconds, from
   * one seed, then takes the live run back to the split so the two can be watched parting.
   */
  compare() {
    const split = this.#splitIndex();
    if (split < 0) return;
    const steps = this.#store.steps();
    // A step made after a rewind can stand earlier in the run than the split itself.
    const from = Math.min(...steps.slice(split).map((step) => step.at));
    const start = advanceRun(startRun(this.#definition(), steps), from);
    const { trial, framesA } = runTrial({
      id: `trial-${this.#store.keptTrials().length + 1}`,
      start,
      branchA: { label: 'before', steps: steps.slice(0, split) },
      branchB: { label: 'after', steps },
      frames: trialFrames,
      sampleEvery: trialSampleEvery,
      focus: steps[split].selection,
    });
    this.#stop();
    this.#ghostFrames.set(framesA);
    this.#dispatcher.dispatch(scenePageEvents.trialCompared(trial));
    this.#history.reset();
    this.#commands.next(() => start);
    this.#runAfterRewind();
  }

  keepTrial() {
    this.#dispatcher.dispatch(scenePageEvents.trialKept());
  }

  closeTrial() {
    this.#dispatcher.dispatch(scenePageEvents.trialClosed());
  }

  // Compositions

  note(text: string) {
    this.#dispatcher.dispatch(scenePageEvents.noteChanged(text));
  }

  #composition(): Composition {
    const steps = this.#store.steps();
    const titles = steps
      .filter((step) => step.kind !== objectiveKind)
      .map((step) => this.#titleOf(step));
    return {
      id: nextCompositionId(this.#store.compositions()),
      title: [...new Set(titles)].join(' · ') || this.#labels.objectiveStep(),
      sceneId: this.#baseDefinition.id,
      seed: this.#seed(),
      steps,
      note: this.#store.note(),
      trials: this.#store.keptTrials(),
    };
  }

  save() {
    if (this.#store.steps().length === 0) return;
    // Another tab may have saved since this one read the list, and a save writes the whole list.
    // After a failed save the list here is the only copy of that composition, so it stands.
    if (!this.#store.saveFailed()) this.#store.readFromStorage();
    this.#dispatcher.dispatch(scenePageEvents.compositionSaved(this.#composition()));
  }

  /** Replays a composition from its own seed, so it runs exactly as it did when saved. */
  open(id: string) {
    const composition = this.#store.compositions().find((candidate) => candidate.id === id);
    if (composition) this.#open(composition);
  }

  #open(composition: Composition) {
    this.#stop();
    this.#seed.set(composition.seed);
    this.#lastApplied.set(null);
    this.#rewind(composition.steps);
    this.#dispatcher.dispatch(scenePageEvents.compositionOpened(composition));
    this.#runAfterRewind();
  }

  exportJson() {
    const text = encodeExport(this.#composition());
    this.#exported.set(text);
    return text;
  }

  importJson(text: string) {
    const composition = parseExport(text, this.#baseDefinition.id);
    this.#importFailed.set(composition === null);
    if (composition) this.#open(composition);
  }
}
