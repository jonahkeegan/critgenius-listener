# System Patterns – Runtime & Operational (Segment 003)

Last Updated: 2025-10-13 | Segment Version: 1.15.0

Parent Index: `systemPatterns-index.md`

## Runtime Design Patterns

### Real-Time Streaming Pattern

- Pattern: Event-driven WebSocket streaming
- Implementation: AssemblyAI real-time transcription with speaker diarization
- Components: AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → UI

### Speaker-Character Mapping Pattern

- Pattern: Persistent profile management with voice fingerprinting
- Implementation: Voice characteristic analysis → session-based character assignment
- Components: MappingInterface → SpeakerProfileManager → VoiceAnalyzer → SessionStorage

### Audio Processing Pipeline Pattern

- Pattern: Multi-layer processing with quality gates
- Layers: Input → Streaming → Processing → Output
- Quality Gates: Permission handling, quality detection, error resilience

### Audio Capture Configuration Pattern (Task 2.10.3)

- Pattern: Configuration-driven dependency injection with feature-flagged telemetry and optional
  retry semantics for microphone capture
- Implementation: `createAudioCaptureConfiguration` centralizes guard creation, reporter plumbing,
  audio context factory, default constraints, and time provider selection while exposing feature
  flags (diagnostics, latency tracking) and retry policy (max attempts + backoff)
- Benefits: Deterministic tests via injected dependencies, per-environment customization without
  code forks, predictable handling of transient `getUserMedia` failures, and backward compatibility
  through legacy option support
- Validation: Expanded unit tests (`audioCapture.test.ts`) asserting latency disablement, retry
  success path, and primary capture lifecycle behavior under mocks

### Structured Audio Diagnostics Pattern (Task 2.10.4.2)

- Pattern: Schema-validated diagnostics pipeline decoupling telemetry emission from UI concerns
- Implementation: `AudioEventSchema` (Zod) validates capture lifecycle events before dispatch,
  `StructuredEventReporter` centralizes sanitization + timestamp assignment, and the controller
  emits retry attempts, guard decisions, and `AudioCaptureErrorCode` values. UI helpers map codes to
  localized copy without coupling transports to presentation.
- Benefits: Ensures telemetry remains machine-readable and privacy-safe, accelerates downstream
  analytics, and unlocks localization by separating error strings from domain codes.
- Validation: Vitest suites assert schema conformance, reporter output, retry metadata emission, and
  localized messaging coverage via `structuredEvents.test.ts` and `audioMessageMapper.test.ts`.

### Testing Infrastructure Pattern: Vitest Configuration Standardization (Task 3.1.1)

- Pattern: Execute canonical TypeScript Vitest configs inside infrastructure tests while sharing a
  single validator entry point across CLI and test environments.
- Implementation: Infrastructure suite bundles each `vitest.config.ts` via `bundleConfigFile` before
  evaluation, the testing standards validator sheds its shebang so it can be imported by Vitest, and
  shared coverage typing is relaxed to match Vitest 3 while metadata writes flow through a typed
  record.
- Benefits: Eliminates stale compiled config drift, ensures validator parity between CLI and tests,
  and keeps strict TypeScript checks green without `any` escapes while preserving coverage and CSS
  transformer guarantees.
- Validation: `pnpm vitest run tests/infrastructure`, `pnpm validate:testing`, and
  `pnpm -w type-check` all pass under the new configuration pipeline; memoized bundling keeps suite
  performance stable.

### Testing Infrastructure Pattern: Unified Vitest Workspace Execution (Task 3.1.1.1)

- Pattern: Centralized Vitest workspace orchestrating root infrastructure suites and all package
  projects with deterministic discovery, resilient runtime guards, and shared CLI ergonomics.
- Implementation: `vitest.workspace.ts` enumerates package manifests with local `vitest.config.ts`
  files, injects a root `workspace-infrastructure` project, and sorts project names for stable
  ordering. Root `vitest.config.ts` narrows include/exclude patterns to infrastructure tests only,
  while package manifests continue to rely on shared config factories. Root npm scripts now delegate
  to `vitest --config vitest.workspace.ts`, and coverage aggregation is driven by the CLI flag
  `--coverage.reportsDirectory=coverage/workspace`.
- 2025-10-02 Hardening: AssemblyAI realtime mocks were hoisted via `vi.hoisted` with centralized
  reset helpers to keep workspace runs deterministic; the Playwright microphone E2E suite now
  ensures `TextEncoder`/`TextDecoder` availability, dynamically loads `esbuild`, and self-skips
  under Vitest while running fully under the Playwright harness.
- Benefits: Single `pnpm test` executes every workspace project without per-package script drift,
  unified reporters keep output coherent, package onboarding requires no script changes, and
  coverage artifacts consolidate into `coverage/workspace` for downstream tooling. Hoisted mocks
  prevent runtime failures, and runtime guards keep Node-based runners stable without sacrificing
  browser coverage.
- Validation: Infrastructure tests confirm workspace detection, deterministic ordering, and coverage
  script configuration; `pnpm test`, `pnpm -w lint`, and `pnpm -w type-check` exercise the full
  suite post-hardening.

### Testing Infrastructure Pattern: Shared Test Utilities Library (Task 3.1.2)

- Pattern: Workspace-scoped testing toolkit packaging deterministic runtime setup, async utilities,
  Socket.IO mocks, domain factories, fixtures, and Vitest matchers for reuse across packages.
- Implementation: `@critgenius/test-utils` exposes runtime installers that seed fake timers,
  register teardown hooks, polyfill encoders, and provide seeded randomness; helper suites supply
  polling/retry utilities aware of fake timers, Socket.IO mock endpoints, and assertion helpers.
  Domain factories build deterministic users, sessions, transcripts, and audio chunks while custom
  matchers validate transcript structure, speaker labels, latency, and accuracy.
- Integration: Root `tsconfig.json` path aliases and `tests/setup/common-vitest-hooks.ts` now
  reference the package with dynamic fallbacks so consumers can import source prior to build. The
  package ships its own Vitest config, README, and scripts for local development.
- Benefits: Eliminates bespoke helper drift between packages, accelerates scenario authoring with
  shared factories/fixtures, ensures all tests run under the same deterministic runtime, and reduces
  flake by coordinating fake timer advancement.
- Validation: `pnpm --filter @critgenius/test-utils test` exercises package suites (24 tests) and
  `pnpm --filter @critgenius/test-utils build` verifies TypeScript emission.

### Coverage Configuration Single Source Pattern (Task 3.2.1.1)

- Pattern: Centralized coverage metadata module that supplies thresholds, thematic definitions,
  report directories, and execution order helpers to every consumer, preventing drift across
  scripts, configs, and infrastructure tests.
- Implementation: `config/coverage.config.mjs` exports typed objects via `.types.ts`/`.d.ts`
  companions; `scripts/coverage/run-coverage.mjs`, `scripts/coverage/thematic-summary.mjs`, root and
  package `vitest.config.ts`, plus infrastructure suites import the module through
  `pathToFileURL`-safe dynamic imports so both Node and jsdom contexts avoid
  `ERR_UNSUPPORTED_ESM_URL_SCHEME` regressions.
- Benefits: Removes duplicated literals, turns validation suites into true drift detectors, and
  enables deterministic automation—developers can run the documented watchexec loop
  (`~/.cargo/bin/watchexec.exe -c -w config/coverage.config.mjs -w tests/infrastructure/coverage-thresholds.test.ts -- pnpm vitest run …`)
  to receive immediate feedback while CI reads the same metadata for gating.
- Validation:
  `pnpm vitest run tests/infrastructure/coverage-thresholds.test.ts tests/infrastructure/coverage-validation.test.ts`
  confirms all packages honor the shared configuration surface.

### Performance Regression Harness Pattern (Task 3.1.3)

- Pattern: Deterministic performance benchmarking pipeline that reuses shared runtime safeguards,
  mirrors orchestration resolver behavior, and surfaces Vitest lifecycle failures via hardened
  runner semantics.
- Implementation: Integrated the proven web encoding polyfill into the shared deterministic test
  runtime so `TextEncoder`/`TextDecoder` invariants hold during client infrastructure suites;
  updated the service launcher spec to accept environment-provided `PORT` values consistent with
  manifest resolution; refactored `scripts/performance/run-tests.mjs` to treat `startVitest` as a
  long-lived instance (awaiting `runningPromise`, calling `close()`, honoring watch vs. batch flows)
  and to propagate exit codes for missing or failing performance suites.
- Benefits: Performance latency benchmarks now execute under real timers without esbuild
  regressions, orchestration smoke tests align with runtime semantics preventing false negatives,
  and CI receives accurate exit behavior enabling reliable regression detection and future
  automation (JSON summaries, watch-mode harness).
- Validation: `pnpm --filter @critgenius/client test`,
  `pnpm vitest run tests/orchestration/service-launcher.test.ts`,
  `node scripts/performance/run-tests.mjs tests/performance/audio-processing.perf.test.ts`, and a
  negative run against a non-existent file confirm success and failure signaling.

### Path Diagnostics & Normalization Guardrail Pattern (Task 3.1.3 Path TypeError Investigation)

### Documentation Validation Harness Pattern (Task 3.1.5)

- Pattern: Self-validating documentation pipeline ensuring the comprehensive testing guide remains
  accurate, complete, and aligned with Continuous Improvement Protocol requirements.
- Implementation: `docs/comprehensive-testing-guide.md` codifies a nine-section hierarchy
  (philosophy, quick starts, infrastructure deep dive, utilities library, integration handbook,
  performance testing, best practices, troubleshooting, quality gates) enriched with four sequence
  diagrams, 50+ TypeScript D&D-domain examples, 20+ bash commands, and cross-references to five
  supplemental documents. Companion suite `tests/infrastructure/comprehensive-testing-guide.test.ts`
  runs 92 assertions (23 per package) covering structure, diagram counts, code samples, references,
  npm scripts, troubleshooting content, formatting, and completeness.
- Benefits: Guarantees onboarding and expert developers rely on current, high-signal documentation;
  prevents silent drift through automated CI gating; encodes troubleshooting knowledge (symptom →
  resolution) and realistic scenarios so contributors mirror production workflows.
- Validation: `pnpm vitest run tests/infrastructure/comprehensive-testing-guide.test.ts` verifies
  structure & references; package-specific runs
  (`pnpm --filter @critgenius/client|server|shared|test-utils test`) ensure helper imports remain
  accurate; lint/type-check gates keep documentation scripts type-safe.

### Integration Testing Harness & Cross-Package Workflow Pattern (Task 3.1.4)

- Pattern: Deterministic integration harness coordinating environment presets, service lifecycles,
  Socket.IO pairs, AssemblyAI mocks, and resilience metrics for workflows spanning client ↔ server
  ↔ shared packages.
- Implementation: `IntegrationTestHarness` applies named presets, restores `process.env`, and wraps
  `ServiceLifecycleManager` which enforces ordered startup/teardown with structured
  `IntegrationServiceError`s; helpers include `allocateAvailablePort`, timeout-aware socket
  listeners, `createMockAssemblyAIScenario`, resilience scenario builders, and environment-aware
  describe/test wrappers that skip suites with contextual reasons.
- Benefits: Integration suites allocate ports dynamically, configure mock-only AssemblyAI flows,
  inject latency/failure modes, and assert transcript/error payloads without bespoke setup.
  Environment gating prevents CI surprises, and documentation/meta-tests codify approved patterns
  for future contributors.
- Validation: `pnpm --filter @critgenius/test-utils test`, `pnpm --filter @critgenius/server test`,
  and `pnpm vitest run tests/infrastructure/integration-test-standards.test.ts` verify harness
  integrity, example suites, and documentation coverage.

### Performance Testing Architecture Decision Pattern (Task 3.1.4.5)

- Pattern: Evidence-based architecture evaluation process using pattern analysis, cost-benefit
  matrices, and weighted decision scoring to determine whether proposed refactorings deliver
  meaningful value.
- Decision: DEFER file-based performance result decoupling in favor of maintaining current
  import-based architecture with documentation enhancements (ADR-001).
- Analysis Process: Three-phase evaluation (Pattern Analysis → Cost-Benefit Evaluation →
  Architecture Decision) produced comprehensive documentation (40,000+ characters across 3
  documents) with 248 passing validation tests, quantitative decision matrix scoring (-0.515
  strongly negative), and formal ADR with re-evaluation triggers.
- Implementation: Current architecture uses direct imports where `compare-performance.mjs` and
  `generate-report.mjs` execute `metrics-runner.mjs` for in-memory benchmark results; proposed
  file-based decoupling would require 18 hours implementation + 10-15% ongoing maintenance for zero
  tangible benefits addressing only speculative future scenarios.
- Benefits: Maintains recently stabilized infrastructure (Oct 2025), avoids HIGH regression risk,
  frees 18 hours for higher-value work, preserves 2-minute benchmark execution time, and delivers
  3-hour documentation enhancement with 9:1 value ratio over refactoring.
- Re-evaluation Triggers: Benchmark time exceeds 10 minutes, historical trend analysis becomes
  requirement, multiple runs per cycle become necessary, cross-team sharing emerges, coupling causes
  friction, or implementation cost drops below 5 hours.
- Documentation: `docs/architecture-decisions/adr-001-performance-testing-architecture.md`,
  `docs/performance-architecture-analysis.md` (20K+ chars),
  `docs/performance-architecture-cost-benefit-evaluation.md` (15K+ chars).
- Validation: 248 passing tests (112 for pattern analysis + 136 for cost-benefit evaluation) confirm
  comprehensive evaluation methodology and documentation quality.

- Pattern: Cross-workspace path validation and diagnostics layer that enforces string-only inputs,
  captures environment-aware telemetry, and neutralizes URL-derived Vitest config regressions on
  Node 18.
- Implementation: `EnvironmentDetector` and `PathValidator` in `@critgenius/test-utils` sanitize
  diagnostics, record stack traces when URL inputs appear, and convert URL/`file://` values via
  `fileURLToPath`; `vitest.shared.config.ts` and `packages/client/vitest.config.ts` now route all
  path inputs through the validator while temporarily swapping `globalThis.URL` during dynamic
  imports to guarantee Node 18 semantics.
- Benefits: Eliminates CI-only `TypeError` failures, preserves privacy by masking environment
  context, produces actionable DEBUG artifacts, and keeps alias resolution consistent across
  packages and operating systems.
- Validation: `pnpm -w lint`, `pnpm -w type-check`, focused infrastructure suites
  (`tests/infrastructure/path-normalization.test.ts`, `path-validator.test.ts`,
  `ci-simulation.test.ts`), and CI artifact uploads confirm guardrail effectiveness.

## Data Flow Patterns

```
Microphone → Web Audio API → Audio Chunks → WebSocket → AssemblyAI →
Transcript + Speaker Labels → Character Mapping → Display + Export
```

```
Voice Input → Voice Analysis → Fingerprint Generation → Profile Storage →
Character Assignment → Persistent Mapping → Cross-Session Recognition
```

## Security Patterns

1. Audio permission consent
2. HTTPS/WSS encrypted streaming
3. Local Development Secure Context Pattern (Task 2.10.1)
   - Conditional HTTPS enablement via dev-only environment variables
   - Idempotent mkcert/OpenSSL certificate generation (SAN: localhost, 127.0.0.1, ::1)
   - Graceful fallback to HTTP with explicit warning (no hard failure to preserve flow)
   - Certificate artifacts git-ignored; expiration monitored via script (warning threshold)
4. Dev HTTPS Proxy Hardening & Diagnostics (Task 2.10.2)
   - Extended proxy env schema enabling secure upstream selection & host allowlist
   - Protocol-aware keep-alive agents reduce handshake overhead
   - `X-Forwarded-Proto` injection preserves original scheme context
   - Optional TLS verification relax (`DEV_PROXY_REJECT_UNAUTHORIZED=false`) for self-signed
     experimentation (default secure)
   - Preflight diagnostics script surfaces misconfig (health probe + WS upgrade heuristic)
     pre-interaction
   - Backward compatible defaults retain HTTP path until explicit opt-in
5. HTTPS Socket.IO TLS Resilience (Task 2.10.5)
   - `CLIENT_SOCKET_DISABLE_TLS_BYPASS` flag keeps self-signed certificate bypass opt-in, while
     allowing automated TLS failure simulations during tests.
   - Socket service now injects an HTTPS agent only when bypassing verification and restores the
     global agent when disabled, preventing latent insecure state.
   - Node-environment integration suites assert secure handshake success, structured TLS failure
     errors, and automatic recovery behavior; shared test setup guards browser-only globals for
     stability.
6. HTTPS Documentation & Troubleshooting Playbook (Task 2.10.6)
   - Dual-document strategy (`docs/https-development-setup.md`,
     `docs/https-troubleshooting-guide.md`) codifies secure-context workflows with sequence
     diagrams, integration validation, and maintenance cadence.
   - Troubleshooting guide delivers scenario-driven diagnostics (certificate errors, port conflicts,
     browser warnings, runtime TLS failures) with explicit sequence diagrams for fast resolution.
   - Setup guide standardizes mkcert/OpenSSL provisioning, environment wiring, Socket.IO WSS checks,
     and certificate rotation, reducing onboarding friction.
7. Privacy compliance (local processing options)
8. Secure API key management (no logging)
9. Client input validation & XSS protection

### Infrastructure Pattern: Centralized Proxy Registry (Task 2.10.2-2)

- Pattern: Single source of truth for development proxy routes and environment keys in shared.
- Implementation: Typed registry (`PROXY_ROUTES`, `PROXY_ENV_KEYS`), helper `resolveTargetFromEnv`,
  and consumer `getProxyRegistry()`; client proxy builder iterates registry for HTTP and WS.
- Benefits: Eliminates config drift across packages, standardizes protocol/port derivation, enables
  code-generation for docs and `.env.example`.
- Safety: No secrets logged; backward compatible—AssemblyAI rewrite behavior preserved.
- Validation: Shared unit tests; monorepo lint/type-check/tests PASS.

### Dev Ergonomics & Safety: Dynamic Port Discovery (Task 2.10.2-1)

- Pattern: Localhost-only discovery with strict timeouts probes `/api/health` across candidate ports
  to auto-select backend during dev.
- Safety: Bounded global and per-port timeouts; sanitized logs (no secrets); discovery active only
  in dev serve; falls back gracefully.
- Integration: Async proxy builder delegates to pure builder to preserve DRY and backward
  compatibility.

## Performance Patterns

1. Latency optimization (<500ms end-to-end)
2. Buffer management & efficient chunk sizing
3. Redis caching for session & profiles
4. Memory/resource management for sustained capture
5. Horizontal load distribution readiness
6. Deterministic performance benchmarking harness with real-timer execution and hardened Vitest
   lifecycle management (Task 3.1.3)

## Error Handling Patterns

1. Progressive degradation (fallback modes)
2. Exponential retry/backoff for transient failures
3. User-facing actionable feedback
4. Real-time monitoring & alert hooks (planned)
5. Graceful recovery preserving session state

## Validation Patterns (Aug 19, 2025)

- Mock-first realtime validation (~90% surface without live keys)
- Server-side normalization (Session Manager standardization)
- Lifecycle-driven cleanup (participant-bound connector lifecycle)
- Structured error signaling (socket codes like ASSEMBLYAI_CONFIG_MISSING)

## Integration Patterns

APIs:

```
/audio  /transcription  /speakers  /integration
```

Real-Time Events: transcript updates for Prompter; session export for LLM; structured output for
Publisher.

## Scalability Considerations

1. Horizontal scaling strategy
2. MongoDB sharding roadmap (session-partitioned)
3. CDN static asset optimization
4. Microservices migration path (clear boundaries)
5. Performance monitoring metrics (usage-driven scaling triggers)

## Deployment Patterns

1. Containerization (Docker)
2. Blue-Green deploys for zero downtime
3. Infrastructure as Code provisioning
4. CI/CD automated test/build/deploy pipeline
5. Monitoring & APM integration

## Resilience Pattern: Structured Health Scoring & Backoff Restart (Aug 30, 2025)

Pattern: Multi-dimensional health snapshot + adaptive restart strategy. Components: Health
Controller → Probes → Scoring Heuristic → Orchestrator Monitor → Backoff Calculator → Circuit
Breaker. Scoring: Start 100; subtract 40 disconnected/unreachable, 15 degraded/backpressure;
thresholds ≥90 healthy, ≥60 degraded else unhealthy. Restart:
`delay = min(baseMs * 2^attempt, maxMs)`; open circuit after maxAttempts until cooldown expires.
Future Extensions: pluggable probes, parallel execution, restart analytics, threshold alerts.

## Operational Notes

- Design supports first-mover advantage in D&D audio processing
- Performance & privacy targets validated through systematic architecture analysis

## Change Log

- 2025-10-13: Added centralized coverage configuration pattern (Task 3.2.1.1); version bump 1.15.0
- 2025-10-11: Documented documentation validation harness pattern (Task 3.1.5); version bump 1.14.0
- 2025-10-11: Added performance testing architecture decision pattern (Task 3.1.4.5); version bump
  1.13.0
- 2025-10-08: Added path diagnostics & normalization guardrail pattern (Task 3.1.3 Path TypeError
  investigation); version bump 1.11.0
- 2025-10-10: Documented integration testing harness & cross-package workflow pattern (Task 3.1.4);
  version bump 1.12.0
- 2025-10-05: Documented performance regression harness pattern (Task 3.1.3); version bump 1.10.0
- 2025-10-03: Added shared test utilities library pattern (Task 3.1.2); version bump 1.9.0
- 2025-10-02: Enhanced Vitest workspace execution pattern with hoisted AssemblyAI mocks and
  Playwright runtime guard (Task 3.1.1.1); version bump 1.8.0
- 2025-10-01: Added unified Vitest workspace execution pattern (Task 3.1.1.1); version bump 1.7.0
- 2025-09-29: Documented HTTPS setup & troubleshooting playbook (Task 2.10.6); version bump 1.5.0
- 2025-09-30: Added Vitest configuration standardization testing pattern (Task 3.1.1); version bump
  1.6.0
- 2025-09-29: Added HTTPS Socket.IO TLS resilience pattern (Task 2.10.5); version bump 1.4.0
- 2025-09-28: Added Structured Audio Diagnostics pattern (Task 2.10.4.2); version bump 1.3.0
- 2025-09-28: Added Audio Capture Configuration pattern (Task 2.10.3); version bump 1.2.0
- 2025-09-20: Added Centralized Proxy Registry infrastructure pattern (Task 2.10.2-2)
- 2025-09-20: Added Dynamic Port Discovery dev ergonomics pattern (Task 2.10.2-1)
- 2025-09-17: Added Dev HTTPS Proxy Hardening & Diagnostics security pattern (Task 2.10.2); version
  bump 1.1.0
- 2025-09-14: Added Local Development Secure Context security pattern (Task 2.10.1)
- 2025-09-12: Extracted runtime & operational patterns into Segment 003.

---

End of Segment 003.
