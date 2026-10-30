import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const flock = 'aifg-a:145';
const arrive = 'aifg-a:112';

const figure = (page: Page, id: string) => page.locator(`[data-metric="${id}"] .figure`);
const units = (page: Page) => page.locator('scene-unit-list li');
const selected = (page: Page) => page.locator('scene-unit-list input:checked');
const tool = (page: Page, id: string) => page.locator(`[data-tool-id="${id}"]`);
const apply = (page: Page) => page.locator('[data-apply] button');
const transport = (page: Page, name: string) => page.locator(`[data-transport="${name}"] button`);

async function arrived(page: Page, path = '/scene') {
  await page.goto(path);
  await expect(tool(page, flock)).toBeVisible();
  await expect(units(page)).toHaveCount(20);
}

// A marquee over most of the field; the fixture spreads the twenty across it.
async function marquee(page: Page) {
  const box = await page.locator('scene-canvas canvas').boundingBox();
  if (!box) throw new Error('The field has no box.');
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height * 0.6, { steps: 5 });
  await page.mouse.up();
  return box;
}

test('the root lands on the scene, with twenty units and no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/scene$/);
  await expect(page).toHaveTitle('DotLn');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The soldier scene');
  await expect(units(page)).toHaveCount(20);
  await expect(page.locator('scene-canvas canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the menu marks the scene as the current page on landing', async ({ page }) => {
  await arrived(page);
  const menu = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(menu.getByRole('link', { name: 'Scene', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('Step advances the frame counter under reduced motion, and nothing moves by itself', async ({
  page,
}) => {
  await arrived(page);
  const frame = page.locator('scene-instrument-strip .frame');
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await expect(frame).toHaveText('Frame 0');
  await transport(page, 'step').click();
  await expect(frame).toHaveText('Frame 1');
});

test('the rail lists the floor of tools and nothing the engine refuses', async ({ page }) => {
  await arrived(page);
  const rail = page.locator('scene-toolbox-rail');
  for (const name of [
    'Seek',
    'Arrive',
    'Separation',
    'Velocity matching',
    'Wander',
    'Flocking',
    'Priority steering',
    'Two-level formation steering',
    'Wedge',
    'Line',
    'Column',
    'Fixed formations',
    'Slot assignment',
  ])
    await expect(rail.getByRole('button', { name, exact: true })).toBeVisible();
  const ids = await rail
    .locator('[data-tool-id]')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-tool-id')));
  expect(ids.length).toBeGreaterThanOrEqual(13);
  expect(ids.every((id) => id?.startsWith('aifg-'))).toBe(true);
});

test('a marquee selects units and Escape clears them', async ({ page }) => {
  await arrived(page);
  await marquee(page);
  await expect.poll(() => selected(page).count()).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Escape');
  await expect(selected(page)).toHaveCount(0);
});

test('the text layer selects by keyboard alone', async ({ page }) => {
  await arrived(page);
  const row = page.locator('[data-unit-id="unit-01"] input');
  await row.focus();
  await page.keyboard.press('Space');
  await expect(row).toBeChecked();
  await expect(page.locator('.focus')).toHaveText('1 selected');
});

test('a toggle and an Escape landing before one render leave no checkbox checked', async ({
  page,
}) => {
  await arrived(page);
  const row = page.locator('[data-unit-id="unit-01"] input');
  // Space on a focused checkbox is a click. Two separate key presses render in between on a quick
  // machine, so the clear is issued in the same task as the activation, as a fast hand lands them.
  await row.evaluate((input) => {
    input.focus();
    input.click();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await expect(page.locator('.focus')).toHaveText('All 20 units');
  await expect(page.locator('scene-canvas canvas')).toHaveAttribute('aria-label', / 0 selected/);
  await expect(selected(page)).toHaveCount(0);
});

test('Flock changes the cohesion figure and draws its sparkline', async ({ page }) => {
  await arrived(page);
  await marquee(page);
  await tool(page, flock).click();
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('Flocking');
  await expect(page.locator('scene-unit-inspector .definition')).toContainText('classic blend');
  const before = await figure(page, 'cohesionRadius').textContent();
  await apply(page).click();
  await transport(page, 'play').click();
  await expect(figure(page, 'cohesionRadius')).not.toHaveText(before ?? '');
  await expect(page.locator('[data-metric="cohesionRadius"] polyline')).not.toHaveAttribute(
    'points',
    '',
  );
  await expect(figure(page, 'collisions')).toHaveText('0');
});

test('a clicked objective and Arrive give a time to objective', async ({ page }) => {
  await arrived(page);
  const box = await marquee(page);
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.85);
  await tool(page, arrive).click();
  await expect(figure(page, 'timeToObjective')).toHaveText('unknown');
  await apply(page).click();
  await transport(page, 'play').click();
  await expect(figure(page, 'timeToObjective')).toHaveText(/^\d+\.\d$/, { timeout: 30_000 });
});

test('a right-click sends the selected units without the browser menu', async ({ page }) => {
  await arrived(page);
  const box = await marquee(page);
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.85, { button: 'right' });
  await expect(page.locator('scene-tool-log ol li')).toHaveText([/Objective set/, /Arrive/]);
});

test('a live change reaches the units without pressing Apply again', async ({ page }) => {
  await arrived(page);
  await marquee(page);
  await tool(page, flock).click();
  await apply(page).click();
  const slider = page.locator('scene-unit-inspector input[type="range"]').first();
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('scene-tool-log ol li').first()).toContainText('2 changes');
});

test('Compare goes back to the split, marks the divergence and keeps the trial', async ({
  page,
}) => {
  await arrived(page);
  await marquee(page);
  await tool(page, flock).click();
  await apply(page).click();
  await transport(page, 'compare').click();
  await expect(page.locator('[data-divergence]')).toContainText('frame 1');
  await expect(page.locator('[data-series="cohesionRadius"] polyline')).toHaveCount(2);
  await page.locator('[data-trial="keep"] button').click();
  await expect(page.locator('scene-tool-log')).toContainText('Trials kept: 1');
});

test('a saved composition survives a reload, and nothing leaves the browser', async ({ page }) => {
  await arrived(page);
  const sent: string[] = [];
  page.on('request', (request) => {
    const data = ['xhr', 'fetch', 'websocket', 'ping', 'eventsource'];
    if (request.method() !== 'GET' || data.includes(request.resourceType()))
      sent.push(`${request.method()} ${request.url()}`);
  });
  await marquee(page);
  await tool(page, flock).click();
  await apply(page).click();
  await page.locator('scene-unit-inspector textarea').fill('pulls together');
  await transport(page, 'save').click();
  await expect(page.locator('[data-composition-id]')).toHaveCount(1);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['dotln-angular.scene']);
  expect(await page.evaluate(() => document.cookie)).toBe('');
  expect(sent).toEqual([]);
  await page.reload();
  await expect(page.locator('[data-composition-id]')).toContainText('Flocking');
  await expect(page.locator('[data-composition-id]')).toContainText('pulls together');
});

test('a corrupt saved scene is ignored in words and left as it was', async ({ page }) => {
  await page.goto('/board');
  await page.evaluate(() => localStorage.setItem('dotln-angular.scene', '{broken'));
  await arrived(page);
  await expect(page.locator('scene-notice-mapper')).toContainText('could not be read');
  expect(await page.evaluate(() => localStorage.getItem('dotln-angular.scene'))).toBe('{broken');
});

test('a tool named in the URL arrives chosen', async ({ page }) => {
  await arrived(page, `/scene?tool=${flock}`);
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('Flocking');
  await expect(tool(page, flock)).toHaveAttribute('aria-pressed', 'true');
});

test('an unknown tool in the URL arrives with no tool chosen and says why', async ({ page }) => {
  await arrived(page, '/scene?tool=nope:1');
  await expect(page.locator('scene-notice-mapper')).toContainText('nope:1');
  await expect(page.locator('scene-unit-inspector h2')).toHaveCount(0);
});

test('a tool the engine refuses arrives with no tool chosen and names the kind', async ({
  page,
}) => {
  await arrived(page, '/scene?tool=eip:91');
  await expect(page.locator('scene-notice-mapper')).toContainText('channel.policy');
  await expect(page.locator('scene-unit-inspector h2')).toHaveCount(0);
});

test('the catalog’s scene link arrives with its tool chosen', async ({ page }) => {
  await page.goto('/tools/catalog');
  await page.getByRole('searchbox', { name: 'Find a concept' }).fill('flocking');
  await page.locator(`[data-result-id="${flock}"]`).click();
  await page.getByRole('link', { name: 'Run it in the soldier scene' }).click();
  await expect(page).toHaveURL(new RegExp(`/scene\\?tool=${flock}$`));
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('Flocking');
});

test.describe('with motion on', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Apply starts the run, and a group sent to an objective stops by itself', async ({
    page,
  }) => {
    await arrived(page);
    const box = await marquee(page);
    await tool(page, flock).click();
    await apply(page).click();
    await expect(transport(page, 'pause')).toBeVisible();
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5, { button: 'right' });
    await expect(figure(page, 'timeToObjective')).not.toContainText('unknown', { timeout: 30_000 });
    await expect(transport(page, 'play')).toBeVisible({ timeout: 45_000 });
  });

  test('the slot table fills while a formation sorts itself', async ({ page }) => {
    await arrived(page);
    await marquee(page);
    await tool(page, 'aifg-a:177').click();
    await apply(page).click();
    await expect(page.locator('scene-unit-inspector table caption')).toContainText(
      'in their slots',
    );
    await expect(page.locator('scene-unit-inspector tr.in-place').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test('an unknown path’s page links home to the scene', async ({ page }) => {
  await page.goto('/nowhere');
  await page.getByRole('main').getByRole('link', { name: 'Back to the scene' }).click();
  await expect(page).toHaveURL(/\/scene$/);
});

test('the scene survives a visit to another page', async ({ page }) => {
  await arrived(page);
  await marquee(page);
  await tool(page, flock).click();
  await apply(page).click();
  const menu = page.getByRole('navigation', { name: 'Primary navigation' });
  await menu.getByRole('link', { name: 'Board', exact: true }).click();
  await menu.getByRole('link', { name: 'Scene', exact: true }).click();
  await expect(page.locator('scene-tool-log ol li')).toHaveCount(1);
});

test('the scene meets the board’s serious/critical WCAG threshold', async ({ page }) => {
  await arrived(page);
  await marquee(page);
  await tool(page, flock).click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    ),
  ).toEqual([]);
});

for (const width of [360, 768, 1440]) {
  test(`the scene fits a ${width}px viewport without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await arrived(page);
    await tool(page, flock).click();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
