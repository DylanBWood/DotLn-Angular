import type { PanelId, StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the rows behind each panel, a source that fails, and what the facade does then. */
export interface RemoteFacadeParameters {
  readonly rowsActors: number;
  readonly rowsBuilds: number;
  readonly rowsMechanisms: number;
  readonly rowsWork: number;
  readonly rowsBlueprint: number;
  /** True when the source behind the Builds panel cannot be read. */
  readonly buildsDown: boolean;
  /** True when the facade writes a panel it could not read into its response; false when the failure ends the call. */
  readonly reportsFailures: boolean;
}

/** The board's panels, the app's own panel ids, in the order the facade reads them. */
export const boardPanels: readonly PanelId[] = [
  'actors',
  'builds',
  'mechanisms',
  'work',
  'blueprint',
];

/** What stands behind one panel: its rows, served one object per call, unless its source is down. */
export interface PanelSource {
  readonly rows: number;
  readonly down: boolean;
}

export type BoardSources = Readonly<Record<PanelId, PanelSource>>;

/** A panel as the facade copies it into its response: its rows, or a report that it could not be read. */
export interface PanelCopy {
  readonly id: PanelId;
  readonly status: 'available' | 'unavailable';
  readonly rows: number;
}

/** What reading one panel returned and cost. */
export interface PanelRead {
  /** The panel and its rows, or null when its source failed. */
  readonly copy: PanelCopy | null;
  /** One call for the panel, and one for each of its rows when the panel could be read. */
  readonly calls: number;
}

/** The calls made so far, counted the three ways the example compares. */
export interface CallCount {
  /** Calls the page has sent across the network. */
  readonly remote: number;
  /** Calls the facade has made to the sources, inside its own process. */
  readonly local: number;
  /** Calls the page would have sent by now had it asked for the panel list, each panel and each row itself. */
  readonly oneByOne: number;
  /** Times the facade has checked that the caller may read the board: once, for every panel. */
  readonly checks: number;
}

export type FacadeOperation =
  | { readonly kind: 'call' }
  | { readonly kind: 'read'; readonly id: PanelId }
  | { readonly kind: 'reportUnavailable'; readonly id: PanelId }
  | { readonly kind: 'readFailed'; readonly id: PanelId }
  | { readonly kind: 'fail'; readonly id: PanelId }
  | { readonly kind: 'reply' };

/** One moment of the run: what happened, then the facade's response, the page and the calls. */
export interface RemoteFacadeStep {
  readonly operation: FacadeOperation;
  /** The panels the facade has copied and not yet sent; it keeps none once it has answered. */
  readonly response: readonly PanelCopy[];
  /** The panels the page holds: none until the reply arrives. */
  readonly page: readonly PanelCopy[];
  /** The panels the facade had copied when the call failed, thrown away with it. */
  readonly discarded: readonly PanelId[];
  readonly calls: CallCount;
}

export const readParameters = (parameters: StudyParameters): RemoteFacadeParameters => ({
  rowsActors: numberParameter(parameters, 'rowsActors'),
  rowsBuilds: numberParameter(parameters, 'rowsBuilds'),
  rowsMechanisms: numberParameter(parameters, 'rowsMechanisms'),
  rowsWork: numberParameter(parameters, 'rowsWork'),
  rowsBlueprint: numberParameter(parameters, 'rowsBlueprint'),
  buildsDown: booleanParameter(parameters, 'buildsDown'),
  reportsFailures: booleanParameter(parameters, 'reportsFailures'),
});

/** The sources behind the board, as the example's parameters describe them. */
export const boardSources = (example: RemoteFacadeParameters): BoardSources => ({
  actors: { rows: example.rowsActors, down: false },
  builds: { rows: example.rowsBuilds, down: example.buildsDown },
  mechanisms: { rows: example.rowsMechanisms, down: false },
  work: { rows: example.rowsWork, down: false },
  blueprint: { rows: example.rowsBlueprint, down: false },
});

/** One panel read the fine-grained way: a call for the panel, then a call for each of its rows. */
export function readPanel(sources: BoardSources, id: PanelId): PanelRead {
  const source = sources[id];
  if (source.down) return { copy: null, calls: 1 };
  return { copy: { id, status: 'available', rows: source.rows }, calls: 1 + source.rows };
}

/** The panel a facade writes in place of one whose source it could not read. */
export const unavailablePanel = (id: PanelId): PanelCopy => ({
  id,
  status: 'unavailable',
  rows: 0,
});

/** Every call a walk of the whole board takes: the panel list, then each panel and its rows. */
export const oneByOneCalls = (sources: BoardSources): number =>
  1 + boardPanels.reduce((sum, id) => sum + readPanel(sources, id).calls, 0);

/**
 * How many rounds that walk needs even when every call of a round is sent at once: the panel ids
 * come from the list and the row ids from each panel, so the list, the panels and the rows are
 * three rounds, or two when no panel has a row to fetch.
 */
export function walkRounds(sources: BoardSources): number {
  const rowsToFetch = boardPanels.some((id) => readPanel(sources, id).calls > 1);
  return 2 + (rowsToFetch ? 1 : 0);
}

/**
 * The example as the facade runs it: the page's one call arrives, the facade checks the caller and
 * lists the panels, reads each panel's source inside its own process, and answers once. A source
 * that fails is either written into the response as unavailable or, when the facade does not
 * report failures, ends the call, and the panels copied so far are thrown away.
 */
export function remoteFacadeRun(example: RemoteFacadeParameters): readonly RemoteFacadeStep[] {
  const sources = boardSources(example);
  // The call itself, the facade's one check of the caller, and its one local call listing the panels.
  let calls: CallCount = { remote: 1, local: 1, oneByOne: 1, checks: 1 };
  let response: readonly PanelCopy[] = [];
  const steps: RemoteFacadeStep[] = [];
  const record = (
    operation: FacadeOperation,
    page: readonly PanelCopy[] = [],
    discarded: readonly PanelId[] = [],
  ) => steps.push({ operation, response, page, discarded, calls });
  record({ kind: 'call' });
  for (const id of boardPanels) {
    const read = readPanel(sources, id);
    calls = { ...calls, local: calls.local + read.calls, oneByOne: calls.oneByOne + read.calls };
    if (read.copy) {
      response = [...response, read.copy];
      record({ kind: 'read', id });
    } else if (example.reportsFailures) {
      response = [...response, unavailablePanel(id)];
      record({ kind: 'reportUnavailable', id });
    } else {
      record({ kind: 'readFailed', id });
      const discarded = response.map((panel) => panel.id);
      response = [];
      record({ kind: 'fail', id }, [], discarded);
      return steps;
    }
  }
  const sent = response;
  // A stateless facade keeps nothing once it has answered.
  response = [];
  record({ kind: 'reply' }, sent);
  return steps;
}

export type PanelState = 'source' | 'response' | 'page';

/** Where a panel stands after a step; null for one thrown away with a failed call. */
export function panelState(step: RemoteFacadeStep, id: PanelId): PanelState | null {
  if (step.page.some((panel) => panel.id === id)) return 'page';
  if (step.response.some((panel) => panel.id === id)) return 'response';
  return step.discarded.includes(id) ? null : 'source';
}
