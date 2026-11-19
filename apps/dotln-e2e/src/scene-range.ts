import type { Page } from '@playwright/test';

const shooters = ['unit-03', 'unit-08', 'unit-13'];

export const standingVolley = {
  at: 0,
  toolId: 'aifg-a:161',
  kind: 'combat.fire',
  selection: shooters,
  params: {
    target: 9,
    'bullet-speed': 36,
    rate: 3,
    range: 100,
    'hit-radius': 0.4,
    'knockout-hits': 0,
  },
};

const singleCue = {
  at: 24,
  kind: 'combat.aim',
  toolId: 'aifg-a:163',
  selection: shooters,
  params: {},
};
export const repeatedCue = { ...singleCue, toolId: 'aifg-a:166', params: { iterations: 4 } };

export function crossing(aim: 'plain' | 'single' | 'repeat', drag: number) {
  const steps = [
    {
      at: 0,
      kind: 'objective.set',
      toolId: 'objective.set',
      selection: [],
      params: { x: 83.8, y: 79 },
    },
    {
      at: 0,
      kind: 'steer.blend',
      toolId: 'aifg-a:112',
      selection: ['unit-09'],
      params: { 'arrive-weight': 1, 'slow-radius': 5, 'target-radius': 0.5, 'time-to-target': 0.2 },
    },
    {
      at: 0,
      kind: 'combat.projectile',
      toolId: 'aifg-a:162',
      selection: shooters,
      params: { 'bullet-speed': 36, drag },
    },
    { ...standingVolley, at: 24 },
  ];
  if (aim === 'plain') return steps;
  return [...steps, aim === 'single' ? singleCue : repeatedCue];
}

/** Exercise the same composition transfer and frame buttons available from the keyboard. */
export async function importScene(page: Page, steps: readonly object[]) {
  const transfer = page.locator('scene-tool-log details.transfer');
  if (!(await transfer.evaluate((node: HTMLDetailsElement) => node.open)))
    await transfer.locator('summary').click();
  await transfer.locator('textarea').fill(
    JSON.stringify({
      schema: 'scene-composition-v0',
      composition: {
        id: 'range',
        title: 'Across the field',
        sceneId: 'the-twenty',
        seed: 20261030,
        steps,
        note: '',
        trials: [],
      },
    }),
  );
  await transfer.getByRole('button', { name: 'Import', exact: true }).click();
  await transfer.locator('summary').click();
}

export async function stepFrames(page: Page, count: number) {
  await page
    .locator('[data-transport="step"] button')
    .evaluate((button: HTMLButtonElement, frames) => {
      for (let i = 0; i < frames; i++) button.click();
    }, count);
}
