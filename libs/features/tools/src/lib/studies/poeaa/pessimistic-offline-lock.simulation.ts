import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the same two tabs as the optimistic study, and how long a lock lasts. */
export interface PessimisticLockParameters {
  /** The version of Hold the ridge in browser storage when Tab A opens it. */
  readonly version: number;
  /** The minute Tab B opens the composition; Tab A opens it at minute 0. */
  readonly openB: number;
  /** The minutes Tab A works on its changes, once it holds the lock, before it saves. */
  readonly minutesA: number;
  /** The minutes Tab B works on its changes, once it holds the lock, before it saves. */
  readonly minutesB: number;
  /** True when Tab A saves its changes; false when its tab is closed without saving or releasing. */
  readonly tabASaves: boolean;
  /** The minutes a lock lasts from when it was taken; after that a waiting tab may take it over. */
  readonly timeout: number;
}

/** The two browser tabs of the example, by id. */
export const tabs = ['tabA', 'tabB'] as const;
export type TabId = (typeof tabs)[number];

/** Where one tab's business transaction stands. */
export type TabState = 'waiting' | 'holding' | 'saved' | 'expired';

/** The lock manager's entry for the composition: the tab that owns the lock, and when it runs out. */
export interface CompositionLock {
  readonly owner: TabId;
  /** The minute from which another tab may take the lock over. */
  readonly expires: number;
}

/** One tab's session: its state, what it read or wrote, and the time it has waited or lost. */
export interface TabSession {
  readonly state: TabState;
  /** The version it read once it held the lock, or wrote when it saved; null before it reads. */
  readonly version: number | null;
  /** The minute it began what it is doing now: waiting for the lock, or working under it. */
  readonly since: number;
  /** Minutes spent waiting for the lock, not counting a wait still going on. */
  readonly waited: number;
  /** Minutes of changes thrown away because its lock was taken over before it saved. */
  readonly lost: number;
  /** True once its tab has been closed; a closed tab does nothing more but may still own the lock. */
  readonly closed: boolean;
}

export type PessimisticOperation =
  /** A tab opening the composition asks for its lock, which is granted or refused at once. */
  | { readonly kind: 'open'; readonly tab: TabId; readonly granted: boolean }
  /** A waiting tab asks again when the lock is released or runs out, and gets it. */
  | {
      readonly kind: 'retry';
      readonly tab: TabId;
      /** The minutes this wait lasted. */
      readonly waited: number;
      /** The lock that had run out and was taken over, or null when the lock was free. */
      readonly tookOver: CompositionLock | null;
    }
  | {
      readonly kind: 'save';
      readonly tab: TabId;
      readonly accepted: boolean;
      /** The minutes of changes this save threw away; 0 when it was accepted. */
      readonly refusedMinutes: number;
    }
  | { readonly kind: 'close'; readonly tab: TabId };

/** One moment of the run: what a tab did, at what minute, and storage, the lock and the tabs after. */
export interface PessimisticStep {
  readonly minute: number;
  readonly operation: PessimisticOperation;
  /** The version in browser storage. */
  readonly stored: number;
  readonly lock: CompositionLock | null;
  readonly sessions: Readonly<Partial<Record<TabId, TabSession>>>;
}

export const readParameters = (parameters: StudyParameters): PessimisticLockParameters => ({
  version: numberParameter(parameters, 'version'),
  openB: numberParameter(parameters, 'openB'),
  minutesA: numberParameter(parameters, 'minutesA'),
  minutesB: numberParameter(parameters, 'minutesB'),
  tabASaves: booleanParameter(parameters, 'tabASaves'),
  timeout: numberParameter(parameters, 'timeout'),
});

/** What the lock manager answered: the lock afterwards, and whether the asking tab owns it now. */
export interface LockAnswer {
  readonly lock: CompositionLock | null;
  readonly granted: boolean;
  /** The lock that had run out and was taken over by this request; null when there was none. */
  readonly tookOver: CompositionLock | null;
}

/**
 * The lock manager's one rule: a tab gets the composition's exclusive lock when no tab holds it,
 * when it holds it already, or when the holder's lock has run out. Any other request is refused at
 * once, never queued. A granted lock lasts `timeout` minutes from now.
 */
export function requestLock(
  lock: CompositionLock | null,
  tab: TabId,
  minute: number,
  timeout: number,
): LockAnswer {
  const other = lock !== null && lock.owner !== tab ? lock : null;
  if (other !== null && minute < other.expires) return { lock, granted: false, tookOver: null };
  return { lock: { owner: tab, expires: minute + timeout }, granted: true, tookOver: other };
}

/** What a save did: storage and the lock afterwards, and whether anything was written. */
export interface LockedSave {
  readonly stored: number;
  readonly lock: CompositionLock | null;
  readonly accepted: boolean;
}

/**
 * A save is the lock owner's alone: it writes the next version and releases the lock in one step.
 * A tab whose lock was taken over writes nothing. A lock that has run out but that no other tab
 * took is still its owner's, so the owner may save.
 */
export function saveUnderLock(
  stored: number,
  lock: CompositionLock | null,
  tab: TabId,
): LockedSave {
  if (lock?.owner !== tab) return { stored, lock, accepted: false };
  return { stored: stored + 1, lock: null, accepted: true };
}

/** An operation the run has planned for a tab, at the minute it happens. */
interface Planned {
  readonly minute: number;
  readonly tab: TabId;
  readonly kind: 'open' | 'retry' | 'save' | 'close';
}

/** Storage, the lock and the sessions between two operations of the run. */
interface RunState {
  readonly stored: number;
  readonly lock: CompositionLock | null;
  readonly sessions: Readonly<Partial<Record<TabId, TabSession>>>;
}

/** What one operation did, and what it plans next: a tab given the lock saves when its work is done. */
interface Performed {
  readonly state: RunState;
  readonly operation: PessimisticOperation;
  readonly follow: readonly Planned[];
}

function sessionOf(state: RunState, tab: TabId): TabSession {
  const session = state.sessions[tab];
  if (!session) throw new Error(`${tab} has not opened the composition.`);
  return session;
}

/** The example's timings, which every operation reads. */
interface Timings {
  readonly work: Readonly<Record<TabId, number>>;
  readonly ends: Readonly<Record<TabId, 'save' | 'close'>>;
  readonly timeout: number;
}

/** A tab asks for the lock, on opening or again after waiting; given it, it reads the composition. */
function askForLock(state: RunState, next: Planned, timings: Timings): Performed {
  const { minute, tab } = next;
  const answer = requestLock(state.lock, tab, minute, timings.timeout);
  const before = state.sessions[tab];
  const waited = before?.state === 'waiting' ? minute - before.since : 0;
  const session: TabSession = answer.granted
    ? {
        state: 'holding',
        version: state.stored,
        since: minute,
        waited: (before?.waited ?? 0) + waited,
        lost: 0,
        closed: false,
      }
    : { state: 'waiting', version: null, since: minute, waited: 0, lost: 0, closed: false };
  const sessions: Partial<Record<TabId, TabSession>> = { ...state.sessions, [tab]: session };
  // A lock taken over leaves its old owner without it, whether that tab is still working or closed.
  const loser = answer.tookOver?.owner;
  if (loser) sessions[loser] = { ...sessionOf(state, loser), state: 'expired' };
  return {
    state: { ...state, lock: answer.lock, sessions },
    operation:
      next.kind === 'open'
        ? { kind: 'open', tab, granted: answer.granted }
        : { kind: 'retry', tab, waited, tookOver: answer.tookOver },
    follow: answer.granted
      ? [{ minute: minute + timings.work[tab], tab, kind: timings.ends[tab] }]
      : [],
  };
}

/** A tab saves, if it still owns the lock, or is closed; a closed tab keeps any lock it owns. */
function finish(state: RunState, next: Planned): Performed {
  const { minute, tab } = next;
  const session = sessionOf(state, tab);
  if (next.kind === 'close') {
    const sessions = { ...state.sessions, [tab]: { ...session, closed: true } };
    return { state: { ...state, sessions }, operation: { kind: 'close', tab }, follow: [] };
  }
  const saved = saveUnderLock(state.stored, state.lock, tab);
  const refusedMinutes = saved.accepted ? 0 : minute - session.since;
  const after: TabSession = saved.accepted
    ? { ...session, state: 'saved', version: saved.stored }
    : { ...session, lost: session.lost + refusedMinutes };
  return {
    state: {
      stored: saved.stored,
      lock: saved.lock,
      sessions: { ...state.sessions, [tab]: after },
    },
    operation: { kind: 'save', tab, accepted: saved.accepted, refusedMinutes },
    follow: [],
  };
}

/**
 * The next operation: the earliest one planned, or a waiting tab asking again, which it does as
 * soon as the lock is free or has run out. At the same minute, planned operations go first, so a
 * lock's owner may still save in the minute its lock runs out.
 */
function nextOperation(state: RunState, plan: readonly Planned[], now: number): Planned | null {
  const retries = tabs.flatMap((tab): Planned[] =>
    state.sessions[tab]?.state === 'waiting'
      ? [{ minute: Math.max(now, state.lock?.expires ?? now), tab, kind: 'retry' }]
      : [],
  );
  const candidates = [...plan, ...retries];
  if (candidates.length === 0) return null;
  return candidates.reduce((first, each) => (each.minute < first.minute ? each : first));
}

/**
 * The example as the two tabs run it: each tab asks for the lock when it opens the composition,
 * works once it holds it, and saves (or Tab A is closed); a tab turned away asks again as soon as
 * the lock is released or runs out.
 */
export function pessimisticRun(example: PessimisticLockParameters): readonly PessimisticStep[] {
  const timings: Timings = {
    work: { tabA: example.minutesA, tabB: example.minutesB },
    ends: { tabA: example.tabASaves ? 'save' : 'close', tabB: 'save' },
    timeout: example.timeout,
  };
  let plan: readonly Planned[] = [
    { minute: 0, tab: 'tabA', kind: 'open' },
    { minute: example.openB, tab: 'tabB', kind: 'open' },
  ];
  let state: RunState = { stored: example.version, lock: null, sessions: {} };
  const steps: PessimisticStep[] = [];
  let next = nextOperation(state, plan, 0);
  while (next !== null) {
    const current = next;
    const performed =
      current.kind === 'open' || current.kind === 'retry'
        ? askForLock(state, current, timings)
        : finish(state, current);
    plan = [...plan.filter((each) => each !== current), ...performed.follow];
    state = performed.state;
    steps.push({ minute: current.minute, operation: performed.operation, ...state });
    next = nextOperation(state, plan, current.minute);
  }
  return steps;
}

/** Minutes the tabs have spent waiting for the lock by a step, a wait still going on included. */
export const waitedBy = (step: PessimisticStep): number =>
  tabs.reduce((total, tab) => {
    const session = step.sessions[tab];
    if (!session) return total;
    return total + session.waited + (session.state === 'waiting' ? step.minute - session.since : 0);
  }, 0);

/** Minutes of changes thrown away by a step, by saves refused because a lock was taken over. */
export const lostBy = (step: PessimisticStep): number =>
  tabs.reduce((total, tab) => total + (step.sessions[tab]?.lost ?? 0), 0);
