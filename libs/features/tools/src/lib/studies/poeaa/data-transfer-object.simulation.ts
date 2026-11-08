import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: the version each side speaks, and one value the transfer object copies. */
export interface DataTransferParameters {
  /** The uifa-board version the server writes. */
  readonly serverVersion: number;
  /** The uifa-board version the page knows how to read. */
  readonly pageVersion: number;
  /** How many steps the saved build has, a plain number the transfer object carries as it is. */
  readonly buildSteps: number;
}

/** The three server objects the board's reply carries, in the order the assembler copies them. */
export const transferred = ['actor', 'build', 'evidence'] as const;
export type TransferredId = (typeof transferred)[number];

/** Server side: an evidence record that an actor's cells cite. */
export interface EvidenceRecord {
  readonly id: string;
  readonly source: string;
}

/** Server side: a saved build, which knows the actor definitions that use it. */
export interface SavedBuild {
  readonly id: string;
  readonly steps: number;
  readonly usedBy: readonly ActorDefinition[];
}

/** Server side: an actor definition, holding its build and its evidence as objects. */
export interface ActorDefinition {
  readonly id: string;
  readonly kind: string;
  readonly build: SavedBuild;
  readonly evidence: readonly EvidenceRecord[];
}

export interface DomainObjects {
  readonly actor: ActorDefinition;
  readonly build: SavedBuild;
  readonly evidence: EvidenceRecord;
}

/** A cell as the board document carries it: a key, a plain value and the ids of its evidence. */
export interface CellData {
  readonly key: string;
  readonly value: string | number;
  readonly evidence: readonly string[];
}

/** A row: its id, its cells, and each row it links to named by id. */
export interface RowData {
  readonly id: string;
  readonly cells: readonly CellData[];
  readonly links: readonly { readonly target: string }[];
}

export interface EvidenceData {
  readonly id: string;
  readonly source: string;
}

/**
 * The transfer object, a sketch of the parts of uifa-board-v1 this example uses: rows by panel and
 * the evidence list. It holds only data, and every reference in it is an id.
 */
export interface BoardTransfer {
  readonly panels: Readonly<Partial<Record<'actors' | 'builds', readonly RowData[]>>>;
  readonly evidence: readonly EvidenceData[];
}

/** What the page builds from a document it accepts: the cells it read, and where links lead. */
export interface PageView {
  /** How many cells the page read for each row, by row id. */
  readonly cells: Readonly<Record<string, number>>;
  /** Every row id the document holds, with its panel: the targets a link may lead to. */
  readonly targets: Readonly<Record<string, string>>;
  /** The link targets the page could resolve inside the document. */
  readonly resolved: readonly string[];
  /** Link targets the document names but does not hold. */
  readonly dangling: readonly string[];
}

/** The page's verdict on a text: read into its view, or refused for a version it does not know. */
export type DecodeResult =
  | { readonly read: true; readonly sent: number; readonly view: PageView }
  | { readonly read: false; readonly sent: number };

export type TransferOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'assemble'; readonly id: TransferredId }
  | { readonly kind: 'encode' }
  | { readonly kind: 'decode' };

/** One moment of the run: what happened, and the transfer object, its text and the page's verdict. */
export interface DataTransferStep {
  readonly operation: TransferOperation;
  readonly transfer: BoardTransfer;
  readonly assembled: readonly TransferredId[];
  /** The encoded text, once the transfer object has been encoded. */
  readonly text: string | null;
  readonly decoded: DecodeResult | null;
}

export const readParameters = (parameters: StudyParameters): DataTransferParameters => ({
  serverVersion: numberParameter(parameters, 'serverVersion'),
  pageVersion: numberParameter(parameters, 'pageVersion'),
  buildSteps: numberParameter(parameters, 'buildSteps'),
});

/** The machine ids the example's objects carry, which the transfer object uses as references. */
export const objectIds: Readonly<Record<TransferredId, string>> = {
  actor: 'definition-1',
  build: 'build-1',
  evidence: 'evidence-1',
};

/**
 * The server's objects as a domain model holds them: the actor holds its build and its evidence,
 * and the build lists the actor back. Building that back reference is the one mutation here,
 * since a cycle of plain values cannot be written in a single expression.
 */
export function domainObjects(example: DataTransferParameters): DomainObjects {
  const evidence: EvidenceRecord = { id: objectIds.evidence, source: 'definitions' };
  const users: ActorDefinition[] = [];
  const build: SavedBuild = { id: objectIds.build, steps: example.buildSteps, usedBy: users };
  const actor: ActorDefinition = {
    id: objectIds.actor,
    kind: 'saved-definition',
    build,
    evidence: [evidence],
  };
  users.push(actor);
  return { actor, build, evidence };
}

/** Whether the domain objects could be sent as they stand; JSON refuses a graph with a cycle. */
export function encodesDirectly(objects: DomainObjects): boolean {
  try {
    JSON.stringify(objects.actor);
    return true;
  } catch {
    return false;
  }
}

export const emptyTransfer: BoardTransfer = { panels: {}, evidence: [] };

const withRow = (
  transfer: BoardTransfer,
  panel: 'actors' | 'builds',
  row: RowData,
): BoardTransfer => ({
  ...transfer,
  panels: { ...transfer.panels, [panel]: [...(transfer.panels[panel] ?? []), row] },
});

/** The actor as a row: its kind as a cell citing its evidence by id, and its build as a link by id. */
export const assembleActor = (transfer: BoardTransfer, actor: ActorDefinition): BoardTransfer =>
  withRow(transfer, 'actors', {
    id: actor.id,
    cells: [{ key: 'kind', value: actor.kind, evidence: actor.evidence.map(({ id }) => id) }],
    links: [{ target: actor.build.id }],
  });

/** The build as a row with its step count; the actors that use it are not copied, so links run one way. */
export const assembleBuild = (transfer: BoardTransfer, build: SavedBuild): BoardTransfer =>
  withRow(transfer, 'builds', {
    id: build.id,
    cells: [{ key: 'steps', value: build.steps, evidence: [] }],
    links: [],
  });

/** The evidence record, copied into the document's evidence list as it is. */
export const assembleEvidence = (
  transfer: BoardTransfer,
  evidence: EvidenceRecord,
): BoardTransfer => ({
  ...transfer,
  evidence: [...transfer.evidence, { id: evidence.id, source: evidence.source }],
});

const versionPrefix = 'uifa-board-v';

/** The name a document gives its own format, as uifa-board-v1 does. */
export const versionName = (version: number) => `${versionPrefix}${version}`;

/**
 * The transfer object as the text that crosses the network, under the version the server writes.
 * Version 2 renames a row's cells to values, a change a version 1 reader does not know about.
 */
export function encode(transfer: BoardTransfer, version: number): string {
  const panels = Object.fromEntries(
    Object.entries(transfer.panels).map(([panel, rows]) => [
      panel,
      version >= 2 ? rows.map(({ cells, ...row }) => ({ ...row, values: cells })) : rows,
    ]),
  );
  return JSON.stringify({
    viewModelVersion: versionName(version),
    panels,
    evidence: transfer.evidence,
  });
}

/** The size of a text on the wire, in bytes of UTF-8. */
export const byteLength = (text: string) => new TextEncoder().encode(text).length;

/** A row as the page receives it: the fields it knows, any of which a newer server may not send. */
interface ReceivedRow {
  readonly id: string;
  readonly cells?: readonly CellData[];
  readonly links?: readonly { readonly target: string }[];
}

/** A document as the page receives it: whatever the server wrote, read with the fields it knows. */
interface ReceivedDocument {
  readonly viewModelVersion: string;
  readonly panels: Readonly<Record<string, readonly ReceivedRow[]>>;
}

/**
 * The page's own assembler, reading a document as if it were the version it knows: cells, and
 * link targets resolved against the rows the document holds. It never sees the server's classes.
 */
export function readUnchecked(text: string): PageView {
  // The page trusts the text's shape as far as its own types say, as a typed HTTP get does.
  const document = JSON.parse(text) as ReceivedDocument;
  const rows = Object.entries(document.panels).flatMap(([panel, list]) =>
    list.map((row) => ({ panel, row })),
  );
  const targets = Object.fromEntries(rows.map(({ panel, row }) => [row.id, panel]));
  const links = rows.flatMap(({ row }) => (row.links ?? []).map(({ target }) => target));
  return {
    cells: Object.fromEntries(rows.map(({ row }) => [row.id, row.cells?.length ?? 0])),
    targets,
    resolved: links.filter((target) => target in targets),
    dangling: links.filter((target) => !(target in targets)),
  };
}

/** The page reads a text only when it names the version the page knows, and refuses any other. */
export function decode(text: string, pageVersion: number): DecodeResult {
  const { viewModelVersion } = JSON.parse(text) as Pick<ReceivedDocument, 'viewModelVersion'>;
  const sent = Number(viewModelVersion.slice(versionPrefix.length));
  if (viewModelVersion !== versionName(pageVersion)) return { read: false, sent };
  return { read: true, sent, view: readUnchecked(text) };
}

/**
 * The example as it runs: the server's objects, assembled into the transfer object one at a time,
 * encoded once under the server's version, then decoded by the page under its own.
 */
export function dataTransferRun(example: DataTransferParameters): readonly DataTransferStep[] {
  const objects = domainObjects(example);
  const assemblers: Readonly<Record<TransferredId, (transfer: BoardTransfer) => BoardTransfer>> = {
    actor: (transfer) => assembleActor(transfer, objects.actor),
    build: (transfer) => assembleBuild(transfer, objects.build),
    evidence: (transfer) => assembleEvidence(transfer, objects.evidence),
  };
  let transfer = emptyTransfer;
  let assembled: readonly TransferredId[] = [];
  const steps: DataTransferStep[] = [
    { operation: { kind: 'start' }, transfer, assembled, text: null, decoded: null },
  ];
  for (const id of transferred) {
    transfer = assemblers[id](transfer);
    assembled = [...assembled, id];
    steps.push({
      operation: { kind: 'assemble', id },
      transfer,
      assembled,
      text: null,
      decoded: null,
    });
  }
  const text = encode(transfer, example.serverVersion);
  steps.push({ operation: { kind: 'encode' }, transfer, assembled, text, decoded: null });
  const decoded = decode(text, example.pageVersion);
  steps.push({ operation: { kind: 'decode' }, transfer, assembled, text, decoded });
  return steps;
}

export type TransferState = 'domain' | 'dto' | 'wire' | 'view' | 'refused';

/** Where an object of the example stands after a step. */
export function transferState(step: DataTransferStep, id: TransferredId): TransferState {
  if (step.decoded) return step.decoded.read ? 'view' : 'refused';
  if (step.text !== null) return 'wire';
  return step.assembled.includes(id) ? 'dto' : 'domain';
}
