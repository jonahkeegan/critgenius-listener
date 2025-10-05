#!/usr/bin/env node
import process from 'node:process';

import {
  BaselineManager,
  detectRegression,
} from '@critgenius/test-utils/performance';

import { runAllBenchmarks } from './metrics-runner.mjs';

function parseArguments(argv) {
  const options = {
    tolerancePercent: 10,
    hardLatencyThresholdMs: 500,
  };

  for (const arg of argv) {
    if (arg.startsWith('--tolerance=')) {
      options.tolerancePercent = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--threshold=')) {
      options.hardLatencyThresholdMs = Number(arg.split('=')[1]);
    }
  }

  return options;
}

function renderRegressionOutput(category, scenario, regression) {
  return [
    `Category: ${category}`,
    `Scenario: ${scenario}`,
    ...regression.breaches.map(breach => `  • ${breach}`),
  ].join('\n');
}

async function main() {
  const cliOptions = parseArguments(process.argv.slice(2));
  const manager = new BaselineManager();
  const baseline = await manager.load();

  console.log('Running performance benchmarks for regression comparison...');
  const benchmarks = await runAllBenchmarks();

  let hasRegression = false;

  for (const [category, scenarios] of Object.entries(benchmarks)) {
    const baselineCategory = baseline.metrics[category];
    if (!baselineCategory) {
      console.warn(
        `Baseline missing category "${category}". Skipping regression comparison for this category.`
      );
      continue;
    }

    for (const [scenario, result] of Object.entries(scenarios)) {
      const baselineScenario = baselineCategory[scenario];
      if (!baselineScenario) {
        console.warn(
          `Baseline missing scenario "${scenario}" in category "${category}". Skipping.`
        );
        continue;
      }

      const regression = detectRegression(result.summary, baselineScenario, {
        tolerancePercent: cliOptions.tolerancePercent,
        hardLatencyThresholdMs: cliOptions.hardLatencyThresholdMs,
        scenarioId: scenario,
      });

      if (regression.regressionDetected) {
        hasRegression = true;
        console.error(renderRegressionOutput(category, scenario, regression));
      } else {
        console.log(
          `✔ ${category}:${scenario} - mean ${result.summary.mean.toFixed(
            2
          )}ms, p95 ${result.summary.p95.toFixed(2)}ms`
        );
      }
    }
  }

  if (hasRegression) {
    console.error('Performance regression detected. See details above.');
    process.exitCode = 1;
    return;
  }

  console.log('No performance regressions detected.');
}

main().catch(error => {
  console.error('Failed to compare performance against baseline:', error);
  process.exitCode = 1;
});
