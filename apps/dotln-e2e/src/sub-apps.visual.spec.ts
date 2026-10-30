import { expect, test } from '@playwright/test';

for (const width of [360, 768, 1440]) {
  for (const route of ['machinery']) {
    test(`${route} at ${width}px retains the menu and arriving content`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${route}`);
      await expect(page.getByRole('main').locator('dotln-empty-state')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${route}-${width}.png`);
    });
  }
}
