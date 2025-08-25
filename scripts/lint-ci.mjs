#!/usr/bin/env node
import { ESLint } from 'eslint';
import fs from 'node:fs';

async function run() {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles(['packages/*/src/**/*.{ts,tsx,js,jsx}']);
  const formatter = await eslint.loadFormatter('stylish');
  const junitFormatterPath = (() => {
    try { return require.resolve('eslint-formatter-junit'); } catch { return null; }
  })();
  const stylishOutput = formatter.format(results);
  process.stdout.write(stylishOutput);
  fs.mkdirSync('reports', { recursive: true });
  if (junitFormatterPath) {
    const junitFormatter = (await import(junitFormatterPath)).default;
    const junitOutput = junitFormatter(results);
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
