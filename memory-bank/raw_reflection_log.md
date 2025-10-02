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



