import { slotPosition } from '@dotln-angular/scene-engine';

import type { MotionBody, MotionFrame, MotionMark, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  assignedTarget,
  cameraReadout,
  coordinatedMovementFrames,
  type CoordinatedMovementParameters,
  coordinatedMovementSamples,
  type CoordinatedMovementState,
  coordinationErrors,
  crew,
} from './coordinated-movement.simulation';
import { boundsOfPoints, decimal, vectorText } from './presentation';

function crewLabel(id: string, t: StudyTranslate): string {
  switch (id) {
    case 'scanner':
      return t('studyAifg.coordinated-movement.model.crewLabels.scanner');
    case 'camera':
      return t('studyAifg.coordinated-movement.model.crewLabels.camera');
    case 'radio':
      return t('studyAifg.coordinated-movement.model.crewLabels.radio');
    default:
      throw new Error('The survey member needs a presentation label.');
  }
}

function frameWorkedStep(
  state: CoordinatedMovementState,
  example: CoordinatedMovementParameters,
  readout: ReturnType<typeof cameraReadout>,
  t: StudyTranslate,
): MotionFrame['worked'] {
  const {
    seconds,
    camera,
    next,
    target,
    acceleration,
    gap,
    stop,
    desiredSpeed,
    desired,
    requested,
    nextCamera,
  } = readout;

  if (!next || !target || !acceleration || !nextCamera) return samplingEnd(readout, t);
  return {
    title: t('studyAifg.coordinated-movement.model.frame.worked.titles.cameraFollowsMovedSlot', {
      seconds: decimal(seconds, 4),
      secondsTimeStep: decimal(seconds + example.timeStep, 4),
    }),
    lines: [
      t(
        'studyAifg.coordinated-movement.model.frame.worked.steps.advanceFormationMovesSharedAnchor',
        {
          formationAnchor: vectorText(state.formation.anchor, 4),
          nextFormationAnchor: vectorText(next.formation.anchor, 4),
          target: vectorText(target, 4),
        },
      ),
      t('studyAifg.coordinated-movement.model.frame.worked.steps.distanceCameraTargetSpeed', {
        cameraPosition: vectorText(camera.position, 4),
        gap: decimal(gap, 4),
        desiredSpeed: decimal(desiredSpeed, 4),
        cameraMaxSpeed: decimal(camera.maxSpeed, 4),
        slowRadius: decimal(example.slowRadius, 4),
        stop: decimal(stop, 4),
      }),
      t(
        'studyAifg.coordinated-movement.model.frame.worked.steps.requestedAccelerationPublicArrive',
        {
          desired: vectorText(desired, 4),
          cameraVelocity: vectorText(camera.velocity, 4),
          responseTime: decimal(example.responseTime, 4),
          requested: vectorText(requested, 4),
          maxAcceleration: decimal(example.maxAcceleration, 4),
          acceleration: vectorText(acceleration, 4),
        },
      ),
      t('studyAifg.coordinated-movement.model.frame.worked.steps.velocityClipLength', {
        cameraVelocity: vectorText(camera.velocity, 4),
        acceleration: vectorText(acceleration, 4),
        timeStep: decimal(example.timeStep, 4),
        cameraMaxSpeed: decimal(camera.maxSpeed, 4),
        nextCameraVelocity: vectorText(nextCamera.velocity, 4),
      }),
      t('studyAifg.coordinated-movement.model.frame.worked.steps.positionCameraPosition', {
        cameraPosition: vectorText(camera.position, 4),
        nextCameraVelocity: vectorText(nextCamera.velocity, 4),
        timeStep: decimal(example.timeStep, 4),
        nextCameraPosition: vectorText(nextCamera.position, 4),
      }),
    ],
    note: t('studyAifg.coordinated-movement.model.frame.worked.notes.anchorReadsAllPrevious'),
  };
}

function samplingEnd(
  { seconds, errors }: ReturnType<typeof cameraReadout>,
  t: StudyTranslate,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.coordinated-movement.model.frame.worked.titles.surveySamplingEnds', {
      seconds: decimal(seconds, 4),
    }),
    lines: [],
    note: t('studyAifg.coordinated-movement.model.frame.worked.notes.cameraRemainingSlotError', {
      errorsCamera: decimal(errors.camera, 4),
    }),
  };
}

function frameValues(
  example: CoordinatedMovementParameters,
  state: CoordinatedMovementState,
  seconds: number,
  errors: { camera: number; mean: number; anchorLag: number },
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
    ...Object.fromEntries(
      state.members.flatMap((member) => [
        [`${member.id}X`, decimal(member.position.x, 4)],
        [`${member.id}Y`, decimal(member.position.y, 4)],
      ]),
    ),
    seconds: decimal(seconds, 4),
    anchorX: decimal(state.formation.anchor.x, 4),
    anchorY: decimal(state.formation.anchor.y, 4),
    cameraError: decimal(errors.camera, 4),
    meanError: decimal(errors.mean, 4),
    anchorLag: decimal(errors.anchorLag, 4),
    slotTargets: crew
      .map(({ id }) =>
        t('studyAifg.coordinated-movement.model.frame.values.slotTargets', {
          label: crewLabel(id, t),
          assignedTarget: vectorText(assignedTarget(state.formation, id), 4),
        }),
      )
      .join('; '),
    memberVelocities: state.members
      .map((member) =>
        t('studyAifg.coordinated-movement.model.frame.values.memberVelocities', {
          memberLabel: crewLabel(member.id, t),
          memberVelocity: vectorText(member.velocity, 4),
        }),
      )
      .join('; '),
  };
}

function frameDrawing(
  state: CoordinatedMovementState,
  example: CoordinatedMovementParameters,
  t: StudyTranslate,
): Pick<MotionFrame, 'bodies' | 'marks' | 'links'> {
  return {
    bodies: state.members.map((member) => ({
      id: member.id,
      ...member.position,
      heading: Math.atan2(member.heading.y, member.heading.x),
      label: crewLabel(member.id, t),
      tone: member.id === 'camera' ? 'actual' : 'other',
    })),
    marks: [
      ...state.formation.assignment.map(({ slot }) => ({
        ...slotPosition(state.formation, slot),
        shape: 'ring' as const,
        tone: 'desired' as const,
      })),
      { ...state.formation.anchor, shape: 'dot', tone: 'muted' },
      {
        x: example.targetX,
        y: example.targetY,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.coordinated-movement.model.frame.marks.labels.gate'),
      },
    ],
    links: state.members.map((member) => ({
      from: member.position,
      to: assignedTarget(state.formation, member.id),
      tone: 'desired',
    })),
  };
}

function frameOf(
  state: CoordinatedMovementState,
  step: number,
  example: CoordinatedMovementParameters,
  t: StudyTranslate,
  readout: ReturnType<typeof cameraReadout>,
): MotionFrame {
  const { seconds, errors } = readout;
  return {
    seconds,
    ...frameDrawing(state, example, t),
    values: frameValues(example, state, seconds, errors, t),
    note:
      step === 0
        ? t('studyAifg.coordinated-movement.model.frame.notes.everyRobotOwnsDistinct')
        : t('studyAifg.coordinated-movement.model.frame.notes.ringsMoveAnchorRobots'),
    worked: frameWorkedStep(state, example, readout, t),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  normalPeak: number,
  slowPeak: number,
  example: CoordinatedMovementParameters,
  errors: { camera: number; mean: number; anchorLag: number }[],
  slowErrors: { camera: number; mean: number; anchorLag: number }[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.coordinated-movement.model.comparison.timeline.title'),
    xLabel: t('studyAifg.coordinated-movement.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.coordinated-movement.model.comparison.timeline.yLabel'),
    seconds,
    yRange: [0, Math.max(normalPeak, slowPeak, 1) * 1.1],
    series: [
      {
        id: 'normal',
        label: t(
          'studyAifg.coordinated-movement.model.comparison.timeline.series.labels.greenCameraSpeed',
          {
            cameraSpeed: example.cameraSpeed,
          },
        ),
        tone: 'actual',
        values: errors.map(({ camera }) => camera),
      },
      {
        id: 'slow',
        label: t(
          'studyAifg.coordinated-movement.model.comparison.timeline.series.labels.amberCameraSpeed',
          { failureCameraSpeed: example.failureCameraSpeed },
        ),
        tone: 'desired',
        values: slowErrors.map(({ camera }) => camera),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: CoordinatedMovementParameters,
  seconds: number[],
  normalPeak: number,
  slowPeak: number,
  errors: { camera: number; mean: number; anchorLag: number }[],
  slowErrors: { camera: number; mean: number; anchorLag: number }[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.coordinated-movement.model.comparison.title'),
    intro: t('studyAifg.coordinated-movement.model.comparison.intro', {
      cameraSpeed: example.cameraSpeed,
      failureCameraSpeed: example.failureCameraSpeed,
      timeStep: example.timeStep,
    }),
    timeline: comparisonTimeline(t, seconds, normalPeak, slowPeak, example, errors, slowErrors),
    findings: [
      t('studyAifg.coordinated-movement.model.comparison.findings.cameraPeakSlotErrors', {
        normalPeak: decimal(normalPeak, 4),
        slowPeak: decimal(slowPeak, 4),
        errorsCamera: decimal(errors[errors.length - 1].camera, 4),
        slowErrorsCamera: decimal(slowErrors[slowErrors.length - 1].camera, 4),
      }),
      example.cameraSpeed === example.failureCameraSpeed
        ? t('studyAifg.coordinated-movement.model.comparison.findings.twoSpeedLimitsNow')
        : t('studyAifg.coordinated-movement.model.comparison.findings.assignmentStaysIntactBoth'),
    ],
    note: t('studyAifg.coordinated-movement.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  errors: { camera: number; mean: number; anchorLag: number }[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.coordinated-movement.model.timeline.title'),
    xLabel: t('studyAifg.coordinated-movement.model.timeline.xLabel'),
    yLabel: t('studyAifg.coordinated-movement.model.timeline.yLabel'),
    seconds,
    series: [
      {
        id: 'camera',
        label: t(
          'studyAifg.coordinated-movement.model.timeline.series.labels.greenCameraSlotError',
        ),
        tone: 'actual',
        values: errors.map(({ camera }) => camera),
      },
      {
        id: 'mean',
        label: t('studyAifg.coordinated-movement.model.timeline.series.labels.amberMeanSlotError'),
        tone: 'desired',
        values: errors.map(({ mean }) => mean),
      },
    ],
  };
}

function motionOf(
  points: (MotionBody | MotionMark)[],
  padding: number,
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: boundsOfPoints(points, padding),
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  initialStep: number,
  example: CoordinatedMovementParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.coordinated-movement.model.moments.labels.assignedAbreast'), step: 0 },
    { label: t('studyAifg.coordinated-movement.model.moments.labels.targetsMoveFirst'), step: 1 },
    {
      label: t('studyAifg.coordinated-movement.model.moments.labels.followingPattern'),
      step: initialStep,
    },
    {
      label: t('studyAifg.coordinated-movement.model.moments.labels.samplingHorizon'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'actual',
      label: t('studyAifg.coordinated-movement.model.legend.labels.greenCameraSlotError'),
    },
    { tone: 'other', label: t('studyAifg.coordinated-movement.model.legend.labels.scannerRadio') },
    {
      tone: 'desired',
      label: t('studyAifg.coordinated-movement.model.legend.labels.amberRingsSlotsLines'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.coordinated-movement.model.legend.labels.smallDotSharedAnchor'),
    },
    {
      tone: 'target',
      label: t('studyAifg.coordinated-movement.model.legend.labels.crossSurveyGate'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'cameraSpeed',
      label: t('studyAifg.coordinated-movement.model.inputs.labels.cameraSpeedLimit'),
      unit: t('studyAifg.coordinated-movement.model.inputs.units.speed'),
      min: 0.5,
      max: 8,
      step: 0.5,
    },
    {
      name: 'anchorSpeed',
      label: t('studyAifg.coordinated-movement.model.inputs.labels.anchorPlanningSpeed'),
      unit: t('studyAifg.coordinated-movement.model.inputs.units.planningSpeed'),
      min: 0.25,
      max: 2,
      step: 0.25,
    },
  ];
}

export function presentStudy(
  example: CoordinatedMovementParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const samples = coordinatedMovementSamples(example);
  const states = samples.map(({ state }) => state);
  const slow = coordinatedMovementFrames({ ...example, cameraSpeed: example.failureCameraSpeed });
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, samples[step].readout),
  );
  const seconds = frames.map(({ seconds: time }) => time);
  const errors = states.map(coordinationErrors);
  const slowErrors = slow.map(coordinationErrors);
  const normalPeak = Math.max(...errors.map(({ camera }) => camera));
  const slowPeak = Math.max(...slowErrors.map(({ camera }) => camera));
  const points = frames.flatMap((frame) => [...frame.bodies, ...(frame.marks ?? [])]);
  const padding = Math.max(example.spacing, 1);
  const initialStep = Math.floor(example.steps / 3);
  return {
    family: 'motion',
    motion: motionOf(points, padding, frames),
    timeline: timelineOf(t, seconds, errors),
    initialStep,
    moments: momentsOf(t, initialStep, example),
    legend: legendOf(t),
    caption: t('studyAifg.coordinated-movement.model.caption'),
    comparison: comparisonOf(t, example, seconds, normalPeak, slowPeak, errors, slowErrors),
    inputs: inputsOf(t),
  };
}
