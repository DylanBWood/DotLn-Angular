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

/** A wall: a segment with a thickness, standing over every point within half of it. */
export interface Wall {
  /** The number a later step names to replace or clear it. */
  readonly shape: number;
  readonly from: Vec2;
  readonly to: Vec2;
  readonly thickness: number;
}

/** An obstacle: a disc. */
export interface Obstacle {
  readonly shape: number;
  readonly centre: Vec2;
  readonly radius: number;
}

/** What stands on the field, and the size of the cells its tile graph divides it into. */
export interface SceneGeometry {
  readonly walls: readonly Wall[];
  readonly obstacles: readonly Obstacle[];
  readonly cellSize: number;
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
  | 'seek'
  | 'arrive'
  | 'flee'
  | 'separation'
  | 'cohesion'
  | 'velocityMatch'
  | 'wander'
  | 'avoidance'
  | 'obstacleAvoidance';

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
  /** How far ahead obstacle and wall avoidance casts its ray. */
  readonly lookAhead: number;
  /** The angle of its two whiskers from the ray, in degrees; none at zero. */
  readonly whiskerAngle: number;
  /** How far from a surface it steers for, along the surface's normal. */
  readonly avoidDistance: number;
}

export type PriorityGroup = 'avoidance' | 'separation' | 'seek' | 'wander';

export interface PrioritySpec {
  /** Groups in the order they are tried; the first whose output clears epsilon wins. */
  readonly order: readonly PriorityGroup[];
  readonly epsilon: number;
}

export type Heuristic = 'zero' | 'manhattan' | 'euclidean' | 'octile';

/** How a unit finds and follows a route, as the path tools set it. */
export interface PathSettings {
  readonly heuristic: Heuristic;
  /** How many waypoints a shortcut may skip, or null when the route is not smoothed. */
  readonly maxSkip: number | null;
  /** How near a waypoint the unit comes before it makes for the next. */
  readonly waypointRadius: number;
  /** How far along its route ahead of itself the unit aims. */
  readonly pathOffset: number;
  /** How far ahead along its velocity the unit judges where it is, in seconds. */
  readonly predictTime: number;
  /** The cost functions' weights, by the catalog's parameter names. */
  readonly costs: Readonly<Record<string, number>>;
}

export interface UnitBehaviour {
  readonly weights: Readonly<Partial<Record<SteeringTerm, number>>>;
  readonly tuning: SteeringTuning;
  /** The units cohesion and velocity matching read; empty until a group tool is applied. */
  readonly group: readonly UnitId[];
  readonly priority: PrioritySpec | null;
  /** Set once a path tool is applied: the unit then finds and follows a route to the objective. */
  readonly path: PathSettings | null;
}

/** Why a unit has no route. */
export type NoRouteReason = 'unreachable-start' | 'unreachable-goal' | 'no-path';

/** One expansion of a search: the cell it closed and the cells that put on its frontier. */
export interface SearchStep {
  readonly expanded: number;
  readonly opened: readonly number[];
}

/** What a search did on its tile graph, for drawing and for stepping through it. */
export interface SearchRecord {
  readonly columns: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly expansions: number;
  /** The cells it expanded, in order. */
  readonly closed: readonly number[];
  /** The cells left on its frontier when it stopped. */
  readonly open: readonly number[];
  readonly trace: readonly SearchStep[];
}

/** A unit's route to the objective, or the reason it has none. */
export interface UnitRoute {
  readonly status: 'following' | 'blocked';
  readonly reason: NoRouteReason | null;
  /** The route from where the unit stood when it planned, ending at the objective. */
  readonly waypoints: readonly Vec2[];
  /** The waypoint the unit is making for. */
  readonly next: number;
  readonly search: SearchRecord | null;
  /** How many times the unit has planned again since its first route. */
  readonly replans: number;
  readonly plannedAt: number;
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
  readonly route: UnitRoute | null;
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
  readonly geometry: SceneGeometry;
}

export type UnitActivity = 'idle' | 'moving' | 'arrived' | 'stalled' | 'formed' | 'blocked';

export interface UnitFrame {
  readonly id: UnitId;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
  readonly radius: number;
  readonly activity: UnitActivity;
}

/** A unit's route as a painter and the text layer read it. */
export interface RouteFrame {
  readonly id: UnitId;
  /** From where the unit stands through the waypoints still ahead; empty when it has no route. */
  readonly ahead: readonly Vec2[];
  readonly reason: NoRouteReason | null;
  readonly search: SearchRecord | null;
  /** The unit planned this route again within the last half second. */
  readonly replanning: boolean;
}

/** One ray obstacle and wall avoidance cast this frame, and where it stopped. */
export interface RayFrame {
  readonly id: UnitId;
  readonly from: Vec2;
  readonly to: Vec2;
  readonly hit: boolean;
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
  readonly geometry: SceneGeometry;
  readonly routes: readonly RouteFrame[];
  readonly rays: readonly RayFrame[];
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
  /** The mean length of route the focus units still have to walk, or null when none follows one. */
  readonly pathLength: number | null;
  /** How many times the focus units have planned again. */
  readonly replans: number;
  /** How many focus units have no route to the objective. */
  readonly blockedUnits: number;
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

/** A unit's route as the inspector reads it, with the length still to walk. */
export interface RouteReading {
  readonly id: UnitId;
  readonly route: UnitRoute;
  /** How much route the unit still has to walk, or null when it has none. */
  readonly length: number | null;
}

/** The first frame's effect of a step, computed without applying it. */
export interface StepPreview {
  readonly arrows: readonly PreviewArrow[];
  readonly assignment: readonly SlotAssignment[];
  /** The routes the step's units would follow, or why they would have none. */
  readonly routes: readonly RouteReading[];
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
