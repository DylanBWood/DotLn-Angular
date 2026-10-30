import { translateSignal } from '@dotln-angular/i18n';
import { TransformKind } from '@dotln-angular/models';

/** Every word the facade chooses between. Each key is written out so the key check can see it. */
export function sceneLabels() {
  return {
    rail: {
      move: translateSignal('scene.rail.move'),
      group: translateSignal('scene.rail.group'),
      avoid: translateSignal('scene.rail.avoid'),
      form: translateSignal('scene.rail.form'),
    },
    patterns: {
      wedge: translateSignal('scene.rail.wedge'),
      line: translateSignal('scene.rail.line'),
      column: translateSignal('scene.rail.column'),
    },
    instruments: {
      cohesionRadius: translateSignal('scene.instruments.cohesionRadius'),
      collisions: translateSignal('scene.instruments.collisions'),
      headingVariance: translateSignal('scene.instruments.headingVariance'),
      timeToObjective: translateSignal('scene.instruments.timeToObjective'),
      stalledUnits: translateSignal('scene.instruments.stalledUnits'),
    },
    instrumentUnits: {
      cohesionRadius: translateSignal('scene.instruments.distance'),
      collisions: translateSignal('scene.instruments.pairs'),
      headingVariance: translateSignal('scene.instruments.spread'),
      timeToObjective: translateSignal('scene.instruments.seconds'),
      stalledUnits: translateSignal('scene.instruments.units'),
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
    },
    transforms: {
      [TransformKind.SteerBlend]: translateSignal('scene.inspector.blend'),
      [TransformKind.SteerPriority]: translateSignal('scene.inspector.priority'),
      [TransformKind.FormationTwoLevel]: translateSignal('scene.inspector.twoLevel'),
      [TransformKind.FormationFixed]: translateSignal('scene.inspector.fixed'),
    },
    objectiveStep: translateSignal('scene.log.objective'),
  };
}
