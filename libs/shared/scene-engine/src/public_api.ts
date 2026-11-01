export { blend, firstActive, type WeightedSteering } from './lib/blending';
export {
  advanceFormation,
  formationPatterns,
  patternSlotRoles,
  patternSlots,
  slotPosition,
} from './lib/formation';
export { firstDivergence, hashFrame } from './lib/hash';
export {
  applyStep,
  interpretedKinds,
  isInterpretedKind,
  isSafeStep,
  objectiveKind,
  previewStep,
  readsParam,
  refusalOf,
} from './lib/interpreter';
export { measure, metricNames } from './lib/metrics';
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
  Composition,
  CompositionStep,
  FormationPattern,
  FormationState,
  MetricName,
  PreviewArrow,
  SceneDefinition,
  SceneFrame,
  SceneMetrics,
  SimulationState,
  SlotAssignment,
  StepPreview,
  StepRefusal,
  Trial,
  Unit,
  UnitActivity,
  UnitFrame,
  UnitId,
  Vec2,
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
