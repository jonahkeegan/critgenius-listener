#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

import { BaselineManager } from '@critgenius/test-utils/performance';

import { runAllBenchmarks } from './metrics-runner.mjs';

const OUTPUT_DIRECTORY = resolve('.performance-baselines');
const JSON_REPORT_PATH = resolve(OUTPUT_DIRECTORY, 'latest-report.json');
const HTML_REPORT_PATH = resolve(OUTPUT_DIRECTORY, 'latest-report.html');

function ensureDirectory(path) {
  return mkdir(path, { recursive: true });
}

function formatSummary(summary) {
  return {
    mean: Number(summary.mean.toFixed(2)),
    p50: Number(summary.median.toFixed(2)),
    p95: Number(summary.p95.toFixed(2)),
    p99: Number(summary.p99.toFixed(2)),
    max: Number(summary.max.toFixed(2)),
    sampleCount: summary.sampleCount,
  };
}

function buildHtmlReport(report) {
  const rows = [];

  for (const [category, scenarios] of Object.entries(report.scenarios)) {
    for (const [scenario, data] of Object.entries(scenarios)) {
      rows.push(`
        <tr>
          <td>${category}</td>
          <td>${scenario}</td>
          <td>${data.baseline.mean} ms</td>
          <td>${data.current.mean} ms</td>
          <td>${data.baseline.p95} ms</td>
          <td>${data.current.p95} ms</td>
          <td>${data.baseline.p99} ms</td>
          <td>${data.current.p99} ms</td>
          <td>${data.delta.mean.toFixed(2)}%</td>
          <td>${data.delta.p95.toFixed(2)}%</td>
          <td>${data.delta.p99.toFixed(2)}%</td>
        </tr>
      `);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CritGenius Performance Report</title>
  <style>
    body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
    th { background-color: #f5f5f5; }
    tr:nth-child(even) { background-color: #fafafa; }
    caption { margin-bottom: 16px; font-weight: 600; font-size: 1.2rem; }
  </style>
</head>
<body>
  <h1>CritGenius Performance Report</h1>
  <p>Generated at ${report.generatedAt}</p>
  <table>
    <caption>Latency Metrics Comparison</caption>
    <thead>
      <tr>
        <th>Category</th>
        <th>Scenario</th>
        <th>Baseline Mean</th>
        <th>Current Mean</th>
        <th>Baseline P95</th>
        <th>Current P95</th>
        <th>Baseline P99</th>
        <th>Current P99</th>
        <th>Δ Mean %</th>
        <th>Δ P95 %</th>
        <th>Δ P99 %</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
    </tbody>
  </table>
</body>
</html>`;
}

function calculatePercentDelta(current, baseline) {
  if (baseline === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - baseline) / baseline) * 100;
}

async function main() {
  const manager = new BaselineManager();
  const baseline = await manager.load();
  const benchmarks = await runAllBenchmarks();

  const report = {
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      os: process.platform,
      arch: process.arch,
    },
    scenarios: {},
  };

  for (const [category, scenarios] of Object.entries(benchmarks)) {
    if (!report.scenarios[category]) {
      report.scenarios[category] = {};
    }

    for (const [scenario, result] of Object.entries(scenarios)) {
      const baselineScenario = baseline.metrics[category]?.[scenario];
      if (!baselineScenario) {
        continue;
      }

      const currentSummary = formatSummary(result.summary);
      const baselineSummary = {
        mean: baselineScenario.mean,
        p50: baselineScenario.p50,
        p95: baselineScenario.p95,
        p99: baselineScenario.p99,
        max: baselineScenario.max,
        sampleCount: baselineScenario.sampleCount,
      };

      report.scenarios[category][scenario] = {
        baseline: baselineSummary,
        current: currentSummary,
        delta: {
          mean: calculatePercentDelta(currentSummary.mean, baselineSummary.mean),
          p95: calculatePercentDelta(currentSummary.p95, baselineSummary.p95),
          p99: calculatePercentDelta(currentSummary.p99, baselineSummary.p99),
        },
      };
    }
  }

  await ensureDirectory(dirname(JSON_REPORT_PATH));
  await writeFile(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(HTML_REPORT_PATH, buildHtmlReport(report), 'utf8');

  console.log('Performance report generated:');
  console.log(`  JSON: ${JSON_REPORT_PATH}`);
  console.log(`  HTML: ${HTML_REPORT_PATH}`);
}

main().catch(error => {
  console.error('Failed to generate performance report:', error);
  process.exitCode = 1;
});
