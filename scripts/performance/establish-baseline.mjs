#!/usr/bin/env node
import process from 'node:process';

import { BaselineManager } from '@critgenius/test-utils/performance';

import { collectBaselineMetrics } from './metrics-runner.mjs';

async function main() {
  const manager = new BaselineManager();

  console.log('Collecting performance metrics for baseline establishment...');
  const metrics = await collectBaselineMetrics();

  const baseline = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      os: process.platform,
      arch: process.arch,
    },
    metrics,
  };

  await manager.save(baseline);

  console.log('Baseline saved to', manager.path);
  for (const [category, scenarios] of Object.entries(metrics)) {
    console.log(`Category: ${category}`);
    for (const [scenario, summary] of Object.entries(scenarios)) {
      console.log(
        `  ${scenario}: mean=${summary.mean.toFixed(2)}ms p95=${summary.p95.toFixed(
          2
        )}ms p99=${summary.p99.toFixed(2)}ms`
      );
    }
  }
}

main().catch(error => {
  console.error('Failed to establish baseline:', error);
  process.exitCode = 1;
});
