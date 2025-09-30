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


Date: 2025-09-28
TaskRef: "Dev Infra 2.10.3 – Unified Audio Capture Configuration"

Learnings:
- Centralizing audio capture dependencies via a configuration factory keeps guard/reporting/constraints wiring coherent while still honoring legacy entry points.
- Feature flags for diagnostics and latency tracking let us tune telemetry cost per environment without code forks.
- Embedding retry semantics directly in the controller smooths over transient `getUserMedia` failures and clarifies backoff behavior in tests.

Success Patterns:
- Applied the Continuous Improvement Protocol by reusing the reflection template and calling out reusable dependency-injection seams.
- Extended existing unit tests rather than introducing new fixtures, keeping validation fast and focused.
- Preserved backward compatibility (e.g., `now` alias) to de-risk adoption while encouraging migration to the new `timeProvider` API.

Implementation Excellence:
- `createAudioCaptureConfiguration` encapsulates reporter plumbing and time provider sourcing, making diagnostics deterministic.
- Retry-aware `start` logic halts by design on hard permission denials, preventing infinite loops.
- Test cases assert both latency flag disablement and retry success, proving the new flags and policy work under controlled mocks.

Improvements_Identified_For_Consolidation:
- Surface configuration builder usage inside React hooks so room-level feature toggles become straightforward.
- Promote diagnostic reporter assertions into higher-level integration tests once Socket.IO wiring is ready.
- Consider extracting the retry policy schema into shared utilities to stay consistent across future capture services.


Date: 2025-09-28
TaskRef: "Dev Infra 2.10.4.2 – Enhance Audio Capture Diagnostics & Error Handling"

Learnings:
- Validating audio capture telemetry with a Zod schema immediately surfaced shape drift during development and kept the reporter contract explicit.
- Returning `AudioCaptureErrorCode` values independently of UI strings makes downstream localization and analytics significantly simpler.
- Capturing retry attempts and guard outcomes as structured events provides lightweight observability without needing backend instrumentation yet.

Success Patterns:
- Reused the task plan’s event naming hierarchy to keep emitted telemetry consistent across controller, guard, and tests.
- Leaned on dependency injection for the reporter so diagnostics remained testable and we could assert emissions deterministically.
- Expanded existing Vitest suites instead of spinning up new harnesses, keeping execution time low while adding behavior coverage.

Implementation Excellence:
- `StructuredEventReporter` sanitizes context and timestamps centrally, ensuring every emission is schema-compliant before hitting transports.
- The controller’s retry loop now records attempt counts and distinguishes hard-block errors from transient failures, simplifying debugging.
- UI-facing helpers map codes to localized copy + action steps, eliminating string duplication across components.

Improvements_Identified_For_Consolidation:
- Wire the new message mapper into the live UI flows so user prompts leverage the centralized localization table.
- Stream structured audio events into the monitoring pipeline once socket listeners can consume them.
- Share `AudioCaptureErrorCode` definitions through `@critgenius/shared` if other packages need awareness of the taxonomy.


Date: 2025-09-29
TaskRef: "Dev Infra 2.10.5 – Verify HTTPS Server & Socket.IO Real-Time Connection"

Learnings:
- Providing an explicit `CLIENT_SOCKET_DISABLE_TLS_BYPASS` switch lets us test TLS failure paths without sacrificing the day-to-day self-signed dev experience.
- Running the HTTPS integration suites in Vitest’s Node environment avoids jsdom WebSocket interference and ensures the TLS agent wiring actually executes.
- Guarding browser-only globals inside `test-setup.ts` keeps mixed environment test runs stable and prevents cross-suite flakiness.

Success Patterns:
- Followed the continuous improvement protocol by capturing granular learnings immediately after the task completion report.
- Reused existing handshake/resilience specs instead of creating new fixtures, keeping coverage focused and execution time tight.
- Leaned on environment flag toggles rather than invasive mocks to simulate real TLS behavior, preserving test realism.

Implementation Excellence:
- Socket service now injects a custom HTTPS agent only when bypassing TLS checks and restores the global agent once bypassing is disabled.
- Integration tests explicitly clear and restore WebSocket globals, ensuring deterministic teardown across runs.
- Resilience spec reuses the service singleton to verify structured error emission, backoff scheduling, and recovery in one pass.

Improvements_Identified_For_Consolidation:
- Extend the test matrix to cover AssemblyAI HTTPS streaming and secure audio context flows to complete the end-to-end story.
- Document the new TLS bypass flag in developer onboarding materials so teammates know when and how to toggle it.
- Evaluate adding an automated lint rule or test guard that fails if `NODE_TLS_REJECT_UNAUTHORIZED` is left disabled outside test scenarios.


