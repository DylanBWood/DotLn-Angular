import type { StudyParameters } from '@dotln-angular/models';
import {
  advanceFormation,
  cosine,
  createSimulation,
  distance,
  type FormationState,
  patternSlots,
  sine,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface FixedFormationParameters {
  readonly members: number;
  readonly leaderX: number;
  readonly leaderY: number;
  readonly spacing: number;
  readonly turnDegrees: number;
  readonly turnStart: number;
  readonly turnSteps: number;
  readonly fastTurnSteps: number;
  readonly speedLimit: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface FixedFormationSample {
  readonly step: number;
  readonly seconds: number;
  readonly angleDegrees: number;
  readonly angleRadians: number;
  readonly formation: FormationState;
  readonly targets: readonly Vec2[];
  readonly previousTargets: readonly Vec2[];
  readonly displacement: number;
  readonly requiredSpeed: number;
}

export const readParameters = (parameters: StudyParameters): FixedFormationParameters => ({
  members: numberParameter(parameters, 'members'),
  leaderX: numberParameter(parameters, 'leaderX'),
  leaderY: numberParameter(parameters, 'leaderY'),
  spacing: numberParameter(parameters, 'spacing'),
  turnDegrees: numberParameter(parameters, 'turnDegrees'),
  turnStart: numberParameter(parameters, 'turnStart'),
  turnSteps: numberParameter(parameters, 'turnSteps'),
  fastTurnSteps: numberParameter(parameters, 'fastTurnSteps'),
  speedLimit: numberParameter(parameters, 'speedLimit'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** The same rebasing used by the scene's fixed-formation interpreter. */
export function fixedOffsets(example: FixedFormationParameters): readonly Vec2[] {
  const centred = patternSlots('wedge', example.members, example.spacing);
  return centred.map((slot) => subtract(slot, centred[0]));
}

/** Generate destinations only: no guard integration or speed clamp is hidden in this run. */
export function fixedFormationSamples(
  example: FixedFormationParameters,
  turnSteps = example.turnSteps,
): readonly FixedFormationSample[] {
  const anchor = { x: example.leaderX, y: example.leaderY };
  const slots = fixedOffsets(example);
  // Only advanceFormation reads this leader; no scene ticks or field boundaries are applied.
  const leader = createSimulation({
    id: 'lantern-court',
    sceneType: 'units-on-terrain',
    field: { width: 0, height: 0 },
    seed: 0,
    units: [
      {
        id: 'mira',
        labels: { name: 'Mira' },
        unitClass: 'escort',
        position: anchor,
        heading: { x: 1, y: 0 },
        velocity: { x: 0, y: 0 },
        maxSpeed: 0,
        maxAcceleration: 0,
        radius: 0,
      },
    ],
  }).units[0];
  const initial: FormationState = {
    kind: 'fixed',
    slots,
    assignment: slots.map((_slot, index) => ({
      unitId: index === 0 ? 'mira' : `escort-${index}`,
      slot: index,
      slotRole: 'escort',
      cost: 0,
    })),
    anchor,
    anchorVelocity: { x: 0, y: 0 },
    heading: leader.heading,
    anchorSpeed: 0,
    lagLimit: 0,
    leader: leader.id,
  };
  const samples: FixedFormationSample[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const progress = Math.max(0, Math.min(1, (step - example.turnStart) / turnSteps));
    const angleDegrees = example.turnDegrees * progress;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const heading = { x: cosine(angleRadians), y: sine(angleRadians) };
    const formation = advanceFormation(initial, [{ ...leader, heading }], null, example.timeStep);
    const targets = slots.map((_slot, index) => slotPosition(formation, index));
    const previousTargets = samples.at(-1)?.targets ?? targets;
    const displacement = Math.max(
      ...targets.slice(1).map((target, index) => distance(target, previousTargets[index + 1])),
    );
    samples.push({
      step,
      seconds: step * example.timeStep,
      angleDegrees,
      angleRadians,
      formation,
      targets,
      previousTargets,
      displacement,
      requiredSpeed: displacement / example.timeStep,
    });
  }
  return samples;
}
