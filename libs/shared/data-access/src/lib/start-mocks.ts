export async function startMocks(
  load: () => Promise<{ start: () => Promise<unknown>; stop: () => void }>,
  timeoutMs = 3000,
  warn: (message: string) => void = (message) => console.warn(message),
): Promise<void> {
  let expired = false;
  let worker: Awaited<ReturnType<typeof load>> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      load().then(async (loaded) => {
        worker = loaded;
        if (expired) return;

        await loaded.start();
        if (expired) loaded.stop();
      }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error('Mock startup timeout'));
        }, timeoutMs);
      }),
    ]);
  } catch {
    expired = true;
    worker?.stop();
    warn('Mock startup unavailable; continuing application bootstrap.');
  } finally {
    clearTimeout(timer);
  }
}
