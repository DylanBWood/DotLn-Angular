import { expect, test } from '@playwright/test';

import { importScene, standingVolley, stepFrames } from './scene-range';

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

for (const width of [360, 1440]) {
  test(`a volley crosses the field at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/scene');
    await importScene(page, [standingVolley]);
    await stepFrames(page, 55);
    await expect(page.locator('scene-instrument-strip .frame')).toHaveText('Frame 55');
    await page.locator('scene-canvas').scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`scene-volley-${width}.png`);
  });
}

test('the retired unit’s activity and hit count are legible together at 360px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/scene');
  await importScene(page, [
    {
      ...standingVolley,
      selection: ['unit-08'],
      params: { ...standingVolley.params, 'bullet-speed': 72, rate: 2, 'knockout-hits': 3 },
    },
  ]);
  await stepFrames(page, 107);
  const row = page.locator('scene-unit-list [data-unit-id="unit-09"]');
  await expect(row).toContainText('Hits taken 3');
  await page.evaluate(() => document.fonts.ready);
  await expect(row).toHaveScreenshot('scene-knockout-row-360.png');
});
