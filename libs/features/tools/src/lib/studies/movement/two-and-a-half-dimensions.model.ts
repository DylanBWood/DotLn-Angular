import type { StudyParameters } from '@dotln-angular/models';
import type { SteeringBody, Vec2 } from '@dotln-angular/scene-engine';
import {
  add,
  clipLength,
  cosine,
  length,
  scale,
  seek,
  sine,
  subtract,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionLink, MotionStudyModel } from '../study-model';

export interface HalfDimensionsParameters {
  readonly startX: number;
  readonly startZ: number;
  readonly targetX: number;
  readonly targetZ: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly rampStart: number;
  readonly rampRun: number;
  readonly ledgeRun: number;
  readonly rise: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly bodyHeight: number;
}

export interface CourierState {
  readonly x: number;
  readonly height: number;
  readonly z: number;
  readonly velocity: Vec2;
  readonly verticalSpeed: number;
  readonly yaw: number;
  readonly pitch: 0;
  readonly roll: 0;
}

const readParameters = (parameters: StudyParameters): HalfDimensionsParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startZ: numberParameter(parameters, 'startZ'),
  targetX: numberParameter(parameters, 'targetX'),
  targetZ: numberParameter(parameters, 'targetZ'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  rampStart: numberParameter(parameters, 'rampStart'),
  rampRun: numberParameter(parameters, 'rampRun'),
  ledgeRun: numberParameter(parameters, 'ledgeRun'),
  rise: numberParameter(parameters, 'rise'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  bodyHeight: numberParameter(parameters, 'bodyHeight'),
});

const fixed = (value: number) => value.toFixed(2);
const degrees = (angle: number) => (angle * 180) / Math.PI;
const planeOf = (state: CourierState): Vec2 => ({ x: state.x, y: state.z });
const targetOf = (example: HalfDimensionsParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetZ,
});

/** This single-valued surface is a teaching sampler, not a collision or navigation query. */
export function concourseHeight(
  x: number,
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
) {
  if (x < example.rampStart) return 0;
  if (rampRun === 0) return example.rise;
  return example.rise * Math.max(0, Math.min(1, (x - example.rampStart) / rampRun));
}

export const initialCourierState = (
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
): CourierState => ({
  x: example.startX,
  height: concourseHeight(example.startX, example, rampRun),
  z: example.startZ,
  velocity: { x: 0, y: 0 },
  verticalSpeed: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
});

export function calculateCourierStep(
  state: CourierState,
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
) {
  // Engine Vec2.y carries world z. Height never enters the engine's planar steering call.
  const body: SteeringBody = {
    position: planeOf(state),
    velocity: state.velocity,
    heading: { x: cosine(state.yaw), y: sine(state.yaw) },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const target = targetOf(example);
  const offset = subtract(target, body.position);
  const acceleration = seek(body, target);
  const candidateVelocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const travel = scale(candidateVelocity, example.timeStep);
  // Clamp the last partial step on this straight route; this is not an Arrive controller.
  const reached = length(travel) >= length(offset);
  const position = reached ? target : add(body.position, travel);
  const height = concourseHeight(position.x, example, rampRun);
  const next: CourierState = {
    x: position.x,
    height,
    z: position.y,
    velocity: reached ? { x: 0, y: 0 } : candidateVelocity,
    verticalSpeed: (height - state.height) / example.timeStep,
    yaw:
      length(candidateVelocity) === 0
        ? state.yaw
        : Math.atan2(candidateVelocity.y, candidateVelocity.x),
    pitch: 0,
    roll: 0,
  };
  return { acceleration, candidateVelocity, reached, next };
}

export function courierStates(
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
): readonly CourierState[] {
  const states = [initialCourierState(example, rampRun)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateCourierStep(states[states.length - 1], example, rampRun).next);
  return states;
}

// The two views use the same distance scale; only the profile has a vertical offset.
const profileBase = (example: HalfDimensionsParameters) =>
  Math.max(example.startZ, example.targetZ) + example.rise + example.bodyHeight * 4;

function surfaceLinks(example: HalfDimensionsParameters): readonly MotionLink[] {
  const base = profileBase(example);
  const corners = [
    { x: example.startX, y: base - concourseHeight(example.startX, example) },
    { x: example.rampStart, y: base },
    { x: example.rampStart + example.rampRun, y: base - example.rise },
    { x: example.targetX, y: base - concourseHeight(example.targetX, example) },
  ];
  return corners
    .slice(1)
    .map((point, index) => ({ from: corners[index], to: point, tone: 'zone' }));
}

function frameOf(
  state: CourierState,
  step: number,
  example: HalfDimensionsParameters,
): MotionFrame {
  const calculation = calculateCourierStep(state, example);
  const next = calculation.next;
  const base = profileBase(example);
  const seconds = step * example.timeStep;
  const profile = { x: state.x, y: base - state.height };
  return {
    seconds,
    bodies: [
      { id: 'courier-plan', x: state.x, y: state.z, heading: state.yaw, label: 'Plan · x/z' },
      { id: 'courier-profile', ...profile, tone: 'actual', label: 'Profile · x/height' },
    ],
    marks: [
      { x: example.targetX, y: example.targetZ, shape: 'cross', label: 'Concourse target' },
      { x: example.targetX, y: base - concourseHeight(example.targetX, example), shape: 'cross' },
    ],
    links: [
      { from: { x: example.startX, y: example.startZ }, to: targetOf(example), tone: 'muted' },
      ...surfaceLinks(example),
      { from: profile, to: { x: profile.x, y: profile.y - example.bodyHeight }, tone: 'actual' },
    ],
    vectors: [
      { x: state.x, y: state.z, dx: state.velocity.x, dy: state.velocity.y, tone: 'actual' },
    ],
    values: {
      seconds: fixed(seconds),
      x: fixed(state.x),
      height: fixed(state.height),
      z: fixed(state.z),
      targetX: fixed(example.targetX),
      targetZ: fixed(example.targetZ),
      speed: fixed(length(state.velocity)),
      verticalSpeed: fixed(state.verticalSpeed),
      yaw: fixed(degrees(state.yaw)),
      pitch: fixed(state.pitch),
      roll: fixed(state.roll),
      rampStart: fixed(example.rampStart),
      rampRun: fixed(example.rampRun),
      rise: fixed(example.rise),
      maxSpeed: fixed(example.maxSpeed),
      maxAcceleration: fixed(example.maxAcceleration),
      timeStep: fixed(example.timeStep),
      ledgeRun: fixed(example.ledgeRun),
    },
    note:
      state.height > 0 && state.height < example.rise
        ? 'The profile climbs while the plan heading stays the same. A sloped route changes height without pitching this upright character.'
        : calculation.reached
          ? 'The next plan step is clamped to the target and stopped; the surface supplies its height.'
          : 'Plan steering chooses x/z motion. The profile is the same courier, placed on the sampled surface.',
    worked: {
      title: `Plan and height step at ${fixed(seconds)} seconds`,
      lines: [
        `Engine Seek reads plan position (${fixed(state.x)}, ${fixed(state.z)}) and target (${fixed(example.targetX)}, ${fixed(example.targetZ)}): acceleration (${fixed(calculation.acceleration.x)}, ${fixed(calculation.acceleration.y)}) units/s².`,
        `Plan velocity + acceleration × ${fixed(example.timeStep)}, capped at ${fixed(example.maxSpeed)}: (${fixed(calculation.candidateVelocity.x)}, ${fixed(calculation.candidateVelocity.y)}) units/s.`,
        `Use the next plan position (${fixed(next.x)}, ${fixed(next.z)}), clamping the final partial step to the target.`,
        example.rampRun === 0
          ? `The surface is a ledge at x = ${fixed(example.rampStart)}: next height ${fixed(next.height)}. Sampling alone does not check whether it can be climbed.`
          : `Surface height = ${fixed(example.rise)} × clamp((${fixed(next.x)} − ${fixed(example.rampStart)}) / ${fixed(example.rampRun)}, 0, 1) = ${fixed(next.height)} units.`,
        `Height rate = (${fixed(next.height)} − ${fixed(state.height)}) / ${fixed(example.timeStep)} = ${fixed(next.verticalSpeed)} units/s. Keep yaw ${fixed(degrees(next.yaw))}°, pitch ${fixed(next.pitch)}° and roll ${fixed(next.roll)}°.`,
      ],
      note: 'Seek and planar vector arithmetic use the public engine. The surface sampler, final-step clamp and yaw-only pose are local to this study; they do not provide gravity or collision handling.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = courierStates(example);
  const ledge = courierStates(example, example.ledgeRun);
  const frames = states.map((state, step) => frameOf(state, step, example));
  const seconds = frames.map(({ seconds }) => seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const peak = (run: readonly CourierState[]) =>
    Math.max(...run.map(({ verticalSpeed }) => Math.abs(verticalSpeed)));
  const climbing = states.findIndex((state) => state.height > 0 && state.height < example.rise);
  const initialStep = climbing < 0 ? 0 : climbing;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - example.bodyHeight * 2,
        maxX: Math.max(...points.map(({ x }) => x)) + example.bodyHeight * 2,
        minY: Math.min(...points.map(({ y }) => y)) - example.bodyHeight * 2,
        maxY: Math.max(...points.map(({ y }) => y)) + example.bodyHeight * 2,
      },
      frames,
      trail: false,
    },
    timeline: {
      title: 'Height changes; the courier stays upright',
      xLabel: 'Time · seconds',
      yLabel: 'Height · units',
      seconds,
      reference: example.rise,
      series: [
        {
          id: 'height',
          label: 'Sampled surface height',
          tone: 'actual',
          values: states.map(({ height }) => height),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'On the lower level', step: 0 },
      { label: 'First step on the ramp', step: initialStep },
      { label: 'Crossing the ramp', step: Math.min(initialStep + 2, example.steps) },
      { label: 'At the concourse', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Courier seen in plan' },
      { tone: 'actual', label: 'Velocity in plan; upright body in profile' },
      { tone: 'zone', label: 'Surface in profile' },
      { tone: 'target', label: 'The same target in both views' },
    ],
    caption:
      'The courier appears twice at the same moment and scale: plan above uses x/z and shows yaw; profile below uses x/height and shows its upright body. The surface line raises the foot without tilting the body. The chart follows that foot height.',
    comparison: {
      title: 'A height value does not prove a route is walkable',
      intro: `Change only the ramp run from ${fixed(example.rampRun)} to ${fixed(example.ledgeRun)} units. The plan steering and height difference stay the same; the zero-run case is a ledge.`,
      timeline: {
        title: 'Vertical rate induced by the surface sampler',
        xLabel: 'Time · seconds',
        yLabel: 'Height change / step time · units/s',
        seconds,
        reference: 0,
        series: [
          {
            id: 'ramp',
            label: `Ramp run ${fixed(example.rampRun)}`,
            tone: 'actual',
            values: states.map(({ verticalSpeed }) => verticalSpeed),
          },
          {
            id: 'ledge',
            label: `Ramp run ${fixed(example.ledgeRun)}`,
            tone: 'desired',
            values: ledge.map(({ verticalSpeed }) => verticalSpeed),
          },
        ],
      },
      findings: [
        `The ramp run produces a peak vertical rate of ${fixed(peak(states))} units/s; the comparison produces ${fixed(peak(ledge))} units/s.`,
        example.rise === 0
          ? 'With no rise, both runs stay at the lower level and there is no height jump to compare.'
          : 'Both runs use identical plan positions and yaw. In the ledge case the sampler assigns the new height in one step; it supplies no contact test or jump to make that change possible.',
      ],
      note: 'The failure belongs to this simple surface sampler. A ground navigation mesh or character controller must decide whether a slope, step or connection is traversable.',
    },
    inputs: [
      { name: 'rise', label: 'Concourse rise', unit: 'units', min: 0, max: 6, step: 1 },
      { name: 'rampRun', label: 'Ramp run', unit: 'units', min: 0, max: 8, step: 1 },
    ],
  };
};
