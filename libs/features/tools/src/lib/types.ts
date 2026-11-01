import type {
  ConceptStudy,
  ParamSpec,
  StudyImplementation,
  StudyReference,
  Tool,
  ToolId,
} from '@dotln-angular/models';

import type {
  FlowModel,
  MarblesModel,
  MotionModel,
  StudyComparison,
  StudyInput,
  StudyLegendEntry,
  StudyMoment,
  StudyWorkedStep,
  TimelineModel,
} from './studies/study-model';

export type StudySection = 'mechanism' | 'reactive' | 'limits' | 'elsewhere';
/** Every disclosure of a study: its explanations and the smaller ones around the drawing. */
export type StudyDisclosure = StudySection | 'example' | 'numbers' | 'inputs' | 'legend';
/** Which drawing of the example shows: movement or its chart, or a flow or its marble diagram. */
export type StudyVisualView = 'motion' | 'timeline' | 'flow' | 'marbles';
export type StudyStatus = 'none' | 'loading' | 'failed' | 'ready';

/** What a reader does to a study; one output carries them all up to the facade. */
export type StudyIntent =
  | { readonly kind: 'step'; readonly step: number }
  | { readonly kind: 'play'; readonly playing: boolean }
  | { readonly kind: 'input'; readonly name: string; readonly value: number }
  | { readonly kind: 'resetInputs' }
  | { readonly kind: 'view'; readonly view: StudyVisualView }
  | { readonly kind: 'expand'; readonly section: StudyDisclosure; readonly open: boolean };

/** An input of the example with the value it has now. */
export interface StudyInputView extends StudyInput {
  readonly value: number;
}

/** What every family's drawing shows at the selected moment, with the record's prose filled. */
interface StudyDrawingViewBase {
  readonly step: number;
  readonly moments: readonly StudyMoment[];
  readonly legend: readonly StudyLegendEntry[];
  readonly caption: string;
  readonly textEquivalent: string;
  readonly note: string | null;
  /** Whether the example is running; null when a reader asked for reduced motion. */
  readonly playing: boolean | null;
  readonly inputs: readonly StudyInputView[];
}

/** A movement drawing, with the chart it switches to when the model has one. */
export interface MotionDrawingView extends StudyDrawingViewBase {
  readonly family: 'motion';
  readonly view: StudyVisualView;
  readonly motion: MotionModel;
  readonly timeline: TimelineModel | null;
}

/** A marble diagram at the selected frame. */
export interface MarblesDrawingView extends StudyDrawingViewBase {
  readonly family: 'marbles';
  readonly marbles: MarblesModel;
}

/** A flow at the selected step, with the marble diagram of the same run when it executes. */
export interface FlowDrawingView extends StudyDrawingViewBase {
  readonly family: 'flow';
  readonly view: 'flow' | 'marbles';
  readonly flow: FlowModel;
  readonly marbles: MarblesModel | null;
}

/** The drawing at the selected moment; the family says which composite draws it. */
export type StudyDrawingView = MotionDrawingView | MarblesDrawingView | FlowDrawingView;

/** A mechanism step with the lines of pseudocode it explains. */
export interface StudyStepView {
  readonly title: string;
  readonly text: string;
  readonly code: string;
}

/** The RxJS reading: its code, and the spec that ran it when the record says it is executable. */
export interface StudyRxjsView {
  readonly code: string;
  readonly executable: boolean;
  /** The repository path of the spec beside the executable module; null for an illustrative reading. */
  readonly spec: string | null;
}

export interface StudyView {
  readonly id: ToolId;
  readonly authoredBy: string;
  readonly authoredOn: string;
  readonly reviewers: string;
  readonly intuition: ConceptStudy['intuition'];
  readonly example: ConceptStudy['example'];
  readonly visual: StudyDrawingView | null;
  readonly expanded: readonly StudyDisclosure[];
  readonly worked: StudyWorkedStep | null;
  readonly pseudocode: string;
  readonly steps: readonly StudyStepView[];
  readonly rxjs: StudyRxjsView | null;
  readonly limits: readonly string[];
  readonly comparison: StudyComparison | null;
  readonly implementations: readonly StudyImplementation[];
  readonly references: readonly StudyReference[];
  readonly nearby: readonly {
    readonly id: ToolId;
    readonly title: string;
    readonly why: string;
  }[];
  /** The next studied concept of the work, in source order; none after the last. */
  readonly next: { readonly id: ToolId; readonly title: string } | null;
}

export interface ReadingView {
  readonly tool: Tool;
  readonly place: string;
  readonly faces: {
    readonly scenes: string;
    readonly target: string;
    readonly minimum: number;
    readonly maximum: number | null;
    readonly transform: string;
    readonly observable: string;
    readonly metrics: string;
    readonly params: readonly ParamSpec[];
  } | null;
  readonly hooks: readonly { readonly domain: string; readonly clauses: readonly string[] }[];
  readonly relations: readonly { readonly title: string; readonly id: ToolId | null }[];
  readonly sceneTool: boolean;
  readonly study: StudyView | null;
  readonly studyStatus: StudyStatus;
}
