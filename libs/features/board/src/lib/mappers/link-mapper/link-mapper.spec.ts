import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';

import { provideBoardFacadeTestKit } from '@dotln-angular/board/testing';
import { navigationEvents } from '@dotln-angular/events';

import { LinkMapper } from './link-mapper';

it('updates an existing copied anchor after query-only navigation', async () => {
  TestBed.configureTestingModule({
    imports: [LinkMapper],
    providers: [
      ...provideBoardFacadeTestKit().providers,
      provideRouter([{ path: 'board', children: [] }]),
    ],
  });
  const fixture = TestBed.createComponent(LinkMapper);
  fixture.componentRef.setInput('link', { label: 'Evidence', target: 'evidence-1' });
  fixture.componentRef.setInput('targets', new Map([['evidence-1', null]]));
  const router = TestBed.inject(Router);
  const dispatcher = TestBed.inject(Dispatcher);

  dispatcher.dispatch(navigationEvents.navigate({ route: 'board', query: { view: 'first' } }));
  await vi.waitFor(() => expect(router.url).toBe('/board?view=first'));
  fixture.detectChanges();

  const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
  expect(anchor.getAttribute('href')).toBe('/board?view=first#evidence-1');

  dispatcher.dispatch(navigationEvents.replaceQuery({ view: 'second' }));
  await vi.waitFor(() => expect(router.url).toBe('/board?view=second'));
  fixture.detectChanges();

  expect(anchor.getAttribute('href')).toBe('/board?view=second#evidence-1');
});
