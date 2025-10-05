# Performance Testing Guide

This guide explains how to run, monitor, and maintain the Listener performance benchmarking system.
The infrastructure extends `@critgenius/test-utils` with benchmark helpers, baseline management, and
regression detection to ensure the end-to-end transcription workflow stays below the 500ms latency
target.

## Overview

The performance suite provides:

- High resolution latency benchmarking helpers (`measureLatency`, `runWorkloadScenario`).
- Baseline management (`BaselineManager`) with JSON persistence under `.performance-baselines/`.
- Regression detection utilities and Vitest matchers (`toBeWithinLatencyThreshold`, `toNotRegress`,
  `toMeetPerformanceTarget`).
- Workload scenarios that model single-stream, burst, and sustained multi-stream usage patterns.
- Dedicated Vitest configuration (`vitest.performance.config.ts`) and npm scripts for running
  benchmarks in isolation.

## Running Performance Tests

```bash
pnpm test:performance
```

- Uses `vitest.performance.config.ts` to target `tests/performance/**/*.perf.test.ts`.
- Extends timeouts to 120s per test to account for repeated measurements.
- Disables coverage for faster feedback.

### Watch Mode

```bash
pnpm test:performance:watch
```

Ideal when iterating on a specific benchmark; Vitest re-runs affected scenarios as code changes.

## Establishing or Refreshing Baselines

Baselines live at `.performance-baselines/baseline.json`. To rebuild it from the current branch:

```bash
pnpm perf:baseline
```

The script runs all workload scenarios, captures latency summaries, and rewrites `baseline.json`
with the new metrics plus environment metadata. Review the console output and commit the updated
file when satisfied.

## Regression Detection Workflow

Use the comparison script in CI or locally before merging performance-sensitive changes:

```bash
pnpm perf:compare
```

- Re-runs all benchmarks and compares results against the saved baseline.
- Fails (`exit 1`) if mean, p95, p99, or max latency degrades beyond the default 10% tolerance or
  exceeds the hard 500ms ceiling.
- Override thresholds as needed:

  ```bash
  pnpm perf:compare -- --tolerance=7.5 --threshold=480
  ```

## Generating Reports

Produce JSON + HTML comparison reports for sharing or historical tracking:

```bash
pnpm perf:report
```

Outputs:

- `.performance-baselines/latest-report.json`
- `.performance-baselines/latest-report.html`

The HTML report includes side-by-side tables of baseline vs current latency metrics with percentage
deltas.

## Workload Scenarios

`@critgenius/test-utils/performance` exposes canned scenarios:

| Scenario ID            | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `singleStream`         | Single participant speaking with minimal jitter.    |
| `multiStreamBurst`     | Three concurrent participants reacting in bursts.   |
| `sustainedMultiStream` | Four participants exchanging dialogue continuously. |

Use `runWorkloadScenario` to execute a scenario against a custom async operation. The helper
coordinates warmups, measurement iterations, jitter simulation, and concurrency.

## Custom Matchers

Importing `@critgenius/test-utils/performance` automatically registers the performance matcher set:

- `toBeWithinLatencyThreshold(threshold)` – asserts mean/p95/p99/max latency for a benchmark result
  or summary.
- `toNotRegress(baseline, options?)` – compares a summary against inline baseline metrics with
  tolerance controls.
- `toNotRegressFromBaseline(baselineFile, category, scenario, options?)` – loads metrics from
  `baseline.json` and asserts no regression.
- `toMeetPerformanceTarget(target)` – generic threshold assertion helper.

## CI/CD Integration Tips

1. Run `pnpm perf:compare` during PR pipelines to block regressions.
2. Publish the HTML report artifact for visibility on merge requests.
3. Rebuild the baseline after intentional performance improvements and commit the updated JSON
   alongside the code changes.
4. Keep the tolerance percent aligned with business SLO expectations (default 10%).

## Troubleshooting

- **Baseline file missing:** Run `pnpm perf:baseline` to generate
  `.performance-baselines/baseline.json`.
- **Script cannot find `expect`:** Ensure scripts run via Vitest or the performance utilities are
  imported inside a Vitest environment.
- **Flaky latency numbers:** Increase measurement iterations or run on a quieter machine. The
  helpers support overriding iteration counts per scenario.

For deeper customisation, extend the workload scenarios or create new ones by exporting additional
definitions from `workload-scenarios.ts`.
