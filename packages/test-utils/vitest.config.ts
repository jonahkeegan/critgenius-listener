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
        exclude: ['src/matchers/vitest.d.ts'],
        reportsDirectory: testUtilsCoverageDirectory,
        thresholds: testUtilsCoverageThresholds,
      },
      aliasOverrides: {
        '@critgenius/test-utils': `${packageRoot}/src`,
        '@critgenius/test-utils/runtime': `${packageRoot}/src/runtime/index.ts`,
        '@critgenius/test-utils/matchers': `${packageRoot}/src/matchers/index.ts`,
        '@critgenius/test-utils/performance': `${packageRoot}/src/performance/index.ts`,
      },
    })
  )
);
