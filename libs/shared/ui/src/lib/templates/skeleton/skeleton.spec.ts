import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnSkeleton } from './skeleton';

describe('DotlnSkeleton', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnSkeleton],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnSkeleton);
    const element: HTMLElement = fixture.nativeElement;
    await fixture.whenStable();
    expect(element.querySelector('[role=status]')?.textContent?.trim()).toBe('Loading');
  });
});
