#!/usr/bin/env node
/**
 * Pre-commit workflow validation helper.
 * Runs the same sequence as the hook (lint-staged equivalent on full set, then type-check)
 * so contributors can benchmark & debug without staging / committing.
 */

import { execSync } from 'node:child_process';

const run = (cmd, label) => {
  process.stdout.write(`▶ ${label}...`);
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit' });
    const ms = Date.now() - start;
    console.log(`✅ (${(ms / 1000).toFixed(2)}s)`);
  } catch (err) {
    console.error(`❌ Failed: ${label}`);
    process.exit(1);
  }
};

console.log('🧪 Pre-commit pipeline validation (full project scope)');
run('pnpm -w lint', 'ESLint (all)');
run('pnpm -w format:check', 'Prettier check (all)');
run('pnpm -w type-check', 'TypeScript type-check');
console.log('🎉 Validation complete – matches hook logic (except staged file narrowing).');
