import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { StudyInputs } from './inputs';

function render() {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyInputs);
  fixture.componentRef.setInput('inputs', [
    { name: 'radius', label: 'Radius', unit: 'units', min: 2, max: 20, step: 2, value: 8 },
  ]);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('labels each input with its value and keeps it inside its range', () => {
  const { element } = render();
  expect(element.querySelector('label')?.textContent).toContain('Radius · 8 units');
  const slider = element.querySelector('input') as HTMLInputElement;
  expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['2', '20', '2', '8']);
});

it('opens from its input and reports a reader toggling it', () => {
  const { fixture, element } = render();
  const details = element.querySelector('details') as HTMLDetailsElement;
  expect(details.open).toBe(false);
  const toggled: boolean[] = [];
  fixture.componentInstance.toggled.subscribe((open) => toggled.push(open));
  details.open = true;
  details.dispatchEvent(new Event('toggle'));
  expect(toggled).toEqual([true]);
  fixture.componentRef.setInput('open', true);
  fixture.detectChanges();
  expect(details.open).toBe(true);
});

it('reports a changed input and a return to the example', () => {
  const { fixture, element } = render();
  const changed: unknown[] = [];
  let reset = 0;
  fixture.componentInstance.changed.subscribe((value) => changed.push(value));
  fixture.componentInstance.restored.subscribe(() => reset++);
  const slider = element.querySelector('input') as HTMLInputElement;
  slider.value = '12';
  slider.dispatchEvent(new Event('input'));
  element.querySelector('button')?.click();
  expect(changed).toEqual([{ name: 'radius', value: 12 }]);
  expect(reset).toBe(1);
});
