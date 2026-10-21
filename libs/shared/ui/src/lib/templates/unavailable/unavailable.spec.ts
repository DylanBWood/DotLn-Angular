import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnUnavailable } from './unavailable';

describe('DotlnUnavailable', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnUnavailable],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnUnavailable);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('explanation', 'Source is absent.');
    await fixture.whenStable();
    expect(element.textContent).toContain('Unavailable');
    expect(element.textContent).toContain('Source is absent.');
  });
});
