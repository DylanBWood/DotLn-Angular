import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';

import { errorEvents } from '@dotln-angular/events';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

import { provideShellFacadeTestKit } from '../../../../testing/src';
import { ShellNotices } from './shell-notices';

it('distinguishes application errors from request failures and restores older notices on dismissal', async () => {
  TestBed.configureTestingModule({
    imports: [ShellNotices],
    providers: [
      ...provideShellFacadeTestKit().providers,
      ...provideDotlnI18nTestKit({
        langs: {
          en: {
            shell: {
              requestFailed: 'A request failed ({{kind}}).',
              applicationFailed: 'An unexpected application error occurred.',
            },
            ui: { dismiss: 'Dismiss' },
          },
        },
      }).providers,
    ],
  });
  const fixture = TestBed.createComponent(ShellNotices);
  const dispatcher = TestBed.inject(Dispatcher);
  const element: HTMLElement = fixture.nativeElement;
  const error = { kind: 'unknown' as const, message: 'Details', correlationId: 'request' };

  dispatcher.dispatch(errorEvents.httpFailed(error));
  await fixture.whenStable();
  expect(element.querySelector('dotln-toast p')?.textContent).toBe('A request failed (unknown).');

  dispatcher.dispatch(errorEvents.unhandled({ ...error, correlationId: 'application' }));
  await fixture.whenStable();
  expect(element.querySelector('dotln-toast p')?.textContent).toBe(
    'An unexpected application error occurred.',
  );

  element.querySelector<HTMLButtonElement>('dotln-toast button')?.click();
  await fixture.whenStable();
  expect(element.querySelector('dotln-toast p')?.textContent).toBe('A request failed (unknown).');

  element.querySelector<HTMLButtonElement>('dotln-toast button')?.click();
  await fixture.whenStable();
  expect(element.querySelector('dotln-toast')).toBeNull();
});
