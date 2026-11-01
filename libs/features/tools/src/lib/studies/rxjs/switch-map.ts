import { switchMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A search box: each query opens a request for its results, and a newer query cancels the request
 * still in flight, so what is shown always belongs to the latest query. The strings here are what
 * the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    query$: {
      label: 'query$',
      marbles: '-a---b-c------|',
      values: { a: 'ant', b: 'bee', c: 'cat' },
    },
  },
  inner: {
    ant: {
      label: 'results(ant)',
      marbles: '---1--2|',
      values: { 1: 'ant, page 1', 2: 'ant, page 2' },
      subscriptions: '-^---!',
    },
    bee: {
      label: 'results(bee)',
      marbles: '---3--4|',
      values: { 3: 'bee, page 1', 4: 'bee, page 2' },
      subscriptions: '-----^-!',
    },
    cat: {
      label: 'results(cat)',
      marbles: '---5--6|',
      values: { 5: 'cat, page 1', 6: 'cat, page 2' },
      subscriptions: '-------^------!',
    },
  },
  operator: 'switchMap((query) => results(query))',
  outputs: {
    shown$: {
      label: 'shown$',
      marbles: '----1-----5--6|',
      values: { 1: 'ant, page 1', 5: 'cat, page 1', 6: 'cat, page 2' },
    },
  },
  run: ({ inputs: { query$ }, inner }) => {
    // The request for one query is the inner stream named after it.
    const results = (query: unknown) => inner[String(query)];
    const shown$ = query$.pipe(switchMap((query) => results(query)));
    return { shown$ };
  },
  moments: [
    { label: 'ant', frame: 1 },
    { label: 'bee cancels ant', frame: 5 },
    { label: 'cat cancels bee', frame: 7 },
    { label: 'Done', frame: 14 },
  ],
  notes: {
    0: 'Nothing has been typed yet.',
    1: 'The first query, ant, arrives and its request starts. Nothing is in flight to cancel.',
    4: "ant's first page arrives and is shown: it belongs to the latest query.",
    5: "A new query, bee, arrives while ant's request is still running. switchMap stops listening to ant and starts bee's request; ant's second page will never be shown.",
    7: "cat arrives before bee has answered at all. bee's request is cut off and cat's starts: the middle query produces nothing, and nothing it would have returned is drawn.",
    10: "cat's first page arrives and is shown.",
    13: "cat's second page arrives and is shown.",
    14: "The box has completed and cat's request has completed, so the output completes.",
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);
