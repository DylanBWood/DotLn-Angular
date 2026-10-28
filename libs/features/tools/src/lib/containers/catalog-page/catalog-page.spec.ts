import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

it('presents a shelf, a readable definition and an untyped reason without a label-value grid', async () => {
  TestBed.configureTestingModule({
    imports: [CatalogPage],
    providers: [...provideToolsTestKit().providers],
  });
  const fixture = TestBed.createComponent(CatalogPage);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('h1')?.textContent).toBe('Catalog');
  expect(element.querySelectorAll('tools-work-shelf li')).toHaveLength(3);
  fixture.componentInstance.facade.open('sample:2');
  await fixture.whenStable();
  expect(element.querySelector('[data-testid="definition"]')?.textContent).toContain(
    'business transaction',
  );
  expect(element.querySelector('tools-concept-reading')?.textContent).toContain(
    'The scene needs a transaction contract.',
  );
  expect(element.querySelector('dl')).toBeNull();
});
