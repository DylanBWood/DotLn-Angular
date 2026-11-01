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

/**
 * What every family says about one moment of the example, whatever it draws there. The prose,
 * the worked step and playback read these; only the family reads the rest of its frame.
 */
export interface StudyTick {
  /** Where the moment sits on the example's own clock; Play follows these gaps. */
  readonly seconds: number;
  /** The values `{name}` placeholders in the record's prose read at this moment. */
  readonly values: Readonly<Record<string, string>>;
  /** One sentence on what is happening now, beside the text equivalent. */
  readonly note?: string;
  readonly worked?: StudyWorkedStep;
}

/** One moment of a movement example. */
export interface MotionFrame extends StudyTick {
  readonly bodies: readonly MotionBody[];
  readonly vectors?: readonly MotionVector[];
  readonly marks?: readonly MotionMark[];
  readonly zones?: readonly MotionZone[];
  readonly links?: readonly MotionLink[];
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
  readonly frames: readonly MotionFrame[];
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

/** What happens on one marble line at one frame of the diagram. */
export interface MarbleEvent {
  /**
   * The frame of the whole diagram: a cold input's first character is frame 0, and an inner or
   * late stream's string is placed from the frame it is subscribed at.
   */
  readonly frame: number;
  readonly kind: 'next' | 'complete' | 'error';
  /** The letter the marble string writes for a next, drawn inside the marble. */
  readonly key: string;
  /** What that letter stands for, as the text equivalent names it. */
  readonly value: string;
  /**
   * False for an emission nothing receives: an inner stream's value after it was cut off, or a
   * hot source's value before anyone subscribed. The diagram does not draw these; a spec may
   * still assert them, since they are what the operator dropped.
   */
  readonly delivered: boolean;
  /**
   * For an output value, the label of the lane it rides down from in the drawing; absent for a
   * value that comes from nowhere drawable, such as one a scheduler held back.
   */
  readonly from?: string;
}

/** One line of a marble diagram: a stream, read from the string the executable spec asserts. */
export interface MarbleLine {
  readonly id: string;
  readonly label: string;
  /** An input the example subscribes to, an inner stream the operator opens, or a result. */
  readonly role: 'input' | 'inner' | 'output';
  /** The marble string as the module declares it, so the drawing and the spec share one source. */
  readonly marbles: string;
  readonly events: readonly MarbleEvent[];
  /**
   * The frame the stream is subscribed at: 0 for a hot input, the `^` of its subscription marbles
   * for an inner stream, a late output or an input that declares them; absent for a cold input or
   * an output listened to from the start.
   */
  readonly subscribedAt?: number;
  /** The frame the subscription ends at, by completion, error or cancelling; absent if never. */
  readonly unsubscribedAt?: number;
  /** True when the subscription ended before the stream was done: something was cut off. */
  readonly cancelled: boolean;
}

/** How long Play lingers on one frame of a marble diagram, and the line of the frame glides. */
export const secondsPerFrame = 1.2;

/** One frame of a marble diagram; every frame is a step of the study. */
export interface MarbleFrame extends StudyTick {
  readonly frame: number;
}

/** A marble diagram: inputs above the operator, outputs below, time in frames left to right. */
export interface MarblesModel {
  readonly lines: readonly MarbleLine[];
  /** The operator as the diagram names it, in one short line. */
  readonly operator: string;
  /** The last frame the diagram reaches. */
  readonly lastFrame: number;
  readonly frames: readonly MarbleFrame[];
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

/** What every family's model carries besides its drawing. */
interface StudyModelBase {
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

/** A movement example: bodies over frames, with a chart of what changes beside them. */
export interface MotionStudyModel extends StudyModelBase {
  readonly family: 'motion';
  readonly motion: MotionModel;
  readonly timeline: TimelineModel | null;
}

/** A stream example: the marble diagram its executable spec asserts. */
export interface MarblesStudyModel extends StudyModelBase {
  readonly family: 'marbles';
  readonly marbles: MarblesModel;
}

/**
 * The example worked through: every part of a study reads this one run. The family names which
 * drawing the payload is for, and `ticksOf` reads the moments every family shares.
 */
export type StudyModel = MotionStudyModel | MarblesStudyModel;

/** The moments of the example, whichever family draws them: one tick per step of the scrubber. */
export function ticksOf(model: StudyModel): readonly StudyTick[] {
  return model.family === 'motion' ? model.motion.frames : model.marbles.frames;
}

/** A model module exports this: the record's parameters in, the example's run out. */
export type StudyModelFunction = (parameters: StudyParameters) => StudyModel;

export interface StudyModelModule {
  readonly model: StudyModelFunction;
}
