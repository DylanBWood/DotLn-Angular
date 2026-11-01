import type {
  ConceptStudy,
  ParamSpec,
  StudyImplementation,
  StudyReference,
  Tool,
  ToolId,
} from '@dotln-angular/models';

import type {
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
export type StudyVisualView = 'motion' | 'timeline';
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

/** The drawing at the selected moment, with the record's prose filled from that moment. */
export interface StudyDrawingView {
  readonly view: StudyVisualView;
  readonly motion: MotionModel;
  readonly timeline: TimelineModel | null;
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

/** A mechanism step with the lines of pseudocode it explains. */
export interface StudyStepView {
  readonly title: string;
  readonly text: string;
  readonly code: string;
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
  readonly rxjs: { readonly code: string; readonly executable: boolean } | null;
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
