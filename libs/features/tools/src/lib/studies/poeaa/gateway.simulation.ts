import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: the back's time limit, what the API does, and what the page can draw. */
export interface GatewayParameters {
  /** How long the back waits for an answer, in milliseconds. */
  readonly timeoutMs: number;
  /** How long the API takes to answer, in milliseconds. */
  readonly answerMs: number;
  /** The HTTP status the API answers with; 0 for a connection lost before any answer. */
  readonly status: number;
  /** The contract version of the board the API serves. */
  readonly servedVersion: number;
  /** The contract version the board page knows how to draw. */
  readonly pageVersion: number;
}

/** The parts a call passes through, from the store that asks to the API that answers. */
export type GatewayPart = 'store' | 'front' | 'back' | 'api';

/** The board's route as the front names it, and the API's base as the back's configuration holds it. */
export const boardPath = '/uifa-board-v1';
export const apiBase = '/api';

/** The request as it stands: each part adds only what it is responsible for. */
export interface BoardRequest {
  readonly at: GatewayPart;
  /** Added by the front: which resource the app means. */
  readonly path: string | null;
  /** Added by the back: where the transport sends the request. */
  readonly url: string | null;
  /** Added by the back: how long it waits for an answer, in milliseconds. */
  readonly limitMs: number | null;
}

/** What the API or the transport produced, in their own terms rather than the app's. */
export type RawReply =
  | { readonly kind: 'response'; readonly status: number; readonly version: number }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'silence'; readonly waitedMs: number };

/** The kinds of failure the app itself names; nothing else reaches it. */
export type FailureKind = 'http' | 'network' | 'timeout';

/** What the app receives: a board, or a failure of one of the app's own kinds. */
export type BoardOutcome =
  | { readonly kind: 'board'; readonly version: number }
  | { readonly kind: 'failure'; readonly error: FailureKind; readonly status: number | null };

/** The reply as it stands: its raw form, and its translation once the back has made one. */
export interface BoardReply {
  readonly at: GatewayPart;
  readonly raw: RawReply;
  readonly outcome: BoardOutcome | null;
}

export type GatewayOperation =
  | 'start'
  | 'load'
  | 'get'
  | 'send'
  | 'answer'
  | 'abandon'
  | 'receive'
  | 'translate'
  | 'return'
  | 'deliver';

/** One moment of the call: what was done, and where the request and the reply stand after it. */
export interface GatewayStep {
  readonly operation: GatewayOperation;
  /** Null once the request is answered or abandoned. */
  readonly request: BoardRequest | null;
  /** Null until the API answers or the transport fails. */
  readonly reply: BoardReply | null;
}

export const readParameters = (parameters: StudyParameters): GatewayParameters => ({
  timeoutMs: numberParameter(parameters, 'timeoutMs'),
  answerMs: numberParameter(parameters, 'answerMs'),
  status: numberParameter(parameters, 'status'),
  servedVersion: numberParameter(parameters, 'servedVersion'),
  pageVersion: numberParameter(parameters, 'pageVersion'),
});

/** The store's need before anything is asked: no path, no address, no limit. */
export const ask = (): BoardRequest => ({ at: 'store', path: null, url: null, limitMs: null });

/** The store calls the front's one method; the call carries nothing but the intention. */
export const load = (request: BoardRequest): BoardRequest => ({ ...request, at: 'front' });

/** The front names the resource the app means and hands the request to the back. */
export const get = (request: BoardRequest): BoardRequest => ({
  ...request,
  at: 'back',
  path: boardPath,
});

/** The back adds what the transport needs, the API's address and a time limit, and sends it. */
export function send(request: BoardRequest, limitMs: number): BoardRequest {
  if (request.path === null) throw new Error('The back has no path to send.');
  return { ...request, at: 'api', url: `${apiBase}${request.path}`, limitMs };
}

/** What the API does with the request, in its own terms: a status and a board, or no connection. */
export const serve = (example: GatewayParameters): RawReply =>
  example.status === 0
    ? { kind: 'unreachable' }
    : { kind: 'response', status: example.status, version: example.servedVersion };

/**
 * The back's wait: an answer that would come after the limit is never seen, because the back stops
 * waiting and raises the transport's own timeout instead.
 */
export const arrive = (answer: RawReply, afterMs: number, limitMs: number): RawReply =>
  answer.kind === 'response' && afterMs > limitMs ? { kind: 'silence', waitedMs: limitMs } : answer;

/**
 * The back's whole job on the way in: the transport's terms become the app's. A 2xx status is a
 * board and any other status an HTTP failure; silence and a lost connection are failures of their
 * own kinds. Nothing else is checked, so the board's contract version crosses as it came.
 */
export function translate(raw: RawReply): BoardOutcome {
  switch (raw.kind) {
    case 'unreachable':
      return { kind: 'failure', error: 'network', status: null };
    case 'silence':
      return { kind: 'failure', error: 'timeout', status: null };
    default:
      return raw.status >= 200 && raw.status < 300
        ? { kind: 'board', version: raw.version }
        : { kind: 'failure', error: 'http', status: raw.status };
  }
}

/** How many of the API's own terms crossed untranslated: a board of a version the page cannot draw. */
export const untranslated = (outcome: BoardOutcome | null, pageVersion: number): number =>
  outcome?.kind === 'board' && outcome.version !== pageVersion ? 1 : 0;

/**
 * The example as the board store runs it: one call through the front and the back to the API, an
 * answer or the back's own timeout, the translation, and the outcome handed back to the store.
 */
export function gatewayRun(example: GatewayParameters): readonly GatewayStep[] {
  const asked = ask();
  const loaded = load(asked);
  const named = get(loaded);
  const sent = send(named, example.timeoutMs);
  const raw = arrive(serve(example), example.answerMs, example.timeoutMs);
  const outcome = translate(raw);
  // An answer inside the limit is seen at the API first; anything else is raised in the back.
  const arrival: readonly GatewayStep[] =
    raw.kind === 'response'
      ? [
          { operation: 'answer', request: null, reply: { at: 'api', raw, outcome: null } },
          { operation: 'receive', request: null, reply: { at: 'back', raw, outcome: null } },
        ]
      : [{ operation: 'abandon', request: null, reply: { at: 'back', raw, outcome: null } }];
  return [
    { operation: 'start', request: asked, reply: null },
    { operation: 'load', request: loaded, reply: null },
    { operation: 'get', request: named, reply: null },
    { operation: 'send', request: sent, reply: null },
    ...arrival,
    { operation: 'translate', request: null, reply: { at: 'back', raw, outcome } },
    { operation: 'return', request: null, reply: { at: 'front', raw, outcome } },
    { operation: 'deliver', request: null, reply: { at: 'store', raw, outcome } },
  ];
}
