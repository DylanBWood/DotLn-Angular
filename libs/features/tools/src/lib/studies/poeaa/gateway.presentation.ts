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
  type BoardReply,
  type BoardRequest,
  type FailureKind,
  type GatewayOperation,
  type GatewayParameters,
  type GatewayPart,
  type GatewayStep,
  type RawReply,
  untranslated,
} from './gateway.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface GatewayRun {
  readonly example: GatewayParameters;
  readonly steps: readonly GatewayStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place among the steps. */
interface GatewayMoment {
  readonly run: GatewayRun;
  readonly index: number;
}

const stepAt = ({ run, index }: GatewayMoment) => run.steps[index];

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'store', label: t('studyPoeaa.gateway.model.parts.store') },
    { id: 'front', label: t('studyPoeaa.gateway.model.parts.front'), tone: 'subject' },
    { id: 'back', label: t('studyPoeaa.gateway.model.parts.back'), tone: 'subject' },
    { id: 'api', label: t('studyPoeaa.gateway.model.parts.api') },
  ],
  objects: [
    { id: 'request', label: t('studyPoeaa.gateway.model.objects.request'), key: '1' },
    { id: 'reply', label: t('studyPoeaa.gateway.model.objects.reply'), key: '2' },
  ],
  transitions: [
    {
      id: 'load',
      from: 'store',
      to: 'front',
      label: t('studyPoeaa.gateway.model.operations.load'),
    },
    { id: 'get', from: 'front', to: 'back', label: t('studyPoeaa.gateway.model.operations.get') },
    { id: 'send', from: 'back', to: 'api', label: t('studyPoeaa.gateway.model.operations.send') },
    {
      id: 'answered',
      from: 'api',
      to: null,
      label: t('studyPoeaa.gateway.model.operations.answer'),
    },
    { id: 'answer', from: null, to: 'api', label: t('studyPoeaa.gateway.model.operations.answer') },
    {
      id: 'abandon',
      from: 'api',
      to: null,
      label: t('studyPoeaa.gateway.model.operations.abandon'),
    },
    { id: 'raise', from: null, to: 'back', label: t('studyPoeaa.gateway.model.operations.raise') },
    {
      id: 'receive',
      from: 'api',
      to: 'back',
      label: t('studyPoeaa.gateway.model.operations.receive'),
    },
    {
      id: 'translate',
      from: 'back',
      to: 'back',
      label: t('studyPoeaa.gateway.model.operations.translate'),
    },
    {
      id: 'return',
      from: 'back',
      to: 'front',
      label: t('studyPoeaa.gateway.model.operations.return'),
    },
    {
      id: 'succeed',
      from: 'front',
      to: 'store',
      label: t('studyPoeaa.gateway.model.operations.succeed'),
    },
    {
      id: 'fail',
      from: 'front',
      to: 'store',
      label: t('studyPoeaa.gateway.model.operations.fail'),
    },
  ],
});

/**
 * The transitions a step's moves cannot be told by their states alone: the request leaves the API
 * answered or abandoned, the reply is translated where it stands, and the store is handed a success
 * or a failure. Every other move joins its two states by a transition of its own.
 */
function tookAt({ operation, reply }: GatewayStep): Readonly<Record<string, string>> {
  if (operation === 'answer') return { request: 'answered' };
  if (operation === 'abandon') return { request: 'abandon' };
  if (operation === 'translate') return { reply: 'translate' };
  if (operation === 'deliver')
    return { reply: reply?.outcome?.kind === 'board' ? 'succeed' : 'fail' };
  return {};
}

const snapshotOf = (step: GatewayStep): StatesSnapshot => ({
  at: { request: step.request?.at ?? null, reply: step.reply?.at ?? null },
  took: tookAt(step),
});

// What each of the app's failures is called beside the reply, as the store holds it, and as the
// step that translates it says; each message reads the status only where it names one.
const failureNotes = {
  http: 'studyPoeaa.gateway.model.notes.http',
  network: 'studyPoeaa.gateway.model.notes.network',
  timeout: 'studyPoeaa.gateway.model.notes.timeout',
} as const satisfies Record<FailureKind, string>;
const failureOutcomes = {
  http: 'studyPoeaa.gateway.model.outcome.http',
  network: 'studyPoeaa.gateway.model.outcome.network',
  timeout: 'studyPoeaa.gateway.model.outcome.timeout',
} as const satisfies Record<FailureKind, string>;
const failureTranslations = {
  http: 'studyPoeaa.gateway.model.steps.translateHttp',
  network: 'studyPoeaa.gateway.model.steps.translateNetwork',
  timeout: 'studyPoeaa.gateway.model.steps.translateTimeout',
} as const satisfies Record<FailureKind, string>;

/** The request in the terms of the part that holds it: each part sees only what it has added. */
function requestNote(t: StudyTranslate, request: BoardRequest): string {
  const notes: Record<GatewayPart, () => string> = {
    store: () => t('studyPoeaa.gateway.model.notes.needs'),
    front: () => t('studyPoeaa.gateway.model.notes.load'),
    back: () => t('studyPoeaa.gateway.model.notes.path'),
    api: () => t('studyPoeaa.gateway.model.notes.wire', { limit: request.limitMs ?? 0 }),
  };
  return notes[request.at]();
}

/** The reply in the API's terms until the back translates it, then in the app's. */
function replyNote(t: StudyTranslate, reply: BoardReply, example: GatewayParameters): string {
  const { raw, outcome } = reply;
  if (outcome === null)
    return matchKind(raw, {
      unreachable: () => t('studyPoeaa.gateway.model.notes.lost'),
      silence: ({ waitedMs }) => t('studyPoeaa.gateway.model.notes.silence', { limit: waitedMs }),
      response: ({ status, version }) =>
        t('studyPoeaa.gateway.model.notes.response', { status, ms: example.answerMs, version }),
    });
  if (outcome.kind === 'board')
    return untranslated(outcome, example.pageVersion)
      ? t('studyPoeaa.gateway.model.notes.unreadable', {
          version: outcome.version,
          page: example.pageVersion,
        })
      : t('studyPoeaa.gateway.model.notes.board', { version: outcome.version });
  return t(failureNotes[outcome.error], { status: outcome.status ?? 0 });
}

/** What the store holds, as the prose reads it: nothing until the outcome is delivered. */
function outcomeWords(
  t: StudyTranslate,
  outcome: BoardOutcome | null,
  example: GatewayParameters,
): string {
  if (outcome === null) return t('studyPoeaa.gateway.model.outcome.none');
  if (outcome.kind === 'board')
    return untranslated(outcome, example.pageVersion)
      ? t('studyPoeaa.gateway.model.outcome.unreadable', { version: outcome.version })
      : t('studyPoeaa.gateway.model.outcome.board', { version: outcome.version });
  return t(failureOutcomes[outcome.error], { status: outcome.status ?? 0 });
}

/** The sentence under the drawing for a step that translates or delivers what came back. */
function inboundNote(t: StudyTranslate, step: GatewayStep, example: GatewayParameters): string {
  const outcome = step.reply?.outcome ?? null;
  if (outcome === null) throw new Error('Nothing has been translated yet.');
  const status = step.reply?.raw.kind === 'response' ? step.reply.raw.status : 0;
  const delivered = step.operation === 'deliver';
  if (outcome.kind === 'board' && untranslated(outcome, example.pageVersion))
    return delivered
      ? t('studyPoeaa.gateway.model.steps.deliverUnreadable', { version: outcome.version })
      : t('studyPoeaa.gateway.model.steps.translateUnreadable', {
          status,
          version: outcome.version,
          page: example.pageVersion,
        });
  if (delivered)
    return outcome.kind === 'board'
      ? t('studyPoeaa.gateway.model.steps.deliverBoard')
      : t('studyPoeaa.gateway.model.steps.deliverFailure');
  if (outcome.kind === 'board')
    return t('studyPoeaa.gateway.model.steps.translateBoard', { status });
  return t(failureTranslations[outcome.error], { status });
}

/** The sentence under the drawing: what the step did, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: GatewayMoment): string {
  const step = stepAt(moment);
  const { example } = moment.run;
  const notes: Record<GatewayOperation, () => string> = {
    start: () => t('studyPoeaa.gateway.model.steps.start'),
    load: () => t('studyPoeaa.gateway.model.steps.load'),
    get: () => t('studyPoeaa.gateway.model.steps.get'),
    send: () => t('studyPoeaa.gateway.model.steps.send', { limit: example.timeoutMs }),
    answer: () =>
      t('studyPoeaa.gateway.model.steps.answer', { ms: example.answerMs, status: example.status }),
    abandon: () =>
      step.reply?.raw.kind === 'silence'
        ? t('studyPoeaa.gateway.model.steps.abandonSilence', { limit: example.timeoutMs })
        : t('studyPoeaa.gateway.model.steps.abandonLost'),
    receive: () => t('studyPoeaa.gateway.model.steps.receive'),
    translate: () => inboundNote(t, step, example),
    return: () => t('studyPoeaa.gateway.model.steps.return'),
    deliver: () => inboundNote(t, step, example),
  };
  return notes[step.operation]();
}

/** The rule the back applied to what came back, as one line of the translation. */
function ruleLine(t: StudyTranslate, reply: BoardReply): string {
  return matchKind(reply.raw, {
    unreachable: () => t('studyPoeaa.gateway.model.worked.ruleNetwork'),
    silence: ({ waitedMs }) =>
      t('studyPoeaa.gateway.model.worked.ruleTimeout', { limit: waitedMs }),
    response: ({ status }) =>
      reply.outcome?.kind === 'board'
        ? t('studyPoeaa.gateway.model.worked.ruleBoard', { status })
        : t('studyPoeaa.gateway.model.worked.ruleHttp', { status }),
  });
}

/** The translation worked through: the rule applied, the version left unchecked, what crossed. */
function translationWorked(
  t: StudyTranslate,
  reply: BoardReply,
  example: GatewayParameters,
): readonly string[] {
  const { outcome } = reply;
  const board = outcome?.kind === 'board' ? outcome : null;
  return [
    ruleLine(t, reply),
    ...(board
      ? [
          t('studyPoeaa.gateway.model.worked.version', { version: board.version }),
          untranslated(board, example.pageVersion)
            ? t('studyPoeaa.gateway.model.worked.pageCannot', { page: example.pageVersion })
            : t('studyPoeaa.gateway.model.worked.pageCan', { page: example.pageVersion }),
        ]
      : []),
    t('studyPoeaa.gateway.model.worked.untranslated', {
      count: untranslated(outcome, example.pageVersion),
    }),
  ];
}

/** The back's wait for what came back, against its limit: lost, too late or in time. */
function waitLine(t: StudyTranslate, raw: RawReply, example: GatewayParameters): string {
  const words = { answer: example.answerMs, limit: example.timeoutMs };
  return matchKind(raw, {
    unreachable: () => t('studyPoeaa.gateway.model.worked.lost'),
    silence: () => t('studyPoeaa.gateway.model.worked.tooLate', words),
    response: () => t('studyPoeaa.gateway.model.worked.inTime', words),
  });
}

/** The check worth showing at a moment, where there is one: the limit, the wait, the translation. */
function workedOf(t: StudyTranslate, moment: GatewayMoment): StudyWorkedStep | undefined {
  const { operation, reply } = stepAt(moment);
  const { example } = moment.run;
  const step = moment.index;
  const waited = () =>
    reply
      ? {
          title: t('studyPoeaa.gateway.model.worked.waitTitle', { step }),
          lines: [waitLine(t, reply.raw, example)],
        }
      : undefined;
  // Every operation has an entry, so a new one must say whether it shows a check.
  const none = () => undefined;
  const worked: Record<GatewayOperation, () => StudyWorkedStep | undefined> = {
    start: none,
    load: none,
    get: none,
    send: () => ({
      title: t('studyPoeaa.gateway.model.worked.sendTitle', { step }),
      lines: [
        t('studyPoeaa.gateway.model.worked.address'),
        t('studyPoeaa.gateway.model.worked.limit', { limit: example.timeoutMs }),
      ],
      note: t('studyPoeaa.gateway.model.worked.sendNote'),
    }),
    answer: waited,
    abandon: waited,
    receive: none,
    translate: () =>
      reply
        ? {
            title: t('studyPoeaa.gateway.model.worked.translateTitle', { step }),
            lines: translationWorked(t, reply, example),
          }
        : undefined,
    return: none,
    deliver: () => ({
      title: t('studyPoeaa.gateway.model.worked.deliverTitle', { step }),
      lines: [
        reply?.outcome?.kind === 'board'
          ? t('studyPoeaa.gateway.model.worked.eventSuccess')
          : t('studyPoeaa.gateway.model.worked.eventFailure'),
        t('studyPoeaa.gateway.model.worked.holds', {
          outcome: outcomeWords(t, reply?.outcome ?? null, example),
        }),
        t('studyPoeaa.gateway.model.worked.never'),
      ],
    }),
  };
  return worked[operation]();
}

/** The values the record's prose reads at a moment, the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: GatewayMoment): StatesMomentText {
  const step = stepAt(moment);
  const { example, parameters } = moment.run;
  const outcome = step.reply?.outcome ?? null;
  const delivered = step.operation === 'deliver' ? outcome : null;
  const worked = workedOf(t, moment);
  return {
    values: {
      ...studyParameterValues(parameters, t),
      outcome: outcomeWords(t, delivered, example),
      untranslated: String(untranslated(outcome, example.pageVersion)),
    },
    note: stepNote(t, moment),
    ...(worked ? { worked } : {}),
    notes: {
      request: step.request ? requestNote(t, step.request) : null,
      reply: step.reply ? replyNote(t, step.reply, example) : null,
    },
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'answerMs',
    label: t('studyPoeaa.gateway.model.inputs.answerMs'),
    unit: t('studyPoeaa.gateway.model.inputs.ms'),
    min: 400,
    max: 12400,
    step: 2000,
  },
  {
    name: 'servedVersion',
    label: t('studyPoeaa.gateway.model.inputs.servedVersion'),
    unit: t('studyPoeaa.gateway.model.inputs.version'),
    min: 1,
    max: 2,
    step: 1,
  },
];

/** The named moments: the call made, the request sent, the answer or its absence, the translation, the delivery. */
function momentsOf(t: StudyTranslate, run: GatewayRun): readonly StudyMoment[] {
  const at = (operation: GatewayOperation) =>
    run.steps.findIndex((step) => step.operation === operation);
  const abandoned = at('abandon') >= 0;
  return [
    { label: t('studyPoeaa.gateway.model.moments.load'), step: at('load') },
    { label: t('studyPoeaa.gateway.model.moments.send'), step: at('send') },
    abandoned
      ? { label: t('studyPoeaa.gateway.model.moments.abandon'), step: at('abandon') }
      : { label: t('studyPoeaa.gateway.model.moments.answer'), step: at('answer') },
    { label: t('studyPoeaa.gateway.model.moments.translate'), step: at('translate') },
    { label: t('studyPoeaa.gateway.model.moments.deliver'), step: run.steps.length - 1 },
  ];
}

/** The call drawn as a register: the request's row and the reply's, in the column of the part that holds each. */
export function present(run: GatewayRun, t: StudyTranslate): StatesStudyModel {
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
