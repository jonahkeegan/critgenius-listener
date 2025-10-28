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

Date: 2025-10-27 TaskRef: "Dev Infra 3.4.3 - Format-on-Save Validation"

Learnings:

- Captured the full manual audit workflow in `docs/format-on-save-validation.md`, covering package ×
  file-type coverage, ESLint interplay, and pre-commit hook expectations.
- Ensuring `docs/developer-onboarding.md` links to the validation guide keeps new contributors aware
  that format-on-save needs explicit verification after config changes.

Success Patterns:

- Documented validation steps as a reusable matrix so future infra runs can check off outcomes
  without rediscovering scope or process.
- Reinforced documentation-first strategy for low-drift configurations, keeping maintenance cost low
  while preserving institutional knowledge.

Implementation Excellence:

- Mirrored onboarding doc tone (brief bullets, actionable pointers) to keep workflow guidance
  consistent across developer docs.
- Highlighted dependencies between Prettier, EditorConfig, and lint-staged so the validation guide
  stays aligned with repository tooling.

Improvements_Identified_For_Consolidation:

- Schedule an actual format-on-save audit using the matrix and archive the results in
  `task-completion-reports/` once completed.
- Consider adding quick reference checks for alternate editors (WebStorm, Vim) in the validation
  guide to cover non-VS Code flows.

---

Date: 2025-10-27 TaskRef: "Dev Infra 3.5.1 - Playwright Dependencies & Scripts"

Learnings:

- Root `package.json` now owns Playwright tooling, so a single `pnpm install` keeps browser binaries
  and test runners consistent across packages.
- Delegating `test:e2e:ui` to the client package prevents the Playwright UI from launching without
  tests, aligning the root command with package-local configuration.
- Updating onboarding and testing docs immediately after scripting changes keeps guidance accurate
  for developers encountering Playwright setup for the first time.

Success Patterns:

- Reused pnpm workspace filters to route all headless/headed E2E commands through the client package
  without duplicating configuration.
- Validated every new script (`test:e2e`, `test:e2e:headed`, `test:e2e:ui`) in sequence before
  closing the task, ensuring the workflow matches the documentation.

Implementation Excellence:

- Matched Playwright versions between root and client to avoid hidden drift and simplify future
  upgrades.
- Documented install, execution, and report review steps in both onboarding and testing guides so
  future tasks can reference a single source of truth.

Improvements_Identified_For_Consolidation:

- Plan a CI spike to cache `playwright install --with-deps` and schedule headless E2E execution in
  the pipeline once runtime budget is confirmed.
- Capture troubleshooting guidance for permissions or binary download failures observed on Windows
  agents when we scale the workflow beyond local testing.
