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
const serverTheme = coverageConfigModule.getCoverageTheme('server');

if (!serverTheme) {
  throw new Error('Missing server coverage configuration');
}

const serverCoverageDirectory = serverTheme.reportsDirectory;
const serverCoverageThresholds = { ...serverTheme.thresholds };

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
        reportsDirectory: serverCoverageDirectory,
        thresholds: serverCoverageThresholds,
      },
    })
  )
);
