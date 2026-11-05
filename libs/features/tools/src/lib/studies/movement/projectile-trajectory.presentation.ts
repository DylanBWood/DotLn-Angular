import type { MotionFrame, MotionLink, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal } from './presentation';
import {
  predictProjectileLanding,
  projectileAt,
  projectileFrames,
  type ProjectileLanding,
  type ProjectileParameters,
  type ProjectileState,
} from './projectile-trajectory.simulation';

function workedStep(
  state: ProjectileState,
  example: ProjectileParameters,
  landing: ProjectileLanding,
  t: StudyTranslate,
): StudyWorkedStep {
  const time = decimal(state.seconds);
  const root = landing.time;

  return {
    title: state.landed
      ? t('studyAifg.projectile-trajectory.model.workedStep.titles.exactLandingEvent')
      : t('studyAifg.projectile-trajectory.model.workedStep.titles.positionSeconds', {
          time: time,
        }),
    lines: [
      t('studyAifg.projectile-trajectory.model.workedStep.steps.dVerticalSpeed', {
        verticalSpeed: decimal(example.verticalSpeed),
        gravity: decimal(example.gravity),
        launchHeight: decimal(example.launchHeight),
        landingHeight: decimal(example.landingHeight),
        landingDiscriminant: decimal(landing.discriminant),
      }),
      root === null
        ? landing.discriminant < 0
          ? t('studyAifg.projectile-trajectory.model.workedStep.steps.dNegativeThereNo')
          : t('studyAifg.projectile-trajectory.model.workedStep.steps.bothHeightEncountersPast')
        : t('studyAifg.projectile-trajectory.model.workedStep.steps.laterRootTLanding', {
            verticalSpeed: decimal(example.verticalSpeed),
            landingDiscriminant: decimal(landing.discriminant),
            gravity: decimal(example.gravity),
            root: decimal(root),
            startX: decimal(example.startX),
            horizontalSpeed: decimal(example.horizontalSpeed),
            landing: decimal(landing.x ?? 0),
          }),
      t('studyAifg.projectile-trajectory.model.workedStep.steps.xT', {
        startX: decimal(example.startX),
        horizontalSpeed: decimal(example.horizontalSpeed),
        time: time,
        x: decimal(state.x),
      }),
      t('studyAifg.projectile-trajectory.model.workedStep.steps.heightT', {
        launchHeight: decimal(example.launchHeight),
        verticalSpeed: decimal(example.verticalSpeed),
        time: time,
        gravity: decimal(example.gravity),
        height: decimal(state.height),
      }),
      state.landed
        ? t('studyAifg.projectile-trajectory.model.workedStep.steps.justBeforeContactVertical', {
            verticalSpeed: decimal(example.verticalSpeed),
            gravity: decimal(example.gravity),
            time: time,
            landingImpactVerticalVelocity: decimal(landing.impactVerticalVelocity ?? 0),
          })
        : t('studyAifg.projectile-trajectory.model.workedStep.steps.verticalVelocityT', {
            verticalSpeed: decimal(example.verticalSpeed),
            gravity: decimal(example.gravity),
            time: time,
            verticalVelocity: decimal(state.verticalVelocity),
          }),
    ],
    note: state.landed
      ? t('studyAifg.projectile-trajectory.model.workedStep.notes.timeComesQuadraticRoot')
      : Math.abs(state.verticalVelocity) < 1e-9
        ? t('studyAifg.projectile-trajectory.model.workedStep.notes.apexVerticalVelocityZero')
        : t('studyAifg.projectile-trajectory.model.workedStep.notes.sameTimeGoesInto'),
  };
}

function frameValues(
  state: ProjectileState,
  example: ProjectileParameters,
  landing: ProjectileLanding,
  landingResult: string,
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    time: decimal(state.seconds),
    x: decimal(state.x),
    height: decimal(state.height),
    horizontalSpeed: decimal(example.horizontalSpeed),
    verticalVelocity: decimal(state.verticalVelocity),
    launchHeight: decimal(example.launchHeight),
    verticalSpeed: decimal(example.verticalSpeed),
    gravity: decimal(example.gravity),
    landingHeight: decimal(example.landingHeight),
    unreachableHeight: decimal(example.unreachableHeight),
    timeStep: decimal(example.timeStep),
    apexHeight: decimal(landing.apexHeight),
    discriminant: decimal(landing.discriminant),
    landingResult,
    phase: state.landed
      ? t('studyAifg.projectile-trajectory.model.frame.values.phaseCases.restingSelectedPlane')
      : t('studyAifg.projectile-trajectory.model.frame.values.phaseCases.airborne'),
  };
}

function frameDrawing(
  state: ProjectileState,
  t: StudyTranslate,
  example: ProjectileParameters,
  landing: ProjectileLanding,
  left: number,
  right: number,
  path: readonly MotionLink[],
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'links'> {
  return {
    bodies: [
      {
        id: 'flare',
        x: state.x,
        y: -state.height,
        tone: 'actual',
        label:
          state.seconds === 0 || state.landed
            ? undefined
            : t('studyAifg.projectile-trajectory.model.frame.bodies.labels.dockFlare'),
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
      {
        x: example.startX,
        y: -example.launchHeight,
        shape: 'dot',
        tone: 'muted',
        label: t('studyAifg.projectile-trajectory.model.frame.marks.labels.roof'),
      },
      ...(landing.x === null
        ? []
        : [
            {
              x: landing.x,
              y: -example.landingHeight,
              shape: 'cross' as const,
              tone: 'target' as const,
              label: t('studyAifg.projectile-trajectory.model.frame.marks.labels.landing'),
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
  };
}

function frameOf(
  state: ProjectileState,
  example: ProjectileParameters,
  landing: ProjectileLanding,
  left: number,
  right: number,
  path: readonly MotionLink[],
  t: StudyTranslate,
): MotionFrame {
  const landingResult =
    landing.time === null
      ? t('studyAifg.projectile-trajectory.model.frame.landingResultCases.absentThereNoFuture')
      : t('studyAifg.projectile-trajectory.model.frame.landingResultCases.xAfter', {
          landing: decimal(landing.x ?? 0),
          landingTime: decimal(landing.time),
        });

  return {
    seconds: state.seconds,
    ...frameDrawing(state, t, example, landing, left, right, path),
    values: frameValues(state, example, landing, landingResult, t),
    note: state.landed
      ? t('studyAifg.projectile-trajectory.model.frame.notes.flareMeetsSelectedPlane')
      : landing.time === null
        ? t('studyAifg.projectile-trajectory.model.frame.notes.noLandingCrossDrawn')
        : t('studyAifg.projectile-trajectory.model.frame.notes.crossFutureLandingNot'),
    worked: workedStep(state, example, landing, t),
  };
}

function raisedPlaneTimeline(
  t: StudyTranslate,
  seconds: number[],
  normalClearance: number[],
  raisedClearance: number[],
  example: ProjectileParameters,
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.projectile-trajectory.model.raisedPlane.timeline.title'),
    xLabel: t('studyAifg.projectile-trajectory.model.raisedPlane.timeline.xLabel'),
    yLabel: t('studyAifg.projectile-trajectory.model.raisedPlane.timeline.yLabel'),
    seconds,
    reference: 0,
    yRange: [
      Math.min(0, ...normalClearance, ...raisedClearance),
      Math.max(0, ...normalClearance, ...raisedClearance),
    ],
    series: [
      {
        id: 'normal',
        label: t(
          'studyAifg.projectile-trajectory.model.raisedPlane.timeline.series.labels.solidGreenPlane',
          {
            landingHeight: decimal(example.landingHeight),
          },
        ),
        tone: 'actual',
        values: normalClearance,
      },
      {
        id: 'raised',
        label: t(
          'studyAifg.projectile-trajectory.model.raisedPlane.timeline.series.labels.dashedAmberPlane',
          { unreachableHeight: decimal(example.unreachableHeight) },
        ),
        tone: 'desired',
        values: raisedClearance,
      },
    ],
  };
}

function raisedPlane(
  example: ProjectileParameters,
  t: StudyTranslate,
  normal: ReturnType<typeof predictProjectileLanding>,
): NonNullable<MotionStudyModel['comparison']> {
  const raised = predictProjectileLanding(example, example.unreachableHeight);
  const seconds = Array.from(
    { length: example.steps + 1 },
    (_unused, step) => step * example.timeStep,
  );
  const normalClearance = seconds.map(
    (time) =>
      projectileAt(example, time, example.landingHeight, normal).height - example.landingHeight,
  );
  const raisedClearance = seconds.map(
    (time) =>
      projectileAt(example, time, example.unreachableHeight, raised).height -
      example.unreachableHeight,
  );
  const same = example.landingHeight === example.unreachableHeight;

  return {
    title: t('studyAifg.projectile-trajectory.model.raisedPlane.title'),
    intro: t('studyAifg.projectile-trajectory.model.raisedPlane.intro', {
      landingHeight: decimal(example.landingHeight),
      unreachableHeight: decimal(example.unreachableHeight),
      stepsTimeStep: decimal(example.steps * example.timeStep),
    }),
    timeline: raisedPlaneTimeline(t, seconds, normalClearance, raisedClearance, example),
    findings: same
      ? [t('studyAifg.projectile-trajectory.model.raisedPlane.findings.bothSelectionsNowName')]
      : [
          raised.time === null
            ? t('studyAifg.projectile-trajectory.model.raisedPlane.findings.raisedRequestHasD', {
                raisedDiscriminant: decimal(raised.discriminant),
                heightAboveApex: decimal(example.unreachableHeight - raised.apexHeight),
                raisedApexHeight: decimal(raised.apexHeight),
              })
            : t(
                'studyAifg.projectile-trajectory.model.raisedPlane.findings.secondPlaneReachableLater',
                {
                  raisedTime: decimal(raised.time),
                  raised: decimal(raised.x ?? 0),
                },
              ),
          normal.time === null
            ? t(
                'studyAifg.projectile-trajectory.model.raisedPlane.findings.originalSelectionAlsoHas',
              )
            : t(
                'studyAifg.projectile-trajectory.model.raisedPlane.findings.originalSelectionLandsX',
                {
                  normalTime: decimal(normal.time),
                  normal: decimal(normal.x ?? 0),
                },
              ),
        ],
    note: t('studyAifg.projectile-trajectory.model.raisedPlane.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  states: readonly ProjectileState[],
  example: ProjectileParameters,
  heights: number[],
  apexStep: number,
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.projectile-trajectory.model.timeline.title'),
    xLabel: t('studyAifg.projectile-trajectory.model.timeline.xLabel'),
    yLabel: t('studyAifg.projectile-trajectory.model.timeline.yLabel'),
    seconds: states.map(({ seconds }) => seconds),
    reference: example.landingHeight,
    yRange: [
      Math.min(...heights, example.landingHeight),
      Math.max(...heights, example.landingHeight),
    ],
    series: [
      {
        id: 'height',
        label: t(
          'studyAifg.projectile-trajectory.model.timeline.series.labels.solidGreenFlareHeight',
        ),
        tone: 'actual',
        values: heights,
      },
    ],
    marks: [{ x: states[apexStep].seconds, y: states[apexStep].height, tone: 'actual' }],
  };
}

function motionOf(
  left: number,
  right: number,
  example: ProjectileParameters,
  heights: number[],
  landing: ProjectileLanding,
  states: readonly ProjectileState[],
  path: readonly MotionLink[],
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: left,
      maxX: right + Math.abs(example.horizontalSpeed * example.timeStep),
      minY: -Math.max(...heights, example.landingHeight, landing.apexHeight) - 4,
      maxY: -Math.min(...heights, example.landingHeight) + 4 + example.gravity * example.timeStep,
    },
    frames: states.map((state) => frameOf(state, example, landing, left, right, path, t)),
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  apexStep: number,
  landed: boolean,
  lastStep: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.projectile-trajectory.model.moments.labels.launch'), step: 0 },
    {
      label: t('studyAifg.projectile-trajectory.model.moments.labels.nearestSampleApex'),
      step: apexStep,
    },
    {
      label: landed
        ? t('studyAifg.projectile-trajectory.model.moments.labels.lastAirborneSample')
        : t('studyAifg.projectile-trajectory.model.moments.labels.beforePreviewEnds'),
      step: Math.max(0, lastStep - 1),
    },
    {
      label: landed
        ? t('studyAifg.projectile-trajectory.model.moments.labels.exactLanding')
        : t('studyAifg.projectile-trajectory.model.moments.labels.previewEnds'),
      step: lastStep,
    },
  ].sort((a, b) => a.step - b.step);
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'actual',
      label: t('studyAifg.projectile-trajectory.model.legend.labels.greenDotDockFlare'),
    },
    {
      tone: 'target',
      label: t('studyAifg.projectile-trajectory.model.legend.labels.crossPredictedLandingSelected'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.projectile-trajectory.model.legend.labels.lineSelectedHeightDot'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'landingHeight',
      label: t('studyAifg.projectile-trajectory.model.inputs.labels.selectedHeight'),
      unit: t('studyAifg.projectile-trajectory.model.inputs.units.metres'),
      min: 0,
      max: 18,
      step: 1,
    },
  ];
}

export function presentStudy(example: ProjectileParameters, t: StudyTranslate): MotionStudyModel {
  const landing = predictProjectileLanding(example);
  const states = projectileFrames(example, landing);
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
    motion: motionOf(left, right, example, heights, landing, states, path, t),
    timeline: timelineOf(t, states, example, heights, apexStep),
    initialStep: apexStep,
    moments: momentsOf(t, apexStep, landed, lastStep),
    legend: legendOf(t),
    caption: t('studyAifg.projectile-trajectory.model.caption'),
    comparison: raisedPlane(example, t, landing),
    inputs: inputsOf(t),
  };
}
