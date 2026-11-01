import { expect, test } from '@playwright/test';

for (const width of [360, 768, 1440]) {
  test(`catalog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/catalog');
    await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
    await page
      .getByRole('searchbox', { name: 'Find a concept' })
      .fill('Two-level formation steering');
    await page.getByRole('searchbox', { name: 'Find a concept' }).press('Enter');
    await expect(page.locator('[data-concept-id="aifg-a:177"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`catalog-${width}.png`);
  });

  test(`a marbles study at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/catalog/rxc:152');
    await expect(page.locator('tools-study-marbles')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('tools-study')).toHaveScreenshot(`marbles-study-${width}.png`);
  });

  test(`a study at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/catalog/aifg-a:145');
    await expect(page.locator('tools-study figure')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('tools-study')).toHaveScreenshot(`study-${width}.png`);
  });
}
