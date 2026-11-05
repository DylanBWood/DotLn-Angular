import type { MotionFrame, MotionStudyModel, StudyPoint } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  add3,
  calculateThirdDimensionStep,
  degrees,
  droneAxes,
  type DroneState,
  projectDrone,
  scale3,
  subtract3,
  targetOf,
  type ThirdDimensionParameters,
  thirdDimensionSamples,
  volumeLength,
  type VolumeVector,
} from './movement-in-the-third-dimension.simulation';
import { boundsOfPoints, decimal } from './presentation';

const volumeText = (value: VolumeVector, t: StudyTranslate) =>
  t('studyAifg.movement-in-the-third-dimension.model.volumeText.descriptions.value', {
    value: decimal(value.x),
    value2: decimal(value.y),
    value3: decimal(value.z),
  });

function frameWorkedStep(
  t: StudyTranslate,
  seconds: number,
  calculation: {
    offset: VolumeVector;
    distance: number;
    acceleration: VolumeVector;
    candidateVelocity: VolumeVector;
    reached: boolean;
    next: DroneState;
  },
  example: ThirdDimensionParameters,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.movement-in-the-third-dimension.model.frame.worked.title', {
      seconds: decimal(seconds),
    }),
    lines: [
      t(
        'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.targetMinusPositionRetaining',
        {
          offset: volumeText(calculation.offset, t),
          distance: decimal(calculation.distance),
        },
      ),
      t(
        'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.localAccelerationOffsetLength',
        {
          maxAcceleration: decimal(example.maxAcceleration),
          acceleration: volumeText(calculation.acceleration, t),
        },
      ),
      t(
        'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.velocityAccelerationCappedTotal',
        {
          timeStep: decimal(example.timeStep),
          maxSpeed: decimal(example.maxSpeed),
          candidateVelocity: volumeText(calculation.candidateVelocity, t),
        },
      ),
      calculation.reached
        ? t(
            'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.nextTravelReachesEffective',
            {
              nextPosition: volumeText(calculation.next.position, t),
            },
          )
        : t(
            'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.positionCappedVelocity',
            {
              timeStep: decimal(example.timeStep),
              nextPosition: volumeText(calculation.next.position, t),
            },
          ),
      t(
        'studyAifg.movement-in-the-third-dimension.model.frame.worked.steps.nextYawPitchIndependent',
        {
          degrees: decimal(degrees(calculation.next.yaw)),
          degrees2: decimal(degrees(calculation.next.pitch)),
          rollDegrees: decimal(example.rollDegrees),
        },
      ),
    ],
    note: t('studyAifg.movement-in-the-third-dimension.model.frame.worked.note'),
  };
}

function frameValues(
  seconds: number,
  example: ThirdDimensionParameters,
  state: DroneState,
  speed: number,
  gap: number,
): MotionFrame['values'] {
  return {
    seconds: decimal(seconds),
    groundHeight: decimal(example.startY),
    x: decimal(state.position.x),
    y: decimal(state.position.y),
    z: decimal(state.position.z),
    targetX: decimal(example.targetX),
    targetY: decimal(example.targetY),
    targetZ: decimal(example.targetZ),
    speed: decimal(speed),
    distance: decimal(gap),
    yaw: decimal(degrees(state.yaw)),
    pitch: decimal(degrees(state.pitch)),
    roll: decimal(degrees(state.roll)),
    maxSpeed: decimal(example.maxSpeed),
    maxAcceleration: decimal(example.maxAcceleration),
    timeStep: decimal(example.timeStep),
    verticalWeight: String(example.verticalWeight),
    flatVerticalWeight: String(example.flatVerticalWeight),
  };
}

function frameDrawing(
  state: DroneState,
  target: VolumeVector,
  example: ThirdDimensionParameters,
  t: StudyTranslate,
): Pick<MotionFrame, 'bodies' | 'marks' | 'links' | 'vectors'> {
  const point = projectDrone(state.position);
  const shadow = projectDrone({ ...state.position, y: example.startY });
  const { forward, right, levelRight } = droneAxes(state);
  const nose = projectDrone(add3(state.position, forward));
  const wing = (axis: VolumeVector) => ({
    from: projectDrone(add3(state.position, scale3(axis, -example.wingSpan / 2))),
    to: projectDrone(add3(state.position, scale3(axis, example.wingSpan / 2))),
  });
  return {
    bodies: [
      {
        id: 'drone',
        ...point,
        heading: Math.atan2(nose.y - point.y, nose.x - point.x),
        label: t('studyAifg.movement-in-the-third-dimension.model.frame.bodies.labels.drone'),
      },
      {
        id: 'ground-projection',
        ...shadow,
        tone: 'muted',
        label: t(
          'studyAifg.movement-in-the-third-dimension.model.frame.bodies.labels.groundProjection',
        ),
      },
    ],
    marks: [
      {
        ...projectDrone(target),
        shape: 'cross',
        label: t('studyAifg.movement-in-the-third-dimension.model.frame.marks.labels.beacon'),
      },
      { ...projectDrone({ ...target, y: example.startY }), shape: 'ring', tone: 'muted' },
    ],
    links: [
      { from: shadow, to: point, tone: 'muted' },
      {
        from: projectDrone({ ...target, y: example.startY }),
        to: projectDrone(target),
        tone: 'target',
      },
      { ...wing(levelRight), tone: 'other' },
      { ...wing(right), tone: 'desired' },
    ],
    vectors: [
      { x: point.x, y: point.y, dx: nose.x - point.x, dy: nose.y - point.y, tone: 'actual' },
    ],
  };
}

function frameOf(
  state: DroneState,
  step: number,
  example: ThirdDimensionParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateThirdDimensionStep>,
): MotionFrame {
  const target = targetOf(example);
  const seconds = step * example.timeStep;
  const speed = volumeLength(state.velocity);
  const gap = volumeLength(subtract3(target, state.position));
  return {
    seconds,
    ...frameDrawing(state, target, example, t),
    values: frameValues(seconds, example, state, speed, gap),
    note:
      gap === 0
        ? t('studyAifg.movement-in-the-third-dimension.model.frame.notes.droneHasReachedBeacon')
        : t(
            'studyAifg.movement-in-the-third-dimension.model.frame.notes.heightConnectorSeparatesDrone',
          ),
    worked: frameWorkedStep(t, seconds, calculation, example),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: ThirdDimensionParameters,
  normalDistance: number[],
  flatDistance: number[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.movement-in-the-third-dimension.model.comparison.timeline.title'),
    xLabel: t('studyAifg.movement-in-the-third-dimension.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.movement-in-the-third-dimension.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'volume',
        label: t(
          'studyAifg.movement-in-the-third-dimension.model.comparison.timeline.series.labels.heightWeight',
          {
            verticalWeight: example.verticalWeight,
          },
        ),
        tone: 'actual',
        values: normalDistance,
      },
      {
        id: 'flat',
        label: t(
          'studyAifg.movement-in-the-third-dimension.model.comparison.timeline.series.labels.heightWeight2',
          { flatVerticalWeight: example.flatVerticalWeight },
        ),
        tone: 'desired',
        values: flatDistance,
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: ThirdDimensionParameters,
  seconds: number[],
  normalDistance: number[],
  flatDistance: number[],
  flat: readonly DroneState[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.movement-in-the-third-dimension.model.comparison.title'),
    intro: t('studyAifg.movement-in-the-third-dimension.model.comparison.intro', {
      verticalWeight: example.verticalWeight,
      flatVerticalWeight: example.flatVerticalWeight,
    }),
    timeline: comparisonTimeline(t, seconds, example, normalDistance, flatDistance),
    findings: [
      t('studyAifg.movement-in-the-third-dimension.model.comparison.findings.normalRunEndsBeacon', {
        normalDistance: decimal(normalDistance[normalDistance.length - 1]),
        flatDistance: decimal(flatDistance[flatDistance.length - 1]),
      }),
      example.targetY === example.startY
        ? t(
            'studyAifg.movement-in-the-third-dimension.model.comparison.findings.beaconStartingHeightSo',
          )
        : t(
            'studyAifg.movement-in-the-third-dimension.model.comparison.findings.flattenedRunEndsHeight',
            {
              flatPosition: decimal(flat[flat.length - 1].position.y),
              targetY: decimal(example.targetY),
            },
          ),
    ],
    note: t('studyAifg.movement-in-the-third-dimension.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: ThirdDimensionParameters,
  states: readonly DroneState[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.movement-in-the-third-dimension.model.timeline.title'),
    xLabel: t('studyAifg.movement-in-the-third-dimension.model.timeline.xLabel'),
    yLabel: t('studyAifg.movement-in-the-third-dimension.model.timeline.yLabel'),
    seconds,
    reference: example.targetY,
    series: [
      {
        id: 'height',
        label: t(
          'studyAifg.movement-in-the-third-dimension.model.timeline.series.labels.actualHeight',
        ),
        tone: 'actual',
        values: states.map((state) => state.position.y),
      },
    ],
  };
}

function motionOf(
  points: StudyPoint[],
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
  example: ThirdDimensionParameters,
  initialStep: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.movement-in-the-third-dimension.model.moments.labels.rest'), step: 0 },
    {
      label: t('studyAifg.movement-in-the-third-dimension.model.moments.labels.firstVolumeStep'),
      step: Math.min(1, example.steps),
    },
    {
      label: t('studyAifg.movement-in-the-third-dimension.model.moments.labels.climbingRolled'),
      step: initialStep,
    },
    {
      label: t('studyAifg.movement-in-the-third-dimension.model.moments.labels.endApproach'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.movement-in-the-third-dimension.model.legend.labels.droneProjectedNose'),
    },
    {
      tone: 'target',
      label: t('studyAifg.movement-in-the-third-dimension.model.legend.labels.beaconHeight'),
    },
    {
      tone: 'desired',
      label: t(
        'studyAifg.movement-in-the-third-dimension.model.legend.labels.wingAfterRollCommand',
      ),
    },
    {
      tone: 'other',
      label: t('studyAifg.movement-in-the-third-dimension.model.legend.labels.wingNoRoll'),
    },
    {
      tone: 'muted',
      label: t(
        'studyAifg.movement-in-the-third-dimension.model.legend.labels.groundProjectionHeightConnector',
      ),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'targetY',
      label: t('studyAifg.movement-in-the-third-dimension.model.inputs.labels.beaconHeight'),
      unit: t('studyAifg.movement-in-the-third-dimension.model.inputs.units.distance'),
      min: 0,
      max: 12,
      step: 1,
    },
    {
      name: 'rollDegrees',
      label: t('studyAifg.movement-in-the-third-dimension.model.inputs.labels.independentRoll'),
      unit: t('studyAifg.movement-in-the-third-dimension.model.inputs.units.degrees'),
      min: -60,
      max: 60,
      step: 10,
    },
  ];
}

export function presentStudy(
  example: ThirdDimensionParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = thirdDimensionSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const flatSamples = thirdDimensionSamples(example, example.flatVerticalWeight);
  const flat = flatSamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, statesSamples[step].calculation),
  );
  const seconds = frames.map((frame) => frame.seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const remaining = (run: readonly DroneState[]) =>
    run.map((state) => volumeLength(subtract3(targetOf(example), state.position)));
  const normalDistance = remaining(states);
  const flatDistance = remaining(flat);
  const padding = Math.max(2, example.wingSpan);
  const initialStep = Math.min(example.steps, 8);
  return {
    family: 'motion',
    motion: motionOf(points, padding, frames),
    timeline: timelineOf(t, seconds, example, states),
    initialStep,
    moments: momentsOf(t, example, initialStep),
    legend: legendOf(t),
    caption: t('studyAifg.movement-in-the-third-dimension.model.caption'),
    comparison: comparisonOf(t, example, seconds, normalDistance, flatDistance, flat),
    inputs: inputsOf(t),
  };
}
