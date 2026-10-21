import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnMenu } from './menu';

it('exposes the house menu trigger and emits only selected item values', async () => {
  TestBed.configureTestingModule({
    imports: [DotlnMenu],
    providers: [...provideUiTestKit().providers],
  });
  const fixture = TestBed.createComponent(DotlnMenu);
  fixture.componentRef.setInput('label', 'Actions');
  fixture.componentRef.setInput('options', [{ id: 'inspect', label: 'Inspect' }]);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('button')?.textContent?.trim()).toBe('Actions');
  const selected = vi.fn();
  fixture.componentInstance.selected.subscribe(selected);
  fixture.componentInstance.choose(undefined);
  fixture.componentInstance.choose('inspect');
  expect(selected).toHaveBeenCalledExactlyOnceWith('inspect');
});
