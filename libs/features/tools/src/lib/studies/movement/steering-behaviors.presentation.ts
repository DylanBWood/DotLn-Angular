import type { MotionBody, MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, decimal } from './presentation';
import {
  behaviourExperiment,
  type BehaviourParameters,
  type BehaviourState,
  type BehaviourStep,
} from './steering-behaviors.simulation';

const member = (arrivalEnabled: number, t: StudyTranslate) =>
  arrivalEnabled === 1
    ? t('studyAifg.steering-behaviors.model.member.descriptions.arrive')
    : t('studyAifg.steering-behaviors.model.member.descriptions.seek');

function frameWorkedStep(
  step: BehaviourStep,
  seconds: number,
  example: BehaviourParameters,
  chosen: string,
  t: StudyTranslate,
): MotionFrame['worked'] {
  const { state } = step;
  const gap = Math.abs(example.target - state.position.x);
  const stop = example.targetRadius / 2;

  return {
    title: t('studyAifg.steering-behaviors.model.frames.worked.title', {
      seconds: decimal(seconds),
    }),
    lines: [
      t('studyAifg.steering-behaviors.model.frames.worked.steps.readXVelocityDepot', {
        position: decimal(state.position.x),
        velocity: decimal(state.velocity.x),
        target: decimal(example.target),
        gap: decimal(gap),
      }),
      t('studyAifg.steering-behaviors.model.frames.worked.steps.seekSign', {
        target: decimal(example.target),
        position: decimal(state.position.x),
        maxAcceleration: decimal(example.maxAcceleration),
        seekRequest: decimal(step.seekRequest.x),
      }),
      gap <= stop
        ? t('studyAifg.steering-behaviors.model.frames.worked.steps.insideHalfTargetRadius', {
            stop: decimal(stop),
          })
        : gap >= example.slowRadius
          ? t('studyAifg.steering-behaviors.model.frames.worked.steps.outsideSlowingRadiusArrive', {
              desiredVelocity: decimal(step.desiredVelocity),
            })
          : t('studyAifg.steering-behaviors.model.frames.worked.steps.arriveDesiredVelocitySign', {
              target: decimal(example.target),
              position: decimal(state.position.x),
              maxSpeed: decimal(example.maxSpeed),
              gap: decimal(gap),
              stop: decimal(stop),
              slowRadius: decimal(example.slowRadius),
              desiredVelocity: decimal(step.desiredVelocity),
            }),
      t('studyAifg.steering-behaviors.model.frames.worked.steps.arriveClamp', {
        desiredVelocity: decimal(step.desiredVelocity),
        velocity: decimal(state.velocity.x),
        responseTime: decimal(example.responseTime),
        maxAcceleration: decimal(example.maxAcceleration),
        arriveRequest: decimal(step.arriveRequest.x),
      }),
      t('studyAifg.steering-behaviors.model.frames.worked.steps.selectAccelerationDoNot', {
        chosen: chosen,
        acceleration: decimal(step.acceleration.x),
      }),
      t('studyAifg.steering-behaviors.model.frames.worked.steps.newVelocityClamp', {
        velocity: decimal(state.velocity.x),
        acceleration: decimal(step.acceleration.x),
        timeStep: decimal(example.timeStep),
        maxSpeed: decimal(example.maxSpeed),
        nextVelocity: decimal(step.next.velocity.x),
      }),
      t('studyAifg.steering-behaviors.model.frames.worked.steps.newX', {
        position: decimal(state.position.x),
        nextVelocity: decimal(step.next.velocity.x),
        timeStep: decimal(example.timeStep),
        nextPosition: decimal(step.next.position.x),
      }),
    ],
    note: t('studyAifg.steering-behaviors.model.frames.worked.note'),
  };
}

function frameValues(
  step: BehaviourStep,
  seconds: number,
  example: BehaviourParameters,
  experiment: ReturnType<typeof behaviourExperiment>,
  chosen: string,
  alternative: string,
): MotionFrame['values'] {
  const { state } = step;
  const gap = Math.abs(example.target - state.position.x);
  const { inputValues, overshoot, comparisonOvershoot } = experiment;

  return {
    ...inputValues,
    seconds: decimal(seconds),
    duration: decimal(example.steps * example.timeStep),
    position: decimal(state.position.x),
    velocity: decimal(state.velocity.x),
    gap: decimal(gap),
    desiredVelocity: decimal(step.desiredVelocity),
    seekAcceleration: decimal(step.seekRequest.x),
    arriveAcceleration: decimal(step.arriveRequest.x),
    acceleration: decimal(step.acceleration.x),
    member: chosen,
    comparisonMember: alternative,
    overshoot: decimal(overshoot),
    comparisonOvershoot: decimal(comparisonOvershoot),
  };
}

function frameDrawing(
  state: BehaviourState,
  t: StudyTranslate,
  lane: number,
  step: BehaviourStep,
  example: BehaviourParameters,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'zones'> {
  return {
    bodies: [
      {
        id: 'mara',
        ...state.position,
        heading: state.velocity.x < 0 ? Math.PI : 0,
        label: t('studyAifg.steering-behaviors.model.frames.bodies.labels.mara'),
      },
    ],
    vectors: [
      { x: state.position.x, y: -lane, dx: step.seekRequest.x, dy: 0, tone: 'other' },
      { x: state.position.x, y: lane, dx: step.arriveRequest.x, dy: 0, tone: 'desired' },
      { ...state.position, dx: step.acceleration.x, dy: 0, tone: 'actual' },
    ],
    marks: [
      {
        x: example.target,
        y: 0,
        shape: 'cross',
        label: t('studyAifg.steering-behaviors.model.frames.marks.labels.depot'),
      },
    ],
    zones: [{ x: example.target, y: 0, radius: example.slowRadius }],
  };
}

function frameOf(
  step: BehaviourStep,
  index: number,
  example: BehaviourParameters,
  experiment: ReturnType<typeof behaviourExperiment>,
  t: StudyTranslate,
): MotionFrame {
  const { seconds, lane, comparisonEnabled } = experiment;
  const chosen = member(example.arrivalEnabled, t);
  const alternative = member(comparisonEnabled, t);

  const { state } = step;
  const note =
    state.position.x > example.target
      ? t('studyAifg.steering-behaviors.model.frames.notes.maraPastDepotRequest')
      : step.acceleration.x * state.velocity.x < 0
        ? t('studyAifg.steering-behaviors.model.frames.notes.requestsBrakingMaraStill', {
            chosen: chosen,
            velocityLeftRight:
              state.velocity.x < 0
                ? t('studyAifg.steering-behaviors.model.frames.notes.left')
                : t('studyAifg.steering-behaviors.model.frames.notes.right'),
          })
        : step.acceleration.x === 0 && state.velocity.x !== 0
          ? t('studyAifg.steering-behaviors.model.frames.notes.zeroSelectedAccelerationPreserves')
          : t('studyAifg.steering-behaviors.model.frames.notes.suppliesUpdateOtherRequest', {
              chosen: chosen,
            });

  return {
    seconds: seconds[index],
    ...frameDrawing(state, t, lane, step, example),
    values: frameValues(step, seconds[index], example, experiment, chosen, alternative),
    note,
    worked: frameWorkedStep(step, seconds[index], example, chosen, t),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: BehaviourParameters,
  chosen: string,
  run: readonly BehaviourStep[],
  alternative: string,
  comparison: readonly BehaviourStep[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.steering-behaviors.model.comparison.timeline.title'),
    xLabel: t('studyAifg.steering-behaviors.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.steering-behaviors.model.comparison.timeline.yLabel'),
    seconds,
    reference: example.target,
    series: [
      {
        id: 'selected',
        label: chosen,
        tone: 'actual',
        values: run.map(({ state }) => state.position.x),
      },
      {
        id: 'other-member',
        label: alternative,
        tone: 'desired',
        values: comparison.map(({ state }) => state.position.x),
      },
    ],
  };
}

function comparisonOf(
  example: BehaviourParameters,
  experiment: ReturnType<typeof behaviourExperiment>,
  t: StudyTranslate,
): NonNullable<MotionStudyModel['comparison']> {
  const { comparisonEnabled, seconds, run, comparison, overshoot, comparisonOvershoot } =
    experiment;
  const chosen = member(example.arrivalEnabled, t);
  const alternative = member(comparisonEnabled, t);

  return {
    title: t('studyAifg.steering-behaviors.model.comparison.title'),
    intro: t('studyAifg.steering-behaviors.model.comparison.intro', {
      arrivalEnabled: example.arrivalEnabled,
      chosen: chosen,
      comparisonEnabled: comparisonEnabled,
      alternative: alternative,
    }),
    timeline: comparisonTimeline(t, seconds, example, chosen, run, alternative, comparison),
    findings: [
      t('studyAifg.steering-behaviors.model.comparison.findings.hasRecordedOvershootSampled', {
        chosen: chosen,
        overshoot: decimal(overshoot),
        alternative: alternative,
        comparisonOvershoot: decimal(comparisonOvershoot),
      }),
      t('studyAifg.steering-behaviors.model.comparison.findings.seekKeepsAskingAcceleration'),
    ],
    note: t('studyAifg.steering-behaviors.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  run: readonly BehaviourStep[],
  chosen: string,
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.steering-behaviors.model.timeline.title'),
    xLabel: t('studyAifg.steering-behaviors.model.timeline.xLabel'),
    yLabel: t('studyAifg.steering-behaviors.model.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'seek',
        label: t('studyAifg.steering-behaviors.model.timeline.series.labels.seekRequest'),
        tone: 'other',
        values: run.map(({ seekRequest }) => seekRequest.x),
      },
      {
        id: 'arrive',
        label: t('studyAifg.steering-behaviors.model.timeline.series.labels.arriveRequest'),
        tone: 'desired',
        values: run.map(({ arriveRequest }) => arriveRequest.x),
      },
      {
        id: 'selected',
        label: t('studyAifg.steering-behaviors.model.timeline.series.labels.selectedChosen', {
          chosen: chosen,
        }),
        tone: 'actual',
        values: run.map(({ acceleration }) => acceleration.x),
      },
    ],
  };
}

function motionOf(
  frames: readonly MotionFrame[],
  points: (MotionBody | { x: number; y: number })[],
  padding: number,
): MotionStudyModel['motion'] {
  return {
    frames,
    trail: true,
    bounds: boundsOfPoints(points, padding),
  };
}

function momentsOf(
  t: StudyTranslate,
  cruise: number,
  example: BehaviourParameters,
  braking: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.steering-behaviors.model.moments.labels.firstRequest'), step: 0 },
    {
      label: t('studyAifg.steering-behaviors.model.moments.labels.approach'),
      step: cruise < 0 ? Math.floor(example.steps / 4) : cruise,
    },
    {
      label: t('studyAifg.steering-behaviors.model.moments.labels.brakingRequest'),
      step: braking < 0 ? Math.floor(example.steps / 2) : braking,
    },
    {
      label: t('studyAifg.steering-behaviors.model.moments.labels.endRun'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'other',
      label: t('studyAifg.steering-behaviors.model.legend.labels.upperArrowSeekRequest'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.steering-behaviors.model.legend.labels.lowerArrowArriveRequest'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.steering-behaviors.model.legend.labels.arrowThroughMaraSelected'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.steering-behaviors.model.legend.labels.circleArriveSlowingRadius'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'arrivalEnabled',
      label: t('studyAifg.steering-behaviors.model.inputs.labels.useArriveSeek'),
      unit: t('studyAifg.steering-behaviors.model.inputs.units.choice'),
      min: 0,
      max: 1,
      step: 1,
    },
  ];
}

export function presentStudy(example: BehaviourParameters, t: StudyTranslate): MotionStudyModel {
  const experiment = behaviourExperiment(example);
  const { run, seconds, braking, cruise } = experiment;
  const chosen = member(example.arrivalEnabled, t);
  const frames: readonly MotionFrame[] = run.map((step, index) =>
    frameOf(step, index, example, experiment, t),
  );
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
  ]);
  const padding = Math.max(
    example.radius * 2,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) / 10,
  );

  return {
    family: 'motion',
    motion: motionOf(frames, points, padding),
    timeline: timelineOf(t, seconds, run, chosen),
    initialStep: braking < 0 ? 0 : braking,
    moments: momentsOf(t, cruise, example, braking),
    legend: legendOf(t),
    caption: t('studyAifg.steering-behaviors.model.caption'),
    comparison: comparisonOf(example, experiment, t),
    inputs: inputsOf(t),
  };
}
