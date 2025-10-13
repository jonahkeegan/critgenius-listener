/// <reference types="vitest" />
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from '../../vitest.shared.config';

const packageRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot,
      environment: 'node',
      setupFiles: [
        '../../tests/setup/common-vitest-hooks.ts',
        './src/test-setup.ts',
      ],
      tsconfigPath: `${packageRoot}/tsconfig.json`,
      coverageOverrides: {
        exclude: ['scripts/**'],
        reportsDirectory: resolve(
          packageRoot,
          '..',
          '..',
          'coverage',
          'shared'
        ),
        thresholds: {
          statements: 75,
          branches: 75,
          functions: 75,
          lines: 75,
        },
      },
    })
  )
);
