#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatThematicSummary,
  generateThematicSummary,
} from './thematic-summary.mjs';
import {
  getCoverageExecutionOrder,
  getCoverageTargets,
} from '../../config/coverage.config.mjs';

const moduleUrl = new URL(import.meta.url);
moduleUrl.search = '';
moduleUrl.hash = '';
const MODULE_FILE_PATH = fileURLToPath(moduleUrl.href);
const MODULE_DIR = dirname(MODULE_FILE_PATH);
const WORKSPACE_ROOT = dirname(dirname(MODULE_DIR));

const IS_WINDOWS = process.platform === 'win32';
const PNPM_EXECUTABLE = IS_WINDOWS ? 'pnpm.cmd' : 'pnpm';

const COVERAGE_TARGETS = getCoverageTargets();
const THEMATIC_ORDER = getCoverageExecutionOrder().filter(
  key => key in COVERAGE_TARGETS
);

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
    const targetConfig = COVERAGE_TARGETS[target];
    if (!targetConfig) {
      throw new Error(`Unsupported coverage target: ${target}`);
    }

    console.log(`\n[coverage] Running ${targetConfig.description}...`);
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

  let results = [];

  if (target === 'thematic') {
    results = runTargetsSequentially(THEMATIC_ORDER);
    updateSummary();
  } else {
    results = runTargetsSequentially([target]);
    updateSummary();
  }

  const failures = results.filter(result => !result.success);
  if (failures.length > 0) {
    if (process.env.VITEST) {
      const failureMessages = [];
      for (const failure of failures) {
        if ('reason' in failure && failure.reason) {
          failureMessages.push(
            `[coverage] ${failure.target} failed: ${failure.reason}`
          );
        } else {
          failureMessages.push(
            `[coverage] ${failure.target} failed with exit code ${failure.exitCode}`
          );
        }
      }
      globalThis.__coverageOrchestratorFailures = failureMessages;
    }

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
  const message =
    error instanceof Error ? error.message : String(error);
  if (process.env.VITEST) {
    globalThis.__coverageOrchestratorFailures = [
      `Execution failed: ${message}`,
    ];
  }
  console.error('\n[coverage] Execution failed:', message);
  process.exitCode = 1;
}
