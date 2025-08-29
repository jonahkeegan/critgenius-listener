# Pre-Commit Benchmark Threshold Configuration

The pre-commit benchmark script (`scripts/precommit-benchmark.mjs`) measures average execution time
for three key quality gates across N iterations:

- ESLint (`pnpm -w lint`)
- Prettier check (`pnpm -w format:check`)
- TypeScript type check (`pnpm -w type-check`)

By default, a non-fatal performance warning is emitted if the average time of any step exceeds
30,000ms (30s). This threshold is now configurable to adapt to hardware differences or evolving team
expectations.

## Why Make It Configurable?

Different contributors and CI agents have varying performance characteristics. A static 30s ceiling
may be too lenient on fast systems (masking regressions) or too strict on constrained runners. A
configurable threshold allows:

- Tightening limits as baseline performance improves
- Relaxing limits on temporary low-powered environments
- Experimentation with progressive lowering (e.g. 30s → 20s → 15s)

## Configuration Precedence

1. CLI flag: `--threshold=<milliseconds>`
2. Environment variable: `PRECOMMIT_WARN_THRESHOLD_MS`
3. Default: `30000`

The first matching value that is a positive integer is used.

## Examples

Run 5 iterations and warn if any step averages over 15 seconds:

```bash
node scripts/precommit-benchmark.mjs 5 --threshold=15000
```

Use an environment variable (helpful in CI):

```bash
PRECOMMIT_WARN_THRESHOLD_MS=20000 node scripts/precommit-benchmark.mjs 4
```

Fallback to default behavior (30s):

```bash
node scripts/precommit-benchmark.mjs 3
```

## Exit Behavior

- Warnings are non-fatal: the script sets `process.exitCode = 0` so it won’t fail a pipeline.
- Treat warnings as prompts to investigate before they become blocking.

## Recommended Progressive Tightening Strategy

| Phase    | Threshold (ms) | Rationale                                       |
| -------- | -------------- | ----------------------------------------------- |
| Baseline | 30000          | Establish current averages; collect data        |
| Phase 1  | 20000          | Encourage early refactors if tools slow         |
| Phase 2  | 15000          | Align with target “fast feedback” budget        |
| Phase 3  | 10000          | Stretch goal once structural optimizations land |

## Interpreting Results

If a single run spikes but avg < threshold: likely transient (warm-up, cache eviction). If avg >
threshold:

1. Re-run with fewer iterations to isolate which step is regressing.
2. Time the command directly (e.g. `time pnpm -w type-check`).
3. Inspect recent dependency upgrades (TS, ESLint, plugin changes).
4. Consider splitting large tsconfig references or enabling incremental build caches.

## When to Fail Instead of Warn

You can convert warnings into failures in CI once the team agrees on a stable target. Modify the
script near the warning section:

```diff
-if (warn) process.exitCode = 0;
+if (warn) process.exit(1);
```

(Keep local usage non-fatal to avoid harming contributor workflow.)

## Extending the Script

Potential future enhancements (defer until needed):

- JSON output mode for historical trend tracking
- Percentile reporting (p95) to catch noisy outliers
- Optional CSV export for dashboards
- Compare against a stored baseline file and emit “regression delta”

## Related Docs

- `docs/pre-commit-workflow.md` – Hook logic & simulation utilities
- `package.json` scripts section – Source commands used in timing

---

Maintained by the CritGenius Listener Infrastructure team.
