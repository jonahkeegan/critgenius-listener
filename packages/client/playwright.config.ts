import { defineConfig, devices } from '@playwright/test';
import { cpus } from 'node:os';

const getWorkerCount = (): number => {
  if (process.env.CI) {
    return 2;
  }

  const cpuCount = cpus().length;
  const computed = Math.floor(cpuCount / 2);

  if (!Number.isFinite(computed) || computed <= 0) {
    return 1;
  }

  return Math.min(computed, 4);
};

const getShardConfig = (): { current: number; total: number } | null => {
  const shardValue = process.env.SHARD;
  if (!shardValue) {
    return null;
  }

  const [currentStr, totalStr] = shardValue.split('/');
  const current = Number(currentStr);
  const total = Number(totalStr);

  if (!Number.isInteger(current) || !Number.isInteger(total)) {
    throw new Error(
      `Invalid SHARD value "${shardValue}". Expected format "current/total".`
    );
  }

  if (total < 1 || current < 1 || current > total) {
    throw new Error(
      `Invalid SHARD value "${shardValue}". Ensure 1 <= current <= total and total >= 1.`
    );
  }

  return { current, total };
};

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.e2e.test.ts'],
  outputDir: './test-results',
  fullyParallel: true,
  workers: getWorkerCount(),
  retries: process.env.CI ? 2 : 0,
  shard: getShardConfig(),
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  use: {
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    baseURL: 'http://localhost:5173',
  },
  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
    [
      'json',
      {
        outputFile: 'test-results/playwright-results.json',
      },
    ],
    ['list'],
    ...(process.env.CI
      ? ([
          [
            'junit',
            {
              outputFile: 'test-results/junit.xml',
            },
          ],
        ] as const)
      : []),
  ],
  projects: [
    {
      name: 'chromium-desktop',
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
    {
      name: 'chromium-tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          },
        },
      },
    },
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        channel: 'msedge',
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
