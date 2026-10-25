import { TestBed } from '@angular/core/testing';

import { provideSceneTestKit } from '../../../../testing/src';
import { SceneArrivingPage } from './scene-arriving-page';

it('names the arriving sub-app and delivery order and links back to the actor board', async () => {
  TestBed.configureTestingModule({
    imports: [SceneArrivingPage],
    providers: [...provideSceneTestKit().providers],
  });
  const fixture = TestBed.createComponent(SceneArrivingPage);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('h1')?.textContent).toBe('Scene');
  expect(element.querySelector('dotln-empty-state')?.textContent).toContain('WO-015');
  expect(element.querySelector('a')?.getAttribute('href')).toBe('/board');
  expect(element.querySelector('a')?.textContent).toBe('Back to the actor board');
});
