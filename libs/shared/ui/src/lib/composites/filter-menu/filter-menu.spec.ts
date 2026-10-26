import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnMenu } from '../../wrappers/menu/menu';
import { DotlnFilterMenu } from './filter-menu';

it('presents a controlled selection and forwards menu intent without changing its input', async () => {
  TestBed.configureTestingModule({
    imports: [DotlnFilterMenu],
    providers: [...provideUiTestKit().providers],
  });
  const fixture = TestBed.createComponent(DotlnFilterMenu);
  fixture.componentRef.setInput('label', 'Work');
  fixture.componentRef.setInput('options', [
    { id: '', label: 'All' },
    { id: 'example', label: 'Example' },
  ]);
  fixture.componentRef.setInput('allLabel', 'All');
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('span')?.textContent).toBe('All');
  const selected = vi.fn();
  fixture.componentInstance.selected.subscribe(selected);
  const menu = fixture.debugElement.query(By.directive(DotlnMenu)).componentInstance as DotlnMenu;
  menu.selected.emit('example');
  expect(selected).toHaveBeenCalledExactlyOnceWith('example');
  expect(fixture.componentInstance.value()).toBeNull();
  fixture.componentRef.setInput('value', 'example');
  await fixture.whenStable();
  expect(element.querySelector('span')?.textContent).toBe('example');
});
