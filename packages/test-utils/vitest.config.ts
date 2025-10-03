/// <reference types="vitest" />
import { dirname } from 'node:path';
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
        exclude: ['src/matchers/vitest.d.ts'],
      },
      aliasOverrides: {
        '@critgenius/test-utils': `${packageRoot}/src/index.ts`,
        '@critgenius/test-utils/runtime': `${packageRoot}/src/runtime/index.ts`,
        '@critgenius/test-utils/matchers': `${packageRoot}/src/matchers/index.ts`,
      },
    })
  )
);
