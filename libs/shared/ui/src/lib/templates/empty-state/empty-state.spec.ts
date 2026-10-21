import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnEmptyState } from './empty-state';

describe('DotlnEmptyState', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnEmptyState],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnEmptyState);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('message', 'No recorded items.');
    await fixture.whenStable();
    expect(element.textContent).toContain('No recorded items.');
  });
});
