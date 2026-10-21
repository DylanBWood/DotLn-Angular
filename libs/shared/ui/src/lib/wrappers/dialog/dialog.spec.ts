import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnDialog } from './dialog';

it('opens a labeled native modal and reflects cancellation into the house state', async () => {
  const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
  const show = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: show },
    close: { configurable: true, value: close },
  });
  const opener = document.createElement('button');
  const next = document.createElement('button');
  document.body.append(opener, next);
  opener.focus();
  try {
    TestBed.configureTestingModule({
      imports: [DotlnDialog],
      providers: [...provideUiTestKit().providers],
    });
    const fixture = TestBed.createComponent(DotlnDialog);
    fixture.componentRef.setInput('label', 'Details');
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('dialog')?.getAttribute('aria-label')).toBe('Details');
    expect(show).toHaveBeenCalledOnce();
    const cancel = new Event('cancel', { cancelable: true });
    element.querySelector('dialog')?.dispatchEvent(cancel);
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(cancel.defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(opener);
    next.focus();
    fixture.destroy();
    expect(document.activeElement).toBe(next);
  } finally {
    opener.remove();
    next.remove();
    if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});
