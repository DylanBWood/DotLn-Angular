import { expect, test } from '@playwright/test';

for (const size of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  for (const panel of ['Actors', 'Builds', 'Mechanisms', 'Work', 'Blueprint']) {
    test(`${size.name} ${panel} page`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/board');
      await page.getByRole('tab', { name: panel, exact: true }).click();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { name: panel, exact: true })).toBeVisible();
      await expect(page).toHaveScreenshot(`board-${size.name}-${panel.toLowerCase()}.png`);
    });
  }
}

test('the actor row preserves the detailed label/value/status hierarchy', async ({ page }) => {
  await page.goto('/board');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('board-row').first()).toHaveScreenshot('actor-row.png');
});

test('a complete actor row remains readable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/board');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('board-row').first()).toHaveScreenshot('actor-row-mobile.png');
});

test('the source disclosure keeps availability and explanations legible', async ({ page }) => {
  await page.goto('/board');
  const disclosure = page.locator('details').first();
  await disclosure.locator('summary').click();
  await page
    .locator('.sources-heading')
    .evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('link', { name: 'Skip to main content' })).not.toBeFocused();
  await expect(page).toHaveScreenshot('sources-open.png');
});
