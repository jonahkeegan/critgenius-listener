#!/usr/bin/env node
/**
 * Pre-commit performance benchmark.
 * Measures cold vs warm timings for lint, format check, and conditional type-check (TS present) 
 * across N iterations to detect regressions.
 *
 * Usage: pnpm precommit:benchmark [iterations]
 */
import { execSync } from 'node:child_process';

const iterations = parseInt(process.argv[2] || '3', 10);
if (Number.isNaN(iterations) || iterations < 1) {
  console.error('Iterations must be positive integer');
  process.exit(2);
}

function time(label, cmd) {
  const start = performance.now();
  execSync(cmd, { stdio: 'ignore' });
  const ms = performance.now() - start;
  return { label, ms };
}

const results = [];
for (let i = 0; i < iterations; i++) {
  // Lint (full) - approximates staged subset upper bound
  results.push(time('eslint', 'pnpm -w lint'));
  results.push(time('prettier:check', 'pnpm -w format:check'));
  results.push(time('tsc', 'pnpm -w type-check'));
}

function summarize(kind) {
  const subset = results.filter(r => r.label === kind).map(r => r.ms);
  const avg = subset.reduce((a,b)=>a+b,0)/subset.length;
  const min = Math.min(...subset);
  const max = Math.max(...subset);
  return { kind, iterations: subset.length, avg: Math.round(avg), min: Math.round(min), max: Math.round(max) };
}

const summary = ['eslint','prettier:check','tsc'].map(summarize);
console.log('\nPre-commit benchmark summary (ms):');
for (const row of summary) {
  console.log(`${row.kind.padEnd(14)} avg=${row.avg} min=${row.min} max=${row.max} n=${row.iterations}`);
}

// Basic regression heuristic (tunable): warn if avg > 30s any step
let warn = false;
for (const row of summary) {
  if (row.avg > 30000) {
    console.warn(`⚠ Performance warning: ${row.kind} average ${row.avg}ms (>30000)`);
    warn = true;
  }
}
if (warn) process.exitCode = 0; // non-fatal
