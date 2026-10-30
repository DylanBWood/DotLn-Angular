import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';

import { withPersistedState } from '@dotln-angular/data-access';
import { scenePageEvents } from '@dotln-angular/events';
import type { Composition, CompositionStep, Trial } from '@dotln-angular/scene-engine';

import { restoreStoredScene, type StoredScene } from './stored-scene';

interface SceneState {
  /** The current branch: every step applied since the run began, in order. */
  readonly steps: readonly CompositionStep[];
  /** Where the current branch forked; a comparison reads the steps before this as before. */
  readonly forkIndex: number | null;
  readonly trial: Trial | null;
  readonly keptTrials: readonly Trial[];
  readonly note: string;
  readonly compositions: readonly Composition[];
  /** A stored value, or part of one, could not be read, so the operator is told it was ignored. */
  readonly storedIgnored: boolean;
  /** The latest save did not reach storage, so the operator is told it will not survive a reload. */
  readonly saveFailed: boolean;
  /** Saves this session; each is the one thing that writes to storage. */
  readonly saves: number;
}

export const SceneStore = signalStore(
  withState<SceneState>({
    steps: [] as readonly CompositionStep[],
    forkIndex: null as number | null,
    trial: null as Trial | null,
    keptTrials: [] as readonly Trial[],
    note: '',
    compositions: [] as readonly Composition[],
    storedIgnored: false,
    saveFailed: false,
    saves: 0,
  }),
  withPersistedState<SceneState>({
    key: 'scene',
    select: (state): StoredScene => ({ version: 1, compositions: state.compositions }),
    restore: (value) => {
      const stored = restoreStoredScene(value);
      return stored && { compositions: stored.compositions, storedIgnored: !stored.complete };
    },
    unreadable: () => ({ storedIgnored: true }),
    unwritable: () => ({ saveFailed: true }),
    // Only a save writes. A value that could not be read stays exactly as it is until the operator
    // saves over it, and playing in one tab cannot write over what another tab has saved.
    writeOn: (state) => state.saves,
  }),
  withReducer<SceneState>(
    on(scenePageEvents.stepApplied, ({ payload }, state) => ({
      steps: [...state.steps, payload],
    })),
    on(scenePageEvents.branchForked, (_event, state) => ({ forkIndex: state.steps.length })),
    on(scenePageEvents.trialCompared, ({ payload }) => ({ trial: payload })),
    on(scenePageEvents.trialKept, (_event, state) => ({
      trial: null,
      keptTrials: state.trial ? [...state.keptTrials, state.trial] : state.keptTrials,
    })),
    on(scenePageEvents.trialClosed, () => ({ trial: null })),
    on(scenePageEvents.noteChanged, ({ payload }) => ({ note: payload })),
    on(scenePageEvents.compositionSaved, ({ payload }, state) => ({
      compositions: [...state.compositions, payload],
      saves: state.saves + 1,
      storedIgnored: false,
      saveFailed: false,
    })),
    on(scenePageEvents.compositionOpened, ({ payload }) => ({
      steps: payload.steps,
      note: payload.note,
      keptTrials: payload.trials,
      forkIndex: null,
      trial: null,
    })),
    on(scenePageEvents.runReset, () => ({
      steps: [],
      forkIndex: null,
      trial: null,
      keptTrials: [],
      note: '',
    })),
  ),
);

export function provideSceneDataAccess() {
  return [SceneStore];
}
