#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatThematicSummary,
  generateThematicSummary,
} from './thematic-summary.mjs';

const MODULE_DIR = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = dirname(dirname(MODULE_DIR));

const IS_WINDOWS = process.platform === 'win32';
const PNPM_EXECUTABLE = IS_WINDOWS ? 'pnpm.cmd' : 'pnpm';

const COVERAGE_TARGETS = {
  workspace: {
    description: 'Workspace aggregate coverage',
    command: ['vitest', 'run', '--coverage'],
  },
  client: {
    description: '@critgenius/client coverage',
    command: [
      'vitest',
      'run',
      '--config',
      'packages/client/vitest.config.ts',
      '--coverage',
    ],
  },
  server: {
    description: '@critgenius/server coverage',
    command: [
      'vitest',
      'run',
      '--config',
      'packages/server/vitest.config.ts',
      '--coverage',
    ],
  },
  shared: {
    description: '@critgenius/shared coverage',
    command: [
      'vitest',
      'run',
      '--config',
      'packages/shared/vitest.config.ts',
      '--coverage',
    ],
  },
  'test-utils': {
    description: '@critgenius/test-utils coverage',
    command: [
      'vitest',
      'run',
      '--config',
      'packages/test-utils/vitest.config.ts',
      '--coverage',
    ],
  },
};

function runCoverageCommand(targetKey) {
  const target = COVERAGE_TARGETS[targetKey];

  if (!target) {
    throw new Error(`Unsupported coverage target: ${targetKey}`);
  }

  const spawnResult = spawnSync(PNPM_EXECUTABLE, target.command, {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
    shell: IS_WINDOWS,
  });

  if (spawnResult.error) {
    return {
      target: targetKey,
      success: false,
      reason: spawnResult.error.message ?? String(spawnResult.error),
    };
  }

  if (typeof spawnResult.status === 'number' && spawnResult.status !== 0) {
    return {
      target: targetKey,
      success: false,
      exitCode: spawnResult.status,
    };
  }

  return {
    target: targetKey,
    success: true,
  };
}

function runTargetsSequentially(targets) {
  const results = [];

  for (const target of targets) {
    console.log(`\n[coverage] Running ${COVERAGE_TARGETS[target].description}...`);
    results.push(runCoverageCommand(target));
  }

  return results;
}

function updateSummary() {
  const summary = generateThematicSummary();
  const table = formatThematicSummary(summary);
  console.log('\n[coverage] Thematic summary');
  console.log(table);
}

function main() {
  const [, , rawTarget] = process.argv;
  const target = rawTarget ?? 'workspace';

  const thematicOrder = ['workspace', 'client', 'server', 'shared', 'test-utils'];

  let results = [];

  if (target === 'thematic') {
    results = runTargetsSequentially(thematicOrder);
    updateSummary();
  } else {
    results = runTargetsSequentially([target]);
    updateSummary();
  }

  const failures = results.filter(result => !result.success);
  if (failures.length > 0) {
    for (const failure of failures) {
      if ('reason' in failure && failure.reason) {
        console.error(
          `[coverage] ${failure.target} failed: ${failure.reason}`
        );
      } else {
        console.error(
          `[coverage] ${failure.target} failed with exit code ${failure.exitCode}`
        );
      }
    }

    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error('\n[coverage] Execution failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
