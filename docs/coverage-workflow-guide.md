# Coverage Workflow Guide

**Version:** 1.0.0  
**Last Updated:** 2025-10-17  
**Audience:** CritGenius Listener developers building and validating code coverage  
**Status:** Draft (developer preview)

> This guide connects the shared coverage architecture to daily developer workflows. Pair it with
> `docs/coverage-system-guide.md` for deep configuration details and
> `docs/coverage-troubleshooting.md` when issues arise.

---

## Table of Contents

1. [Purpose & Goals](#1-purpose--goals)
2. [Five-Minute Quick Start](#2-five-minute-quick-start)
3. [Daily Development Workflow](#3-daily-development-workflow)
4. [Investigating Coverage Gaps](#4-investigating-coverage-gaps)
5. [Meeting Threshold Requirements](#5-meeting-threshold-requirements)
6. [Pre-commit Coverage Safeguards](#6-pre-commit-coverage-safeguards)
7. [Thematic vs Workspace Coverage](#7-thematic-vs-workspace-coverage)
8. [HTML Report Navigation](#8-html-report-navigation)
9. [Practical Examples](#9-practical-examples)
10. [Common Scenarios & Solutions](#10-common-scenarios--solutions)
11. [Quick Reference](#11-quick-reference)
12. [Related Documentation](#12-related-documentation)

---

## 1. Purpose & Goals

- Provide a repeatable coverage workflow that keeps thresholds ≥ required tier values.
- Highlight commands that work on macOS, Linux, and Windows (Git Bash).
- Show when to run workspace vs thematic coverage to conserve time.
- Document artefacts (`coverage/<theme>/*`, `coverage/thematic-summary.json`) and how to interpret
  them.
- Call out recovery paths before CI fails.

## 2. Five-Minute Quick Start

1. Install dependencies: `pnpm install`
2. Generate shared coverage once: `pnpm test:coverage:workspace`
3. Inspect the thematic summary: `pnpm test:coverage:summary`
4. Open the HTML report: `pnpm exec open-cli coverage/workspace/index.html`
5. Capture TODOs for uncovered lines before coding deeper

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant PNPM as pnpm CLI
  participant Cov as run-coverage.mjs
  participant Sum as print-summary.mjs
  participant Browser as HTML Viewer

  Dev->>PNPM: pnpm test:coverage:workspace
  PNPM->>Cov: node scripts/coverage/run-coverage.mjs workspace
  Cov-->>Dev: coverage/workspace/**/*
  Dev->>PNPM: pnpm test:coverage:summary
  PNPM->>Sum: node scripts/coverage/print-summary.mjs
  Sum-->>Dev: thematic-summary.json table
  Dev->>PNPM: pnpm exec open-cli coverage/workspace/index.html
  PNPM->>Browser: Launch report
  Browser-->>Dev: Highlight uncovered lines
```

## 3. Daily Development Workflow

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Git as Git Status
  participant PNPM as pnpm CLI
  participant Runner as run-coverage.mjs
  participant Report as HTML Report
  participant Notes as Task Tracker

  Dev->>Git: git status --short
  Git-->>Dev: Identify touched packages
  Dev->>PNPM: pnpm test:coverage:<theme>
  PNPM->>Runner: run coverage for theme
  Runner-->>Dev: coverage/<theme>/coverage-summary.json
  Dev->>PNPM: pnpm test:coverage:summary
  PNPM-->>Dev: thematic-summary.json
  Dev->>Report: open coverage/<theme>/index.html
  Report-->>Dev: Review uncovered lines
  Dev->>Notes: record follow-up actions
```

**Checklist:**

- Pick the narrowest theme matching the packages you touched.
- Run workspace coverage once per day (or before PR) to validate aggregate thresholds.
- Keep `thematic-summary.json` in version control; do not delete between runs.
- Annotate TODOs inline with `// coverage-ignore` only after reviewer approval.

## 4. Investigating Coverage Gaps

Use this process when `thematic-summary.json` marks a target as below threshold or missing.

```mermaid
sequenceDiagram
  participant Alert as Thematic Summary Alert
  participant Dev as Developer
  participant FS as File System
  participant Git as Git Blame
  participant Vitest as Vitest Runner
  participant Notes as TODO Log

  Alert-->>Dev: <theme> below threshold
  Dev->>FS: open coverage/<theme>/lcov-report
  FS-->>Dev: highlight uncovered files
  Dev->>Git: git blame <file>
  Git-->>Dev: identify responsible changes
  Dev->>Vitest: pnpm vitest run <test-file>
  Vitest-->>Dev: confirm gap reproduction
  Dev->>Notes: plan new tests
```

**Guidance:**

- Prefer 1-2 targeted unit tests before writing integration tests.
- Use `pnpm exec vitest run path/to/file.test.ts --coverage.enabled false` to debug exclusive lines.
- Update `tests/infrastructure/coverage-validation.test.ts` only when thresholds or directories
  change.

## 5. Meeting Threshold Requirements

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Planner as Task Notes
  participant Runner as run-coverage.mjs
  participant Summary as Thematic Summary
  participant Reviewer as Pull Request Reviewer

  Dev->>Planner: Identify risk (new module)
  Planner-->>Dev: Flag coverage objective >= tier
  Dev->>Runner: pnpm test:coverage:<theme>
  Runner-->>Dev: coverage metrics
  Dev->>Summary: Inspect thematic-summary.json
  Summary-->>Dev: Confirm threshold >= target
  Dev-->>Reviewer: Share coverage status in PR
  Reviewer-->>Dev: Request additional tests if gap persists
```

**Threshold Targets:**

| Theme                    | Statement | Branch | Function | Line |
| ------------------------ | --------- | ------ | -------- | ---- |
| `workspace`              | 30% min   | 30%    | 30%      | 30%  |
| `@critgenius/client`     | 50%       | 50%    | 50%      | 50%  |
| `@critgenius/server`     | 50%       | 50%    | 50%      | 50%  |
| `@critgenius/shared`     | 75%       | 75%    | 75%      | 75%  |
| `@critgenius/test-utils` | 30%       | 30%    | 30%      | 30%  |

Values originate from `config/coverage.config.mjs`. Update the config and infrastructure tests when
thresholds evolve.

## 6. Pre-commit Coverage Safeguards

Pre-commit validation (`pnpm precommit:validate`) does not run full coverage but ensures targeted
unit suites stay green. Run thematic coverage before staging large changes to avoid CI surprises.

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Git as git add
  participant Hook as precommit:validate
  participant Vitest as Vitest Fast Path
  participant Cov as Coverage Runner
  participant CI as GitHub Actions

  Dev->>Git: git add src/new-module.ts tests/new-module.test.ts
  Git-->>Dev: staged changes
  Dev->>Hook: pnpm precommit:validate
  Hook->>Vitest: Run fast unit suites
  Vitest-->>Hook: Pass
  Dev->>Cov: pnpm test:coverage:<theme>
  Cov-->>Dev: coverage/<theme>/summary
  Dev->>CI: push branch
  CI-->>Dev: coverage gate already satisfied
```

**Recommendation:** Configure your editor task runner to execute `pnpm test:coverage:<theme>` before
pushing a branch that modifies business logic.

## 7. Thematic vs Workspace Coverage

Use the decision tree below to pick the fastest command.

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Decision as Decision Node
  participant Theme as Theme Coverage
  participant Workspace as Workspace Coverage
  participant Summary as Thematic Summary

  Dev->>Decision: What changed?
  Decision-->>Dev: Only client package files?
  alt Client-only changes
    Dev->>Theme: pnpm test:coverage:client
    Theme-->>Dev: Focused HTML + summary
  else Shared or multiple packages
    Dev->>Workspace: pnpm test:coverage:workspace
    Workspace-->>Dev: Aggregate coverage
  end
  Dev->>Summary: pnpm test:coverage:summary
  Summary-->>Dev: Confirm gate status
```

**Time Savers:**

- Theme coverage completes 30-40% faster than workspace coverage.
- Always regenerate the summary after any run to keep metrics fresh.
- If multiple themes changed, run `pnpm test:coverage:thematic` (sequential). Use when preparing
  PRs.

## 8. HTML Report Navigation

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant PNPM as pnpm CLI
  participant Browser as HTML Viewer
  participant Report as Coverage Index
  participant Source as Source Viewer

  Dev->>PNPM: pnpm exec open-cli coverage/<theme>/index.html
  PNPM->>Browser: Launch default browser
  Browser->>Report: Render summary table
  Dev->>Report: Drill into uncovered file
  Report->>Source: Render annotated source
  Source-->>Dev: Highlight uncovered line numbers
```

**Tips:**

- Use keyboard shortcuts (`j`/`k`) in the HTML report to jump between uncovered lines.
- Toggle the _Show only uncovered_ switch to focus on gaps.
- Export PDF snapshots for PR evidence when coverage is tight.

## 9. Practical Examples

### Run coverage for a single package

```bash
pnpm test:coverage:server
```

### Filter tests to isolate a coverage hole

```bash
pnpm exec vitest run packages/server/src/session/session-manager.test.ts --coverage.enabled false
```

### Load summary metrics programmatically

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const summaryPath = resolve(process.cwd(), 'coverage', 'thematic-summary.json');
const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
  themes: Record<string, { statement: number; status: string }>;
};

for (const [theme, metrics] of Object.entries(summary.themes)) {
  if (metrics.status !== 'pass') {
    console.info(`[coverage] ${theme} requires attention`);
  }
}
```

### Debug uncovered lines with inline logging

```bash
pnpm exec vitest run packages/shared/src/transcript/normalizer.test.ts --runInBand --coverage.enabled false
```

## 10. Common Scenarios & Solutions

| Scenario                                | Diagnosis                                   | Action                                                        |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Coverage dropped below 90% for `shared` | New module missing tests                    | Add unit tests; re-run `pnpm test:coverage:shared`            |
| Summary shows files you did not touch   | Stale artefacts in `coverage/`              | Remove directory (`rimraf coverage`) then rerun coverage      |
| Unsure which coverage command to run    | Multiple packages changed                   | Run `pnpm test:coverage:thematic` for full sweep              |
| Coverage is slow                        | Running workspace coverage during iteration | Switch to thematic coverage; run workspace nightly            |
| HTML report missing                     | Browser blocked local file                  | Use `pnpm exec http-server coverage/<theme>` to serve locally |

## 11. Quick Reference

| Purpose                      | Command                         |
| ---------------------------- | ------------------------------- |
| Workspace coverage           | `pnpm test:coverage:workspace`  |
| Sequential thematic coverage | `pnpm test:coverage:thematic`   |
| Client coverage              | `pnpm test:coverage:client`     |
| Server coverage              | `pnpm test:coverage:server`     |
| Shared coverage              | `pnpm test:coverage:shared`     |
| Test-utils coverage          | `pnpm test:coverage:test-utils` |
| Summary table                | `pnpm test:coverage:summary`    |
| Clean coverage artefacts     | `pnpm run clean`                |

## 12. Related Documentation

- `docs/coverage-system-guide.md` — architecture, thresholds, and orchestration internals
- `docs/coverage-troubleshooting.md` — deep troubleshooting playbooks
- `docs/developer-onboarding.md` — onboarding checklist including coverage expectations
- `docs/comprehensive-testing-guide.md` — testing philosophy and coverage relationship
- `tests/infrastructure/coverage-documentation.test.ts` — validation suite for this guide
