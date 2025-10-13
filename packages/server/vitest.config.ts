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
          'server'
        ),
        thresholds: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50,
        },
      },
    })
  )
);
