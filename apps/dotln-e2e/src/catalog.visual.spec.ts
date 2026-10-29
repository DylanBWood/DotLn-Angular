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
}
