import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
  defaultVitestExcludePatterns,
  defaultVitestIncludePatterns,
} from './vitest.shared.config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

const rootTestIncludePatterns = defaultVitestIncludePatterns.filter(pattern =>
  pattern.startsWith('tests/')
);

const rootTestExcludePatterns = Array.from(
  new Set([...defaultVitestExcludePatterns, 'packages/**'])
);

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: workspaceRoot,
      environment: 'node',
      setupFiles: ['tests/setup/common-vitest-hooks.ts'],
      tsconfigPath: `${workspaceRoot}/tsconfig.json`,
      testOverrides: {
        include: rootTestIncludePatterns,
        exclude: rootTestExcludePatterns,
      },
    })
  )
);
