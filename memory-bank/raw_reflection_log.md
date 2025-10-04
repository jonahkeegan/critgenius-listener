## Raw Reflection Log - CritGenius: Listener

**Purpose:** Capture fresh, detailed reflections (tasks, learnings, discoveries, successes) prior to consolidation. This file is periodically distilled into `consolidated-learnings-XXX.md` entries per Continuous Improvement Protocol.

**Usage Guidelines:**
- Append new entries BELOW this section.
- Use the template exactly; verbose detail encouraged (pruning happens later).
- Do not remove prior entries until after a consolidation pass confirms migration.

**Entry Template:**
```
Date: YYYY-MM-DD
TaskRef: "<Task ID / Descriptive Title>"

Learnings:

Success Patterns:

Implementation Excellence:

Improvements_Identified_For_Consolidation:
```




Date: 2025-10-02
TaskRef: "Dev Infra 3.1.1 – Vitest workspace hardening & CI readiness"

Learnings:
- Hoisted Vitest mocks with `vi.hoisted` prevent `vi.clearAllMocks()` from stripping constructor state, restoring deterministic realtime suites.
- Guarding Playwright E2E tests with an environment probe plus a `TextEncoder`/`TextDecoder` polyfill keeps Node-based runners resilient without sacrificing browser coverage.
- Centralizing workspace orchestration in `vitest.workspace.ts` and aligning root include/exclude patterns simplifies future package onboarding while keeping infra specs isolated.

Success Patterns:
- Reusable polyfill helper ensures cross-runner encoding stability with minimal surface area.
- Deterministic project discovery (sorted by manifest name) maintains legible aggregated output and predictable CI diffs.
- Infrastructure tests that introspect workspace configs catch drift before it hits CI.

Implementation Excellence:
- Added reset helper for AssemblyAI mocks so every test starts from a clean slate while retaining type safety.
- Root scripts now point to a single workspace entry, eliminating shell fan-out and reducing failure blind spots.
- Memory bank and task checklist updates keep institutional knowledge synced with code shifts.

Improvements_Identified_For_Consolidation:
- Wire the Playwright runner into CI to exercise the guarded suite in its native environment.
- Consider segmenting long-running AssemblyAI resilience cases into an integration tag if pipeline duration grows.
- Document the new `pnpm test` semantics in developer onboarding guides to prevent stale instructions.




Date: 2025-10-02
TaskRef: "Dev Infra 3.1.2 – Shared test utilities library"

Learnings:
- A dedicated `@critgenius/test-utils` package gives every workspace project the same deterministic Vitest runtime, eliminating drift between bespoke helpers.
- Dynamic fallback imports in the global Vitest setup let consumers run against source before the package is built, keeping local dev and CI aligned.
- Updating async polling helpers to advance fake timers only after scheduling delays prevents deterministic runs from hanging while still supporting real timers.

Success Patterns:
- Centralized factories, fixtures, and matchers accelerate scenario authoring and keep transcript/audio assertions domain-aware.
- Shared runtime installation (fake timers, seeded randomness, teardown registry) enables low-latency tests without repeating boilerplate in each package.
- Documenting usage directly in the package README encourages early adoption and clarifies setup expectations.

Implementation Excellence:
- Vitest config alias overrides and root `tsconfig` path mappings ensure both source and built consumers resolve the new module consistently.
- The README and package scripts mirror existing workspace conventions, so contributors inherit familiar commands and lint/test expectations.
- Async helper regression tests prove the deterministic runtime changes work under fake timers before rollout.

Improvements_Identified_For_Consolidation:
- Roll the shared utilities into client/server/shared test suites to retire duplicated helpers and measure adoption impact.
- Track coverage metrics after migration and consider adding thresholds once suites stabilize on the new tooling.
- Evaluate publishing prebuilt artifacts (or incremental build outputs) if tooling outside the monorepo needs these utilities.



Date: 2025-10-03
TaskRef: "Dev Infra 3.1.2.1 – Enhance test runtime state isolation"

Learnings:
- Encapsulating `runtimeInstalled`, teardown registries, and `Math.random` backups inside the `createTestRuntime` closure prevents cross-suite state leakage while preserving default runtime ergonomics.
- New helpers (`drainTeardowns`, `dispatchUnhandledRejection`) expose deterministic seams for exercising runtime internals without depending on Vitest hook ordering or truly unhandled promises.
- Callback-based unhandled rejection handling enables richer debugging workflows while retaining boolean opt-outs for teams that prefer legacy behavior.

Success Patterns:
- Closure-scoped state couples cleanly with a cached default runtime so shared setup stays simple, yet packages can spin up isolated runtimes for advanced scenarios.
- Tests that drive the helpers directly run faster, avoid flake across node/browser runners, and document expectations more explicitly.
- Draining teardowns through a helper keeps assertions localized and ensures teardown order stays predictable between suites.

Implementation Excellence:
- Added union typing for `failOnUnhandledRejection` with zero `any` leakage and maintained strict typing across runtime exports.
- Extended runtime tests to cover isolation, listener disablement, and custom handler invocation while avoiding real process-level unhandled rejections.
- Validated changes via `pnpm --filter @critgenius/test-utils test`, confirming the refactor ships green.

Improvements_Identified_For_Consolidation:
- Document the new helpers in the `@critgenius/test-utils` README to accelerate downstream adoption.
- Sweep other packages for ad-hoc teardown helpers that could standardize on `drainTeardowns()`.
- Evaluate exposing read-only snapshots of captured rejections if future diagnostics need more visibility without widening the public API.



