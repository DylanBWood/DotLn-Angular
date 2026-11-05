import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface JumpPointsParameters {
  readonly startX: number;
  readonly lateStartX: number;
  readonly markerX: number;
  readonly initialVelocity: number;
  readonly requiredVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly positionTolerance: number;
  readonly velocityTolerance: number;
  readonly verticalVelocity: number;
  readonly gravity: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly padHalfWidth: number;
  readonly arrowSeconds: number;
  readonly radius: number;
}

export interface JumpPointState {
  readonly seconds: number;
  readonly x: number;
  readonly height: number;
  readonly velocity: number;
  readonly verticalVelocity: number;
  readonly phase: 'run-up' | 'airborne' | 'landed' | 'rejected';
  readonly airTime: number;
  readonly takeoffX: number | null;
  readonly takeoffSeconds: number | null;
}

export interface JumpRunUpStep {
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly velocity: number;
  readonly x: number;
}

const readParameters = (parameters: StudyParameters): JumpPointsParameters => {
  const example: JumpPointsParameters = {
    startX: numberParameter(parameters, 'startX'),
    lateStartX: numberParameter(parameters, 'lateStartX'),
    markerX: numberParameter(parameters, 'markerX'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    requiredVelocity: numberParameter(parameters, 'requiredVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    positionTolerance: numberParameter(parameters, 'positionTolerance'),
    velocityTolerance: numberParameter(parameters, 'velocityTolerance'),
    verticalVelocity: numberParameter(parameters, 'verticalVelocity'),
    gravity: numberParameter(parameters, 'gravity'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    padHalfWidth: numberParameter(parameters, 'padHalfWidth'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
    radius: numberParameter(parameters, 'radius'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.startX > example.markerX + example.positionTolerance ||
    example.lateStartX > example.markerX + example.positionTolerance ||
    example.initialVelocity < 0 ||
    example.initialVelocity > example.maxSpeed ||
    example.requiredVelocity <= 0 ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.responseTime <= 0 ||
    example.positionTolerance <= 0 ||
    example.velocityTolerance <= 0 ||
    example.verticalVelocity <= 0 ||
    example.gravity <= 0 ||
    example.timeStep <= 0 ||
    example.padHalfWidth <= 0 ||
    example.arrowSeconds <= 0 ||
    example.radius <= 0 ||
    !Number.isInteger(example.steps) ||
    example.steps < 1 ||
    example.steps > 239
  )
    throw new Error(
      'Jump points need finite values, a forward runway, positive limits and 1–239 steps.',
    );
  return example;
};

export const jumpFlightDuration = (example: JumpPointsParameters) =>
  (2 * example.verticalVelocity) / example.gravity;

export const jumpPadCentre = (example: JumpPointsParameters) =>
  example.markerX + example.requiredVelocity * jumpFlightDuration(example);

/** The marker requires a velocity as well as a position; being at the marker alone cannot pass. */
export const canTakeOff = (x: number, velocity: number, example: JumpPointsParameters) =>
  Math.abs(x - example.markerX) <= example.positionTolerance &&
  Math.abs(velocity - example.requiredVelocity) <= example.velocityTolerance;

/** The engine calculates velocity matching; this study advances the one-dimensional run-up. */
export function jumpRunUpStep(
  state: Pick<JumpPointState, 'x' | 'velocity'>,
  example: JumpPointsParameters,
): JumpRunUpStep {
  const body: SteeringBody = {
    position: { x: state.x, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: 0,
  };
  const requestedAcceleration = (example.requiredVelocity - state.velocity) / example.responseTime;
  const acceleration = matchVelocity(
    body,
    { x: example.requiredVelocity, y: 0 },
    example.responseTime,
  ).x;
  const velocity = Math.max(
    -example.maxSpeed,
    Math.min(example.maxSpeed, state.velocity + acceleration * example.timeStep),
  );
  return {
    requestedAcceleration,
    acceleration,
    velocity,
    x: state.x + velocity * example.timeStep,
  };
}

/** Exact constant-gravity flight from the actual accepted launch position and horizontal speed. */
export function jumpFlightPoint(
  takeoffX: number,
  velocity: number,
  airTime: number,
  example: JumpPointsParameters,
) {
  return {
    x: takeoffX + velocity * airTime,
    height: Math.max(
      0,
      example.verticalVelocity * airTime - (example.gravity * airTime * airTime) / 2,
    ),
    verticalVelocity: example.verticalVelocity - example.gravity * airTime,
  };
}

/** A one-pass runway: reject the first marker encounter if either launch condition fails. */
export function jumpPointFrames(
  example: JumpPointsParameters,
  startX = example.startX,
): readonly JumpPointState[] {
  const states: JumpPointState[] = [];
  let state: JumpPointState = {
    seconds: 0,
    x: startX,
    height: 0,
    velocity: example.initialVelocity,
    verticalVelocity: 0,
    phase: 'run-up',
    airTime: 0,
    takeoffX: null,
    takeoffSeconds: null,
  };
  const duration = jumpFlightDuration(example);
  for (let step = 0; step <= example.steps; step++) {
    if (state.phase === 'run-up' && state.x >= example.markerX - example.positionTolerance) {
      state = canTakeOff(state.x, state.velocity, example)
        ? {
            ...state,
            phase: 'airborne',
            verticalVelocity: example.verticalVelocity,
            takeoffX: state.x,
            takeoffSeconds: state.seconds,
          }
        : { ...state, phase: 'rejected' };
    }
    states.push(state);
    if (state.phase === 'landed' || state.phase === 'rejected' || step === example.steps) break;
    if (state.phase === 'run-up') {
      const next = jumpRunUpStep(state, example);
      state = {
        ...state,
        seconds: state.seconds + example.timeStep,
        x: next.x,
        velocity: next.velocity,
      };
    } else {
      const airTime = Math.min(duration, state.airTime + example.timeStep);
      const takeoffX = state.takeoffX ?? state.x;
      const takeoffSeconds = state.takeoffSeconds ?? state.seconds;
      state = {
        ...state,
        ...jumpFlightPoint(takeoffX, state.velocity, airTime, example),
        seconds: takeoffSeconds + airTime,
        airTime,
        phase: airTime >= duration ? 'landed' : 'airborne',
      };
    }
  }
  return states;
}

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

function workedStep(state: JumpPointState, example: JumpPointsParameters): StudyWorkedStep {
  const positionError = Math.abs(state.x - example.markerX);
  const velocityError = Math.abs(state.velocity - example.requiredVelocity);
  if (state.phase === 'run-up') {
    const next = jumpRunUpStep(state, example);
    return {
      title: `Run-up at ${fixed(state.seconds)} s`,
      lines: [
        `Velocity request: (${fixed(example.requiredVelocity)} − ${fixed(state.velocity)}) / ${fixed(example.responseTime)} = ${fixed(next.requestedAcceleration)} m/s².`,
        `The engine caps that request at ±${fixed(example.maxAcceleration)} m/s², giving ${fixed(next.acceleration)} m/s².`,
        `Velocity: ${fixed(state.velocity)} + ${fixed(next.acceleration)} × ${fixed(example.timeStep)} = ${fixed(next.velocity)} m/s, limited to ±${fixed(example.maxSpeed)} m/s.`,
        `Position: ${fixed(state.x)} + ${fixed(next.velocity)} × ${fixed(example.timeStep)} = ${fixed(next.x)} m.`,
      ],
      note: 'Matching launch velocity does not stop Finch at the marker; the runway is aligned with the required direction.',
    };
  }
  if (state.phase === 'rejected' || state.airTime === 0)
    return {
      title: state.phase === 'rejected' ? 'Launch refused' : 'Launch conditions pass',
      lines: [
        `Position error: |${fixed(state.x)} − ${fixed(example.markerX)}| = ${fixed(positionError)} m; allowed ${fixed(example.positionTolerance)} m.`,
        `Velocity error: |${fixed(state.velocity)} − ${fixed(example.requiredVelocity)}| = ${fixed(velocityError)} m/s; allowed ${fixed(example.velocityTolerance)} m/s.`,
        state.phase === 'rejected'
          ? 'At least one condition fails: do not apply the vertical jump impulse.'
          : `Both pass: preserve horizontal velocity ${fixed(state.velocity)} m/s and apply vertical launch velocity ${fixed(example.verticalVelocity)} m/s.`,
      ],
      note:
        state.phase === 'rejected'
          ? 'The study ends at this decision; retained velocity is the incoming velocity, not an instant braking response.'
          : 'The marker protocol and vertical launch action are study-local; velocity matching during the run-up uses the engine.',
    };
  const takeoffX = state.takeoffX ?? example.markerX;
  return {
    title: state.phase === 'landed' ? 'Landing contact' : `Airborne for ${fixed(state.airTime)} s`,
    lines: [
      `Same-height flight time: 2 × ${fixed(example.verticalVelocity)} / ${fixed(example.gravity)} = ${fixed(jumpFlightDuration(example))} s.`,
      `Horizontal position: ${fixed(takeoffX)} + ${fixed(state.velocity)} × ${fixed(state.airTime)} = ${fixed(state.x)} m.`,
      `Height: ${fixed(example.verticalVelocity)} × ${fixed(state.airTime)} − ${fixed(example.gravity)} × ${fixed(state.airTime)}² / 2 = ${fixed(state.height)} m.`,
      `Vertical velocity: ${fixed(example.verticalVelocity)} − ${fixed(example.gravity)} × ${fixed(state.airTime)} = ${fixed(state.verticalVelocity)} m/s.`,
      ...(state.phase === 'landed'
        ? [
            `Landing error: |${fixed(state.x)} − ${fixed(jumpPadCentre(example))}| = ${fixed(Math.abs(state.x - jumpPadCentre(example)))} m; pad half-width ${fixed(example.padHalfWidth)} m.`,
          ]
        : []),
    ],
    note: 'Constant downward gravity, equal platform heights and no air resistance are local assumptions; the study ends before collision response.',
  };
}

function frameOf(state: JumpPointState, example: JumpPointsParameters): MotionFrame {
  const padCentre = jumpPadCentre(example);
  const planned = Array.from({ length: 17 }, (_unused, index) =>
    jumpFlightPoint(
      example.markerX,
      example.requiredVelocity,
      (jumpFlightDuration(example) * index) / 16,
      example,
    ),
  );
  const phase = state.phase === 'landed' ? 'landing contact' : state.phase;
  const note =
    state.phase === 'run-up'
      ? 'Finch builds the required horizontal speed while approaching the marker.'
      : state.phase === 'rejected'
        ? 'Finch reaches the marker without a valid take-off state, so the launch is refused.'
        : state.phase === 'landed'
          ? Math.abs(state.x - padCentre) <= example.padHalfWidth
            ? 'Finch reaches the receiving pad at landing contact.'
            : 'The accepted take-off reaches ground outside the receiving pad.'
          : state.airTime === 0
            ? 'Position and velocity both satisfy the marker, so the vertical jump begins.'
            : state.verticalVelocity > 0
              ? 'Finch rises while horizontal velocity stays unchanged.'
              : state.verticalVelocity < 0
                ? 'Finch descends towards the receiving pad.'
                : 'Finch is at the apex, with zero vertical velocity and horizontal motion continuing.';
  return {
    seconds: state.seconds,
    bodies: [
      {
        id: 'finch',
        x: state.x,
        y: -state.height,
        heading: Math.atan2(-state.verticalVelocity, state.velocity),
        label: 'Finch',
        tone: 'subject',
      },
    ],
    vectors: [
      {
        x: state.x,
        y: -state.height,
        dx: state.velocity * example.arrowSeconds,
        dy: -state.verticalVelocity * example.arrowSeconds,
        tone: 'actual',
      },
      {
        x: example.markerX,
        y: 0.8,
        dx: example.requiredVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    marks: [
      {
        x: example.markerX,
        y: 0,
        shape: 'ring',
        label: Math.hypot(state.x - example.markerX, state.height) < 1 ? undefined : 'Take-off',
        tone: 'target',
      },
      {
        x: padCentre,
        y: 0,
        shape: 'cross',
        label: Math.hypot(state.x - padCentre, state.height) < 1 ? undefined : 'Receiving pad',
        tone: 'target',
      },
    ],
    links: [
      { from: { x: example.startX - 1, y: 0 }, to: { x: example.markerX, y: 0 }, tone: 'muted' },
      {
        from: { x: padCentre - example.padHalfWidth, y: 0 },
        to: { x: padCentre + example.padHalfWidth, y: 0 },
        tone: 'target',
      },
      ...planned.slice(1).map((point, index) => ({
        from: { x: planned[index].x, y: -planned[index].height },
        to: { x: point.x, y: -point.height },
        tone: 'desired' as const,
      })),
    ],
    values: {
      ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
      seconds: fixed(state.seconds),
      phase,
      x: fixed(state.x),
      height: fixed(state.height),
      vx: fixed(state.velocity),
      vy: fixed(state.verticalVelocity),
      positionError: fixed(Math.abs(state.x - example.markerX)),
      velocityError: fixed(Math.abs(state.velocity - example.requiredVelocity)),
      airTime: fixed(state.airTime),
      flightDuration: fixed(jumpFlightDuration(example)),
      padCentre: fixed(padCentre),
      landingError: fixed(Math.abs(state.x - padCentre)),
    },
    note,
    worked: workedStep(state, example),
  };
}

function stateAt(states: readonly JumpPointState[], seconds: number) {
  return states.reduce((latest, state) => (state.seconds <= seconds ? state : latest), states[0]);
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = jumpPointFrames(example);
  const late = jumpPointFrames(example, example.lateStartX);
  const frames = states.map((state) => frameOf(state, example));
  const padCentre = jumpPadCentre(example);
  const seconds = frames.map(({ seconds }) => seconds);
  const takeoff = states.findIndex(({ phase }) => phase === 'airborne');
  const initialStep = takeoff >= 0 ? takeoff : states.length - 1;
  const apex = states.reduce(
    (best, state, index) => (state.height > states[best].height ? index : best),
    0,
  );
  const last = states[states.length - 1];
  const lateLast = late[late.length - 1];
  const xPoints = frames.flatMap(({ bodies, vectors = [], links = [] }) => [
    ...bodies.map(({ x }) => x),
    ...vectors.flatMap(({ x, dx }) => [x, x + dx]),
    ...links.flatMap(({ from, to }) => [from.x, to.x]),
  ]);
  const yPoints = frames.flatMap(({ bodies, vectors = [], links = [] }) => [
    ...bodies.map(({ y }) => y),
    ...vectors.flatMap(({ y, dy }) => [y, y + dy]),
    ...links.flatMap(({ from, to }) => [from.y, to.y]),
  ]);
  const decisionOf = (end: JumpPointState) =>
    end.phase === 'landed'
      ? `reaches landing contact at ${fixed(end.x)} m, with pad error ${fixed(Math.abs(end.x - padCentre))} m`
      : end.phase === 'rejected'
        ? `rejects launch at ${fixed(end.x)} m with velocity error ${fixed(Math.abs(end.velocity - example.requiredVelocity))} m/s`
        : `ends its bounded horizon in the ${end.phase} phase`;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...xPoints) - 1,
        maxX: Math.max(...xPoints) + 1,
        minY: Math.min(...yPoints) - 1,
        maxY: Math.max(...yPoints) + 1,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Build the take-off velocity',
      xLabel: 'Time · seconds',
      yLabel: 'Horizontal velocity · m/s',
      seconds,
      reference: example.requiredVelocity,
      series: [
        {
          id: 'actual',
          label: 'Finch’s horizontal velocity',
          tone: 'actual',
          values: states.map(({ velocity }) => velocity),
        },
        {
          id: 'required',
          label: 'Marker’s required velocity',
          tone: 'desired',
          values: states.map(() => example.requiredVelocity),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'Run-up begins', step: 0 },
      { label: takeoff >= 0 ? 'Marker accepted' : 'Marker decision or horizon', step: initialStep },
      { label: 'Highest sampled point', step: apex },
      {
        label: last.phase === 'landed' ? 'Landing contact' : 'Final decision',
        step: states.length - 1,
      },
    ],
    legend: [
      { tone: 'subject', label: 'Arrowhead · Finch' },
      { tone: 'target', label: 'Take-off marker and receiving pad' },
      { tone: 'actual', label: 'Actual velocity' },
      { tone: 'desired', label: 'Required launch velocity and planned arc' },
    ],
    caption: `The arrowhead is Finch, pointing along its velocity; the ring remains visible around it at take-off. The ring marks a required take-off state, and the cross centres the receiving pad. The pale arc is the marker’s planned jump; arrows show velocity over ${fixed(example.arrowSeconds)} s. A terminal sample retains incoming velocity and ends before braking or collision response.`,
    comparison: {
      title: 'A marker cannot create a missing run-up',
      intro: `Change only the starting position from ${fixed(example.startX)} m to ${fixed(example.lateStartX)} m. The marker, initial speed, acceleration limit, tolerances and jump impulse stay the same.`,
      timeline: {
        title: 'Velocity error before the marker decision',
        xLabel: 'Time · seconds',
        yLabel: 'Required minus actual velocity · m/s',
        seconds,
        reference: 0,
        series: [
          {
            id: 'normal',
            label: `Start at ${fixed(example.startX)} m`,
            tone: 'actual',
            values: states.map(({ velocity }) => example.requiredVelocity - velocity),
          },
          {
            id: 'late',
            label: `Start at ${fixed(example.lateStartX)} m`,
            tone: 'desired',
            values: seconds.map(
              (second) => example.requiredVelocity - stateAt(late, second).velocity,
            ),
          },
        ],
      },
      findings: [
        `The main run ${decisionOf(last)}; the changed run ${decisionOf(lateLast)}.`,
        'A small position error is insufficient: the horizontal velocity must also match before the vertical launch action is allowed.',
      ],
      note: 'After a rejected marker decision, the chart holds the incoming error to show the result. That flat trace is no additional motion or physical stopping simulation.',
    },
    inputs: [
      { name: 'startX', label: 'Run-up start', unit: 'm', min: 0, max: 6, step: 0.5 },
      {
        name: 'maxAcceleration',
        label: 'Run-up acceleration limit',
        unit: 'm/s²',
        min: 2,
        max: 8,
        step: 1,
      },
    ],
  };
};
