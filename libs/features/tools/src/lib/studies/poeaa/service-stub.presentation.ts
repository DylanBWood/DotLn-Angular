import type { StudyParameters } from '@dotln-angular/models';

import { matchKind } from '../match-kind';
import {
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type { StatesStudyModel, StudyInput, StudyMoment, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type BoardOutcome,
  type FailureKind,
  isSuccessStatus,
  type RawReply,
} from './gateway.simulation';
import {
  type CaseId,
  type CaseOperation,
  cases,
  type CaseState,
  expectationOf,
  type ServiceStubParameters,
  stubDelayOf,
  type SuiteStep,
  tally,
} from './service-stub.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface ServiceStubRun {
  readonly example: ServiceStubParameters;
  readonly steps: readonly SuiteStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place among the steps. */
interface ServiceStubMoment {
  readonly run: ServiceStubRun;
  readonly index: number;
}

/** A case the stub has answered: what it said, what the gateway made of it, and where it stands. */
interface AnsweredCase {
  readonly answer: RawReply;
  readonly seen: RawReply;
  readonly outcome: BoardOutcome;
  readonly waitedMs: number;
  readonly state: CaseState;
}

const stepAt = ({ run, index }: ServiceStubMoment) => run.steps[index];

/** Reads a case that has been answered, refusing one the stub has not reached yet. */
function answeredCase(step: SuiteStep, id: CaseId): AnsweredCase {
  const { answer, seen, outcome, waitedMs, state } = step.cases[id];
  if (answer === null || seen === null || outcome === null)
    throw new Error(`${id} has not been answered.`);
  return { answer, seen, outcome, waitedMs, state };
}

// Each case's name, the scenario it writes on its request in display words, and the letter its
// token shows; the compiler requires an entry for every case the suite runs.
const names = {
  recorded: 'studyPoeaa.service-stub.model.cases.recorded',
  refusal: 'studyPoeaa.service-stub.model.cases.refusal',
  network: 'studyPoeaa.service-stub.model.cases.network',
  timeout: 'studyPoeaa.service-stub.model.cases.timeout',
} as const satisfies Record<CaseId, string>;
const scenarios = {
  recorded: 'studyPoeaa.service-stub.model.scenarios.recorded',
  refusal: 'studyPoeaa.service-stub.model.scenarios.refusal',
  network: 'studyPoeaa.service-stub.model.scenarios.network',
  timeout: 'studyPoeaa.service-stub.model.scenarios.timeout',
} as const satisfies Record<CaseId, string>;
const tokens = {
  recorded: 'D',
  refusal: 'R',
  network: 'L',
  timeout: 'T',
} as const satisfies Record<CaseId, string>;
// What each of the app's failures is called as an outcome; a message reads the status where it names one.
const failures = {
  http: 'studyPoeaa.service-stub.model.outcomes.http',
  network: 'studyPoeaa.service-stub.model.outcomes.network',
  timeout: 'studyPoeaa.service-stub.model.outcomes.timeout',
} as const satisfies Record<FailureKind, string>;

const caseName = (t: StudyTranslate, id: CaseId): string => t(names[id]);

const scenarioName = (t: StudyTranslate, id: CaseId): string => t(scenarios[id]);

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'queued', label: t('studyPoeaa.service-stub.model.states.queued') },
    {
      id: 'answered',
      label: t('studyPoeaa.service-stub.model.states.answered'),
      tone: 'subject',
    },
    { id: 'passed', label: t('studyPoeaa.service-stub.model.states.passed') },
    { id: 'failed', label: t('studyPoeaa.service-stub.model.states.failed') },
  ],
  objects: cases.map((id) => ({ id, label: caseName(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'answer',
      from: 'queued',
      to: 'answered',
      label: t('studyPoeaa.service-stub.model.operations.answer'),
    },
    {
      id: 'pass',
      from: 'answered',
      to: 'passed',
      label: t('studyPoeaa.service-stub.model.operations.assert'),
    },
    {
      id: 'fail',
      from: 'answered',
      to: 'failed',
      label: t('studyPoeaa.service-stub.model.operations.assert'),
    },
    {
      id: 'liveHolds',
      from: 'passed',
      to: 'passed',
      label: t('studyPoeaa.service-stub.model.operations.live'),
    },
    {
      id: 'liveBreaks',
      from: 'passed',
      to: 'failed',
      label: t('studyPoeaa.service-stub.model.operations.live'),
    },
  ],
});

/**
 * The transition a step's moves cannot be told by their states alone: the recorded case's
 * expectation met once more against the live API leaves it passed where it stood. Answering,
 * judging and breaking live each join their two states by a transition of their own.
 */
function tookAt(step: SuiteStep, before: SuiteStep | undefined): Readonly<Record<string, string>> {
  const { operation } = step;
  if (operation.kind !== 'release') return {};
  const { id } = operation;
  const holds = before?.cases[id].state === 'passed' && step.cases[id].state === 'passed';
  return holds ? { [id]: 'liveHolds' } : {};
}

const snapshotOf = (
  step: SuiteStep,
  index: number,
  steps: readonly SuiteStep[],
): StatesSnapshot => ({
  at: Object.fromEntries(cases.map((id) => [id, step.cases[id].state])),
  took: tookAt(step, steps[index - 1]),
});

/** An outcome in the app's terms: a board, or a failure of one of the app's kinds. */
const outcomeWords = (t: StudyTranslate, outcome: BoardOutcome): string =>
  outcome.kind === 'board'
    ? t('studyPoeaa.service-stub.model.outcomes.board', { version: outcome.version })
    : t(failures[outcome.error], { status: outcome.status ?? 0 });

/** An answer in the API's own terms, before the gateway translates it by the gateway's own rule. */
function answerWords(t: StudyTranslate, answer: RawReply): string {
  return matchKind(answer, {
    unreachable: () => t('studyPoeaa.service-stub.model.answers.dropped'),
    silence: ({ waitedMs }) => t('studyPoeaa.service-stub.model.answers.held', { limit: waitedMs }),
    response: ({ status, version }) =>
      isSuccessStatus(status)
        ? t('studyPoeaa.service-stub.model.answers.board', { status, version })
        : t('studyPoeaa.service-stub.model.answers.status', { status }),
  });
}

/** The few words beside a case's token: what it expects, what it got, and the verdict. */
function caseNote(
  t: StudyTranslate,
  step: SuiteStep,
  id: CaseId,
  example: ServiceStubParameters,
): string {
  const expected = outcomeWords(t, expectationOf(id, example));
  const got = () => outcomeWords(t, answeredCase(step, id).outcome);
  const live = step.operation.kind === 'release' && step.operation.id === id;
  const notes: Record<CaseState, () => string> = {
    queued: () => t('studyPoeaa.service-stub.model.notes.expects', { outcome: expected }),
    answered: () => t('studyPoeaa.service-stub.model.notes.got', { outcome: got() }),
    passed: () =>
      live
        ? t('studyPoeaa.service-stub.model.notes.livePassed', { outcome: got() })
        : t('studyPoeaa.service-stub.model.notes.passed', { outcome: got() }),
    failed: () =>
      live
        ? t('studyPoeaa.service-stub.model.notes.liveFailed', { expected, outcome: got() })
        : t('studyPoeaa.service-stub.model.notes.failed', { expected, outcome: got() }),
  };
  return notes[step.cases[id].state]();
}

/** The sentence for a case the stub has just answered: what it was asked, and what it said. */
function answerNote(
  t: StudyTranslate,
  step: SuiteStep,
  id: CaseId,
  example: ServiceStubParameters,
): string {
  const { answer, seen, outcome } = answeredCase(step, id);
  const words = {
    name: caseName(t, id),
    answer: answerWords(t, answer),
    outcome: outcomeWords(t, outcome),
  };
  if (id === 'recorded') return t('studyPoeaa.service-stub.model.steps.answerPlain', words);
  if (!example.dynamicStub) return t('studyPoeaa.service-stub.model.steps.answerStatic', words);
  // The stub did answer the timeout case, but only after the gateway had stopped waiting.
  return seen.kind === 'silence'
    ? t('studyPoeaa.service-stub.model.steps.answerHeld', {
        ...words,
        delay: stubDelayOf(id, example),
        limit: example.timeoutMs,
      })
    : t('studyPoeaa.service-stub.model.steps.answerDynamic', words);
}

/** The sentence under the drawing: what the step did to which case, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: ServiceStubMoment): string {
  const step = stepAt(moment);
  const { example } = moment.run;
  const { operation } = step;
  if (operation.kind === 'start') return t('studyPoeaa.service-stub.model.steps.start');
  const { id } = operation;
  if (operation.kind === 'answer') return answerNote(t, step, id, example);
  const { state, outcome } = answeredCase(step, id);
  if (operation.kind === 'release')
    return state === 'passed'
      ? t('studyPoeaa.service-stub.model.steps.liveHolds', { live: example.liveVersion })
      : t('studyPoeaa.service-stub.model.steps.liveBreaks', {
          live: example.liveVersion,
          stub: example.fixtureVersion,
        });
  const words = {
    name: caseName(t, id),
    outcome: outcomeWords(t, outcome),
    expected: outcomeWords(t, expectationOf(id, example)),
  };
  return state === 'passed'
    ? t('studyPoeaa.service-stub.model.steps.passed', words)
    : t('studyPoeaa.service-stub.model.steps.failed', words);
}

/** The suite's running count, the last line of every worked step. */
function tallyLine(t: StudyTranslate, step: SuiteStep): string {
  const { passed, failed, waitedMs } = tally(step);
  return t('studyPoeaa.service-stub.model.worked.tally', {
    passed,
    failed,
    waited: waitedMs,
    calls: step.liveCalls,
  });
}

/** The stub's answer worked through: the scenario, what the stub said and when, what the gateway saw. */
function answerWorked(t: StudyTranslate, moment: ServiceStubMoment, id: CaseId): readonly string[] {
  const { example } = moment.run;
  const { answer, seen, outcome, waitedMs } = answeredCase(stepAt(moment), id);
  const delay = stubDelayOf(id, example);
  return [
    t('studyPoeaa.service-stub.model.worked.scenario', { scenario: scenarioName(t, id) }),
    // The recorded case writes no scenario, so there is nothing for the stub to read or ignore.
    ...(id === 'recorded'
      ? []
      : [
          example.dynamicStub
            ? t('studyPoeaa.service-stub.model.worked.read')
            : t('studyPoeaa.service-stub.model.worked.ignored'),
        ]),
    delay === 0
      ? t('studyPoeaa.service-stub.model.worked.stubNow', { answer: answerWords(t, answer) })
      : t('studyPoeaa.service-stub.model.worked.stubHeld', {
          answer: answerWords(t, answer),
          delay,
        }),
    t('studyPoeaa.service-stub.model.worked.wait', { waited: waitedMs, limit: example.timeoutMs }),
    ...(seen.kind === 'silence'
      ? [t('studyPoeaa.service-stub.model.worked.late', { limit: seen.waitedMs })]
      : []),
    t('studyPoeaa.service-stub.model.worked.gateway', { outcome: outcomeWords(t, outcome) }),
  ];
}

/** What one case's step works out: the stub's answer, the verdict, or the live call. */
function caseWorked(
  t: StudyTranslate,
  moment: ServiceStubMoment,
  operation: CaseOperation,
): readonly string[] {
  const { example } = moment.run;
  const { answer, outcome, state } = answeredCase(stepAt(moment), operation.id);
  const expected = () =>
    t('studyPoeaa.service-stub.model.worked.expected', {
      outcome: outcomeWords(t, expectationOf(operation.id, example)),
    });
  const verdict = () =>
    state === 'passed'
      ? t('studyPoeaa.service-stub.model.worked.verdictPassed')
      : t('studyPoeaa.service-stub.model.worked.verdictFailed');
  return matchKind(operation, {
    answer: () => answerWorked(t, moment, operation.id),
    assert: () => [
      expected(),
      t('studyPoeaa.service-stub.model.worked.holds', { outcome: outcomeWords(t, outcome) }),
      verdict(),
    ],
    release: () => [
      t('studyPoeaa.service-stub.model.worked.live', { answer: answerWords(t, answer) }),
      expected(),
      verdict(),
    ],
  });
}

/** The worked step of every moment: the case's own lines, then the suite's running count. */
function workedOf(t: StudyTranslate, moment: ServiceStubMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { operation } = step;
  if (operation.kind === 'start')
    return {
      title: t('studyPoeaa.service-stub.model.worked.startTitle'),
      lines: [
        moment.run.example.dynamicStub
          ? t('studyPoeaa.service-stub.model.worked.kindDynamic')
          : t('studyPoeaa.service-stub.model.worked.kindStatic'),
        tallyLine(t, step),
      ],
    };
  const name = caseName(t, operation.id);
  const titles = {
    answer: t('studyPoeaa.service-stub.model.worked.answerTitle', { name, step: moment.index }),
    assert: t('studyPoeaa.service-stub.model.worked.assertTitle', { name, step: moment.index }),
    release: t('studyPoeaa.service-stub.model.worked.releaseTitle', { name, step: moment.index }),
  };
  return {
    title: titles[operation.kind],
    lines: [...caseWorked(t, moment, operation), tallyLine(t, step)],
    note:
      operation.kind === 'release'
        ? t('studyPoeaa.service-stub.model.worked.releaseNote')
        : t('studyPoeaa.service-stub.model.worked.stubNote'),
  };
}

/** The values the record's prose reads at a moment, the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: ServiceStubMoment): StatesMomentText {
  const step = stepAt(moment);
  const { example, parameters } = moment.run;
  const { passed, failed, waitedMs } = tally(step);
  return {
    values: {
      ...studyParameterValues(parameters, t),
      passed: String(passed),
      failed: String(failed),
      waited: String(waitedMs),
      liveCalls: String(step.liveCalls),
      stubKind: example.dynamicStub
        ? t('studyPoeaa.service-stub.model.values.dynamic')
        : t('studyPoeaa.service-stub.model.values.static'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(cases.map((id) => [id, caseNote(t, step, id, example)])),
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'dynamicStub',
    label: t('studyPoeaa.service-stub.model.inputs.dynamicStub'),
    unit: t('studyPoeaa.service-stub.model.inputs.flag'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'liveVersion',
    label: t('studyPoeaa.service-stub.model.inputs.liveVersion'),
    unit: t('studyPoeaa.service-stub.model.inputs.version'),
    min: 1,
    max: 2,
    step: 1,
  },
];

/** The named moments: three of the stub's answers, the end of the suite, and the release. */
function momentsOf(t: StudyTranslate, run: ServiceStubRun): readonly StudyMoment[] {
  const answered = (id: CaseId) =>
    run.steps.findIndex(({ operation }) => operation.kind === 'answer' && operation.id === id);
  const last = run.steps.length - 1;
  return [
    { label: t('studyPoeaa.service-stub.model.moments.recorded'), step: answered('recorded') },
    { label: t('studyPoeaa.service-stub.model.moments.refusal'), step: answered('refusal') },
    { label: t('studyPoeaa.service-stub.model.moments.timeout'), step: answered('timeout') },
    { label: t('studyPoeaa.service-stub.model.moments.done'), step: last - 1 },
    { label: t('studyPoeaa.service-stub.model.moments.release'), step: last },
  ];
}

/** The suite drawn as a register: each case's row, in the column of where it stands at every step. */
export function present(run: ServiceStubRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map(snapshotOf),
      text: run.steps.map((_, index) => textOf(t, { run, index })),
    },
    {
      moments: momentsOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}
