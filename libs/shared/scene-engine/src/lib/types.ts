export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type UnitId = string;

/** A unit as a scene defines it. Its labels are only what a person reads. */
export interface Unit {
  readonly id: UnitId;
  readonly labels: Readonly<Record<string, string>>;
  /** The class a slot-assignment cost table reads. */
  readonly unitClass: string;
  readonly position: Vec2;
  readonly velocity: Vec2;
  /** The direction the unit faces at rest, as a unit vector. */
  readonly heading: Vec2;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
}

export interface SceneDefinition {
  readonly id: string;
  readonly sceneType: 'units-on-terrain';
  readonly field: { readonly width: number; readonly height: number };
  readonly seed: number;
  readonly units: readonly Unit[];
}

/** One step of a composition: a catalog transform applied to units at a frame. */
export interface CompositionStep {
  readonly at: number;
  readonly toolId: string;
  readonly kind: string;
  readonly selection: readonly UnitId[];
  readonly params: Readonly<Record<string, number>>;
}

export type SteeringTerm =
  'seek' | 'arrive' | 'flee' | 'separation' | 'cohesion' | 'velocityMatch' | 'wander' | 'avoidance';

export interface SteeringTuning {
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly timeToTarget: number;
  readonly separationThreshold: number;
  /** One is a linear falloff, two is inverse-square. */
  readonly separationFalloff: number;
  readonly wanderRadius: number;
  readonly wanderOffset: number;
  readonly wanderScale: number;
}

export type PriorityGroup = 'avoidance' | 'separation' | 'seek' | 'wander';

export interface PrioritySpec {
  /** Groups in the order they are tried; the first whose output clears epsilon wins. */
  readonly order: readonly PriorityGroup[];
  readonly epsilon: number;
}

export interface UnitBehaviour {
  readonly weights: Readonly<Partial<Record<SteeringTerm, number>>>;
  readonly tuning: SteeringTuning;
  /** The units cohesion and velocity matching read; empty until a group tool is applied. */
  readonly group: readonly UnitId[];
  readonly priority: PrioritySpec | null;
}

export interface UnitState {
  readonly id: UnitId;
  readonly unitClass: string;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly behaviour: UnitBehaviour;
  readonly wanderAngle: number;
  readonly wanderSeed: number;
  /** Consecutive frames spent still while a goal remains unreached. */
  readonly stallFrames: number;
}

export type FormationPattern = 'wedge' | 'line' | 'column';

/** One member's place in a formation, in assignment order. */
export interface SlotAssignment {
  readonly unitId: UnitId;
  readonly slot: number;
  readonly slotRole: string;
  readonly cost: number;
}

export interface FormationState {
  readonly kind: 'two-level' | 'fixed';
  readonly slots: readonly Vec2[];
  readonly assignment: readonly SlotAssignment[];
  /** The anchor of a two-level formation, or the leader's position in a fixed one. */
  readonly anchor: Vec2;
  readonly anchorVelocity: Vec2;
  readonly heading: Vec2;
  readonly anchorSpeed: number;
  readonly lagLimit: number;
  readonly leader: UnitId | null;
}

export interface ObjectiveState {
  readonly position: Vec2;
  /** The tick the current run toward the objective began. */
  readonly startedAt: number;
  readonly arrivedAt: number | null;
  /** The tick since which every unit heading here has been slow, while they still are. */
  readonly slowSince: number | null;
}

export interface SimulationState {
  readonly definition: SceneDefinition;
  readonly tick: number;
  readonly units: readonly UnitState[];
  readonly objective: ObjectiveState | null;
  readonly formations: readonly FormationState[];
}

export type UnitActivity = 'idle' | 'moving' | 'arrived' | 'stalled' | 'formed';

export interface UnitFrame {
  readonly id: UnitId;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
  readonly radius: number;
  readonly activity: UnitActivity;
}

/** What a painter draws: everything visible in one frame, and nothing it would have to derive. */
export interface SceneFrame {
  readonly frameNo: number;
  readonly field: SceneDefinition['field'];
  readonly units: readonly UnitFrame[];
  readonly anchors: readonly Vec2[];
  readonly slots: readonly Vec2[];
  /** The midpoint of every pair of units touching this frame. */
  readonly collisions: readonly Vec2[];
  readonly objective: Vec2 | null;
}

export interface SceneMetrics {
  readonly cohesionRadius: number;
  readonly collisions: number;
  readonly headingVariance: number;
  readonly timeToObjective: number | null;
  readonly stalledUnits: number;
  readonly anchorToMean: number | null;
  readonly slotError: number | null;
  readonly assignmentCost: number | null;
}

export type MetricName = keyof SceneMetrics;

export interface StepRefusal {
  /** Why the step was refused: a kind this engine does not run, or nothing to run it on. */
  readonly code: 'uninterpreted' | 'no-units';
  readonly kind: string;
  readonly reason: string;
}

export interface StepResult {
  readonly state: SimulationState;
  readonly refusal: StepRefusal | null;
}

export interface PreviewArrow {
  readonly id: UnitId;
  readonly position: Vec2;
  readonly acceleration: Vec2;
}

/** The first frame's effect of a step, computed without applying it. */
export interface StepPreview {
  readonly arrows: readonly PreviewArrow[];
  readonly assignment: readonly SlotAssignment[];
  readonly refusal: StepRefusal | null;
}

export interface TrialBranch {
  readonly label: string;
  readonly steps: readonly CompositionStep[];
}

export interface TrialSeries {
  readonly a: readonly (number | null)[];
  readonly b: readonly (number | null)[];
}

/** A saved piece of authoring: the steps, the operator's note and the trials they kept. */
export interface Composition {
  readonly id: string;
  readonly title: string;
  readonly sceneId: string;
  readonly seed: number;
  readonly steps: readonly CompositionStep[];
  readonly note: string;
  readonly trials: readonly Trial[];
}

/** Two branches of one scene from one seed over the same frames. */
export interface Trial {
  readonly id: string;
  readonly sceneId: string;
  readonly seed: number;
  /** The frame the compared window opens on: everything before it is shared by both branches. */
  readonly from: number;
  /** How many frames the window runs for. */
  readonly frames: number;
  readonly sampleEvery: number;
  readonly focus: readonly UnitId[];
  readonly branchA: TrialBranch;
  readonly branchB: TrialBranch;
  readonly metrics: Readonly<Record<MetricName, TrialSeries>>;
  readonly firstDivergenceFrame: number | null;
}
