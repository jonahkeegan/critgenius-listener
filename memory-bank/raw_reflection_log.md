## Raw Reflection Log - CritGenius: Listener

**Purpose:** Capture fresh, detailed reflections (tasks, learnings, discoveries, successes) prior to consolidation. This file is periodically distilled into `consolidated-learnings-XXX.md` entries per Continuous Improvement Protocol.

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

Date: 2025-10-08
TaskRef: "Dev Infra 3.1.3 Path TypeError Investigation Enhancement"

Learnings:
- Matching local Node v18.20.4 with CI exposed URL-to-string mismatches that local Node 20 never surfaced, reinforcing the need to validate against production runtimes before diagnosing failures.
- Centralizing path normalization through the new `PathValidator` keeps URL objects, `file://` strings, and whitespace edge cases from leaking into Vitest configs while preserving privacy via sanitized diagnostic context.
- Swapping `globalThis.URL` to Node 19 `URL` during dynamic imports stabilizes Vite/vitest interop without forcing global polyfills in package code.

Success Patterns:
- Always-on DEBUG toggles with artifact upload provided actionable CI logs without rerunning workflows manually.
- Dedicated infrastructure suites (`path-normalization`, `path-validator`, `ci-simulation`) caught Windows- and CI-specific regressions quickly and now serve as regression guards.

Implementation Excellence:
- Reused shared diagnostics across packages by exporting validators from `@critgenius/test-utils`, avoiding drift between workspace and per-package configs.
- Instrumented GitHub Actions to build shared/test-utils packages before linting and tests, ensuring type artifacts exist for downstream packages.

Improvements_Identified_For_Consolidation:
- Monitor the expanded ESLint regression timeout (45s on slow runners) and explore extracting lint harness helpers if runtime keeps growing.
- Evaluate whether DEBUG path logging should downgrade to `warn` by default once stability is confirmed to reduce CI artifact noise.
- Consider a lightweight CLI wrapper around `createPathValidator` for contributors debugging future path issues outside Vitest.


Date: 2025-10-10
TaskRef: "Dev Infra 3.1.3 Latency Bench Regression Detection Testing Infra"

Learnings:
- Socket.IO suites stay deterministic when tests wait for explicit session join and `transcriptionStatus` milestones before asserting; emitting AssemblyAI traffic early caused the former 300 s hang.
- Renaming and exporting `waitForSocketEventWithTimeout` eliminated ambiguous star exports and enforced typed listeners, preventing `any` creep across packages.
- Returning frozen copies from the AssemblyAI mock avoids locking the live chunk buffer, enabling assertions without resurfacing `Cannot add property` runtime errors.

Success Patterns:
- Layered waits (join ack → running status → event payload) formed a reusable handshake that stabilized three separate integration flows immediately.
- Adding a focused unit test around the mock’s chunk snapshots caught regressions quickly and documents intended behaviour for future contributors.

Implementation Excellence:
- Guarding `httpServer.close()` behind `listening` state made the harness teardown idempotent, reducing IntegrationServiceError noise in Vitest output.
- Documentation and downstream imports were updated alongside the helper rename, keeping client/server packages and standards docs aligned without drift.

Improvements_Identified_For_Consolidation:
- Audit remaining suites for legacy `waitForSocketEvent` imports to migrate them gradually and avoid mixed helper usage.
- Extract the multi-step Socket.IO handshake into a shared helper to reduce duplication and simplify future workflow tests.
- Instrument lightweight timing metrics around the new waits to feed forthcoming performance benchmarking goals.

Date: 2025-10-10
TaskRef: "Dev Infra 3.1.4 Integration Test Patterns & Cross-Package Workflows"

Learnings:
- Orchestrating services through a dedicated `ServiceLifecycleManager` kept integration suites declarative and avoided the ad-hoc teardown bugs we hit when starting servers directly inside tests.
- Environment presets made it trivial to reproduce CI conditions locally; swapping between `localDevelopment` and `ci` surfaced port collisions before they reached GitHub Actions.
- Capturing resilience metrics (latency, emitted errors) inside the scenario builder provided concrete assertions for degraded paths instead of relying on log inspection.

Success Patterns:
- The `IntegrationTestHarness.run()` helper let suites inline the full setup/teardown flow, drastically shrinking boilerplate without sacrificing explicit service registration.
- Combining deterministic AssemblyAI mocks with the new timeout helpers verified both happy-path streaming and structured error propagation in a single flow.
- Documenting approved patterns alongside a meta-test keeps standards visible and prevents docs from drifting as helpers evolve.

Implementation Excellence:
- Socket.IO and AssemblyAI integration suites now allocate ports dynamically, preventing parallel Vitest runs from racing over hard-coded values.
- Environment-aware describe/test wrappers encode skip reasons directly in test names, producing actionable Vitest output when prerequisites aren't met.
- The resilience scenario builder cleanly layers optional degradation without polluting the primary helper APIs.

Improvements_Identified_For_Consolidation:
- Expand presets with toggles for datastore fixtures (Mongo, Redis) before we introduce persistence-heavy workflows.
- Back-port the resilience metrics into shared monitoring once the production pipeline is ready so test coverage and runtime telemetry align.
- Evaluate adding CLI scaffolds that generate integration suite skeletons pre-wired with the harness and documentation links.



