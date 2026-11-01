import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { StudyScrubber } from './scrubber';

function render(step: number) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyScrubber);
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('lastStep', 10);
  fixture.componentRef.setInput('seconds', '1.0');
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('stops stepping at either end of the run', () => {
  const first = render(0).element.querySelectorAll('button');
  expect(first[0].disabled).toBe(true);
  expect(first[1].disabled).toBe(false);
  TestBed.resetTestingModule();
  const last = render(10).element.querySelectorAll('button');
  expect(last[0].disabled).toBe(false);
  expect(last[1].disabled).toBe(true);
});

it('reports the slider’s moment', () => {
  const { fixture, element } = render(3);
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  const slider = element.querySelector('input') as HTMLInputElement;
  expect(slider.max).toBe('10');
  slider.value = '7';
  slider.dispatchEvent(new Event('input'));
  expect(stepped).toEqual([7]);
});

it('gives each instance its own ids, tied to its label', () => {
  const one = render(1).element;
  const other = TestBed.createComponent(StudyScrubber);
  other.componentRef.setInput('step', 1);
  other.componentRef.setInput('lastStep', 10);
  other.componentRef.setInput('seconds', '1.0');
  other.detectChanges();
  const two = other.nativeElement as HTMLElement;
  expect(one.querySelector('input')?.id).not.toBe(two.querySelector('input')?.id);
  expect(one.querySelector('label')?.getAttribute('for')).toBe(one.querySelector('input')?.id);
});

it('names a marble diagram’s frame out of its last', () => {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyScrubber);
  fixture.componentRef.setInput('step', 3);
  fixture.componentRef.setInput('lastStep', 10);
  fixture.componentRef.setInput('frame', 3);
  fixture.detectChanges();
  const label = (fixture.nativeElement as HTMLElement).querySelector('label');
  expect(label?.textContent).toContain('Frame 3 of 10');
});
