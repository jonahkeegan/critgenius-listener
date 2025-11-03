import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './tests/integration/visual',
  testMatch: ['**/*.integration.test.ts'],
  outputDir: './test-results/visual',
  workers: 1,
  fullyParallel: false,
  use: {
    ...(baseConfig.use ?? {}),
    baseURL: undefined,
    video: 'off',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'visual-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
  ],
});
