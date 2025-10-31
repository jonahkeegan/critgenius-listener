## Raw Reflection Log - CritGenius: Listener

**Purpose:** Capture fresh, detailed reflections (tasks, learnings, discoveries, successes) prior to
consolidation. This file is periodically distilled into `consolidated-learnings-XXX.md` entries per
Continuous Improvement Protocol.

**Usage Guidelines:**

**Entry Template:**

```
Date: YYYY-MM-DD
TaskRef: "<Task ID / Descriptive Title>"

Learnings:

Success Patterns:

Implementation Excellence:

Improvements_Identified_For_Consolidation:
```

---

Date: 2025-10-29 TaskRef: "Dev Infra 3.5.3 Cross-Browser E2E Smoke Tests"

Learnings:

- Replaced fragile console parsing in `packages/client/tests/e2e/transcription-display.e2e.test.ts`
  with a deterministic `window.__critgeniusSocketEvents` buffer fed by
  `packages/client/src/services/socketService.ts`, eliminating Firefox flakiness.
- Capturing emitted payloads inside `SocketService.emitTestEvent` gave Playwright deterministic
  transcript assertions without altering production pathways.

Success Patterns:

- Guarded the new event buffer behind `VITE_E2E`, keeping test-only hooks inert for real users while
  exposing complete data during automation.
- Verified the fix by rerunning `pnpm --filter @critgenius/client exec -- playwright test` across
  the six-project matrix and observing all passes.

Implementation Excellence:

- Cleared the shared event queue before each emission so assertions always inspect fresh payloads,
  preventing residue from earlier tests.
- Reused existing socket listener readiness checks to emit mock transcription events only after
  handlers registered, avoiding timing races.

Improvements_Identified_For_Consolidation:

- Document the `__critgeniusSocketEvents` hook in the Playwright testing guide for future smoke
  tests.
- Explore consolidating event-buffer inspection into a shared helper to reduce duplication across
  upcoming E2E specs.

---

Date: 2025-10-31 TaskRef: "Dev Infra 3.5.5 Playwright Test Parallelization"

Learnings:

- Parallelized the Playwright suite by enabling `fullyParallel`, dynamic `getWorkerCount`, and
  shard-aware retries in `packages/client/playwright.config.ts`.
- Added the `e2e-tests` GitHub Actions matrix in `.github/workflows/ci.yml` so each browser project
  runs concurrently and publishes scoped artifacts.
- Captured the operating model in `docs/playwright-parallelization-guide.md` and surfaced the
  guidance through updates to `docs/comprehensive-testing-guide.md`.

Success Patterns:

- Reused shared/test-utils/client build steps ahead of the matrix job, keeping browser executions
  fast while avoiding redundant compilation.
- Normalized artifact naming via the suffix preparation step to prevent collisions when sharding is
  enabled.
- Locked the configuration in place with `tests/infrastructure/playwright-parallelization.test.ts`
  to detect future drift across config, CI, and docs.

Implementation Excellence:

- Hardened shard parsing so malformed `SHARD` values fail immediately rather than skipping subsets
  of the suite.
- Extended `packages/client/package.json` with browser-specific and shard-aware scripts, making
  targeted or distributed runs a single command.
- Verified the behaviour with
  `pnpm exec vitest run --config vitest.infrastructure.config.ts tests/infrastructure/playwright-parallelization.test.ts`
  before publishing the report.

Improvements_Identified_For_Consolidation:

- Monitor the new `e2e-tests` workflow runtime and adjust shard settings as the Playwright suite
  grows.
- Resolve the pre-existing syntax regression in
  `tests/infrastructure/helpers/validate-versions-runner-core.mjs` prior to the next full
  infrastructure sweep.

---
