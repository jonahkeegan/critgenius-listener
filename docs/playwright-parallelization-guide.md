# Playwright Parallelization & Worker Optimization Guide

**Last Updated:** 2025-10-31

---

## Overview

This guide documents how CritGenius Listener parallelizes Playwright end-to-end tests across local
development and CI environments. The goal is to shrink feedback time without sacrificing
reliability.

## Configuration

### Worker Allocation Strategy

- **Local development:** Uses half of the available CPU cores (rounded down) with a ceiling of 4
  workers.
- **CI environment:** Runs each browser project with 2 workers for predictable resource usage.
- **Fallback:** Enforces at least one worker when CPU detection fails.

### Sharding Support

- The `SHARD` environment variable accepts values in the form `current/total` (for example `1/2`).
- Invalid shard declarations abort the run to avoid silently skipping tests.
- CI keeps sharding disabled by default; enable it only after the suite grows beyond roughly 20
  Playwright specs.

### Retry Behavior

- **CI:** Retries each failed test up to 2 times to combat transient flakiness.
- **Local:** Retries are disabled to surface legitimate failures quickly.

## Usage

### Local Parallel Execution

```bash
pnpm --filter @critgenius/client test:browser
```

### Sharded Execution (Large Suites)

```bash
SHARD=1/2 pnpm --filter @critgenius/client test:browser:shard
SHARD=2/2 pnpm --filter @critgenius/client test:browser:shard
```

### Browser-Specific Execution

```bash
pnpm --filter @critgenius/client test:browser:chromium
pnpm --filter @critgenius/client test:browser:firefox
pnpm --filter @critgenius/client test:browser:edge
pnpm --filter @critgenius/client test:browser:webkit
```

### CI Matrix Behavior

- Each browser project runs in a dedicated GitHub Actions job.
- Jobs reuse the same dependency build step to avoid redundant compilation.
- Artifacts include JSON, HTML, and failure assets for each browser run.

## Performance Expectations

- **Local:** Expect a 2x-4x speed-up depending on core count and throttling.
- **CI:** Browser runs execute concurrently, so total runtime is roughly the slowest individual
  browser.
- Monitor GitHub Actions duration after merging to validate the improvement window.

## Troubleshooting

- **Random failures after enabling parallelization:** Audit tests for shared state or reliance on
  global fixtures. Drop the worker count temporarily with `playwright test --workers=1` while
  debugging.
- **High resource usage:** Set `SHARD=1/2` and `SHARD=2/2` runs when suites climb past 20 specs to
  keep jobs under resource limits.
- **Invalid shard errors:** Confirm the `SHARD` value uses integers and satisfies
  `1 <= current <= total`.

## Future Enhancements

- Consider dynamic shard matrices in CI when the suite exceeds 20 specs.
- Pipe Playwright timings into the coverage reporting channel once available for trend monitoring.
- Evaluate per-project worker overrides if specific browsers become bottlenecks.
