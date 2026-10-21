import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnIcon } from './icon';

describe('DotlnIcon', () => {
  it('renders its accessible content and supplied state', async () => {
    TestBed.configureTestingModule({
      imports: [DotlnIcon],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnIcon);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('glyph', '🔎');
    fixture.componentRef.setInput('label', 'Search');
    await fixture.whenStable();
    expect(element.querySelector('[role=img]')?.getAttribute('aria-label')).toBe('Search');
    expect(element.textContent).toContain('🔎');
  });
});
