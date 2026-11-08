import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: the stored version, when each tab opens and works, and whether A saves. */
export interface OptimisticLockParameters {
  /** The version of Hold the ridge in browser storage when Tab A opens it. */
  readonly version: number;
  /** The minute Tab B opens the composition; Tab A opens it at minute 0. */
  readonly openB: number;
  /** The minutes Tab A works on its changes before it saves. */
  readonly minutesA: number;
  /** The minutes Tab B works on its changes before it saves. */
  readonly minutesB: number;
  /** 1 when Tab A saves its changes; 0 when its tab is closed without saving. */
  readonly tabASaves: number;
}

/** The two browser tabs of the example, by id. */
export const tabs = ['tabA', 'tabB'] as const;
export type TabId = (typeof tabs)[number];

/** Where one tab's business transaction stands. */
export type TabState = 'editing' | 'saved' | 'refused';

/** One tab's session: its state, the version it holds, and the work it has had refused. */
export interface TabSession {
  readonly state: TabState;
  /** The version the tab read, which its save is conditioned on; after a save, the one it wrote. */
  readonly version: number;
  /** The minute its current changes began. */
  readonly since: number;
  /** Minutes of changes thrown away by its refused saves. */
  readonly lost: number;
}

/** Browser storage's copy of the composition: the version its last accepted save gave it. */
export interface StoredComposition {
  readonly version: number;
}

export type OptimisticOperation =
  | { readonly kind: 'read' | 'reload' | 'close'; readonly tab: TabId }
  | {
      readonly kind: 'save';
      readonly tab: TabId;
      /** The version the save was conditioned on: the one the tab read. */
      readonly held: number;
      /** The version storage held when the save ran. */
      readonly found: number;
      readonly accepted: boolean;
      /** The minutes of changes this save threw away; 0 when it was accepted. */
      readonly refusedMinutes: number;
    };

/** One moment of the run: what a tab did, at what minute, and every session and storage after it. */
export interface OptimisticStep {
  readonly minute: number;
  readonly operation: OptimisticOperation;
  readonly sessions: Readonly<Partial<Record<TabId, TabSession>>>;
  readonly stored: StoredComposition;
  /** Saves refused so far, the count the catalog row's toy metric names. */
  readonly refusals: number;
  /** Minutes of work thrown away by refused saves so far. */
  readonly lost: number;
}

export const readParameters = (parameters: StudyParameters): OptimisticLockParameters => ({
  version: numberParameter(parameters, 'version'),
  openB: numberParameter(parameters, 'openB'),
  minutesA: numberParameter(parameters, 'minutesA'),
  minutesB: numberParameter(parameters, 'minutesB'),
  tabASaves: numberParameter(parameters, 'tabASaves'),
});

/** Opening reads the stored version and remembers it. Nothing is written and nothing is held. */
export const read = (stored: StoredComposition, minute: number): TabSession => ({
  state: 'editing',
  version: stored.version,
  since: minute,
  lost: 0,
});

/** What a save did: the session and storage afterwards, and whether anything was written. */
export interface SaveOutcome {
  readonly session: TabSession;
  readonly stored: StoredComposition;
  readonly accepted: boolean;
}

/**
 * The conditional write, as one step: it stores the tab's changes and moves the version on only
 * while storage still holds the version the tab read. Otherwise it writes nothing, and the tab's
 * changes since it read are refused and counted as lost work.
 */
export function save(session: TabSession, stored: StoredComposition, minute: number): SaveOutcome {
  if (session.state !== 'editing') throw new Error('Only a tab that is editing can save.');
  if (stored.version === session.version) {
    const version = stored.version + 1;
    return {
      session: { ...session, state: 'saved', version },
      stored: { version },
      accepted: true,
    };
  }
  return {
    session: { ...session, state: 'refused', lost: session.lost + minute - session.since },
    stored,
    accepted: false,
  };
}

/** A refused tab reads the composition again at its new version and starts its changes over. */
export function reload(session: TabSession, stored: StoredComposition, minute: number): TabSession {
  if (session.state !== 'refused') throw new Error('Only a refused tab reloads.');
  return { ...session, state: 'editing', version: stored.version, since: minute };
}

/** An operation the run has planned for a tab, at the minute it happens. */
interface Planned {
  readonly minute: number;
  readonly tab: TabId;
  readonly kind: 'read' | 'save' | 'close' | 'reload';
}

/** Storage, the sessions and the counts between two operations of the run. */
interface RunState {
  readonly stored: StoredComposition;
  readonly sessions: Readonly<Partial<Record<TabId, TabSession>>>;
  readonly refusals: number;
  readonly lost: number;
}

/** What one planned operation did, and what it plans next: a refused tab reloads and saves again. */
interface Performed {
  readonly state: RunState;
  readonly operation: OptimisticOperation;
  readonly follow: readonly Planned[];
}

function sessionOf(state: RunState, tab: TabId): TabSession {
  const session = state.sessions[tab];
  if (!session) throw new Error(`${tab} has not opened the composition.`);
  return session;
}

function perform(state: RunState, next: Planned, work: Readonly<Record<TabId, number>>): Performed {
  const { minute, tab } = next;
  const withSession = (session: TabSession) => ({ ...state.sessions, [tab]: session });
  switch (next.kind) {
    case 'read':
      return {
        state: { ...state, sessions: withSession(read(state.stored, minute)) },
        operation: { kind: 'read', tab },
        follow: [],
      };
    case 'reload':
      return {
        state: {
          ...state,
          sessions: withSession(reload(sessionOf(state, tab), state.stored, minute)),
        },
        operation: { kind: 'reload', tab },
        follow: [],
      };
    case 'close': {
      // A closed tab simply goes: it wrote nothing and holds nothing that needs releasing.
      const { [tab]: _closed, ...sessions } = state.sessions;
      return { state: { ...state, sessions }, operation: { kind: 'close', tab }, follow: [] };
    }
    default: {
      const session = sessionOf(state, tab);
      const outcome = save(session, state.stored, minute);
      const refusedMinutes = outcome.session.lost - session.lost;
      return {
        state: {
          stored: outcome.stored,
          sessions: withSession(outcome.session),
          refusals: state.refusals + (outcome.accepted ? 0 : 1),
          lost: state.lost + refusedMinutes,
        },
        operation: {
          kind: 'save',
          tab,
          held: session.version,
          found: state.stored.version,
          accepted: outcome.accepted,
          refusedMinutes,
        },
        follow: outcome.accepted
          ? []
          : [
              { minute, tab, kind: 'reload' },
              { minute: minute + work[tab], tab, kind: 'save' },
            ],
      };
    }
  }
}

/**
 * The example as the two tabs run it: Tab A opens the composition, Tab B opens it later, each works
 * and saves (or Tab A is closed), and a refused tab reloads and does its work again. The earliest
 * planned operation runs next; at the same minute, the one planned first.
 */
export function optimisticRun(example: OptimisticLockParameters): readonly OptimisticStep[] {
  const work = { tabA: example.minutesA, tabB: example.minutesB };
  let plan: readonly Planned[] = [
    { minute: 0, tab: 'tabA', kind: 'read' },
    { minute: example.openB, tab: 'tabB', kind: 'read' },
    { minute: example.minutesA, tab: 'tabA', kind: example.tabASaves > 0 ? 'save' : 'close' },
    { minute: example.openB + example.minutesB, tab: 'tabB', kind: 'save' },
  ];
  let state: RunState = {
    stored: { version: example.version },
    sessions: {},
    refusals: 0,
    lost: 0,
  };
  const steps: OptimisticStep[] = [];
  while (plan.length > 0) {
    const next = plan.reduce((first, each) => (each.minute < first.minute ? each : first));
    const performed = perform(state, next, work);
    plan = [...plan.filter((each) => each !== next), ...performed.follow];
    state = performed.state;
    steps.push({ minute: next.minute, operation: performed.operation, ...state });
  }
  return steps;
}
