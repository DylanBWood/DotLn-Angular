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
import {
  type BoardOutcome,
  type BoardReply,
  type BoardRequest,
  type GatewayParameters,
  type GatewayStep,
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

/** Which transition the request and the reply took at a step, by the operation performed. */
function tookAt({ operation, reply }: GatewayStep): Readonly<Record<string, string>> {
  switch (operation) {
    case 'load':
    case 'get':
    case 'send':
      return { request: operation };
    case 'answer':
      return { request: 'answered', reply: 'answer' };
    case 'abandon':
      return { request: 'abandon', reply: 'raise' };
    case 'receive':
    case 'translate':
    case 'return':
      return { reply: operation };
    case 'deliver':
      return { reply: reply?.outcome?.kind === 'board' ? 'succeed' : 'fail' };
    default:
      return {};
  }
}

const snapshotOf = (step: GatewayStep): StatesSnapshot => ({
  at: {
    ...(step.request ? { request: step.request.at } : {}),
    ...(step.reply ? { reply: step.reply.at } : {}),
  },
  took: tookAt(step),
});

/** The request in the terms of the part that holds it: each part sees only what it has added. */
function requestNote(t: StudyTranslate, request: BoardRequest): string {
  switch (request.at) {
    case 'store':
      return t('studyPoeaa.gateway.model.notes.needs');
    case 'front':
      return t('studyPoeaa.gateway.model.notes.load');
    case 'back':
      return t('studyPoeaa.gateway.model.notes.path');
    default:
      return t('studyPoeaa.gateway.model.notes.wire', { limit: request.limitMs ?? 0 });
  }
}

/** The reply in the API's terms until the back translates it, then in the app's. */
function replyNote(t: StudyTranslate, reply: BoardReply, example: GatewayParameters): string {
  const { raw, outcome } = reply;
  if (outcome === null)
    switch (raw.kind) {
      case 'unreachable':
        return t('studyPoeaa.gateway.model.notes.lost');
      case 'silence':
        return t('studyPoeaa.gateway.model.notes.silence', { limit: raw.waitedMs });
      default:
        return t('studyPoeaa.gateway.model.notes.response', {
          status: raw.status,
          ms: example.answerMs,
          version: raw.version,
        });
    }
  if (outcome.kind === 'board')
    return untranslated(outcome, example.pageVersion)
      ? t('studyPoeaa.gateway.model.notes.unreadable', {
          version: outcome.version,
          page: example.pageVersion,
        })
      : t('studyPoeaa.gateway.model.notes.board', { version: outcome.version });
  switch (outcome.error) {
    case 'http':
      return t('studyPoeaa.gateway.model.notes.http', { status: outcome.status ?? 0 });
    case 'network':
      return t('studyPoeaa.gateway.model.notes.network');
    default:
      return t('studyPoeaa.gateway.model.notes.timeout');
  }
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
  switch (outcome.error) {
    case 'http':
      return t('studyPoeaa.gateway.model.outcome.http', { status: outcome.status ?? 0 });
    case 'network':
      return t('studyPoeaa.gateway.model.outcome.network');
    default:
      return t('studyPoeaa.gateway.model.outcome.timeout');
  }
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
  switch (outcome.error) {
    case 'http':
      return t('studyPoeaa.gateway.model.steps.translateHttp', { status });
    case 'network':
      return t('studyPoeaa.gateway.model.steps.translateNetwork');
    default:
      return t('studyPoeaa.gateway.model.steps.translateTimeout');
  }
}

/** The sentence under the drawing: what the step did, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: GatewayMoment): string {
  const step = stepAt(moment);
  const { example } = moment.run;
  switch (step.operation) {
    case 'start':
      return t('studyPoeaa.gateway.model.steps.start');
    case 'load':
      return t('studyPoeaa.gateway.model.steps.load');
    case 'get':
      return t('studyPoeaa.gateway.model.steps.get');
    case 'send':
      return t('studyPoeaa.gateway.model.steps.send', { limit: example.timeoutMs });
    case 'answer':
      return t('studyPoeaa.gateway.model.steps.answer', {
        ms: example.answerMs,
        status: example.status,
      });
    case 'abandon':
      return step.reply?.raw.kind === 'silence'
        ? t('studyPoeaa.gateway.model.steps.abandonSilence', { limit: example.timeoutMs })
        : t('studyPoeaa.gateway.model.steps.abandonLost');
    case 'receive':
      return t('studyPoeaa.gateway.model.steps.receive');
    case 'return':
      return t('studyPoeaa.gateway.model.steps.return');
    default:
      return inboundNote(t, step, example);
  }
}

/** The rule the back applied to what came back, as one line of the translation. */
function ruleLine(t: StudyTranslate, reply: BoardReply): string {
  const { raw } = reply;
  switch (raw.kind) {
    case 'unreachable':
      return t('studyPoeaa.gateway.model.worked.ruleNetwork');
    case 'silence':
      return t('studyPoeaa.gateway.model.worked.ruleTimeout', { limit: raw.waitedMs });
    default:
      return reply.outcome?.kind === 'board'
        ? t('studyPoeaa.gateway.model.worked.ruleBoard', { status: raw.status })
        : t('studyPoeaa.gateway.model.worked.ruleHttp', { status: raw.status });
  }
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

/** The check worth showing at a moment, where there is one: the limit, the wait, the translation. */
function workedOf(t: StudyTranslate, moment: GatewayMoment): StudyWorkedStep | undefined {
  const { operation, reply } = stepAt(moment);
  const { example } = moment.run;
  const limit = example.timeoutMs;
  switch (operation) {
    case 'send':
      return {
        title: t('studyPoeaa.gateway.model.worked.sendTitle', { step: moment.index }),
        lines: [
          t('studyPoeaa.gateway.model.worked.address'),
          t('studyPoeaa.gateway.model.worked.limit', { limit }),
        ],
        note: t('studyPoeaa.gateway.model.worked.sendNote'),
      };
    case 'answer':
    case 'abandon':
      return {
        title: t('studyPoeaa.gateway.model.worked.waitTitle', { step: moment.index }),
        lines: [
          reply?.raw.kind === 'unreachable'
            ? t('studyPoeaa.gateway.model.worked.lost')
            : reply?.raw.kind === 'silence'
              ? t('studyPoeaa.gateway.model.worked.tooLate', { answer: example.answerMs, limit })
              : t('studyPoeaa.gateway.model.worked.inTime', { answer: example.answerMs, limit }),
        ],
      };
    case 'translate':
      return reply
        ? {
            title: t('studyPoeaa.gateway.model.worked.translateTitle', { step: moment.index }),
            lines: translationWorked(t, reply, example),
          }
        : undefined;
    case 'deliver':
      return {
        title: t('studyPoeaa.gateway.model.worked.deliverTitle', { step: moment.index }),
        lines: [
          reply?.outcome?.kind === 'board'
            ? t('studyPoeaa.gateway.model.worked.eventSuccess')
            : t('studyPoeaa.gateway.model.worked.eventFailure'),
          t('studyPoeaa.gateway.model.worked.holds', {
            outcome: outcomeWords(t, reply?.outcome ?? null, example),
          }),
          t('studyPoeaa.gateway.model.worked.never'),
        ],
      };
    default:
      return undefined;
  }
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
      ...(step.request ? { request: requestNote(t, step.request) } : {}),
      ...(step.reply ? { reply: replyNote(t, step.reply, example) } : {}),
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
  const at = (operation: GatewayStep['operation']) =>
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
