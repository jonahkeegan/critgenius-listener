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

Date: 2025-10-30 TaskRef: "Task 3.5.4 Playwright CI Integration"

Learnings:

- Introducing an `e2e-tests` matrix job in `.github/workflows/ci.yml` keeps cross-browser coverage
  automated by reusing the build-and-validate outputs, launching a health-checked dev server, and
  retaining per-browser artifacts for debugging.
- Aligning local scripts (`package.json`, `packages/client/package.json`) with CI commands ensures
  developers can mirror the pipeline by running browser-targeted Playwright tests and installing the
  full browser set, including Edge.

Success Patterns:

- Split browser installation so Chromium/Firefox/WebKit install for every matrix entry while
  `msedge` installs only when the Edge project runs, trimming redundant setup time.
- Captured reports, results, screenshots, videos, and traces via `actions/upload-artifact@v4` using
  browser-specific names, making failures fast to triage directly from workflow runs.

Implementation Excellence:

- Added `VITE_E2E` to the workflow environment and dev-server start so Playwright instrumentation
  toggles on consistently in CI without manual env management.
- Authored `tests/infrastructure/playwright-ci-integration.test.ts` to scan the workflow and
  Playwright config, protecting the matrix wiring and artifact expectations from accidental drift.

Improvements_Identified_For_Consolidation:

- Capture CI runtime metrics after a few runs to inform Task 3.5.5 parallelization decisions and
  document recommended worker settings once stabilized.
- Extend contributor docs with a quick-reference table mapping matrix browsers to their viewport
  specs for faster test planning.

---
