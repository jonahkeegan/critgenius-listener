#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const MODULE_FILE_URL = moduleUrl.href;
const MODULE_FILE_PATH = fileURLToPath(MODULE_FILE_URL);
const MODULE_DIR = dirname(MODULE_FILE_PATH);
const WORKSPACE_ROOT = dirname(dirname(MODULE_DIR));

const IS_WINDOWS = process.platform === 'win32';
const PNPM_EXECUTABLE = IS_WINDOWS ? 'pnpm.cmd' : 'pnpm';

const COVERAGE_TARGETS = getCoverageTargets();
const THEMATIC_ORDER = getCoverageExecutionOrder().filter(
  key => key in COVERAGE_TARGETS
);

let spawnImplementationRef = spawn;

export function setSpawnImplementationForTests(implementation) {
  spawnImplementationRef =
    typeof implementation === 'function' ? implementation : spawn;
}

export function resetSpawnImplementationForTests() {
  spawnImplementationRef = spawn;
}

function resolveSpawnImplementation() {
  return spawnImplementationRef;
}

function runCoverageCommandAsync(targetKey) {
  const target = COVERAGE_TARGETS[targetKey];

  if (!target) {
    throw new Error(`Unsupported coverage target: ${targetKey}`);
  }

  return new Promise(resolve => {
    let child;
    const spawnImplementation = resolveSpawnImplementation();

    try {
      child = spawnImplementation(PNPM_EXECUTABLE, target.command, {
        cwd: WORKSPACE_ROOT,
        shell: IS_WINDOWS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      resolve({
        target: targetKey,
        success: false,
        reason: message,
      });
      return;
    }

    const streamForwarder = chunk => {
      if (typeof chunk === 'string' || chunk instanceof Buffer) {
        return chunk;
      }
      return Buffer.from(String(chunk));
    };

    child.stdout?.on('data', chunk => {
      process.stdout.write(streamForwarder(chunk));
    });

    child.stderr?.on('data', chunk => {
      process.stderr.write(streamForwarder(chunk));
    });

    let resolved = false;
    const resolveOnce = result => {
      if (resolved) {
        return;
      }
      resolved = true;
      resolve(result);
    };

    child.on('error', error => {
      const message =
        error instanceof Error ? error.message : String(error);
      resolveOnce({
        target: targetKey,
        success: false,
        reason: message,
      });
    });

    child.on('close', (code, signal) => {
      if (typeof code === 'number' && code !== 0) {
        resolveOnce({
          target: targetKey,
          success: false,
          exitCode: code,
        });
        return;
      }

      if (signal) {
        resolveOnce({
          target: targetKey,
          success: false,
          reason: `terminated by signal ${signal}`,
        });
        return;
      }

      resolveOnce({
        target: targetKey,
        success: true,
      });
    });
  });
}

function runTargetsInParallel(targets) {
  const invalidTarget = targets.find(target => !COVERAGE_TARGETS[target]);
  if (invalidTarget) {
    throw new Error(`Unsupported coverage target: ${invalidTarget}`);
  }

  const executions = targets.map(target => {
    const targetConfig = COVERAGE_TARGETS[target];
    console.log(`\n[coverage] Running ${targetConfig.description}...`);
    return runCoverageCommandAsync(target);
  });

  return Promise.all(executions);
}

function updateSummary() {
  const summary = generateThematicSummary();
  const table = formatThematicSummary(summary);
  console.log('\n[coverage] Thematic summary');
  console.log(table);
}

async function main() {
  const [, , rawTarget] = process.argv;
  const target = rawTarget ?? 'workspace';

  let results = [];

  if (target === 'thematic') {
    results = await runTargetsInParallel(THEMATIC_ORDER);
    updateSummary();
  } else {
    results = await runTargetsInParallel([target]);
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

const isDirectExecution = (() => {
  try {
    const invokedPath = process.argv?.[1];
    if (!invokedPath) {
      return false;
    }
    return pathToFileURL(invokedPath).href === MODULE_FILE_URL;
  } catch {
    return false;
  }
})();

if (isDirectExecution) {
  try {
    await main();
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
}

export {
  runCoverageCommandAsync,
  runTargetsInParallel,
  updateSummary,
  main,
};
