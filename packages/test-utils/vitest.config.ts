/// <reference types="vitest" />
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from '../../vitest.shared.config';

import type { CoverageConfigModule } from '../../config/coverage.config.types';

const packageRoot = dirname(fileURLToPath(import.meta.url));

const coverageConfigModule = (await import(
  pathToFileURL(join(packageRoot, '..', '..', 'config', 'coverage.config.mjs'))
    .href
)) as CoverageConfigModule;
const testUtilsTheme = coverageConfigModule.getCoverageTheme('test-utils');

if (!testUtilsTheme) {
  throw new Error('Missing test-utils coverage configuration');
}

const testUtilsCoverageDirectory = testUtilsTheme.reportsDirectory;
const testUtilsCoverageThresholds = { ...testUtilsTheme.thresholds };

export default defineConfig(
  // @ts-expect-error - Duplicate Vite installations in node_modules cause incompatible Plugin types.
  // The config is structurally valid and works at runtime. This is a known pnpm hoisting issue.
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
        exclude: ['tests/**'],
        reportsDirectory: testUtilsCoverageDirectory,
        thresholds: testUtilsCoverageThresholds,
      },
    })
  )
);
