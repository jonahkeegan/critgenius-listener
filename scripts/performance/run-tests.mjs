#!/usr/bin/env node
import process from 'node:process';

import { startVitest } from 'vitest/node';

function parseCliArguments(argv) {
  const filters = [];
  let watch = false;

  for (const arg of argv) {
    if (arg === '--watch') {
      watch = true;
    } else {
      filters.push(arg);
    }
  }

  return { filters, watch };
}

async function main() {
  process.env.VITEST_WORKSPACE = 'false';

  const { filters, watch } = parseCliArguments(process.argv.slice(2));

  const vitest = await startVitest('test', filters, {
    config: 'vitest.performance.config.ts',
    watch,
    workspace: null,
  });

  if (!vitest) {
    process.exitCode = 1;
    return;
  }

  if (watch) {
    vitest.closingPromise?.catch(error => {
      console.error('Vitest watch run terminated unexpectedly:', error);
      process.exitCode = 1;
    });
    return;
  }

  try {
    if (vitest.runningPromise) {
      await vitest.runningPromise;
    }
    await vitest.close();
  } catch (error) {
    console.error('Vitest encountered an error while closing:', error);
    process.exitCode = process.exitCode ?? 1;
  }

  const exitCode =
    typeof process.exitCode === 'number' && Number.isFinite(process.exitCode)
      ? process.exitCode
      : 0;

  process.exit(exitCode);
}

main().catch(error => {
  console.error('Failed to execute performance tests:', error);
  process.exitCode = 1;
});
