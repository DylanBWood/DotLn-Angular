import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { crossing, importScene, repeatedCue, standingVolley, stepFrames } from './scene-range';

const flock = 'aifg-a:145';
const arrive = 'aifg-a:112';
const aStar = 'aifg-a:222';
const wander = 'aifg-a:125';
const collisionAvoidance = 'aifg-a:134';

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

// Where a point of the 120 by 80 field is on the page, measured afresh as the page may have moved.
async function fieldPoint(page: Page, x: number, y: number) {
  const canvas = page.locator('scene-canvas canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('The field has no box.');
  const scale = Math.min(box.width / 120, box.height / 80);
  return {
    x: box.x + (box.width - 120 * scale) / 2 + x * scale,
    y: box.y + (box.height - 80 * scale) / 2 + y * scale,
  };
}

// Choosing the chosen field tool again puts it down, so a tool already chosen is left as it is.
async function fieldTool(page: Page, name: 'select' | 'wall' | 'obstacle') {
  const button = page.locator(`[data-field-tool="${name}"]`);
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

async function dragOnField(page: Page, from: [number, number], to: [number, number]) {
  const start = await fieldPoint(page, ...from);
  const end = await fieldPoint(page, ...to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
}

async function drawWall(page: Page, from: [number, number], to: [number, number]) {
  await fieldTool(page, 'wall');
  await dragOnField(page, from, to);
}

async function clickField(page: Page, x: number, y: number, options = {}) {
  const point = await fieldPoint(page, x, y);
  await page.mouse.click(point.x, point.y, options);
}

const shapes = (page: Page) => page.locator('scene-geometry-list li');

// The order's field: a wall standing down from the top edge at x = 70 with a gap at its foot, two
// obstacles by the gap, the units west of it given A* and the objective beyond it.
async function routeRoundTheWall(page: Page) {
  await drawWall(page, [70, 0.5], [70, 64]);
  await fieldTool(page, 'obstacle');
  await clickField(page, 62, 74);
  await clickField(page, 82, 72);
  await expect(shapes(page)).toHaveCount(3);
  await fieldTool(page, 'select');
  await dragOnField(page, [2, 2], [68, 68]);
  await expect.poll(() => selected(page).count()).toBeGreaterThanOrEqual(8);
  await tool(page, aStar).click();
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('A*');
  await clickField(page, 100, 40);
  await expect(page.locator('scene-unit-list legend')).toContainText('Objective: east');
  await apply(page).click();
  await expect(page.locator('[data-routes]')).toContainText('With a route');
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
    'A*',
    "Dijkstra's algorithm",
    'Path following',
    'Obstacle and wall avoidance',
    'Collision avoidance',
    'Aiming and shooting',
    'Projectile trajectory',
    'The firing solution',
    'Iterative targeting',
    'Moving targets',
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
  await row.evaluate((input: HTMLInputElement) => {
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

test('a wall drawn on the field sends a squad given A* round it to the objective', async ({
  page,
}) => {
  await arrived(page);
  await routeRoundTheWall(page);
  await expect(figure(page, 'pathLength')).toHaveText(/^\d+\.\d$/);
  await transport(page, 'play').click();
  await expect(figure(page, 'timeToObjective')).toHaveText(/^\d+\.\d$/, { timeout: 45_000 });
  await expect(page.locator('scene-unit-list li', { hasText: 'arrived' }).first()).toBeVisible();
});

test('a second wall across the way makes the squad plan again, a sealed gap leaves it no route, and clearing frees it', async ({
  page,
}) => {
  await arrived(page);
  await routeRoundTheWall(page);
  for (let step = 0; step < 3; step += 1) await transport(page, 'step').click();
  await drawWall(page, [76, 58], [92, 44]);
  await expect(figure(page, 'replans')).not.toHaveText('0');
  await expect(page.locator('scene-unit-list li', { hasText: 'replanning' }).first()).toBeVisible();
  await drawWall(page, [70, 60], [70, 79.5]);
  await expect(page.locator('[data-no-route="no-path"]')).toContainText('No route (');
  await expect(page.locator('scene-unit-list li', { hasText: 'no route' }).first()).toBeVisible();
  await expect(figure(page, 'blockedUnits')).not.toHaveText('0');
  await page.locator('[data-field-clear]').click();
  await expect(shapes(page)).toHaveCount(0);
  await expect(page.locator('[data-no-route]')).toHaveCount(0);
  await expect(figure(page, 'blockedUnits')).toHaveText('0');
  // Clearing plans every route again, so each row reads replanning until the run moves on.
  await expect(page.locator('scene-unit-list li', { hasText: 'replanning' }).first()).toBeVisible();
  await expect(page.locator('scene-unit-list li', { hasText: 'no route' })).toHaveCount(0);
});

test('a unit given Wander and then A* stays still once a wall seals it off, as its notice says', async ({
  page,
}) => {
  await arrived(page);
  await page.locator('[data-unit-id="unit-01"] input').click();
  await tool(page, wander).click();
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('Wander');
  await apply(page).click();
  await drawWall(page, [60, 0.5], [60, 79.5]);
  await fieldTool(page, 'select');
  await tool(page, aStar).click();
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('A*');
  await clickField(page, 100, 40);
  await expect(page.locator('scene-unit-list legend')).toContainText('Objective: east');
  await apply(page).click();
  await expect(page.locator('[data-no-route="no-path"]')).toContainText('No route (1)');
  for (let step = 0; step < 20; step += 1) await transport(page, 'step').click();
  // The notice says the unit stops where it stands; its row has to agree, twenty frames on.
  await expect(page.locator('[data-unit-id="unit-01"]')).toContainText(
    'still · blocked · no route',
  );
});

test('a wall is edited from the keyboard by its numbers, and removed', async ({ page }) => {
  await arrived(page);
  await page.locator('[data-add="wall"]').click();
  await expect(shapes(page)).toHaveCount(1);
  const toY = shapes(page).locator('[data-value="y2"]');
  await toY.fill('70');
  await toY.press('Enter');
  await expect(page.locator('scene-tool-log ol li').first()).toContainText('Wall drawn');
  await expect(toY).toHaveValue('70');
  await shapes(page).locator('[data-remove]').click();
  await expect(shapes(page)).toHaveCount(0);
});

test('a saved composition keeps its walls through a reload and replays them', async ({ page }) => {
  await arrived(page);
  await drawWall(page, [60, 10], [60, 70]);
  await fieldTool(page, 'select');
  await dragOnField(page, [2, 2], [50, 60]);
  await tool(page, aStar).click();
  await apply(page).click();
  await transport(page, 'save').click();
  await expect(page.locator('[data-composition-id]')).toHaveCount(1);
  await page.reload();
  await expect(tool(page, flock)).toBeVisible();
  await page.locator('[data-composition-id] button').first().click();
  await transport(page, 'step').click();
  await expect(shapes(page)).toHaveCount(1);
  await expect(shapes(page).locator('[data-value="x1"]')).toHaveValue('60');
});

test('two units sent head on with collision avoidance part, and part alike on a replay', async ({
  page,
}) => {
  await arrived(page);
  await page.locator('[data-unit-id="unit-02"] input').click();
  await page.locator('[data-unit-id="unit-04"] input').click();
  await tool(page, collisionAvoidance).click();
  await expect(page.locator('scene-unit-inspector h2')).toHaveText('Collision avoidance');
  await apply(page).click();
  await clickField(page, 61.05, 16.65, { button: 'right' });
  await transport(page, 'play').click();
  const time = figure(page, 'timeToObjective');
  await expect(time).toHaveText(/^\d+\.\d$/, { timeout: 30_000 });
  await expect(figure(page, 'collisions')).toHaveText('0');
  const first = await time.textContent();
  await transport(page, 'restart').click();
  await transport(page, 'play').click();
  await expect(time).toHaveText(first ?? '', { timeout: 30_000 });
  await expect(figure(page, 'collisions')).toHaveText('0');
});

test('the scene with walls and a route meets the serious/critical WCAG threshold', async ({
  page,
}) => {
  await arrived(page);
  await routeRoundTheWall(page);
  await page.locator('[data-show-search]').check();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    ),
  ).toEqual([]);
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

test('three selected units fire at a clicked glyph and replay their saved composition', async ({
  page,
}) => {
  await arrived(page);
  for (const id of standingVolley.selection) {
    const box = page.locator(`[data-unit-id="${id}"] input`);
    await box.click();
    await expect(box).toBeChecked();
  }
  await tool(page, standingVolley.toolId).click();
  await clickField(page, 83.8, 35.6);
  await expect(selected(page)).toHaveCount(3);
  await expect(page.getByRole('combobox', { name: 'Fire at' })).toHaveValue('9');
  await expect(page.locator('[data-shot-preview]')).toContainText('Current pose');
  await stepFrames(page, 100);
  const target = page.locator('[data-unit-id="unit-09"]');
  await expect(target).toContainText(/Hits taken [1-9]/);
  const result = await target.innerText();
  const hits = await figure(page, 'hits').innerText();
  const shots = await figure(page, 'shots').innerText();
  expect(Number(shots)).toBeGreaterThanOrEqual(Number(hits));
  expect(Number(hits)).toBeGreaterThan(0);
  await transport(page, 'save').click();
  await page.reload();
  await page.locator('[data-composition-id] button').first().click();
  await stepFrames(page, 100);
  await expect(target).toHaveText(result.replace(/\s+/g, ' ').trim(), { useInnerText: true });
  await expect(figure(page, 'hits')).toHaveText(hits);
});

test('a crossing piece shows the four aim outcomes and the two delayed aims diverge in a kept trial', async ({
  page,
}) => {
  await arrived(page);
  const marked = page.locator('[data-unit-id="unit-09"]');
  for (const [aim, drag, hits] of [
    ['plain', 0, 0],
    ['single', 0, 1],
    ['single', 0.3, 0],
    ['repeat', 0.3, 1],
  ] as const) {
    await importScene(page, crossing(aim, drag));
    await stepFrames(page, 145);
    await expect(marked.locator('.hit-count')).toHaveCount(hits);
  }
  const single = crossing('single', 0.3);
  await importScene(page, [...single, repeatedCue]);
  await transport(page, 'compare').click();
  await expect(page.locator('[data-divergence]')).toContainText('frame 25');
  const accuracy = page.locator('[data-series="accuracy"]');
  await expect(accuracy.locator('polyline.before')).toHaveAttribute('points', /\d/);
  await expect(accuracy.locator('polyline.after')).toHaveAttribute('points', /\d/);
  await expect(accuracy.locator('.summary')).toHaveText('72% → 90%');
  await page.locator('[data-trial="keep"] button').click();
  await expect(page.locator('scene-tool-log')).toContainText('Trials kept: 1');
});

test('a drawn wall catches the volley and three hits retire a piece on each replay', async ({
  page,
}) => {
  await arrived(page);
  await importScene(page, [standingVolley]);
  await drawWall(page, [72, 10], [72, 66]);
  await stepFrames(page, 105);
  await expect(figure(page, 'hits')).toHaveText('0');
  await expect(page.locator('[data-shot-counts]')).toContainText(/Wall and obstacle marks [1-9]/);
  await expect(page.locator('[data-unit-id="unit-09"] .hit-count')).toHaveCount(0);
  await importScene(page, [
    {
      ...standingVolley,
      selection: ['unit-08'],
      params: { ...standingVolley.params, 'bullet-speed': 72, 'knockout-hits': 3, rate: 2 },
    },
  ]);
  for (let replay = 0; replay < 2; replay++) {
    await transport(page, 'restart').click();
    await stepFrames(page, 57);
    const row = page.locator('[data-unit-id="unit-09"]');
    await expect(row).toContainText('Hits taken 2');
    await expect(row).not.toContainText('down');
    await stepFrames(page, 50);
    await expect(row).toContainText('still · down');
    await expect(row).toContainText('Hits taken 3');
    await expect(figure(page, 'downUnits')).toHaveText('1');
  }
});

test('the shooting inspector and text layer meet the board’s serious/critical WCAG threshold', async ({
  page,
}) => {
  await arrived(page);
  await page.locator('[data-unit-id="unit-08"] input').click();
  await tool(page, standingVolley.toolId).click();
  await page.getByRole('combobox', { name: 'Fire at' }).selectOption('9');
  await apply(page).click();
  await stepFrames(page, 100);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
  ).toEqual([]);
});

for (const [width, height] of [
  [360, 900],
  [768, 900],
  [1440, 900],
  [2080, 1460],
  [3840, 1620],
]) {
  test(`the scene fits a ${width}px viewport without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await arrived(page);
    await page.locator('[data-add="wall"]').click();
    await tool(page, aStar).click();
    await expect(page.locator('[data-routes]')).toBeVisible();
    await tool(page, standingVolley.toolId).click();
    await expect(page.getByRole('combobox', { name: 'Fire at' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
