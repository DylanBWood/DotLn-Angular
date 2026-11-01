import { mergeMap } from 'rxjs';
import type { RunHelpers } from 'rxjs/testing';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example as concatMapExample } from './concat-map';
import { expectMarbleExample } from './marble-testing';
import { type MarbleExample, marbleModel } from './marbles';
import { example, model } from './merge-map';

const newScheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

/** The example's streams under a scheduler run, with the marbles of some uploads replaced. */
function streamsOf({ cold }: RunHelpers, replaced: Readonly<Record<string, string>> = {}) {
  const { photo$ } = example.inputs;
  const uploads = Object.entries(example.inner ?? {}).map(
    ([id, upload]) => [id, cold(replaced[id] ?? upload.marbles, upload.values)] as const,
  );
  return { photo$: cold(photo$.marbles, photo$.values), uploads: Object.fromEntries(uploads) };
}

/** What an example feeds its operator: the inputs, and each inner stream without its timing. */
const inputsOf = ({ inputs, inner }: MarbleExample) => ({
  inputs,
  inner: Object.entries(inner ?? {}).map(([id, { label, marbles, values }]) => ({
    id,
    label,
    marbles,
    values,
  })),
});

const linesOf = () => marbleModel(example).marbles.lines;
const uploadLines = () => linesOf().filter(({ role }) => role === 'inner');

/** How many uploads are open at a frame: subscribed, and not yet completed or cut off. */
const openAt = (frame: number) =>
  uploadLines().filter(
    ({ subscribedAt, unsubscribedAt }) =>
      (subscribedAt ?? Infinity) <= frame && frame < (unsubscribedAt ?? Infinity),
  ).length;

const framesOf = (kind: 'next' | 'complete', label: string) =>
  linesOf()
    .find((line) => line.label === label)
    ?.events.filter((event) => event.kind === kind)
    .map(({ frame }) => frame);

it('runs the album example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the mergeMap row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:150');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/merge-map.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(model(record.example.parameters).family).toBe('marbles');
  expect(linesOf().map(({ label }) => label)).toEqual([
    'photo$',
    'upload(cat)',
    'upload(dog)',
    'upload(owl)',
    'stored$',
  ]);
});

it('feeds its operator the same photos and uploads as the concatMap study', () => {
  expect(inputsOf(example)).toEqual(inputsOf(concatMapExample));
  expect(Object.keys(example.outputs)).toEqual(Object.keys(concatMapExample.outputs));
});

it('takes the photos and upload times the record names from the marbles', async () => {
  const { parameters } = (await loadStudy('rxc:150')).example;
  expect(Object.values(example.inputs['photo$'].values ?? {})).toEqual(['cat', 'dog', 'owl']);
  expect(parameters['photos']).toBe('cat, dog and owl');
  const answeredAfter = uploadLines().map(({ events, subscribedAt }) => {
    const answer = events.find(({ kind }) => kind === 'next');
    return (answer?.frame ?? NaN) - (subscribedAt ?? NaN);
  });
  expect(answeredAfter).toEqual([
    parameters['catUpload'],
    parameters['dogUpload'],
    parameters['owlUpload'],
  ]);
});

it('starts every upload the moment its photo is added, beside those still running', () => {
  expect(framesOf('next', 'photo$')).toEqual([1, 3, 5]);
  expect(
    uploadLines().map(({ subscribedAt, unsubscribedAt, cancelled }) => [
      subscribedAt,
      unsubscribedAt,
      cancelled,
    ]),
  ).toEqual([
    [1, 7, false],
    [3, 5, false],
    [5, 8, false],
  ]);
  // cat is uploading throughout, first beside dog and then beside owl.
  expect([3, 4, 5, 6].map(openAt)).toEqual([2, 2, 2, 2]);
});

it('passes answers on in the order the uploads finish, dropping none', () => {
  const dropped = linesOf().flatMap(({ events }) =>
    events.filter(({ kind, delivered }) => kind === 'next' && !delivered),
  );
  expect(dropped).toEqual([]);
  const { frames } = marbleModel(example).marbles;
  expect(frames[frames.length - 1].values['delivered']).toBe(
    '2 (dog stored), 1 (cat stored), 3 (owl stored)',
  );
});

it('prepares each upload as soon as its photo is added', () => {
  const scheduler = newScheduler();
  const prepared: string[] = [];
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers);
    // The projection looks its upload up here, so each read is the moment an upload is prepared.
    const watched = new Proxy(uploads, {
      get: (streams, id) => {
        if (typeof id !== 'string') return undefined;
        prepared.push(`${id} at ${scheduler.now()}`);
        return streams[id];
      },
    });
    const { stored$ } = example.run({ inputs: { photo$ }, inner: watched, scheduler });
    const { marbles, values } = example.outputs['stored$'];
    helpers.expectObservable(stored$).toBe(marbles, values);
  });
  expect(prepared).toEqual(['cat at 1', 'dog at 3', 'owl at 5']);
});

it('completes once the user is done and the last upload has completed', () => {
  expect(framesOf('complete', 'photo$')).toEqual([8]);
  expect(framesOf('complete', 'upload(owl)')).toEqual([8]);
  expect(framesOf('complete', 'stored$')).toEqual([8]);
});

it('tells of dog overtaking cat and names each moment', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[4];
  expect(telling.frame).toBe(4);
  expect(telling.values['now']).toBe(
    'upload(dog) emits 2 (dog stored); stored$ emits 2 (dog stored)',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['cat starts', 1],
    ['dog runs beside cat', 3],
    ['dog overtakes cat', 4],
    ['owl starts at once', 5],
    ['Done', 8],
  ]);
});

it('gives what the concatMap study draws when capped at one', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers);
    const upload = (photo: unknown) => uploads[String(photo)];
    const oneAtATime$ = photo$.pipe(mergeMap((photo) => upload(photo), 1));
    const { marbles, values } = concatMapExample.outputs['stored$'];
    helpers.expectObservable(oneAtATime$).toBe(marbles, values);
    for (const id of ['cat', 'dog', 'owl'])
      helpers
        .expectSubscriptions(uploads[id].subscriptions)
        .toBe(concatMapExample.inner?.[id]?.subscriptions ?? []);
  });
});

it('cuts off the other uploads and stops listening for new photos when one fails', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers, { dog: '-#' });
    const { stored$ } = example.run({ inputs: { photo$ }, inner: uploads, scheduler });
    helpers.expectObservable(stored$).toBe('----#');
    // cat is still uploading and is cut off; owl is never added, as nothing listens any more.
    helpers.expectSubscriptions(uploads['cat'].subscriptions).toBe('-^--!');
    helpers.expectSubscriptions(uploads['owl'].subscriptions).toBe([]);
    helpers.expectSubscriptions(photo$.subscriptions).toBe('^---!');
  });
});

it('never completes when one upload never completes', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers, { cat: '-----1-' });
    const { stored$ } = example.run({ inputs: { photo$ }, inner: uploads, scheduler });
    helpers.expectObservable(stored$).toBe('----2-13', example.outputs['stored$'].values);
    helpers.expectSubscriptions(uploads['cat'].subscriptions).toBe('-^');
  });
});
