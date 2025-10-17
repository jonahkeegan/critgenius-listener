# Coverage System Guide

This guide documents the CritGenius Listener Vitest coverage system, including the shared
configuration, thematic directory layout, orchestration commands, and validation guarantees.

## System Overview

- Coverage provider is pinned to V8 via `@vitest/coverage-v8`.
- Tiered minimum thresholds: workspace/test-utils 30%, client/server 50%, shared 75%.
- Reporters are `text`, `json-summary`, and `html` for every run.
- Shared config enforces consistent exclude patterns (fixtures, mocks, build outputs, config files).
- All Vitest projects opt in via `createVitestConfig()` and `assertUsesSharedConfig()`.
- Thematic reports write to `coverage/<theme>` and an aggregate workspace report sits at
  `coverage/workspace`.

## Thematic Directory Layout

```
coverage/
├── workspace/              # Aggregate workspace report
├── client/                 # @critgenius/client coverage
├── server/                 # @critgenius/server coverage
├── shared/                 # @critgenius/shared coverage
├── test-utils/             # @critgenius/test-utils coverage
└── thematic-summary.json   # Consolidated metrics snapshot
```

Each directory contains `index.html`, `coverage-summary.json`, and provider-specific artefacts.
`thematic-summary.json` captures the latest percentages, coverage status (pass/fail/missing), and
threshold expectations for CI auditing.

## Orchestration Commands

Run from the repository root:

| Command                         | Purpose                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm test:coverage:workspace`  | Workspace aggregate coverage using `vitest.config.ts`.    |
| `pnpm test:coverage:client`     | Theme-only run for `@critgenius/client`.                  |
| `pnpm test:coverage:server`     | Theme-only run for `@critgenius/server`.                  |
| `pnpm test:coverage:shared`     | Theme-only run for `@critgenius/shared`.                  |
| `pnpm test:coverage:test-utils` | Theme-only run for `@critgenius/test-utils`.              |
| `pnpm test:coverage:thematic`   | Sequentially runs all themes plus workspace.              |
| `pnpm test:coverage:summary`    | Regenerates `thematic-summary.json` and prints the table. |

The orchestrator lives at `scripts/coverage/run-coverage.mjs` and always refreshes the thematic
summary after execution.

## Configuration Verification Workflow

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Guard as coverage-validation.test.ts
  participant Shared as vitest.shared.config.ts
  participant Package as Package vitest.config.ts

  Dev->>Guard: vitest run tests/infrastructure/coverage-validation.test.ts
  Guard->>Shared: Import shared defaults + marker key
  Guard->>Package: Dynamically import per-package configs
  Guard->>Shared: Assert coverage provider/reporters/thresholds
  Guard->>Package: Verify reportsDirectory matches coverage/<theme>
  Guard->>Guard: Ensure exclude patterns include shared defaults
  Guard-->>Dev: Pass/Fail with drift diagnostics
```

## Thematic Coverage Orchestration

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Orchestrator as run-coverage.mjs
  participant Vitest as Vitest Runner
  participant Reporter as thematic-summary.mjs

  Dev->>Orchestrator: pnpm test:coverage:thematic
  loop Each theme (workspace, client, server, shared, test-utils)
    Orchestrator->>Vitest: pnpm vitest run --config <theme>
    Vitest-->>Orchestrator: Coverage artefacts in coverage/<theme>
  end
  Orchestrator->>Reporter: generateThematicSummary()
  Reporter-->>Orchestrator: Latest metrics + status table
  Orchestrator-->>Dev: Console table + JSON summary path
```

## Coverage Orchestration Workflows

### Coverage Orchestration Workflow

```mermaid
sequenceDiagram
  participant User
  participant CLI
  participant Runner as run-coverage.mjs
  participant Config as coverage.config.mjs
  participant PNPM
  participant Package
  participant Summary as thematic-summary.mjs
  participant FS as FileSystem

  User->>CLI: pnpm test:coverage:thematic
  CLI->>Runner: Execute target="thematic"
  Runner->>Config: getCoverageExecutionOrder()
  Config-->>Runner: ordered themes
  Runner->>Config: getCoverageTargets()
  Config-->>Runner: command metadata

  loop For each theme
    Runner->>Runner: Log start message
    Runner->>PNPM: spawnSync(command)
    PNPM->>Package: vitest run --coverage
    Package->>FS: Write coverage/<theme>/coverage-summary.json
    PNPM-->>Runner: exit status + error (if any)
    Runner->>Runner: Append success/failure result
  end

  Runner->>Summary: generateThematicSummary()
  Summary->>FS: Read coverage/<theme>/coverage-summary.json
  Summary-->>Runner: Aggregate metrics + statuses
  Runner->>Summary: formatThematicSummary()
  Summary-->>Runner: ASCII table
  Runner->>CLI: Print thematic summary

  alt Any failures recorded
    Runner->>CLI: Print failure diagnostics
    Runner->>Runner: process.exitCode = 1
  else All targets succeeded
    Runner->>Runner: process.exitCode = 0
  end
```

### Thematic Execution Flow

```mermaid
sequenceDiagram
  participant Runner as run-coverage.mjs
  participant Workspace as workspace theme
  participant Client as client theme
  participant Server as server theme
  participant Shared as shared theme
  participant TestUtils as test-utils theme
  participant Results as Result Collector

  Runner->>Results: Initialize []
  Runner->>Workspace: Execute coverage command
  Workspace-->>Runner: { status: 0 }
  Runner->>Results: Append success

  Runner->>Client: Execute coverage command
  Client-->>Runner: { status: 0 }
  Runner->>Results: Append success

  Runner->>Server: Execute coverage command
  Server-->>Runner: { status: 1 }
  Runner->>Results: Append failure (continue)

  Runner->>Shared: Execute coverage command
  Shared-->>Runner: { status: 0 }
  Runner->>Results: Append success

  Runner->>TestUtils: Execute coverage command
  TestUtils-->>Runner: { status: 0 }
  Runner->>Results: Append success

  Results-->>Runner: Summarised failures
  Runner->>Runner: process.exitCode = failures ? 1 : 0
```

### Failure Handling & Recovery

```mermaid
sequenceDiagram
  participant Runner as run-coverage.mjs
  participant PNPM
  participant Package
  participant Errors as ErrorReporter
  participant Logger

  Runner->>PNPM: spawnSync(command)
  PNPM->>Package: Execute vitest --coverage
  Package->>Package: Encounter failure

  alt spawn error
    PNPM-->>Runner: { error }
    Runner->>Errors: normalize spawn error
    Errors-->>Runner: { success: false, reason }
  else non-zero status
    PNPM-->>Runner: { status: 1 }
    Runner->>Errors: normalize exit code
    Errors-->>Runner: { success: false, exitCode: 1 }
  else success
    PNPM-->>Runner: { status: 0 }
    Runner-->>Runner: { success: true }
  end

  Runner->>Runner: Collect result
  Runner->>Runner: Continue loop

  alt Failures collected
    Runner->>Logger: console.error("[coverage] <target> failed ...")
    Runner->>Runner: process.exitCode = 1
  else All succeeded
    Runner->>Runner: process.exitCode = 0
  end
```

### Aggregate Report Generation

```mermaid
sequenceDiagram
  participant Summary as thematic-summary.mjs
  participant Config as coverage.config.mjs
  participant FS as FileSystem
  participant Evaluator
  participant Output

  Summary->>Config: coverageThemes[] metadata
  Config-->>Summary: thresholds + paths
  Summary->>FS: ensure coverage directory

  loop theme in coverageThemes
    Summary->>FS: Read coverage-summary.json
    alt file present
      FS-->>Summary: JSON payload
      Summary->>Evaluator: Extract metrics
      Evaluator-->>Summary: status + coverage object
    else ENOENT / parse error
      FS-->>Summary: error
      Summary->>Evaluator: Handle missing/corrupt file
      Evaluator-->>Summary: status = missing/error
    end
    Summary->>Output: Append theme snapshot
  end

  Summary->>Output: Assemble payload (thresholds, themes)
  Output->>FS: Write coverage/thematic-summary.json
  Summary->>Output: formatThematicSummary(payload)
  Output-->>Summary: Printable ASCII table
```

## Validation Test Assertions

```mermaid
sequenceDiagram
  participant Test as coverage-validation.test.ts
  participant Config as Loaded Config

  Test->>Config: Inspect test.coverage
  Config-->>Test: provider = v8
  Config-->>Test: reporters include text/json-summary/html
  Config-->>Test: thresholds align with theme tier
  Config-->>Test: exclude contains shared patterns
  Config-->>Test: reportsDirectory == coverage/<theme>
  Test-->>Test: Fail fast on drift (missing reporter, wrong path, etc.)
```

### Validation Toolkit

- `tests/infrastructure/coverage-orchestration.test.ts` simulates sequential execution, spawn
  failures, and thematic summary regeneration to guarantee orchestrator resilience.
- `scripts/validate-coverage-orchestration.mjs` performs CLI validation of package.json scripts,
  documentation diagrams, coverage configuration targets, and (optionally) runs the infrastructure
  test for end-to-end assurance.

## CI/CD Enforcement Strategy

- Coverage runs inside dedicated CI workflows (pre-merge) instead of pre-commit hooks.
- Fast local commits are preserved; developers opt in to coverage runs when appropriate.
- Required status checks gate merges, using `thematic-summary.json` plus HTML artefacts for review.
- Summary table exposes missing reports (e.g., skipped package) and threshold regressions.

## Interpreting Results

1. Run `pnpm test:coverage:thematic` or a targeted command.
2. Open `coverage/<theme>/index.html` for visual drill-down.
3. Review terminal table or `coverage/thematic-summary.json` for quick comparisons.
4. Investigate failing themes—CI will block merges until thresholds recover.

## Troubleshooting

| Symptom                                     | Resolution                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `provider` missing in summary               | Ensure package config imports `createVitestConfig()` (validation test will fail). |
| Coverage written to package-local directory | Update `coverageOverrides.reportsDirectory` for that package.                     |
| Missing HTML report                         | Verify reporters include `html`; run validation test for drift.                   |
| Summary shows `missing`                     | Theme coverage was not run; rerun specific command or full thematic suite.        |
| Threshold regression                        | Expand tests in the failing theme, then rerun coverage and regenerate summary.    |

## Related Artifacts

- Shared configuration: `vitest.shared.config.ts`
- Orchestration scripts: `scripts/coverage/run-coverage.mjs`, `scripts/coverage/print-summary.mjs`
- Thematic summary generator: `scripts/coverage/thematic-summary.mjs`
- Validation test: `tests/infrastructure/coverage-validation.test.ts`
- Threshold tiers: `tests/infrastructure/coverage-thresholds.test.ts`
- CI integration: add coverage job referencing `pnpm test:coverage:thematic`

## See Also

- `docs/coverage-workflow-guide.md` for day-to-day commands and practitioner workflows
- `docs/coverage-troubleshooting.md` for scenario-based diagnostics
- `docs/developer-onboarding.md` for onboarding checklist updates that cover coverage gates
