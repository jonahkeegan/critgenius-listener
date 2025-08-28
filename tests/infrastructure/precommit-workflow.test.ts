import { execSync } from 'node:child_process';
import path from 'node:path';
import { describe, test } from 'vitest';

// Integration-style test to assert simulation script expectations hold.

describe('precommit workflow simulation', () => {
  const root = path.join(__dirname, '..', '..');

  test('simulation script enforces expected outcomes', () => {
    // Run full suite; it exits non-zero if expectations mismatch.
    execSync('node scripts/precommit-simulate.mjs', {
      cwd: root,
      stdio: 'inherit',
    });
  });

  test('benchmark script runs (smoke)', () => {
    // Just ensure it executes; not asserting performance numbers.
    execSync('node scripts/precommit-benchmark.mjs 1', {
      cwd: root,
      stdio: 'inherit',
    });
  });
});
