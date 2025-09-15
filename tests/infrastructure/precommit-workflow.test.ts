import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, test } from 'vitest';

// Integration-style test to assert simulation script expectations hold.

describe('precommit workflow simulation', () => {
  const root = path.join(__dirname, '..', '..');

  test('simulation script enforces expected outcomes', async () => {
    process.env.CG_PRECOMMIT_SIM_SILENT = '1';
    await new Promise<void>((resolve, reject) => {
      const child = spawn('node', ['scripts/precommit-simulate.mjs'], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env },
      });
      child.on('exit', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`simulation script exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  }, 120000); // allow up to 120s due to full lint + type cycles per scenario

  test('benchmark script runs (smoke)', async () => {
    process.env.CG_PRECOMMIT_SIM_SILENT = '1';
    await new Promise<void>((resolve, reject) => {
      const child = spawn('node', ['scripts/precommit-benchmark.mjs', '1'], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env },
      });
      child.on('exit', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`benchmark script exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  }, 60000);
});
