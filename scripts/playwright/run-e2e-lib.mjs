import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { printReportHint } from './report-hint-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..');

function runSpawn(spawnFn, command, args) {
  return spawnFn(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
}

export async function runPlaywrightSuite({
  spawn = spawnSync,
  reportHint = printReportHint,
  logger = console,
} = {}) {
  const result = runSpawn(spawn, 'pnpm', [
    '--filter',
    '@critgenius/client',
    'test:browser',
  ]);

  try {
    await reportHint();
  } catch (error) {
    if (logger && typeof logger.error === 'function') {
      logger.error('Failed to display Playwright report hint', error);
    }
  }

  if (typeof result.status === 'number') {
    return result.status;
  }

  if (result.error && logger && typeof logger.error === 'function') {
    logger.error('Playwright client tests failed to run', result.error);
  }

  return 1;
}
