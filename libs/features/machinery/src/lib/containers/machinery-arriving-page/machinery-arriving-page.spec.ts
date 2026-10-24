import { TestBed } from '@angular/core/testing';

import { provideMachineryTestKit } from '../../../../testing/src';
import { MachineryArrivingPage } from './machinery-arriving-page';

it('names the arriving sub-app and delivery order and links back to the actor board', async () => {
  TestBed.configureTestingModule({
    imports: [MachineryArrivingPage],
    providers: [...provideMachineryTestKit().providers],
  });
  const fixture = TestBed.createComponent(MachineryArrivingPage);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('h1')?.textContent).toBe('Machinery');
  expect(element.querySelector('dotln-empty-state')?.textContent).toContain('WO-016');
  expect(element.querySelector('a')?.getAttribute('href')).toBe('/board');
  expect(element.querySelector('a')?.textContent).toBe('Back to the actor board');
});
