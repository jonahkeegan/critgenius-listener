import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from './vitest.shared.config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

process.env.CRITGENIUS_TEST_USE_FAKE_TIMERS = 'false';

const performanceConfig = assertUsesSharedConfig(
  createVitestConfig({
    packageRoot: workspaceRoot,
    environment: 'node',
    tsconfigPath: `${workspaceRoot}/tsconfig.json`,
    reporters: ['default', 'verbose'],
    testOverrides: {
      include: ['tests/performance/**/*.perf.test.ts'],
      testTimeout: 120_000,
      hookTimeout: 120_000,
      teardownTimeout: 60_000,
      isolate: true,
    },
  })
);

const normalizedPerformanceConfig = performanceConfig as UserConfig;

const existingTestConfig = normalizedPerformanceConfig.test ?? {};

normalizedPerformanceConfig.test = {
  ...existingTestConfig,
  coverage: {
    provider: 'v8',
    enabled: false,
  },
};

export default defineConfig(normalizedPerformanceConfig);
