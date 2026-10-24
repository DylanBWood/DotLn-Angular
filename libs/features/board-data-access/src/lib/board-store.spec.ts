import {
  HttpInterceptorFn,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';

import {
  baseUrlInterceptor,
  errorInterceptor,
  timeoutInterceptor,
} from '@dotln-angular/data-access';
import { boardPageEvents } from '@dotln-angular/events';

import { provideBoardStoreTestKit, recordedBoard } from '../../testing/src';
import { BoardStore } from './board-store';

function scenarioHeader(scenario: string): HttpInterceptorFn {
  return (request, next) =>
    next(request.clone({ setHeaders: { 'x-dotln-test-scenario': scenario } }));
}

it('loads the recorded board through HTTP and responds to UI selection', async () => {
  const kit = provideBoardStoreTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const store = TestBed.inject(BoardStore),
    dispatcher = TestBed.inject(Dispatcher);

  dispatcher.dispatch(boardPageEvents.opened());
  expect(store.loading()).toBe(true);
  await vi.waitFor(() => expect(store.loaded()).toBe(true));

  expect(store.document()).toEqual(recordedBoard);
  expect(store.failure()).toBeNull();

  dispatcher.dispatch(boardPageEvents.panelSelected('work'));
  expect(store.selectedPanel()).toBe('work');
  expect(JSON.parse(kit.values.get('dotln-angular.board') ?? '')).toEqual({
    selectedPanel: 'work',
  });
});

it.each([
  ['refusal', 'http', 503],
  ['failure', 'http', 500],
  ['network', 'network', undefined],
  ['timeout', 'timeout', undefined],
])('maps %s into the failure trinity', async (scenario, kind, status) => {
  TestBed.configureTestingModule({
    providers: [
      ...provideBoardStoreTestKit({ requestTimeoutMs: scenario === 'timeout' ? 30 : 1000 })
        .providers,
      provideHttpClient(
        withFetch(),
        withInterceptors([
          baseUrlInterceptor,
          errorInterceptor,
          timeoutInterceptor,
          scenarioHeader(String(scenario)),
        ]),
      ),
    ],
  });
  const store = TestBed.inject(BoardStore),
    dispatcher = TestBed.inject(Dispatcher);

  dispatcher.dispatch(boardPageEvents.refreshRequested());
  await vi.waitFor(() => expect(store.failure()?.kind).toBe(kind));

  expect(store.loading()).toBe(false);
  expect(store.loaded()).toBe(false);
  expect(store.document()).toBeNull();
  if (status) expect(store.failure()).toMatchObject({ status });
});

it('renders the schema-shaped unavailable projection returned by the handler', async () => {
  TestBed.configureTestingModule({
    providers: [
      ...provideBoardStoreTestKit().providers,
      provideHttpClient(
        withFetch(),
        withInterceptors([
          baseUrlInterceptor,
          errorInterceptor,
          timeoutInterceptor,
          scenarioHeader('unavailable'),
        ]),
      ),
    ],
  });
  const store = TestBed.inject(BoardStore);

  TestBed.inject(Dispatcher).dispatch(boardPageEvents.opened());
  await vi.waitFor(() => expect(store.loaded()).toBe(true));

  expect(
    store
      .document()
      ?.panels.every((panel) =>
        panel.sections.every((section) => section.status === 'unavailable'),
      ),
  ).toBe(true);
});
