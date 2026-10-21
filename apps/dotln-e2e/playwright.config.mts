import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4200';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  testIgnore: '**/*.visual.spec.ts',
  forbidOnly: true,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: [
    {
      command: 'npx nx serve-static dotln --host=127.0.0.1 --port=4200 --watch=false',
      url: baseURL,
      reuseExistingServer: false,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
    {
      command: 'npx nx serve-storybook ui',
      url: 'http://127.0.0.1:6006',
      reuseExistingServer: false,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
