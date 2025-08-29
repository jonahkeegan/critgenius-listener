#!/usr/bin/env node
// Lint CI script (ESM) – produces stylish output to stdout and JUnit XML (if dependency installed)
// Avoids CommonJS require.resolve; uses dynamic import with graceful fallback to keep optional dep truly optional.
import { ESLint } from 'eslint';
import fs from 'node:fs';

async function run() {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles(['packages/*/src/**/*.{ts,tsx,js,jsx}']);

  // Primary human-readable formatter
  const stylish = await eslint.loadFormatter('stylish');
  const stylishOutput = stylish.format(results);
  process.stdout.write(stylishOutput);

  // Optional JUnit formatter (only if dependency present)
  let junitFormatterFn = null;
  try {
    const mod = await import('eslint-formatter-junit').catch(() => null);
    if (mod && typeof mod.default === 'function') junitFormatterFn = mod.default;
  } catch { /* ignore */ }

  if (junitFormatterFn) {
    fs.mkdirSync('reports', { recursive: true });
    const junitOutput = junitFormatterFn(results);
    fs.writeFileSync('reports/eslint-junit.xml', junitOutput, 'utf8');
  }

  const errorCount = results.reduce((a, r) => a + r.errorCount, 0);
  const warningCount = results.reduce((a, r) => a + r.warningCount, 0);
  if (errorCount > 0 || warningCount > 0) {
    console.error(`ESLint failed with ${errorCount} errors and ${warningCount} warnings.`);
    process.exit(1);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
