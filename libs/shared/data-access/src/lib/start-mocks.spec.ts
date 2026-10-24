import { startMocks } from './start-mocks';

it('awaits the worker before bootstrap', async () => {
  const order: string[] = [];

  await startMocks(async () => ({
    start: async () => {
      order.push('mocks');
    },
    stop: vi.fn(),
  }));
  order.push('bootstrap');

  expect(order).toEqual(['mocks', 'bootstrap']);
});

it.each(['import', 'start', 'timeout'])(
  'falls through to bootstrap after %s failure',
  async (failure) => {
    const warn = vi.fn();
    const stop = vi.fn();
    const bootstrap = vi.fn();

    await startMocks(
      async () => {
        if (failure === 'import') throw new Error('Import failed');
        return {
          stop,
          start: () =>
            failure === 'timeout'
              ? new Promise(() => undefined)
              : Promise.reject(new Error('Start failed')),
        };
      },
      5,
      warn,
    );
    bootstrap();

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    if (failure !== 'import') expect(stop).toHaveBeenCalled();
  },
);

it('stops a worker that completes after the deadline', async () => {
  let complete: () => void = () => undefined;
  const stop = vi.fn();

  await startMocks(
    async () => ({
      stop,
      start: () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    }),
    5,
    vi.fn(),
  );

  complete();
  await Promise.resolve();
  await Promise.resolve();

  expect(stop).toHaveBeenCalled();
});
