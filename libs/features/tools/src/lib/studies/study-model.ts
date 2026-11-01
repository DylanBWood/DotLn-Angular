import type { StudyParameters } from '@dotln-angular/models';

/** What a mark in a drawing stands for. The family turns this into its colour and line. */
export type StudyTone = 'subject' | 'target' | 'actual' | 'desired' | 'other' | 'zone' | 'muted';

export interface StudyPoint {
  readonly x: number;
  readonly y: number;
}

/** Something that moves. A heading in radians draws an arrowhead instead of a dot. */
export interface MotionBody extends StudyPoint {
  readonly id: string;
  readonly tone?: StudyTone;
  readonly heading?: number;
  /** A short name drawn beside the body. */
  readonly label?: string;
}

/** An arrow from a point, in the drawing's own units. */
export interface MotionVector extends StudyPoint {
  readonly dx: number;
  readonly dy: number;
  readonly tone: StudyTone;
}

/** A fixed place: a cross for a target, a ring for a slot, a dot for anything else. */
export interface MotionMark extends StudyPoint {
  readonly shape: 'cross' | 'ring' | 'dot';
  readonly tone?: StudyTone;
  /** A short name drawn beside the mark. */
  readonly label?: string;
}

/** A circular region, such as a slowing radius or a neighbourhood. */
export interface MotionZone extends StudyPoint {
  readonly radius: number;
  readonly tone?: StudyTone;
}

/** A line between two places, such as a unit and its slot. */
export interface MotionLink {
  readonly from: StudyPoint;
  readonly to: StudyPoint;
  readonly tone?: StudyTone;
}

/** The arithmetic of one moment, shown beside the pseudocode while the mechanism is open. */
export interface StudyWorkedStep {
  readonly title: string;
  /** Each line of the calculation, in order; empty for a moment with nothing to work out. */
  readonly lines: readonly string[];
  readonly note?: string;
}

/** One moment of the example. */
export interface StudyFrame {
  readonly seconds: number;
  readonly bodies: readonly MotionBody[];
  readonly vectors?: readonly MotionVector[];
  readonly marks?: readonly MotionMark[];
  readonly zones?: readonly MotionZone[];
  readonly links?: readonly MotionLink[];
  /** The values `{name}` placeholders in the record's prose read at this moment. */
  readonly values: Readonly<Record<string, string>>;
  /** One sentence on what is happening now, beside the text equivalent. */
  readonly note?: string;
  readonly worked?: StudyWorkedStep;
}

export interface MotionBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** The positions of one or more bodies over time. A one-dimensional example keeps y at 0. */
export interface MotionModel {
  readonly bounds: MotionBounds;
  readonly frames: readonly StudyFrame[];
  /** Draw where each body has just been. */
  readonly trail?: boolean;
}

export interface TimelineSeries {
  readonly id: string;
  readonly label: string;
  readonly tone: StudyTone;
  /** One value per entry of the timeline's `seconds`. */
  readonly values: readonly number[];
}

/** One or more series over time. */
export interface TimelineModel {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly seconds: readonly number[];
  readonly series: readonly TimelineSeries[];
  /** The window drawn; the whole run and all its values when absent. */
  readonly xRange?: readonly [number, number];
  readonly yRange?: readonly [number, number];
  readonly xTicks?: readonly number[];
  readonly yTicks?: readonly number[];
  /** A horizontal line that means something, such as the target. */
  readonly reference?: number;
  /** Points worth marking, such as a peak. */
  readonly marks?: readonly (StudyPoint & { readonly tone: StudyTone })[];
}

/** A second run with one input changed, shown where the study says when the idea fails. */
export interface StudyComparison {
  readonly title: string;
  readonly intro: string;
  readonly timeline: TimelineModel;
  readonly findings: readonly string[];
  readonly note?: string;
}

export interface StudyMoment {
  readonly label: string;
  readonly step: number;
}

/** What a legend says about one tone. */
export interface StudyLegendEntry {
  readonly tone: StudyTone;
  readonly label: string;
}

/** A parameter of the example a reader may change; the model reruns on each change. */
export interface StudyInput {
  readonly name: string;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** The example worked through: every part of a study reads this one run. */
export interface StudyModel {
  readonly motion: MotionModel;
  readonly timeline: TimelineModel | null;
  /** The moment the drawing opens on. */
  readonly initialStep: number;
  readonly moments: readonly StudyMoment[];
  readonly legend: readonly StudyLegendEntry[];
  /** How to read the drawing, shown under it. */
  readonly caption: string;
  readonly comparison?: StudyComparison;
  /** The parameters worth changing; none leaves the example fixed. */
  readonly inputs?: readonly StudyInput[];
}

/** A model module exports this: the record's parameters in, the example's run out. */
export type StudyModelFunction = (parameters: StudyParameters) => StudyModel;

export interface StudyModelModule {
  readonly model: StudyModelFunction;
}
