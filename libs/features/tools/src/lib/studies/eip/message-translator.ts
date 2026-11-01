import { map } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import { type MarbleExample, nameOf } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** A catalog row in the older shape: its id and the shape it says it is written in. */
interface LegacyRow {
  readonly id: string;
  readonly schema: 'tool-v0';
}

/**
 * The same row in the shape the Tools home reads. The older shape has no definition and no
 * reading of its source, so the row says so rather than carrying an invented value.
 */
export interface CurrentRow {
  readonly id: string;
  readonly schema: 'tool-v1';
  readonly definition: 'unavailable';
  readonly verified: 'partial';
}

const isLegacyRow = (record: unknown): record is LegacyRow =>
  typeof record === 'object' &&
  record !== null &&
  'id' in record &&
  typeof record.id === 'string' &&
  'schema' in record &&
  record.schema === 'tool-v0';

/** The shape a record says it is in, for the error that refuses it. */
const shapeOf = (record: unknown) =>
  typeof record === 'object' && record !== null && 'schema' in record
    ? nameOf(record.schema)
    : 'an unnamed shape';

/**
 * The translator: rebuilds one row in the newer shape, keeping its id and marking what the older
 * shape cannot supply. A record in any other shape is refused, since a guess would hand the
 * Tools home a row that looks right and is not.
 */
export function toToolV1(record: unknown): CurrentRow {
  if (!isLegacyRow(record)) throw new Error(`no translation from ${shapeOf(record)}`);
  return { id: record.id, schema: 'tool-v1', definition: 'unavailable', verified: 'partial' };
}

/**
 * A chunk written in the older shape sends its three rows, one a step, and the translator hands
 * each one on in the newer shape in the step it arrives. A row's letter is the first letter of its
 * title: small as the chunk wrote it, capital once rebuilt for the Tools home. The strings here
 * are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    records$: {
      label: 'records$',
      marbles: '-tnc|',
      values: {
        t: { id: 'eip:60', schema: 'tool-v0' },
        n: { id: 'eip:145', schema: 'tool-v0' },
        c: { id: 'eip:146', schema: 'tool-v0' },
      },
    },
  },
  operator: 'map((record) => toToolV1(record))',
  outputs: {
    rows$: {
      label: 'rows$',
      marbles: '-TNC|',
      values: {
        T: { id: 'eip:60', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
        N: { id: 'eip:145', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
        C: { id: 'eip:146', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
      },
    },
  },
  run: ({ inputs: { records$ } }) => {
    // records$ is the tool-v0 channel; rows$ is the tool-v1 channel the Tools home reads
    const rows$ = records$.pipe(
      // the translator: each record becomes one tool-v1 row as it arrives, or is refused
      map((record) => toToolV1(record)),
    );
    return { rows$ };
  },
  moments: [
    { label: 'First row', frame: 1 },
    { label: 'Last row', frame: 3 },
    { label: 'Done', frame: 4 },
  ],
  notes: {
    0: 'Nothing has moved yet. Three rows wait in the legacy chunk: t, n and c.',
    1: 'The chunk sends t, the Message Translator row, to the translator, which hands T, the same row rebuilt in tool-v1, to the Tools home in the same step.',
    2: 'The chunk sends n, the Normalizer row, to the translator, which hands N to the Tools home. Nothing of t was kept, so n is rebuilt exactly as t was.',
    3: 'The chunk sends c, the Canonical Data Model row, to the translator, which hands C to the Tools home: three rows out for three in, in the order they were sent.',
    4: 'The chunk has no more rows and finishes, so the translator finishes the tool-v1 channel too, with nothing left over to send.',
  },
};

/**
 * Where the rows travel: from the chunk to the translator on the older shape's channel, and from
 * the translator to the Tools home on the newer one's. The translator never holds a row, which is
 * why no frame names anything held by it, and each box's words say what it is, not what moved.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'chunk', label: 'Legacy chunk', stage: 0 },
    { id: 'translator', label: 'Translator', stage: 1, tone: 'subject' },
    { id: 'home', label: 'Tools home', stage: 2 },
  ],
  links: [
    { id: 'read', from: 'chunk', to: 'translator', label: 'tool-v0' },
    { id: 'answer', from: 'translator', to: 'home', label: 'tool-v1' },
  ],
  routes: { records$: 'read', rows$: 'answer' },
  states: {
    0: { chunk: 'writes tool-v0 only', translator: 'keeps no rows', home: 'reads tool-v1 only' },
  },
  held: {
    0: { chunk: ['t', 'n', 'c'] },
    1: { chunk: ['n', 'c'], home: ['T'] },
    2: { chunk: ['c'], home: ['T', 'N'] },
    3: { chunk: [], home: ['T', 'N', 'C'] },
  },
  caption:
    'Legacy chunk is a bundle of catalog rows still written in the old shape, tool-v0; Translator is the pattern’s part, which rebuilds each row; Tools home is the catalog page, which reads only the new shape, tool-v1. A token is one row: t, n and c are the Message Translator, Normalizer and Canonical Data Model rows as the chunk wrote them, and T, N and C the same rows rebuilt in tool-v1. A row and its rebuilt copy move in the same step, because the translator hands each row on as soon as it arrives. A token is green while it moves and outlined while a box holds it; a box a token leaves or reaches is outlined in green, and the words inside a box say what it does. Step forward to move the rows on.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
