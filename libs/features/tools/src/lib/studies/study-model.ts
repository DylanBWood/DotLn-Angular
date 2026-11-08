import type { StudyParameters } from '@dotln-angular/models';

import type { StudyTranslate } from './study-translate';

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

/** Named substitutions supplied to the record's prose at one moment. */
export interface StudyValues {
  readonly [name: string]: string;
}

/**
 * What every family says about one moment of the example, whatever it draws there. The prose,
 * the worked step and playback read these; only the family reads the rest of its frame.
 */
export interface StudyTick {
  /** Where the moment sits on the example's own clock; Play follows these gaps. */
  readonly seconds: number;
  /** The values `{name}` placeholders in the record's prose read at this moment. */
  readonly values: StudyValues;
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
  /** One value per x value of the chart. */
  readonly values: readonly number[];
}

/**
 * What a chart's x values hold: the seconds of a movement example's clock, the steps of a run, or
 * a count, such as the studies a reader has opened.
 */
export type TimelineAxis = 'seconds' | 'steps' | 'counts';

/** Where a chart keeps its x values: under the name of what they hold. */
interface TimelineAxes {
  readonly seconds: { readonly seconds: readonly number[] };
  readonly steps: { readonly steps: readonly number[] };
  readonly counts: { readonly counts: readonly number[] };
}

/** A chart's series, axes and marks, whatever its x values hold. */
interface TimelineChart {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
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

/**
 * One or more series along x, with the x values held under the name of what they are, `seconds`
 * by default. A chart whose x values may be any of them is `TimelineModel<TimelineAxis>`. Reading
 * the axis from `TimelineAxes` lets the compiler see that a chart over seconds is a chart over some
 * axis and never the reverse, so a comparison over steps cannot pass for one over seconds.
 */
export type TimelineModel<Axis extends TimelineAxis = 'seconds'> = TimelineChart &
  TimelineAxes[Axis];

/** The x value of each entry of a chart, whatever its x values hold. */
export function xValuesOf(chart: TimelineModel<TimelineAxis>): readonly number[] {
  if ('steps' in chart) return chart.steps;
  if ('counts' in chart) return chart.counts;
  return chart.seconds;
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
   * For an output value, the stable id of the lane it rides down from in the drawing; absent for a
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

/**
 * A place a message reaches in a flow: an endpoint that sends, receives or keeps messages, or a
 * channel drawn as a place of its own, as a queue or a publish-subscribe channel is.
 */
export interface FlowNode {
  readonly id: string;
  /** What the box says: one or two short words, such as `Aggregator` or `Work queue`. */
  readonly label: string;
  /** The column it stands in, from 0 at the left: a flow is laid out one column per stage. */
  readonly stage: number;
  /** Its place in the column from the top, when a stage holds several; 0 when absent. */
  readonly row?: number;
  /** An endpoint is drawn as a box and a channel as a pipe; an endpoint when absent. */
  readonly kind?: 'endpoint' | 'channel';
  /** `subject` for the pattern's own part of the flow; `other` when absent. */
  readonly tone?: StudyTone;
}

/** A line a message travels along, from the node that sends it to the node that receives it. */
export interface FlowLink {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  /** A name the line carries when it is a channel of its own, such as `reply`; none when absent. */
  readonly label?: string;
}

/** A message as a token shows it: a letter or a short number, and what it says. */
export interface FlowToken {
  readonly key: string;
  readonly content: string;
}

/** One message crossing one link at a step, arriving at the link's far end. */
export interface FlowHop extends FlowToken {
  readonly link: string;
}

/** One step of a flow: the messages that move now, and what each node holds afterwards. */
export interface FlowFrame extends StudyTick {
  readonly step: number;
  readonly hops: readonly FlowHop[];
  /** What a node holds or decides after this step, as prose beside it, by node id. */
  readonly states: Readonly<Record<string, string>>;
  /** The messages a node holds after this step, drawn inside it, by node id. */
  readonly held: Readonly<Record<string, readonly FlowToken[]>>;
}

/** Endpoints and channels with the messages that step through them. */
export interface FlowModel {
  readonly nodes: readonly FlowNode[];
  readonly links: readonly FlowLink[];
  readonly frames: readonly FlowFrame[];
}

/**
 * A state an object of the example can be in: a register of a unit of work, the status of a lock,
 * a stage of a request. The register gives each state a column of its own.
 */
export interface StateNode {
  readonly id: string;
  /** What the state is called on screen: one or two short words, such as `Dirty` or `Locked`. */
  readonly label: string;
  /**
   * `subject` for a state the pattern adds, whose name the register draws in bold; the register
   * draws every other tone, and a state without one, plainly.
   */
  readonly tone?: StudyTone;
}

/** A record or object whose state the example follows: one row of the drawing. */
export interface StateObject {
  readonly id: string;
  /** The name its row carries, such as `Scene B`. */
  readonly label: string;
  /** A letter or short number the object's token shows, such as `B`. */
  readonly key: string;
}

/** A way from one state to another, named by the operation that takes it, such as `registerDirty`. */
export interface StateTransition {
  readonly id: string;
  /** Null for the way into the example from outside it, as an object first registered comes. */
  readonly from: string | null;
  /** Null for the way out of the example, as an object deleted when a change is written goes. */
  readonly to: string | null;
  readonly label: string;
}

/** One object changing state at a step; a null end means it enters or leaves the example there. */
export interface StateMove {
  readonly object: string;
  readonly from: string | null;
  readonly to: string | null;
  /** The transition taken, when the example names one for this move. */
  readonly transition?: string;
}

/** Where one object stands after a step, with a few words on what it holds there. */
export interface StatePlacement {
  readonly object: string;
  readonly node: string;
  /** A few words beside the object's token, such as `version 4`; none when absent. */
  readonly note?: string;
}

/** One step of a states example: what moved, and where every tracked object stands afterwards. */
export interface StatesFrame extends StudyTick {
  readonly step: number;
  readonly moves: readonly StateMove[];
  /** Every object the example tracks after this step; one not yet tracked, or forgotten, is absent. */
  readonly placements: readonly StatePlacement[];
}

/** Objects moving between states, one step at a time. */
export interface StatesModel {
  readonly nodes: readonly StateNode[];
  readonly objects: readonly StateObject[];
  readonly transitions: readonly StateTransition[];
  readonly frames: readonly StatesFrame[];
}

/**
 * A second run with one input changed, shown where the study says when the idea fails. Its chart
 * runs over seconds unless the comparison names the axis it runs over.
 */
export interface StudyComparison<Axis extends TimelineAxis = 'seconds'> {
  readonly title: string;
  readonly intro: string;
  readonly timeline: TimelineModel<Axis>;
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
  readonly comparison?: StudyComparison<TimelineAxis>;
  /** The parameters worth changing; none leaves the example fixed. */
  readonly inputs?: readonly StudyInput[];
}

/** A movement example: bodies over frames, with a chart of what changes beside them. */
export interface MotionStudyModel extends StudyModelBase {
  readonly family: 'motion';
  readonly motion: MotionModel;
  readonly timeline: TimelineModel | null;
  /** A movement comparison runs on the example's own clock, as its chart beside the drawing does. */
  readonly comparison?: StudyComparison;
}

/** A stream example: the marble diagram its executable spec asserts. */
export interface MarblesStudyModel extends StudyModelBase {
  readonly family: 'marbles';
  readonly marbles: MarblesModel;
}

/** The marble diagram of a flow whose example runs, with how to read it. */
export interface FlowDiagram {
  readonly marbles: MarblesModel;
  readonly legend: readonly StudyLegendEntry[];
  readonly caption: string;
}

/**
 * A messaging example: messages stepping through endpoints and channels. When the example also
 * runs as a marble example, `diagram` is that marble diagram, one frame for each step of the flow,
 * so a reader can switch between the two drawings at the same moment.
 */
export interface FlowStudyModel extends StudyModelBase {
  readonly family: 'flow';
  readonly flow: FlowModel;
  readonly diagram: FlowDiagram | null;
}

/** A states example: records or objects stepping between the states the pattern gives them. */
export interface StatesStudyModel extends StudyModelBase {
  readonly family: 'states';
  readonly states: StatesModel;
}

/**
 * The example worked through: every part of a study reads this one run. The family names which
 * drawing the payload is for, and `ticksOf` reads the moments every family shares.
 */
export type StudyModel = MotionStudyModel | MarblesStudyModel | FlowStudyModel | StatesStudyModel;

/** The moments of the example, whichever family draws them: one tick per step of the scrubber. */
export function ticksOf(model: StudyModel): readonly StudyTick[] {
  switch (model.family) {
    case 'motion':
      return model.motion.frames;
    case 'flow':
      return model.flow.frames;
    case 'states':
      return model.states.frames;
    default:
      return model.marbles.frames;
  }
}

/** A model module exports this: the record's parameters in, the example's run out. */
export type StudyModelFunction = (parameters: StudyParameters, t: StudyTranslate) => StudyModel;

export interface StudyModelModule {
  readonly model: StudyModelFunction;
}
