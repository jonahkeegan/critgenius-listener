import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from './vitest.shared.config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: workspaceRoot,
      environment: 'node',
      setupFiles: ['tests/setup/common-vitest-hooks.ts'],
      tsconfigPath: `${workspaceRoot}/tsconfig.json`,
    })
  )
);
