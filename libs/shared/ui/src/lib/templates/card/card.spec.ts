import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnVisuallyHidden } from '../../fragments/visually-hidden/visually-hidden';
import { DotlnCard } from './card';

@Component({
  selector: 'dotln-card-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-card>
      <h2 card-header translate="no">{{ title }}</h2>
      <p card-body translate="no">{{ body }}</p>
      <button card-actions type="button">
        <dotln-visually-hidden
          ><span translate="no">{{ action }}</span></dotln-visually-hidden
        >
      </button>
    </dotln-card>
  `,
  imports: [DotlnCard, DotlnVisuallyHidden],
})
class CardHost {
  readonly title = 'Title';
  readonly body = 'Body';
  readonly action = 'Read details';
}

it('projects card slots and preserves accessible visually hidden action text', async () => {
  TestBed.configureTestingModule({
    imports: [CardHost],
    providers: [...provideUiTestKit().providers],
  });
  const fixture = TestBed.createComponent(CardHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('.header h2')?.textContent).toBe('Title');
  expect(element.querySelector('.body p')?.textContent).toBe('Body');
  expect(element.querySelector('.actions button dotln-visually-hidden')?.textContent).toBe(
    'Read details',
  );
});
