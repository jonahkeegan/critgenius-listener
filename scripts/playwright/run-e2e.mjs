import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function runCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.error) {
    console.error(`Failed to run ${label}:`, result.error);
  }

  if (typeof result.status !== 'number' && result.signal) {
    console.error(`${label} terminated by signal: ${result.signal}`);
  }

  return result;
}

const testResult = runCommand(
  'pnpm',
  ['--filter', '@critgenius/client', 'test:browser'],
  'Playwright client tests'
);

runCommand(
  'node',
  ['scripts/playwright/report-hint.mjs'],
  'Playwright report helper'
);

const exitCode = typeof testResult.status === 'number' ? testResult.status : 1;

process.exit(exitCode);
