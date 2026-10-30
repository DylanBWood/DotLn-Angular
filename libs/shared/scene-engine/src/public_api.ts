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
export { runBranch, runTrial, type TrialOutcome } from './lib/trial';
export type {
  Composition,
  CompositionStep,
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
export { length } from './lib/vectors';
