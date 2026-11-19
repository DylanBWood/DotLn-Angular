export { blend, firstActive, type WeightedSteering } from './lib/blending';
export {
  advanceFormation,
  formationPatterns,
  patternSlotRoles,
  patternSlots,
  slotPosition,
} from './lib/formation';
export { emptyGeometry } from './lib/geometry';
export { gridGraph, type PlainGrid, type TileGraph, tileGraph } from './lib/graph';
export { firstDivergence, hashFrame } from './lib/hash';
export {
  applyStep,
  type FieldKind,
  fieldDefaults,
  interpretedKinds,
  isFieldKind,
  isInterpretedKind,
  isSafeStep,
  leastValueOf,
  nextShapeNumber,
  objectiveKind,
  previewStep,
  readsParam,
  refusalOf,
} from './lib/interpreter';
export { measure, metricNames } from './lib/metrics';
export { impactFrames } from './lib/projectiles';
export { routesOf } from './lib/path-following';
export {
  findPath,
  heuristics,
  type PathSearch,
  type SearchOptions,
  searchAt,
  travelWeightParams,
} from './lib/pathfinding';
export { assignmentOf, squadOf, unitsFollowingNothing } from './lib/queries';
export { advanceRun, applyToRun, type SceneRun, startRun } from './lib/run';
export {
  advance,
  createSimulation,
  frameOf,
  frameSeconds,
  isAtRest,
  stillSpeed,
} from './lib/simulation';
export { assignSlots, type SlotCandidate, type SlotCosts } from './lib/slot-assignment';
export {
  type ArrivalTuning,
  arrive,
  avoid,
  avoidCollisions,
  flee,
  keepOnField,
  matchVelocity,
  seek,
  separate,
  type SeparationTuning,
  type SteeringBody,
  wander,
  type WanderTuning,
} from './lib/steering';
export { runBranch, runTrial, type TrialOutcome } from './lib/trial';
export type {
  BulletState,
  Composition,
  CompositionStep,
  FormationPattern,
  FormationState,
  Heuristic,
  Impact,
  MetricName,
  NoRouteReason,
  Obstacle,
  PathSettings,
  PreviewArrow,
  RayFrame,
  RouteFrame,
  RouteReading,
  SceneDefinition,
  SceneFrame,
  SceneGeometry,
  SceneMetrics,
  ShotPreview,
  SearchRecord,
  SearchStep,
  SimulationState,
  SlotAssignment,
  StepPreview,
  StepRefusal,
  Trial,
  TrialSeries,
  Unit,
  UnitActivity,
  UnitFrame,
  UnitId,
  UnitRoute,
  Vec2,
  Wall,
} from './lib/types';
export {
  add,
  alongHeading,
  centroid,
  clipLength,
  cosine,
  distance,
  dot,
  length,
  normalize,
  scale,
  sine,
  subtract,
  zero,
} from './lib/vectors';
