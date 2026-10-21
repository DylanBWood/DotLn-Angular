import { defineConfig } from '@playwright/test';

import base from './playwright.config.mts';

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: '**/*.visual.spec.ts',
  // Browser rendering differs by OS. Reviewed macOS baselines run in the macOS CI job.
  snapshotPathTemplate: '{testDir}/visual-baselines/{platform}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 } },
  use: { ...base.use, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
});
