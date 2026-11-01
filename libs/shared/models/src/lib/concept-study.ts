import type { ToolId, WorkSlug } from './toolbox';

/**
 * The kinds of drawing a study can use. A family lands with the batch that first needs it, so
 * a name here does not promise a renderer for it yet.
 */
export const visualFamilies = [
  'motion',
  'timeline',
  'marbles',
  'flow',
  'states',
  'relations',
] as const;
export type VisualFamily = (typeof visualFamilies)[number];

export const studyStates = ['draft', 'checked'] as const;
export type StudyState = (typeof studyStates)[number];

export type StudyParameters = Readonly<Record<string, number | string>>;

export interface StudyStep {
  readonly title: string;
  readonly text: string;
}

export interface StudyVisual {
  readonly family: VisualFamily;
  /** Repository path of the model module the drawing reads, or null for a drawing with none. */
  readonly model: string | null;
  readonly textEquivalent: string;
}

export interface StudyExecutable {
  readonly kind: 'rxjs' | 'typescript';
  /** Repository path of a module with a spec beside it. */
  readonly module: string;
}

export interface StudyImplementation {
  readonly project: string;
  readonly url: string;
  readonly relevance: string;
  readonly explanation: string;
}

export interface StudyReference {
  readonly title: string;
  readonly url: string;
  /** The ISO date the author opened it. */
  readonly accessed: string;
  /** The claim the reference is cited for. */
  readonly supports: string;
}

/**
 * One concept studied from several sides, in its author's own words. A representation the idea
 * does not need is null or an empty list, never filled to match the other studies.
 */
export interface ConceptStudy {
  readonly schema: 'concept-study-v0';
  readonly id: ToolId;
  readonly work: WorkSlug;
  readonly slug: string;
  readonly authored: {
    readonly by: string;
    readonly on: string;
    readonly reviewedBy: readonly string[];
    readonly state: StudyState;
  };
  readonly intuition: { readonly text: string; readonly situation: string };
  readonly example: {
    readonly name: string;
    readonly description: string;
    readonly parameters: StudyParameters;
  };
  readonly mechanism: { readonly steps: readonly StudyStep[] };
  readonly pseudocode: {
    readonly ordinary: string;
    readonly rxjs: string | null;
    readonly executable: StudyExecutable | null;
  };
  readonly visual: StudyVisual | null;
  readonly implementations: readonly StudyImplementation[];
  readonly references: readonly StudyReference[];
  readonly limits: readonly string[];
  readonly nearby: readonly { readonly id: ToolId; readonly why: string }[];
}

/** The ids of a work's studies with their state, so a page can count them without loading any. */
export interface StudiesSummary {
  readonly schema: 'studies-summary-v0';
  readonly works: readonly {
    readonly work: WorkSlug;
    readonly studies: readonly { readonly id: ToolId; readonly state: StudyState }[];
  }[];
}

/** What a page can say about the works before loading any of them. */
export interface CatalogSummary {
  readonly works: readonly { readonly work: WorkSlug; readonly count: number }[];
  readonly studies: StudiesSummary;
}
