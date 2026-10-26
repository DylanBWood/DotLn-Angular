import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

it('renders catalog rows and shows an untyped reason and the five faces on selection', async () => {
  TestBed.configureTestingModule({
    imports: [CatalogPage],
    providers: [...provideToolsTestKit().providers],
  });
  const fixture = TestBed.createComponent(CatalogPage);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('h1')?.textContent).toBe('Catalog');
  expect(element.querySelectorAll('[data-tool-id]')).toHaveLength(3);
  const button = element.querySelector<HTMLButtonElement>('[data-tool-id="sample:2"] button');
  button?.click();
  await fixture.whenStable();
  const details = element.querySelector('tools-tool-faces');
  expect(details?.textContent).toContain('The scene needs a transaction contract.');
  expect(
    Array.from(details?.querySelectorAll('dt') ?? []).map((item) => item.textContent?.trim()),
  ).toEqual(['Scene', 'Selection', 'Transform', 'Observable', 'Toy metrics']);
  expect(button?.getAttribute('aria-pressed')).toBe('true');
});
