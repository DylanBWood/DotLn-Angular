import type { StudyParameters } from '@dotln-angular/models';

import {
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type { StatesStudyModel, StudyInput, StudyMoment, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import type { BoardOutcome, RawReply } from './gateway.simulation';
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

/** The letter each case's token shows. */
const keys: Readonly<Record<CaseId, string>> = {
  recorded: 'D',
  refusal: 'R',
  network: 'L',
  timeout: 'T',
};

function caseName(t: StudyTranslate, id: CaseId): string {
  switch (id) {
    case 'recorded':
      return t('studyPoeaa.service-stub.model.cases.recorded');
    case 'refusal':
      return t('studyPoeaa.service-stub.model.cases.refusal');
    case 'network':
      return t('studyPoeaa.service-stub.model.cases.network');
    default:
      return t('studyPoeaa.service-stub.model.cases.timeout');
  }
}

/** The scenario a case writes on its request, in display words; the recorded case writes none. */
function scenarioName(t: StudyTranslate, id: CaseId): string {
  switch (id) {
    case 'recorded':
      return t('studyPoeaa.service-stub.model.scenarios.recorded');
    case 'refusal':
      return t('studyPoeaa.service-stub.model.scenarios.refusal');
    case 'network':
      return t('studyPoeaa.service-stub.model.scenarios.network');
    default:
      return t('studyPoeaa.service-stub.model.scenarios.timeout');
  }
}

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
  objects: cases.map((id) => ({ id, label: caseName(t, id), key: keys[id] })),
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

/** The transition the case acted on took, read from its state before and after the step. */
function tookAt(step: SuiteStep, before: SuiteStep | undefined): Readonly<Record<string, string>> {
  const { operation } = step;
  if (operation.kind === 'start') return {};
  const { id } = operation;
  const passed = step.cases[id].state === 'passed';
  switch (operation.kind) {
    case 'answer':
      return { [id]: 'answer' };
    case 'assert':
      return { [id]: passed ? 'pass' : 'fail' };
    default:
      // Only a case that passed against the stub has an expectation left to test live.
      return before?.cases[id].state === 'passed'
        ? { [id]: passed ? 'liveHolds' : 'liveBreaks' }
        : {};
  }
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
function outcomeWords(t: StudyTranslate, outcome: BoardOutcome): string {
  if (outcome.kind === 'board')
    return t('studyPoeaa.service-stub.model.outcomes.board', { version: outcome.version });
  switch (outcome.error) {
    case 'http':
      return t('studyPoeaa.service-stub.model.outcomes.http', { status: outcome.status ?? 0 });
    case 'network':
      return t('studyPoeaa.service-stub.model.outcomes.network');
    default:
      return t('studyPoeaa.service-stub.model.outcomes.timeout');
  }
}

/** An answer in the API's own terms, before the gateway translates it. */
function answerWords(t: StudyTranslate, answer: RawReply): string {
  switch (answer.kind) {
    case 'unreachable':
      return t('studyPoeaa.service-stub.model.answers.dropped');
    case 'silence':
      return t('studyPoeaa.service-stub.model.answers.held', { limit: answer.waitedMs });
    default:
      return answer.status >= 200 && answer.status < 300
        ? t('studyPoeaa.service-stub.model.answers.board', {
            status: answer.status,
            version: answer.version,
          })
        : t('studyPoeaa.service-stub.model.answers.status', { status: answer.status });
  }
}

/** The few words beside a case's token: what it expects, what it got, and the verdict. */
function caseNote(
  t: StudyTranslate,
  step: SuiteStep,
  id: CaseId,
  example: ServiceStubParameters,
): string {
  const expected = outcomeWords(t, expectationOf(id, example));
  if (step.cases[id].state === 'queued')
    return t('studyPoeaa.service-stub.model.notes.expects', { outcome: expected });
  const { state, outcome } = answeredCase(step, id);
  const got = outcomeWords(t, outcome);
  const live = step.operation.kind === 'release' && step.operation.id === id;
  switch (state) {
    case 'answered':
      return t('studyPoeaa.service-stub.model.notes.got', { outcome: got });
    case 'passed':
      return live
        ? t('studyPoeaa.service-stub.model.notes.livePassed', { outcome: got })
        : t('studyPoeaa.service-stub.model.notes.passed', { outcome: got });
    default:
      return live
        ? t('studyPoeaa.service-stub.model.notes.liveFailed', { expected, outcome: got })
        : t('studyPoeaa.service-stub.model.notes.failed', { expected, outcome: got });
  }
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
  if (example.dynamicStub === 0)
    return t('studyPoeaa.service-stub.model.steps.answerStatic', words);
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
          example.dynamicStub === 0
            ? t('studyPoeaa.service-stub.model.worked.ignored')
            : t('studyPoeaa.service-stub.model.worked.read'),
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
  const got = outcomeWords(t, outcome);
  switch (operation.kind) {
    case 'answer':
      return answerWorked(t, moment, operation.id);
    case 'assert':
      return [
        t('studyPoeaa.service-stub.model.worked.expected', {
          outcome: outcomeWords(t, expectationOf(operation.id, example)),
        }),
        t('studyPoeaa.service-stub.model.worked.holds', { outcome: got }),
        state === 'passed'
          ? t('studyPoeaa.service-stub.model.worked.verdictPassed')
          : t('studyPoeaa.service-stub.model.worked.verdictFailed'),
      ];
    default:
      return [
        t('studyPoeaa.service-stub.model.worked.live', { answer: answerWords(t, answer) }),
        t('studyPoeaa.service-stub.model.worked.expected', {
          outcome: outcomeWords(t, expectationOf(operation.id, example)),
        }),
        state === 'passed'
          ? t('studyPoeaa.service-stub.model.worked.verdictPassed')
          : t('studyPoeaa.service-stub.model.worked.verdictFailed'),
      ];
  }
}

/** The worked step of every moment: the case's own lines, then the suite's running count. */
function workedOf(t: StudyTranslate, moment: ServiceStubMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { operation } = step;
  if (operation.kind === 'start')
    return {
      title: t('studyPoeaa.service-stub.model.worked.startTitle'),
      lines: [
        moment.run.example.dynamicStub === 0
          ? t('studyPoeaa.service-stub.model.worked.kindStatic')
          : t('studyPoeaa.service-stub.model.worked.kindDynamic'),
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
      stubKind:
        example.dynamicStub === 0
          ? t('studyPoeaa.service-stub.model.values.static')
          : t('studyPoeaa.service-stub.model.values.dynamic'),
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
