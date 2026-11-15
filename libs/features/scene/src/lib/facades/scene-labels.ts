import { translateSignal } from '@dotln-angular/i18n';
import { TransformKind } from '@dotln-angular/models';

/** Every word the facade chooses between. Each key is written out so the key check can see it. */
export function sceneLabels() {
  return {
    rail: {
      move: translateSignal('scene.rail.move'),
      ways: translateSignal('scene.rail.ways'),
      group: translateSignal('scene.rail.group'),
      avoid: translateSignal('scene.rail.avoid'),
      form: translateSignal('scene.rail.form'),
    },
    // The named values a parameter offers: formation patterns and A*'s heuristics.
    choices: {
      wedge: translateSignal('scene.rail.wedge'),
      line: translateSignal('scene.rail.line'),
      column: translateSignal('scene.rail.column'),
      zero: translateSignal('scene.inspector.heuristicZero'),
      manhattan: translateSignal('scene.inspector.heuristicManhattan'),
      euclidean: translateSignal('scene.inspector.heuristicEuclidean'),
      octile: translateSignal('scene.inspector.heuristicOctile'),
    },
    instruments: {
      cohesionRadius: translateSignal('scene.instruments.cohesionRadius'),
      collisions: translateSignal('scene.instruments.collisions'),
      headingVariance: translateSignal('scene.instruments.headingVariance'),
      timeToObjective: translateSignal('scene.instruments.timeToObjective'),
      stalledUnits: translateSignal('scene.instruments.stalledUnits'),
      pathLength: translateSignal('scene.instruments.pathLength'),
      replans: translateSignal('scene.instruments.replans'),
      blockedUnits: translateSignal('scene.instruments.blockedUnits'),
    },
    instrumentUnits: {
      cohesionRadius: translateSignal('scene.instruments.distance'),
      collisions: translateSignal('scene.instruments.pairs'),
      headingVariance: translateSignal('scene.instruments.spread'),
      timeToObjective: translateSignal('scene.instruments.seconds'),
      stalledUnits: translateSignal('scene.instruments.units'),
      pathLength: translateSignal('scene.instruments.distance'),
      replans: translateSignal('scene.instruments.times'),
      blockedUnits: translateSignal('scene.instruments.units'),
    },
    unknown: translateSignal('scene.instruments.unknown'),
    positions: {
      'north-west': translateSignal('scene.units.northWest'),
      north: translateSignal('scene.units.north'),
      'north-east': translateSignal('scene.units.northEast'),
      west: translateSignal('scene.units.west'),
      centre: translateSignal('scene.units.centre'),
      east: translateSignal('scene.units.east'),
      'south-west': translateSignal('scene.units.southWest'),
      south: translateSignal('scene.units.south'),
      'south-east': translateSignal('scene.units.southEast'),
    },
    speeds: {
      still: translateSignal('scene.units.still'),
      walking: translateSignal('scene.units.walking'),
      running: translateSignal('scene.units.running'),
    },
    activities: {
      idle: translateSignal('scene.units.idle'),
      moving: translateSignal('scene.units.moving'),
      arrived: translateSignal('scene.units.arrived'),
      stalled: translateSignal('scene.units.stalled'),
      formed: translateSignal('scene.units.formed'),
      blocked: translateSignal('scene.units.blocked'),
    },
    routes: {
      'on-path': translateSignal('scene.units.onPath'),
      replanning: translateSignal('scene.units.replanning'),
      'no-route': translateSignal('scene.units.noRoute'),
    },
    shapeValues: {
      x1: translateSignal('scene.geometry.x1'),
      y1: translateSignal('scene.geometry.y1'),
      x2: translateSignal('scene.geometry.x2'),
      y2: translateSignal('scene.geometry.y2'),
      thickness: translateSignal('scene.geometry.thickness'),
      x: translateSignal('scene.geometry.x'),
      y: translateSignal('scene.geometry.y'),
      radius: translateSignal('scene.geometry.radius'),
    },
    fieldSteps: {
      'field.wall': translateSignal('scene.log.wall'),
      'field.obstacle': translateSignal('scene.log.obstacle'),
      'field.clear': translateSignal('scene.log.cleared'),
      'field.grid': translateSignal('scene.log.grid'),
    },
    shapeRemoved: translateSignal('scene.log.removed'),
    transforms: {
      [TransformKind.SteerBlend]: translateSignal('scene.inspector.blend'),
      [TransformKind.SteerPriority]: translateSignal('scene.inspector.priority'),
      [TransformKind.FormationTwoLevel]: translateSignal('scene.inspector.twoLevel'),
      [TransformKind.FormationFixed]: translateSignal('scene.inspector.fixed'),
      [TransformKind.PathFind]: translateSignal('scene.inspector.find'),
      [TransformKind.PathSmooth]: translateSignal('scene.inspector.smooth'),
      [TransformKind.PathFollow]: translateSignal('scene.inspector.follow'),
      [TransformKind.PathCost]: translateSignal('scene.inspector.cost'),
    },
    objectiveStep: translateSignal('scene.log.objective'),
  };
}
