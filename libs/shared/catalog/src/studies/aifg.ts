import align from './aifg/align.json';
import arrive from './aifg/arrive.json';
import equilibriumFallback from './aifg/equilibrium-fallback.json';
import face from './aifg/face.json';
import fixedFormations from './aifg/fixed-formations.json';
import flocking from './aifg/flocking.json';
import formationPatternInterface from './aifg/formation-pattern-interface.json';
import groupMovement from './aifg/group-movement.json';
import makingTheCreatures from './aifg/making-the-creatures.json';
import prioritySteering from './aifg/priority-steering.json';
import pursue from './aifg/pursue.json';
import scalableFormations from './aifg/scalable-formations.json';
import seek from './aifg/seek.json';
import separation from './aifg/separation.json';
import slotAssignment from './aifg/slot-assignment.json';
import steeringPipeline from './aifg/steering-pipeline.json';
import twoLevelFormationSteering from './aifg/two-level-formation-steering.json';
import velocityMatching from './aifg/velocity-matching.json';
import wander from './aifg/wander.json';
import weightedBlending from './aifg/weighted-blending.json';

// The work's studies load as one chunk, the first time one of them is read. The studies check
// refuses a record this list misses.
export default [
  align,
  arrive,
  equilibriumFallback,
  face,
  fixedFormations,
  flocking,
  formationPatternInterface,
  groupMovement,
  makingTheCreatures,
  prioritySteering,
  pursue,
  scalableFormations,
  seek,
  separation,
  slotAssignment,
  steeringPipeline,
  twoLevelFormationSteering,
  velocityMatching,
  wander,
  weightedBlending,
];
