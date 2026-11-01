import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  distance,
  dot,
  length,
  scale,
  seek,
  separate,
  type SteeringBody,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { namedBoundsOf } from '../drawing';
import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface WeightedBlendingParameters {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly robotX: number;
  readonly robotY: number;
  readonly alignedRobotY: number;
  readonly radius: number;
  readonly threshold: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly seekWeight: number;
  readonly separationWeight: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly accelerationScale: number;
}

export interface BlendingStep {
  readonly seekRequest: Vec2;
  readonly separationRequest: Vec2;
  readonly weightedSeek: Vec2;
  readonly weightedSeparation: Vec2;
  readonly raw: Vec2;
  readonly acceleration: Vec2;
  readonly robotDistance: number;
  readonly next: SteeringBody;
}

interface RunReading {
  readonly alignmentResult: string;
  readonly minimumGap: number;
}

const readParameters = (parameters: StudyParameters): WeightedBlendingParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  robotX: numberParameter(parameters, 'robotX'),
  robotY: numberParameter(parameters, 'robotY'),
  alignedRobotY: numberParameter(parameters, 'alignedRobotY'),
  radius: numberParameter(parameters, 'radius'),
  threshold: numberParameter(parameters, 'threshold'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  seekWeight: numberParameter(parameters, 'seekWeight'),
  separationWeight: numberParameter(parameters, 'separationWeight'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  accelerationScale: numberParameter(parameters, 'accelerationScale'),
});

const shown = (value: number) => String(Number(value.toFixed(2)));
const vectorText = ({ x, y }: Vec2) => `(${shown(x)}, ${shown(y)})`;
const targetOf = (example: WeightedBlendingParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetY,
});
const robotOf = (example: WeightedBlendingParameters, y = example.robotY): Vec2 => ({
  x: example.robotX,
  y,
});

export const createNia = (example: WeightedBlendingParameters): SteeringBody => ({
  position: { x: example.startX, y: example.startY },
  velocity: zero,
  heading: { x: 1, y: 0 },
  radius: example.radius,
  maxAcceleration: example.maxAcceleration,
  maxSpeed: example.maxSpeed,
  wanderAngle: 0,
});

/** Engine behaviours produce the requests and the blend; this study applies their result. */
export function calculateBlendingStep(
  before: SteeringBody,
  example: WeightedBlendingParameters,
  robotY = example.robotY,
): BlendingStep {
  const robot: SteeringBody = { ...createNia(example), position: robotOf(example, robotY) };
  const seekRequest = seek(before, targetOf(example));
  const separationRequest = separate(before, 0, [before, robot], {
    separationThreshold: example.threshold,
    separationFalloff: 1,
  });
  const weightedSeek = scale(seekRequest, example.seekWeight);
  const weightedSeparation = scale(separationRequest, example.separationWeight);
  const raw = add(weightedSeek, weightedSeparation);
  const acceleration = blend(
    [
      { acceleration: seekRequest, weight: example.seekWeight },
      { acceleration: separationRequest, weight: example.separationWeight },
    ],
    example.maxAcceleration,
  );
  const velocity = clipLength(
    add(before.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    seekRequest,
    separationRequest,
    weightedSeek,
    weightedSeparation,
    raw,
    acceleration,
    robotDistance: distance(before.position, robot.position),
    next: {
      ...before,
      velocity,
      position: add(before.position, scale(velocity, example.timeStep)),
    },
  };
}

export function blendingFrames(
  example: WeightedBlendingParameters,
  robotY = example.robotY,
): readonly SteeringBody[] {
  const states: SteeringBody[] = [createNia(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateBlendingStep(states[states.length - 1], example, robotY).next);
  return states;
}

function relationToRobot(position: Vec2, robot: Vec2): string {
  const vertical = position.y < robot.y ? 'above' : position.y > robot.y ? 'below' : '';
  const horizontal =
    position.x < robot.x ? 'to the left of' : position.x > robot.x ? 'to the right of' : '';
  return vertical && horizontal
    ? `${vertical} and ${horizontal}`
    : vertical || horizontal || 'in the same place as';
}

function directionOf(offset: Vec2): string {
  const vertical = offset.y < 0 ? 'upwards' : offset.y > 0 ? 'downwards' : '';
  const horizontal = offset.x < 0 ? 'to the left' : offset.x > 0 ? 'to the right' : '';
  return vertical && horizontal
    ? `${vertical} and ${horizontal}`
    : vertical || horizontal || 'away';
}

function pullsOf(step: BlendingStep): string {
  if (length(step.raw) === 0) return 'cancel';
  if (length(step.weightedSeparation) === 0) return 'leave seek acting alone';
  if (length(step.weightedSeek) === 0) return 'leave separation acting alone';
  return dot(step.weightedSeek, step.weightedSeparation) < 0
    ? 'partly oppose one another'
    : 'reinforce one another';
}

function noteOf(
  body: SteeringBody,
  calculation: BlendingStep,
  step: number,
  example: WeightedBlendingParameters,
): string {
  if (calculation.robotDistance < 2 * example.radius)
    return 'Nia’s footprint overlaps the robot because the blended requests have not preserved clearance.';
  if (length(calculation.raw) === 0)
    return length(body.velocity) === 0
      ? 'The pulls cancel, so Nia stays at rest with the bay still ahead.'
      : 'The pulls cancel, but Nia keeps coasting because zero acceleration preserves velocity.';
  if (
    dot(
      subtract(targetOf(example), body.position),
      subtract(targetOf(example), createNia(example).position),
    ) < 0
  )
    return 'Nia has passed the bay with speed remaining because seek supplies no arrival brake.';
  if (distance(body.position, targetOf(example)) < example.radius)
    return 'Nia is close to the bay but still moving because seek supplies no arrival brake.';
  if (length(calculation.weightedSeparation) === 0)
    return calculation.robotDistance >= example.threshold
      ? 'The robot is outside the neighbourhood, so seek alone steers Nia towards the bay.'
      : 'Separation has no weight, so seek directs Nia towards the bay without protecting clearance.';
  if (step === 0) {
    if (dot(calculation.raw, calculation.seekRequest) < 0)
      return 'Separation outweighs seek, so Nia starts away from the bay.';
    if (calculation.weightedSeparation.y < 0)
      return 'Separation pushes Nia above the parked robot while seek draws her towards the bay.';
    if (calculation.weightedSeparation.y > 0)
      return 'Separation pushes Nia below the parked robot while seek draws her towards the bay.';
  }
  if (length(calculation.raw) > example.maxAcceleration)
    return 'The requests exceed Nia’s acceleration limit, so the cap shortens their sum without changing its direction.';
  if (calculation.weightedSeparation.y < 0)
    return 'Separation keeps pushing Nia above the robot while seek continues pulling towards the bay.';
  if (calculation.weightedSeparation.y > 0)
    return 'Separation pushes Nia downwards while seek continues pulling towards the bay.';
  return 'The requests pull along the same line, so their balance controls progress towards the bay.';
}

function frameOf(
  body: SteeringBody,
  calculation: BlendingStep,
  step: number,
  example: WeightedBlendingParameters,
  reading: RunReading,
): MotionFrame {
  const robot = robotOf(example);
  const target = targetOf(example);
  const scaleForDrawing = example.accelerationScale;
  const seekTip = add(body.position, scale(calculation.weightedSeek, scaleForDrawing));
  const rawMagnitude = length(calculation.raw);
  const factor = rawMagnitude === 0 ? 1 : Math.min(1, example.maxAcceleration / rawMagnitude);
  const accelerationMagnitude = length(calculation.acceleration);
  const labelLift = 3 * example.radius;
  const robotName = { ...robot, y: robot.y + labelLift };
  const bayName = { ...target, y: target.y + labelLift };
  return {
    seconds: step * example.timeStep,
    bodies: [
      { id: 'nia', ...body.position, tone: 'subject', label: 'Nia' },
      { id: 'parked-robot', ...robot, tone: 'other' },
    ],
    marks: [
      { ...target, shape: 'cross', tone: 'target' },
      { ...robotName, shape: 'dot', tone: 'other', label: 'Robot' },
      { ...bayName, shape: 'dot', tone: 'target', label: 'Bay' },
    ],
    links: [
      { from: robot, to: robotName, tone: 'muted' },
      { from: target, to: bayName, tone: 'muted' },
    ],
    zones: [
      { ...body.position, radius: example.threshold, tone: 'zone' },
      { ...body.position, radius: example.radius, tone: 'subject' },
      { ...robot, radius: example.radius, tone: 'other' },
    ],
    vectors: [
      {
        ...body.position,
        dx: calculation.weightedSeek.x * scaleForDrawing,
        dy: calculation.weightedSeek.y * scaleForDrawing,
        tone: 'desired',
      },
      {
        ...seekTip,
        dx: calculation.weightedSeparation.x * scaleForDrawing,
        dy: calculation.weightedSeparation.y * scaleForDrawing,
        tone: 'other',
      },
      {
        ...body.position,
        dx: calculation.acceleration.x * scaleForDrawing,
        dy: calculation.acceleration.y * scaleForDrawing,
        tone: 'actual',
      },
    ],
    values: {
      seconds: shown(step * example.timeStep),
      robotRelation: relationToRobot(body.position, robot),
      bayDirection: directionOf(subtract(target, body.position)),
      robotDistance: shown(calculation.robotDistance),
      bayDistance: shown(distance(body.position, target)),
      speed: shown(length(body.velocity)),
      seekMagnitude: shown(length(calculation.seekRequest)),
      separationMagnitude: shown(length(calculation.separationRequest)),
      weightedSeekMagnitude: shown(length(calculation.weightedSeek)),
      weightedSeparationMagnitude: shown(length(calculation.weightedSeparation)),
      rawMagnitude: shown(rawMagnitude),
      accelerationMagnitude: shown(accelerationMagnitude),
      pullRelation: pullsOf(calculation),
      seekWeight: shown(example.seekWeight),
      separationWeight: shown(example.separationWeight),
      weightSum: shown(example.seekWeight + example.separationWeight),
      maxAcceleration: shown(example.maxAcceleration),
      maxSpeed: shown(example.maxSpeed),
      timeStep: shown(example.timeStep),
      threshold: shown(example.threshold),
      radius: shown(example.radius),
      robotOffset: shown(example.robotY - example.startY),
      accelerationScale: shown(scaleForDrawing),
      alignmentResult: reading.alignmentResult,
      minimumGap: shown(reading.minimumGap),
      diameter: shown(2 * example.radius),
      clearanceSummary:
        reading.minimumGap < 2 * example.radius
          ? 'the footprints overlap'
          : 'the sampled footprints stay apart',
    },
    note: noteOf(body, calculation, step, example),
    worked: {
      title: `Loading-bay calculation at ${shown(step * example.timeStep)} s`,
      lines: [
        `Begin at ${vectorText(body.position)} with velocity ${vectorText(body.velocity)} units/s; the robot is at ${vectorText(robot)} and the bay at ${vectorText(target)}.`,
        `Bay offset ${vectorText(subtract(target, body.position))}: seek requests ${shown(example.maxAcceleration)} × its unit direction ≈ ${vectorText(calculation.seekRequest)} units/s².`,
        `Robot distance = √(${shown(body.position.x - robot.x)}² + ${shown(body.position.y - robot.y)}²) ≈ ${shown(calculation.robotDistance)} units.`,
        calculation.robotDistance >= example.threshold
          ? `Distance ≥ ${shown(example.threshold)}, so separation requests (0, 0).`
          : `Linear strength = ${shown(example.maxAcceleration)} × (${shown(example.threshold)} − ${shown(calculation.robotDistance)}) / ${shown(example.threshold)} ≈ ${shown(length(calculation.separationRequest))}; pointing away gives ${vectorText(calculation.separationRequest)} units/s².`,
        `Seek: ${shown(example.seekWeight)} × ${vectorText(calculation.seekRequest)} ≈ ${vectorText(calculation.weightedSeek)}; separation: ${shown(example.separationWeight)} × ${vectorText(calculation.separationRequest)} ≈ ${vectorText(calculation.weightedSeparation)}.`,
        `Add: ${vectorText(calculation.weightedSeek)} + ${vectorText(calculation.weightedSeparation)} ≈ ${vectorText(calculation.raw)}; its length is ${shown(rawMagnitude)} units/s².`,
        rawMagnitude === 0
          ? 'The requests cancel exactly, so the applied acceleration remains (0, 0).'
          : `Length cap: multiply the sum by min(1, ${shown(example.maxAcceleration)} / ${shown(rawMagnitude)}) ≈ ${shown(factor)}, giving ${vectorText(calculation.acceleration)} units/s².`,
        `Velocity = capLength(${vectorText(body.velocity)} + ${vectorText(calculation.acceleration)} × ${shown(example.timeStep)}, ${shown(example.maxSpeed)}) ≈ ${vectorText(calculation.next.velocity)} units/s.`,
        `Position = ${vectorText(body.position)} + ${vectorText(calculation.next.velocity)} × ${shown(example.timeStep)} ≈ ${vectorText(calculation.next.position)} units.`,
      ],
      note:
        step === example.steps
          ? 'This final sample previews the next update; displayed values are rounded while calculations retain full precision.'
          : 'The engine applies the weighted sum without averaging; displayed values are rounded while calculations retain full precision.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = blendingFrames(example);
  const aligned = blendingFrames(example, example.alignedRobotY);
  const calculations = states.map((state) => calculateBlendingStep(state, example));
  const alignedStart = calculateBlendingStep(aligned[0], example, example.alignedRobotY);
  const alignmentResult =
    length(alignedStart.raw) === 0
      ? 'the weighted requests cancel and Nia stays at rest'
      : alignedStart.raw.x > 0
        ? 'the sum starts Nia towards the bay'
        : 'the sum starts Nia away from the bay';
  const closest = calculations.reduce(
    (best, calculation, step) =>
      calculation.robotDistance < calculations[best].robotDistance ? step : best,
    0,
  );
  const reading = { alignmentResult, minimumGap: calculations[closest].robotDistance };
  const frames = states.map((state, step) =>
    frameOf(state, calculations[step], step, example, reading),
  );
  const seconds = frames.map((frame) => frame.seconds);
  const rawMagnitudes = calculations.map(({ raw }) => length(raw));
  const usedMagnitudes = calculations.map(({ acceleration }) => length(acceleration));
  const largestRequest = rawMagnitudes.reduce(
    (best, magnitude, step) => (magnitude > rawMagnitudes[best] ? step : best),
    0,
  );
  const firstOverlap = calculations.findIndex(
    ({ robotDistance }) => robotDistance < 2 * example.radius,
  );
  const firstClip = rawMagnitudes.findIndex((magnitude) => magnitude > example.maxAcceleration);
  const firstClear = calculations.findIndex(
    ({ robotDistance }) => robotDistance >= example.threshold,
  );
  const target = targetOf(example);
  const normalDistances = states.map((state) => distance(state.position, target));
  const alignedDistances = aligned.map((state) => distance(state.position, target));
  return {
    family: 'motion',
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: {
      title: 'The request and the acceleration Nia can apply',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration magnitude · units/s²',
      seconds,
      reference: example.maxAcceleration,
      yRange: [0, Math.max(example.maxAcceleration, ...rawMagnitudes)],
      series: [
        {
          id: 'raw',
          label: 'Weighted sum before clipping',
          tone: 'desired',
          values: rawMagnitudes,
        },
        { id: 'used', label: 'Applied acceleration', tone: 'actual', values: usedMagnitudes },
      ],
    },
    initialStep: firstOverlap < 0 ? largestRequest : firstOverlap,
    moments: [
      { label: 'First weighted sum', step: 0 },
      {
        label: firstClip < 0 ? 'Requests within the cap' : 'First acceleration cap',
        step: firstClip < 0 ? 0 : firstClip,
      },
      {
        label: firstOverlap < 0 ? 'Largest request before clipping' : 'Footprints overlap',
        step: firstOverlap < 0 ? largestRequest : firstOverlap,
      },
      {
        label: firstClear < 0 ? 'Robot stays nearby' : 'Robot outside the neighbourhood',
        step: firstClear < 0 ? example.steps : firstClear,
      },
      { label: 'End of observation', step: example.steps },
    ],
    legend: [
      { tone: 'desired', label: 'Amber · weighted seek' },
      { tone: 'other', label: 'Grey · weighted separation' },
      { tone: 'actual', label: 'Green · applied acceleration' },
      { tone: 'zone', label: 'Outer circle · separation neighbourhood' },
    ],
    caption: `Add amber seek and grey separation tip to tail; green shows the capped sum from Nia. Arrow lengths use ${shown(example.accelerationScale)} drawing units per unit/s². Dotted callouts keep the robot and bay names clear of the moving courier.`,
    comparison: {
      title:
        length(alignedStart.raw) === 0
          ? 'Cancellation with the bay still ahead'
          : 'Changing the balance on the direct route',
      intro:
        example.robotY === example.alignedRobotY
          ? 'Both runs now place the robot on the direct route, so their chart lines coincide.'
          : `Place the robot on the direct route while keeping seek weight ${shown(example.seekWeight)} and separation weight ${shown(example.separationWeight)}; only its lateral position changes.`,
      timeline: {
        title: 'Distance remaining to the bay',
        xLabel: 'Time · seconds',
        yLabel: 'Distance · units',
        seconds,
        reference: 0,
        yRange: [0, Math.max(...normalDistances, ...alignedDistances)],
        series: [
          {
            id: 'current-robot',
            label: 'Current robot position',
            tone: 'actual',
            values: normalDistances,
          },
          {
            id: 'aligned-robot',
            label: 'Robot on direct route',
            tone: 'desired',
            values: alignedDistances,
          },
        ],
      },
      findings: [
        `On the direct route, seek contributes ${shown(length(alignedStart.weightedSeek))} units/s² towards the bay and separation ${shown(length(alignedStart.weightedSeparation))} away; ${alignmentResult}.`,
        `At ${shown(seconds[example.steps])} s, the current run has ${shown(normalDistances[example.steps])} units left to the bay and the aligned run ${shown(alignedDistances[example.steps])}; the current run's smallest robot distance is ${shown(reading.minimumGap)}, against body diameter ${shown(2 * example.radius)}.`,
      ],
      note: 'A path around the robot exists, but aligned requests supply no sideways direction to find it; cancellation holds a resting courier still and would preserve a moving courier’s velocity.',
    },
    inputs: [
      {
        name: 'separationWeight',
        label: 'Separation weight',
        unit: 'weight',
        min: 0,
        max: 4.5,
        step: 0.5,
      },
      {
        name: 'robotY',
        label: 'Robot offset',
        unit: 'units below route',
        min: 0,
        max: 3,
        step: 0.5,
      },
    ],
  };
};
