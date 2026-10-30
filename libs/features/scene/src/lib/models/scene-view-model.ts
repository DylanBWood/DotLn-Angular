import type { ToolId } from '@dotln-angular/models';
import type {
  PreviewArrow,
  SceneFrame,
  SlotAssignment,
  StepRefusal,
  UnitActivity,
  UnitId,
  Vec2,
} from '@dotln-angular/scene-engine';

import type { SceneUnitStyle } from '../renderers/scene-renderer';

export type RailGroupId = 'move' | 'group' | 'avoid' | 'form';
export type PositionBucket =
  | 'north-west'
  | 'north'
  | 'north-east'
  | 'west'
  | 'centre'
  | 'east'
  | 'south-west'
  | 'south'
  | 'south-east';
export type SpeedBucket = 'still' | 'walking' | 'running';
export type LabelSet = 'lifecycle' | 'uifa';
export type InstrumentId =
  'cohesionRadius' | 'collisions' | 'headingVariance' | 'timeToObjective' | 'stalledUnits';

/** The next thing the coach line suggests trying. */
export type CoachStep = 'select' | 'tool' | 'apply' | 'send' | 'form' | 'tune';

/** One row of the text layer before its words are chosen. */
export interface UnitRow {
  readonly id: UnitId;
  readonly position: PositionBucket;
  readonly speed: SpeedBucket;
  readonly activity: UnitActivity;
  readonly selected: boolean;
}

export interface UnitRowView {
  readonly id: UnitId;
  readonly label: string;
  readonly colour: string;
  readonly position: string;
  readonly speed: string;
  readonly activity: string;
  readonly selected: boolean;
}

/** One named value of a parameter: a formation pattern, a falloff. */
export interface ChoiceView {
  readonly value: number;
  readonly label: string;
  readonly chosen: boolean;
}

export interface RailTool {
  readonly id: ToolId;
  readonly title: string;
  readonly colour: string;
  readonly chosen: boolean;
  readonly patterns: readonly ChoiceView[];
}

export interface RailGroup {
  readonly id: RailGroupId;
  readonly label: string;
  readonly tools: readonly RailTool[];
}

export interface RailView {
  readonly status: 'loading' | 'ready' | 'failed';
  readonly groups: readonly RailGroup[];
}

export interface InspectorParam {
  readonly name: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  /** Its named values; a parameter with any is a choice, not a slider. */
  readonly choices: readonly ChoiceView[];
}

export interface InspectorFaces {
  readonly minimum: number;
  readonly maximum: number | null;
  readonly squad: boolean;
  readonly transform: string;
  readonly scenes: string;
  readonly observable: string;
  readonly metrics: string;
}

export interface SlotRow extends SlotAssignment {
  readonly label: string;
  /** The slot as a person counts it, from one. */
  readonly number: number;
  /** The unit has reached the slot, which only a standing formation's table can say. */
  readonly inPlace: boolean;
}

export interface SlotTableView {
  readonly rows: readonly SlotRow[];
  /** These are the slots units are taking now, not the ones Apply would fill. */
  readonly live: boolean;
  /** How many units stand in their slots. */
  readonly placed: number;
  readonly totalCost: number;
}

export interface InspectorPreview {
  readonly units: number;
  readonly strongest: string;
  readonly quiet: boolean;
}

export interface FormationReading {
  readonly anchorToMean: string;
  readonly slotError: string;
  readonly assignmentCost: string;
}

/** Why a chosen tool cannot be applied yet, and to how many units it can be. */
export interface InspectorIssue {
  readonly code: 'empty' | 'too-few' | 'too-many' | 'objective';
  readonly min: number;
  readonly max: number | null;
}

export type SceneNotice =
  | { readonly code: 'unknown-tool'; readonly id: string }
  | { readonly code: 'untyped-tool'; readonly title: string }
  | { readonly code: 'refused-tool'; readonly title: string; readonly kind: string }
  | { readonly code: 'catalog-unavailable'; readonly id: string }
  | { readonly code: 'import-failed' }
  | { readonly code: 'save-failed' }
  | { readonly code: 'stored-ignored' };

export interface InspectorView {
  readonly title: string;
  readonly colour: string;
  readonly definition: string;
  readonly faces: InspectorFaces;
  readonly params: readonly InspectorParam[];
  readonly costs: readonly InspectorParam[];
  readonly preview: InspectorPreview | null;
  readonly slots: SlotTableView | null;
  readonly issue: InspectorIssue | null;
  readonly canApply: boolean;
}

export interface InstrumentView {
  readonly id: InstrumentId;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly known: boolean;
  readonly points: string;
}

export interface TransportView {
  readonly seed: number;
  readonly frameNo: number;
  readonly playing: boolean;
  readonly feel: boolean;
  readonly selected: number;
  readonly units: number;
  readonly labelSet: LabelSet;
  readonly canSave: boolean;
  readonly canCompare: boolean;
}

export interface LogStepView {
  readonly at: number;
  readonly title: string;
  readonly units: number;
  /** How many steps in a row this entry stands for, as a live change makes one per change. */
  readonly repeats: number;
  /** The branch forked just before this step. */
  readonly afterFork: boolean;
}

export interface LogCompositionView {
  readonly id: string;
  readonly title: string;
  readonly steps: number;
  readonly trials: number;
  readonly note: string;
}

export interface LogView {
  readonly steps: readonly LogStepView[];
  readonly compositions: readonly LogCompositionView[];
  readonly kept: number;
  readonly exported: string | null;
  readonly canSave: boolean;
}

export interface TrialSeriesView {
  readonly id: string;
  readonly label: string;
  readonly before: string;
  readonly after: string;
  readonly marker: number | null;
  readonly summaryBefore: string;
  readonly summaryAfter: string;
}

export interface TrialView {
  readonly firstDivergence: number | null;
  readonly series: readonly TrialSeriesView[];
}

/** A part of the field the objective can be put by keyboard. */
export interface ObjectiveRegion {
  readonly id: string;
  readonly label: string;
  readonly point: Vec2;
}

export interface SceneViewModel {
  readonly reducedMotion: boolean;
  readonly rail: RailView;
  readonly inspector: InspectorView | null;
  readonly formation: FormationReading | null;
  /** Under reduced motion an applied step waits here for Play or Step. */
  readonly awaitingRun: boolean;
  /** The chosen tool is on the selected units, so changing it changes them at once. */
  readonly live: boolean;
  readonly refusal: StepRefusal | null;
  readonly notice: SceneNotice | null;
  readonly instruments: readonly InstrumentView[];
  readonly transport: TransportView;
  readonly rows: readonly UnitRowView[];
  readonly textLayerOpen: boolean;
  readonly objective: string | null;
  readonly objectiveRegions: readonly ObjectiveRegion[];
  readonly note: string;
  readonly coach: CoachStep | null;
  readonly selection: readonly UnitId[];
  readonly arrows: readonly PreviewArrow[];
  /** The compared branch through its window, drawn faintly under the live run. */
  readonly ghostFrames: readonly SceneFrame[];
  readonly unitStyles: readonly SceneUnitStyle[];
  readonly log: LogView;
  readonly trial: TrialView | null;
}
