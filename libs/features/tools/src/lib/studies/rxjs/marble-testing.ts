import { tap } from 'rxjs';
import type { RunHelpers } from 'rxjs/testing';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'vitest';

import type { MarbleExample } from './marbles';
import { marbleModel, nameOf } from './marbles';

type Logged = ReturnType<RunHelpers['cold']> | ReturnType<RunHelpers['hot']>;

/** One thing an output delivered, named as the model names its events. */
interface Delivered {
  readonly frame: number;
  readonly kind: 'next' | 'error' | 'complete';
  readonly value: string;
}

/**
 * Runs an example under the TestScheduler and asserts every string it declares: each output's
 * marbles, every inner stream's subscription marbles and each input's declared ones. It then
 * holds the drawing's model to the same run: what the model draws as delivered on each output is
 * what the output delivered, at that frame, and a cold input the example does not place was
 * subscribed at frame 0, where the model draws it. A spec beside a module calls this, so the
 * strings the drawing reads are the strings the test passed.
 */
export function expectMarbleExample(example: MarbleExample): void {
  const delivered: Record<string, Delivered[]> = {};
  let inputs: [string, Logged][] = [];
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  scheduler.run(({ cold, hot, animate, expectObservable, expectSubscriptions }) => {
    if (example.animate !== undefined) animate(example.animate);
    inputs = Object.entries(example.inputs).map(([id, input]): [string, Logged] => [
      id,
      input.hot
        ? hot(input.marbles, input.values, input.error)
        : cold(input.marbles, input.values, input.error),
    ]);
    const inner = Object.entries(example.inner ?? {}).map(([id, stream]): [string, Logged] => [
      id,
      cold(stream.marbles, stream.values, stream.error),
    ]);
    const outputs = example.run({
      inputs: Object.fromEntries(inputs),
      inner: Object.fromEntries(inner),
      scheduler,
    });
    for (const [id, output] of Object.entries(example.outputs)) {
      const actual = outputs[id];
      expect(actual, `the example returns no output named ${id}`).toBeDefined();
      // The one subscription the assertion makes passes through this record on its way.
      const record: Delivered[] = [];
      delivered[id] = record;
      const observed = actual.pipe(
        tap({
          next: (value) =>
            record.push({ frame: scheduler.now(), kind: 'next', value: nameOf(value) }),
          error: (error: unknown) =>
            record.push({ frame: scheduler.now(), kind: 'error', value: nameOf(error) }),
          complete: () =>
            record.push({ frame: scheduler.now(), kind: 'complete', value: 'complete' }),
        }),
      );
      expectObservable(observed, output.subscriptions).toBe(
        output.marbles,
        output.values,
        output.error,
      );
    }
    for (const [id, stream] of inner)
      expectSubscriptions(stream.subscriptions).toBe(example.inner?.[id]?.subscriptions ?? '');
    for (const [id, stream] of inputs) {
      const expected = example.inputs[id]?.subscriptions;
      if (expected !== undefined) expectSubscriptions(stream.subscriptions).toBe(expected);
    }
  });
  // The drawing is built from the same strings and placed by the same subscriptions.
  const { marbles } = marbleModel(example);
  expect(marbles.frames.length).toBeGreaterThan(1);
  for (const line of marbles.lines.filter(({ role }) => role === 'output'))
    expect(
      line.events
        .filter((event) => event.delivered)
        .map(({ frame, kind, value }) => ({ frame, kind, value })),
      `the drawing's ${line.label} is not what the run delivered`,
    ).toEqual(delivered[line.id]);
  for (const [id, stream] of inputs) {
    const input = example.inputs[id];
    if (input?.hot || input?.subscriptions !== undefined) continue;
    const first = stream.subscriptions[0]?.subscribedFrame;
    expect(first ?? 0, `${input?.label} is drawn from frame 0 but was first subscribed later`).toBe(
      0,
    );
  }
}
