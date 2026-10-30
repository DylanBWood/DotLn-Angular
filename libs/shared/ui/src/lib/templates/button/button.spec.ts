import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnButton } from './button';

@Component({
  selector: 'dotln-button-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-button (pressed)="presses = presses + 1"
      ><span translate="no">{{ label }}</span></dotln-button
    >
  `,
  imports: [DotlnButton],
})
class ButtonHost {
  readonly label = 'Continue';
  presses = 0;
}

describe('DotlnButton', () => {
  it.each([
    ['size', 'small', 'data-size'],
    ['tone', 'primary', 'data-tone'],
  ])('marks a %s of %s on the host for its styles', async (name, value, attribute) => {
    TestBed.configureTestingModule({
      imports: [DotlnButton],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnButton);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.getAttribute(attribute)).toBeNull();
    fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    expect(host.getAttribute(attribute)).toBe(value);
  });

  it('projects its label and forwards native activation once', async () => {
    TestBed.configureTestingModule({
      imports: [ButtonHost],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(ButtonHost);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector('button')?.click();
    expect(fixture.componentInstance.presses).toBe(1);
    expect(element.textContent).toContain('Continue');
  });
  it.each(['replace', 'trailing', 'overlay'])(
    'announces %s loading and prevents repeated intent',
    async (variant) => {
      TestBed.configureTestingModule({
        imports: [DotlnButton],
        providers: [...provideUiTestKit().providers],
      });
      const fixture = TestBed.createComponent(DotlnButton);
      const pressed = vi.fn();
      fixture.componentInstance.pressed.subscribe(pressed);
      fixture.componentRef.setInput('loadingVariant', variant);
      fixture.componentRef.setInput('loading', true);
      await fixture.whenStable();
      const element: HTMLElement = fixture.nativeElement;
      const button = element.querySelector('button');
      expect(button?.disabled).toBe(true);
      expect(button?.getAttribute('aria-busy')).toBe('true');
      expect(element.getAttribute('data-loading')).toBe(variant);
      expect(element.querySelector('[role=status]')?.textContent).toContain('Loading');
      button?.click();
      expect(pressed).not.toHaveBeenCalled();
    },
  );
});
