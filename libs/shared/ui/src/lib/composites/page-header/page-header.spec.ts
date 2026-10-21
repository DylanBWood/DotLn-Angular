import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnPageHeader } from './page-header';

describe('DotlnPageHeader', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnPageHeader],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnPageHeader);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('heading', 'Recorded work');
    fixture.componentRef.setInput('eyebrow', 'Workspace');
    fixture.componentRef.setInput('status', { state: 'unknown', label: 'Last refreshed time' });
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toBe('Recorded work');
    expect(element.textContent).toContain('Unknown');
    expect(element.textContent).toContain('Last refreshed time');
  });
});
