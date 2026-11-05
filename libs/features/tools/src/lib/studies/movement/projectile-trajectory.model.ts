import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionLink, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface ProjectileParameters {
  readonly startX: number;
  readonly launchHeight: number;
  readonly horizontalSpeed: number;
  readonly verticalSpeed: number;
  readonly gravity: number;
  readonly landingHeight: number;
  readonly unreachableHeight: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ProjectileLanding {
  readonly discriminant: number;
  readonly time: number | null;
  readonly x: number | null;
  readonly impactVerticalVelocity: number | null;
  readonly apexHeight: number;
}

export interface ProjectileState {
  readonly seconds: number;
  readonly x: number;
  readonly height: number;
  readonly verticalVelocity: number;
  readonly landed: boolean;
}

const readParameters = (parameters: StudyParameters): ProjectileParameters => ({
  startX: numberParameter(parameters, 'startX'),
  launchHeight: numberParameter(parameters, 'launchHeight'),
  horizontalSpeed: numberParameter(parameters, 'horizontalSpeed'),
  verticalSpeed: numberParameter(parameters, 'verticalSpeed'),
  gravity: numberParameter(parameters, 'gravity'),
  landingHeight: numberParameter(parameters, 'landingHeight'),
  unreachableHeight: numberParameter(parameters, 'unreachableHeight'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

const fixed = (value: number) => value.toFixed(2);

/** The later root reaches the selected height on descent, rather than on the way up. */
export function predictProjectileLanding(
  example: ProjectileParameters,
  landingHeight = example.landingHeight,
): ProjectileLanding {
  const discriminant =
    example.verticalSpeed ** 2 + 2 * example.gravity * (example.launchHeight - landingHeight);
  const apexHeight =
    example.launchHeight + Math.max(0, example.verticalSpeed) ** 2 / (2 * example.gravity);
  const time =
    discriminant < 0 ? null : (example.verticalSpeed + Math.sqrt(discriminant)) / example.gravity;
  const futureTime = time !== null && time >= 0 ? time : null;

  return {
    discriminant,
    time: futureTime,
    x: futureTime === null ? null : example.startX + example.horizontalSpeed * futureTime,
    impactVerticalVelocity:
      futureTime === null ? null : example.verticalSpeed - example.gravity * futureTime,
    apexHeight,
  };
}

/** The engine has no ballistic update; this local calculation evaluates constant gravity exactly. */
export function projectileAt(
  example: ProjectileParameters,
  seconds: number,
  landingHeight = example.landingHeight,
): ProjectileState {
  const landing = predictProjectileLanding(example, landingHeight);
  const landed = landing.time !== null && seconds >= landing.time;
  const time = landed && landing.time !== null ? landing.time : seconds;

  return {
    seconds: time,
    x: example.startX + example.horizontalSpeed * time,
    height: landed
      ? landingHeight
      : example.launchHeight + example.verticalSpeed * time - (example.gravity * time ** 2) / 2,
    verticalVelocity: landed ? 0 : example.verticalSpeed - example.gravity * time,
    landed,
  };
}

/** Fixed preview samples end with the actual landing event, even when it falls between them. */
export function projectileFrames(example: ProjectileParameters): readonly ProjectileState[] {
  const frames: ProjectileState[] = [];
  const landing = predictProjectileLanding(example);

  for (let step = 0; step <= example.steps; step++) {
    const seconds = step * example.timeStep;
    if (landing.time !== null && seconds >= landing.time) {
      frames.push(projectileAt(example, landing.time));
      break;
    }
    frames.push(projectileAt(example, seconds));
  }

  return frames;
}

function workedStep(
  state: ProjectileState,
  example: ProjectileParameters,
  landing: ProjectileLanding,
): StudyWorkedStep {
  const time = fixed(state.seconds);
  const root = landing.time;

  return {
    title: state.landed ? 'The exact landing event' : `Position at ${time} seconds`,
    lines: [
      `D = ${fixed(example.verticalSpeed)}² + 2 × ${fixed(example.gravity)} × (${fixed(example.launchHeight)} − ${fixed(example.landingHeight)}) = ${fixed(landing.discriminant)}.`,
      root === null
        ? landing.discriminant < 0
          ? 'D is negative: there is no real time at which the flare reaches the selected height.'
          : 'Both height encounters are in the past: there is no future landing.'
        : `Later root: t = (${fixed(example.verticalSpeed)} + √${fixed(landing.discriminant)}) / ${fixed(example.gravity)} = ${fixed(root)} s; landing x = ${fixed(example.startX)} + ${fixed(example.horizontalSpeed)} × ${fixed(root)} = ${fixed(landing.x ?? 0)} m.`,
      `x(t) = ${fixed(example.startX)} + ${fixed(example.horizontalSpeed)} × ${time} = ${fixed(state.x)} m.`,
      `height(t) = ${fixed(example.launchHeight)} + ${fixed(example.verticalSpeed)} × ${time} − ½ × ${fixed(example.gravity)} × ${time}² ≈ ${fixed(state.height)} m.`,
      state.landed
        ? `Just before contact, vertical velocity = ${fixed(example.verticalSpeed)} − ${fixed(example.gravity)} × ${time} = ${fixed(landing.impactVerticalVelocity ?? 0)} m/s. The absorbing surface then holds the flare still.`
        : `vertical velocity(t) = ${fixed(example.verticalSpeed)} − ${fixed(example.gravity)} × ${time} = ${fixed(state.verticalVelocity)} m/s.`,
    ],
    note: state.landed
      ? 'This time comes from the quadratic root. It is not the first preview sample below the surface, nor an extrapolation of the last visible point.'
      : Math.abs(state.verticalVelocity) < 1e-9
        ? 'At the apex, vertical velocity is zero while horizontal velocity continues. The flare has not stopped in mid-air.'
        : 'The same time goes into both axes. Displayed numbers are rounded; the calculation retains the unrounded root.',
  };
}

function frameOf(
  state: ProjectileState,
  example: ProjectileParameters,
  landing: ProjectileLanding,
  left: number,
  right: number,
  path: readonly MotionLink[],
): MotionFrame {
  const landingResult =
    landing.time === null
      ? 'absent: there is no future height encounter'
      : `at x ${fixed(landing.x ?? 0)} m after ${fixed(landing.time)} s`;

  return {
    seconds: state.seconds,
    bodies: [
      {
        id: 'flare',
        x: state.x,
        y: -state.height,
        tone: 'actual',
        label: state.seconds === 0 || state.landed ? undefined : 'Dock flare',
      },
    ],
    vectors: state.landed
      ? []
      : [
          {
            x: state.x,
            y: -state.height,
            dx: example.horizontalSpeed * example.timeStep,
            dy: -state.verticalVelocity * example.timeStep,
            tone: 'actual',
          },
        ],
    marks: [
      { x: example.startX, y: -example.launchHeight, shape: 'dot', tone: 'muted', label: 'Roof' },
      ...(landing.x === null
        ? []
        : [
            {
              x: landing.x,
              y: -example.landingHeight,
              shape: 'cross' as const,
              tone: 'target' as const,
              label: 'Landing',
            },
          ]),
    ],
    links: [
      {
        from: { x: left, y: -example.landingHeight },
        to: { x: right, y: -example.landingHeight },
        tone: 'muted',
      },
      ...path,
    ],
    values: {
      time: fixed(state.seconds),
      x: fixed(state.x),
      height: fixed(state.height),
      horizontalSpeed: fixed(example.horizontalSpeed),
      verticalVelocity: fixed(state.verticalVelocity),
      launchHeight: fixed(example.launchHeight),
      verticalSpeed: fixed(example.verticalSpeed),
      gravity: fixed(example.gravity),
      landingHeight: fixed(example.landingHeight),
      unreachableHeight: fixed(example.unreachableHeight),
      timeStep: fixed(example.timeStep),
      apexHeight: fixed(landing.apexHeight),
      discriminant: fixed(landing.discriminant),
      landingResult,
      phase: state.landed ? 'resting at the selected plane' : 'airborne',
    },
    note: state.landed
      ? 'The flare meets the selected plane exactly and this preview ends at contact.'
      : landing.time === null
        ? 'No landing cross is drawn: the selected height has no future encounter. The body is only a preview of its free flight.'
        : 'The cross is a future landing, not the current position. Height is drawn upwards; screen y is its negative.',
    worked: workedStep(state, example, landing),
  };
}

function raisedPlane(example: ProjectileParameters): NonNullable<MotionStudyModel['comparison']> {
  const normal = predictProjectileLanding(example);
  const raised = predictProjectileLanding(example, example.unreachableHeight);
  const seconds = Array.from(
    { length: example.steps + 1 },
    (_unused, step) => step * example.timeStep,
  );
  const normalClearance = seconds.map(
    (time) => projectileAt(example, time).height - example.landingHeight,
  );
  const raisedClearance = seconds.map(
    (time) =>
      projectileAt(example, time, example.unreachableHeight).height - example.unreachableHeight,
  );
  const same = example.landingHeight === example.unreachableHeight;

  return {
    title: 'What if the requested height is above the apex?',
    intro: `Change only the selected plane from ${fixed(example.landingHeight)} m to ${fixed(example.unreachableHeight)} m. The chart measures height relative to each plane, so zero means contact. It retains the full ${fixed(example.steps * example.timeStep)} s preview; a landed flare remains at its plane.`,
    timeline: {
      title: 'Height relative to the selected plane',
      xLabel: 'Time · seconds',
      yLabel: 'Height relative to plane · m',
      seconds,
      reference: 0,
      yRange: [
        Math.min(0, ...normalClearance, ...raisedClearance),
        Math.max(0, ...normalClearance, ...raisedClearance),
      ],
      series: [
        {
          id: 'normal',
          label: `Solid green · plane at ${fixed(example.landingHeight)} m`,
          tone: 'actual',
          values: normalClearance,
        },
        {
          id: 'raised',
          label: `Dashed amber · plane at ${fixed(example.unreachableHeight)} m`,
          tone: 'desired',
          values: raisedClearance,
        },
      ],
    },
    findings: same
      ? ['Both selections now name the same height, so the two runs coincide.']
      : [
          raised.time === null
            ? `The raised request has D = ${fixed(raised.discriminant)}. Its plane is ${fixed(example.unreachableHeight - raised.apexHeight)} m above the ${fixed(raised.apexHeight)} m apex, so no landing time or landing point exists.`
            : `The second plane is reachable: its later encounter is at ${fixed(raised.time)} s and x ${fixed(raised.x ?? 0)} m. It is no longer an unreachable-height example.`,
          normal.time === null
            ? 'The original selection also has no future encounter; neither run should invent a landing.'
            : `The original selection lands at ${fixed(normal.time)} s and x ${fixed(normal.x ?? 0)} m. A preview ending elsewhere must not be labelled its landing.`,
        ],
    note: 'This is a selected-height query. It does not test a finite platform, a wall, water drag or any earlier collision.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = projectileFrames(example);
  const landing = predictProjectileLanding(example);
  const xs = states.map(({ x }) => x);
  const heights = states.map(({ height }) => height);
  const left = Math.min(example.startX, ...xs, landing.x ?? example.startX) - 4;
  const right = Math.max(example.startX, ...xs, landing.x ?? example.startX) + 4;
  const apexTime = Math.max(0, example.verticalSpeed / example.gravity);
  const apexStep = states.reduce(
    (best, state, index) =>
      Math.abs(state.seconds - apexTime) < Math.abs(states[best].seconds - apexTime) ? index : best,
    0,
  );
  const lastStep = states.length - 1;
  const landed = states[lastStep].landed;
  const path: readonly MotionLink[] = states.slice(1).map((state, index) => ({
    from: { x: states[index].x, y: -states[index].height },
    to: { x: state.x, y: -state.height },
    tone: 'actual',
  }));

  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: left,
        maxX: right + Math.abs(example.horizontalSpeed * example.timeStep),
        minY: -Math.max(...heights, example.landingHeight, landing.apexHeight) - 4,
        maxY: -Math.min(...heights, example.landingHeight) + 4 + example.gravity * example.timeStep,
      },
      frames: states.map((state) => frameOf(state, example, landing, left, right, path)),
      trail: true,
    },
    timeline: {
      title: 'Flare height',
      xLabel: 'Time · seconds',
      yLabel: 'Height · m',
      seconds: states.map(({ seconds }) => seconds),
      reference: example.landingHeight,
      yRange: [
        Math.min(...heights, example.landingHeight),
        Math.max(...heights, example.landingHeight),
      ],
      series: [
        { id: 'height', label: 'Solid green · flare height', tone: 'actual', values: heights },
      ],
      marks: [{ x: states[apexStep].seconds, y: states[apexStep].height, tone: 'actual' }],
    },
    initialStep: apexStep,
    moments: [
      { label: 'Launch', step: 0 },
      { label: 'Nearest sample to apex', step: apexStep },
      {
        label: landed ? 'Last airborne sample' : 'Before preview ends',
        step: Math.max(0, lastStep - 1),
      },
      { label: landed ? 'Exact landing' : 'Preview ends', step: lastStep },
    ].sort((a, b) => a.step - b.step),
    legend: [
      { tone: 'actual', label: 'Green dot · dock flare; arrow · velocity × time step' },
      { tone: 'target', label: 'Cross · predicted landing at the selected height' },
      { tone: 'muted', label: 'Line · selected height; dot · launch roof' },
    ],
    caption:
      'A side view of the dock flare. Positive height points upwards. The curve and cross come from the same unrounded constant-gravity equations; the preview ends exactly at contact, or at its time limit when there is none.',
    comparison: raisedPlane(example),
    inputs: [
      { name: 'landingHeight', label: 'Selected height', unit: 'm', min: 0, max: 18, step: 1 },
    ],
  };
};
