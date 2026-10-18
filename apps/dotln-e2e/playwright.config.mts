import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = 'http://127.0.0.1:4200';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  forbidOnly: true,
  use: { baseURL, trace: 'on-first-retry' },
  webServer: {
    command: 'npx nx serve dotln --host=127.0.0.1 --port=4200',
    url: baseURL,
    reuseExistingServer: false,
    cwd: workspaceRoot,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
