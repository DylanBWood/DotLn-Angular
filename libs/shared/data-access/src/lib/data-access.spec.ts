import { createServer } from 'node:http';
import { HttpClient, HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { Events } from '@ngrx/signals/events';
import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { firstValueFrom } from 'rxjs';

import { errorEvents } from '@dotln-angular/events';
import type { PanelId } from '@dotln-angular/models';
import { isPanelId } from '@dotln-angular/models';

import { provideDotlnHttpTestKit, provideStorageTokenTestKit } from '../../testing/src';
import { RequestCorrelationToken, RequestTimeoutToken, withPersistedState } from '../public_api';
import { server } from '../test-setup';

const PanelStore = signalStore(
  { protectedState: false },
  withState({ selectedPanel: 'actors' as PanelId, transient: 'not persisted' }),
  withPersistedState<{ selectedPanel: PanelId }>({
    key: 'board',
    select: (state) => ({ selectedPanel: state.selectedPanel }),
    restore: (value) =>
      typeof value === 'object' &&
      value !== null &&
      'selectedPanel' in value &&
      isPanelId(value.selectedPanel)
        ? { selectedPanel: value.selectedPanel }
        : undefined,
  }),
);

describe('persisted state', () => {
  it('writes only the selected slice to the injected namespaced storage and restores it', () => {
    const kit = provideStorageTokenTestKit();
    kit.values.set(
      'dotln-angular.board',
      JSON.stringify({ selectedPanel: 'work', transient: 'forged' }),
    );
    const browserWrite = vi.spyOn(Storage.prototype, 'setItem');
    const cookie = vi.spyOn(Document.prototype, 'cookie', 'set');
    const fetch = vi.spyOn(globalThis, 'fetch');

    TestBed.configureTestingModule({ providers: [...kit.providers, PanelStore] });
    const store = TestBed.inject(PanelStore);

    expect(store.selectedPanel()).toBe('work');
    expect(store.transient()).toBe('not persisted');

    patchState(store, { selectedPanel: 'blueprint' });
    expect(kit.writes.length).toBeGreaterThan(0);
    expect(kit.writes.every((write) => write.key.startsWith('dotln-angular.'))).toBe(true);
    expect(JSON.parse(kit.values.get('dotln-angular.board') ?? '')).toEqual({
      selectedPanel: 'blueprint',
    });

    expect(browserWrite).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('keeps defaults and remains usable when storage throws', () => {
    const blocked = () => {
      throw new Error('Blocked');
    };

    TestBed.configureTestingModule({
      providers: [
        ...provideStorageTokenTestKit({ getItem: blocked, setItem: blocked, removeItem: blocked })
          .providers,
        PanelStore,
      ],
    });
    const store = TestBed.inject(PanelStore);

    expect(store.selectedPanel()).toBe('actors');
    expect(() => patchState(store, { selectedPanel: 'work' })).not.toThrow();

    expect(store.selectedPanel()).toBe('work');
  });

  it.each(['not JSON', '{"selectedPanel":"unknown"}'])('keeps defaults for %s', (value) => {
    const kit = provideStorageTokenTestKit();
    kit.values.set('dotln-angular.board', value);

    TestBed.configureTestingModule({ providers: [...kit.providers, PanelStore] });
    expect(TestBed.inject(PanelStore).selectedPanel()).toBe('actors');
  });
});

describe('HTTP interceptors', () => {
  it('resolves relative requests against the API base and leaves absolute requests untouched', async () => {
    server.use(
      http.get('http://localhost/api/example', () => HttpResponse.json({ base: true })),
      http.get('https://example.test/absolute', () => HttpResponse.json({ absolute: true })),
    );

    TestBed.configureTestingModule({ providers: [...provideDotlnHttpTestKit().providers] });
    const client = TestBed.inject(HttpClient);

    expect(await firstValueFrom(client.get('/example'))).toEqual({ base: true });
    expect(await firstValueFrom(client.get('https://example.test/absolute'))).toEqual({
      absolute: true,
    });
  });

  it('refuses an unhandled request that a live server would answer', async () => {
    let received = 0;
    const liveServer = createServer((_request, response) => {
      received += 1;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ reached: true }));
    });

    await new Promise<void>((resolve, reject) => {
      liveServer.once('error', reject);
      liveServer.listen(0, '127.0.0.1', resolve);
    });

    try {
      TestBed.configureTestingModule({ providers: [...provideDotlnHttpTestKit().providers] });
      const address = liveServer.address();
      if (address === null || typeof address === 'string') throw new Error('No TCP address');
      const url = `http://127.0.0.1:${address.port}/no-handler`;

      await expect(firstValueFrom(TestBed.inject(HttpClient).get(url))).rejects.toMatchObject({
        kind: 'network',
      });
      expect(received).toBe(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        liveServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('dispatches the correlated timeout and propagates it', async () => {
    server.use(
      http.get('http://localhost/api/slow', async () => {
        await delay(100);
        return HttpResponse.json({});
      }),
    );

    TestBed.configureTestingModule({ providers: [...provideDotlnHttpTestKit().providers] });
    const observed = firstValueFrom(TestBed.inject(Events).on(errorEvents.httpFailed));
    const context = new HttpContext()
      .set(RequestTimeoutToken, 10)
      .set(RequestCorrelationToken, 'timeout-case');

    await expect(
      firstValueFrom(TestBed.inject(HttpClient).get('/slow', { context })),
    ).rejects.toMatchObject({ kind: 'timeout', correlationId: 'timeout-case' });
    expect((await observed).payload).toMatchObject({
      kind: 'timeout',
      correlationId: 'timeout-case',
    });
  });
});
