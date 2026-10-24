import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Dispatcher, Events } from '@ngrx/signals/events';
import { firstValueFrom } from 'rxjs';

import { errorEvents, navigationEvents } from '@dotln-angular/events';

import { provideDotlnStateTestKit } from '../../testing/src';
import { ErrorStore, FeatureFlagStore } from '../public_api';

@Component({
  selector: 'lib-state-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span></span>
  `,
})
class Page {}

it.each([true, false])('applies URL flags only when enabled (%s)', (enabled) => {
  const doc = document.implementation.createHTMLDocument();
  Object.defineProperty(doc, 'URL', {
    value: 'http://localhost/board?ff=sourcesFooter:off&ff=unknown:on',
  });
  TestBed.configureTestingModule({
    providers: [
      ...provideDotlnStateTestKit({ featureFlagOverrides: enabled }).providers,
      { provide: DOCUMENT, useValue: doc },
    ],
  });

  expect(TestBed.inject(FeatureFlagStore).flags().sourcesFooter).toBe(!enabled);
});

it('collects, deduplicates and dismisses errors', () => {
  TestBed.configureTestingModule({ providers: [...provideDotlnStateTestKit().providers] });
  const store = TestBed.inject(ErrorStore);
  const dispatcher = TestBed.inject(Dispatcher);
  const error = { kind: 'network' as const, message: 'Unavailable', correlationId: 'case' };

  dispatcher.dispatch(errorEvents.httpFailed(error));
  dispatcher.dispatch(errorEvents.httpFailed(error));

  expect(store.count()).toBe(1);
  expect(store.latest()).toEqual({ ...error, source: 'http' });

  store.dismiss('case');
  expect(store.latest()).toBeNull();
});

it.each([
  new Error('Uncaught', { cause: new Error('Original cause') }),
  'A thrown string',
  { detail: 'A thrown object' },
  null,
])(
  'reports the original uncaught value and dispatches an application error (%s)',
  async (error) => {
    TestBed.configureTestingModule({ providers: [...provideDotlnStateTestKit().providers] });
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const observed = firstValueFrom(TestBed.inject(Events).on(errorEvents.unhandled));

    try {
      TestBed.inject(ErrorHandler).handleError(error);

      expect(report).toHaveBeenCalledExactlyOnceWith('ERROR', error);
      expect(report.mock.calls[0][1]).toBe(error);

      const { payload } = await observed;
      expect(payload).toMatchObject({
        kind: 'unknown',
        message: 'An unexpected application error occurred.',
        correlationId: expect.any(String),
      });
      expect(TestBed.inject(ErrorStore).latest()).toEqual({ ...payload, source: 'application' });
    } finally {
      report.mockRestore();
    }
  },
);

it('uses canonical navigation, preserves query values and replaces a query', async () => {
  TestBed.configureTestingModule({
    providers: [
      ...provideDotlnStateTestKit().providers,
      provideRouter([{ path: 'board', component: Page }]),
    ],
  });
  const router = TestBed.inject(Router),
    dispatcher = TestBed.inject(Dispatcher);

  dispatcher.dispatch(
    navigationEvents.navigate({
      route: 'board',
      query: { page: 2, enabled: false },
      fragment: 'work',
    }),
  );
  await vi.waitFor(() => expect(router.url).toBe('/board?page=2&enabled=false#work'));

  dispatcher.dispatch(navigationEvents.replaceQuery({ page: 3 }));
  await vi.waitFor(() => expect(router.url).toBe('/board?page=3'));
});
