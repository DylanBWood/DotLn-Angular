import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnBadge } from './badge';

describe('DotlnBadge', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnBadge],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnBadge);
    const element: HTMLElement = fixture.nativeElement;
    for (const state of ['known', 'unknown', 'unavailable']) {
      fixture.componentRef.setInput('status', state);
      await fixture.whenStable();
      expect(element.textContent?.trim().toLowerCase()).toBe(state);
      expect(element.getAttribute('data-status')).toBe(state);
    }
  });
});
