import { expect, test } from '@playwright/test';

const flock = 'aifg-a:145';

// Under the suite's reduced motion nothing moves by itself, so each frame is the same every run.
for (const width of [360, 768, 1440]) {
  test(`the scene at ${width}px, idle and with a tool chosen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/scene');
    await expect(page.locator(`[data-tool-id="${flock}"]`)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`scene-${width}.png`);

    await page.locator(`[data-tool-id="${flock}"]`).click();
    await expect(page.locator('scene-unit-inspector h2')).toHaveText('Flocking');
    await expect(page).toHaveScreenshot(`scene-flocking-${width}.png`);
  });
}
