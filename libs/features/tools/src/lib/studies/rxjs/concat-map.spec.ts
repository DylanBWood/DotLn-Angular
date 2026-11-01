import { mergeMap } from 'rxjs';
import type { RunHelpers } from 'rxjs/testing';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example, model } from './concat-map';
import { expectMarbleExample } from './marble-testing';
import { type MarbleExample, marbleModel } from './marbles';
import { example as mergeMapExample } from './merge-map';

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

it('attaches the record to the concatMap row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:147');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/concat-map.ts',
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

it('feeds its operator the same photos and uploads as the mergeMap study', () => {
  expect(inputsOf(example)).toEqual(inputsOf(mergeMapExample));
  expect(Object.keys(example.outputs)).toEqual(Object.keys(mergeMapExample.outputs));
});

it('takes the photos and upload times the record names from the marbles', async () => {
  const { parameters } = (await loadStudy('rxc:147')).example;
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
  // Each upload completes on the frame after its answer.
  for (const { events } of uploadLines()) {
    const [answer, completion] = events;
    expect([answer.kind, completion.kind, completion.frame - answer.frame]).toEqual([
      'next',
      'complete',
      1,
    ]);
  }
});

it('stores every photo, one upload at a time, in the order the photos were added', () => {
  const dropped = linesOf().flatMap(({ events }) =>
    events.filter(({ kind, delivered }) => kind === 'next' && !delivered),
  );
  expect(dropped).toEqual([]);
  expect(
    uploadLines().map(({ subscribedAt, unsubscribedAt, cancelled }) => [
      subscribedAt,
      unsubscribedAt,
      cancelled,
    ]),
  ).toEqual([
    [1, 7, false],
    [7, 9, false],
    [9, 12, false],
  ]);
  const { lastFrame, frames } = marbleModel(example).marbles;
  expect(Math.max(...Array.from({ length: lastFrame + 1 }, (_, frame) => openAt(frame)))).toBe(1);
  expect(frames[frames.length - 1].values['delivered']).toBe(
    '1 (cat stored), 2 (dog stored), 3 (owl stored)',
  );
});

it('starts the next upload when the one before completes, not when it is answered', () => {
  expect(framesOf('next', 'upload(cat)')).toEqual([6]);
  expect(framesOf('complete', 'upload(cat)')).toEqual([7]);
  // dog was added at frame 3 and its upload is the quickest, yet it opens only at cat's completion.
  expect(framesOf('next', 'photo$')).toEqual([1, 3, 5]);
  expect(uploadLines()[1].subscribedAt).toBe(7);
});

it('prepares the upload of a queued photo only when its turn comes', () => {
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
  expect(prepared).toEqual(['cat at 1', 'dog at 7', 'owl at 9']);
});

it('keeps the output open after the user is done until the last upload completes', () => {
  expect(framesOf('complete', 'photo$')).toEqual([8]);
  expect(framesOf('complete', 'stored$')).toEqual([12]);
  expect(uploadLines()[2].unsubscribedAt).toBe(12);
});

it('tells of the hand-over from cat to dog and names each moment', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe('upload(cat) completes; upload(dog) is opened');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['cat starts', 1],
    ['dog and owl queue', 5],
    ['cat done, dog starts', 7],
    ['No more photos', 8],
    ['Done', 12],
  ]);
});

it('stalls every later photo behind an upload that answers but never completes', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers, { cat: '-----1-' });
    const { stored$ } = example.run({ inputs: { photo$ }, inner: uploads, scheduler });
    helpers.expectObservable(stored$).toBe('------1', { 1: 'cat stored' });
    helpers.expectSubscriptions(uploads['cat'].subscriptions).toBe('-^');
    helpers.expectSubscriptions(uploads['dog'].subscriptions).toBe([]);
    helpers.expectSubscriptions(uploads['owl'].subscriptions).toBe([]);
  });
});

it('drops the queued photos and stops listening for new ones when an upload fails', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers, { cat: '---#' });
    const { stored$ } = example.run({ inputs: { photo$ }, inner: uploads, scheduler });
    helpers.expectObservable(stored$).toBe('----#');
    // dog was waiting when cat's upload failed and owl had not been added: neither is uploaded.
    helpers.expectSubscriptions(photo$.subscriptions).toBe('^---!');
    helpers.expectSubscriptions(uploads['dog'].subscriptions).toBe([]);
    helpers.expectSubscriptions(uploads['owl'].subscriptions).toBe([]);
  });
});

it('gives what the mergeMap study draws when the same uploads run at once', () => {
  const scheduler = newScheduler();
  scheduler.run((helpers) => {
    const { photo$, uploads } = streamsOf(helpers);
    const upload = (photo: unknown) => uploads[String(photo)];
    const together$ = photo$.pipe(mergeMap((photo) => upload(photo)));
    const { marbles, values } = mergeMapExample.outputs['stored$'];
    helpers.expectObservable(together$).toBe(marbles, values);
  });
});
