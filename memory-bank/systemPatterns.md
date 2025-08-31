# System Patterns - Crit Genius Listener

**Last Updated:** 2025-08-31 15:20 PST **Version:** 2.11.0 **Dependencies:** projectbrief.md,
productContext.md

## Architectural Decisions

### ADR-001: AssemblyAI Selection for Speech-to-Text

**Status:** Accepted  
**Context:** Need reliable real-time transcription with speaker diarization  
**Decision:** Use AssemblyAI Node SDK for speech-to-text processing  
**Rationale:** Context7 analysis confirms excellent documentation, robust speaker diarization, and
real-time streaming capabilities  
**Consequences:** AssemblyAI service dependency, but excellent feature alignment with requirements

### ADR-002: Web Audio API for Real-Time Audio Capture

**Status:** Accepted  
**Context:** Browser-based real-time audio capture requirement  
**Decision:** Implement Web Audio API with progressive enhancement  
**Rationale:** Native browser support, real-time capabilities, Context7-validated documentation
quality  
**Consequences:** Browser compatibility considerations, but standardized approach

### ADR-003: Modular Monolith Architecture for MVP

**Status:** Accepted  
**Context:** Balance between complexity and scalability for initial release  
**Decision:** Implement modular monolith with clear component boundaries  
**Rationale:** Reduced complexity for MVP while maintaining migration path to microservices  
**Consequences:** Easier development and deployment, with future refactoring considerations

## Design Patterns

### Real-Time Streaming Pattern

- **Pattern:** Event-driven architecture with WebSocket streaming
- **Implementation:** AssemblyAI real-time transcription with speaker diarization
- **Components:** AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → UI

### Speaker-Character Mapping Pattern

- **Pattern:** Persistent profile management with voice fingerprinting
- **Implementation:** Voice characteristic analysis with session-based character assignment
- **Components:** MappingInterface → SpeakerProfileManager → VoiceAnalyzer → SessionStorage

### Audio Processing Pipeline Pattern

- **Pattern:** Multi-layer processing with quality gates
- **Layers:** Input → Streaming → Processing → Output
- **Quality Gates:** Permission handling, quality detection, error resilience

## System Architecture Overview

```
CritGenius Listener Architecture:
├── Frontend (React + TypeScript)
│   ├── Audio Capture Components (Web Audio API)
│   ├── Real-time Transcript Display
│   ├── Speaker-Character Mapping Interface
│   └── Socket.IO Client Communication
├── Backend Services (Node.js + Express)
│   ├── Audio Streaming Service
│   ├── AssemblyAI Integration Service
│   ├── Speaker Profile Management
│   └── CritGenius Ecosystem APIs
├── Data Layer
│   ├── MongoDB (Session data, speaker profiles)
│   ├── Redis (Real-time state, caching)
│   └── File Storage (Audio artifacts)
└── Infrastructure
    ├── Docker Containerization
    ├── Socket.IO for real-time communication
    └── Cloud deployment with auto-scaling
```

## Key Architectural Principles

1. **Privacy-First Design**: Local processing capabilities with transparent data policies
2. **Real-Time Performance**: Sub-500ms latency for gaming experience
3. **Modular Design**: Clear component boundaries for CritGenius ecosystem integration
4. **Progressive Enhancement**: Graceful degradation across browser capabilities
5. **Scalability Planning**: Horizontal scaling support for multiple sessions
6. **Reliability Focus**: 99.9% uptime with comprehensive error handling

## Component Interactions

### Core Workflow Sequence

```
User → AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → CritGeniusCore
```

### Real-Time Data Flow

1. **Audio Input**: Web Audio API microphone capture
2. **Streaming**: WebSocket audio data transmission
3. **Transcription**: AssemblyAI real-time processing with speaker diarization
4. **Mapping**: Speaker-to-character assignment with voice profiling
5. **Output**: Live transcript display and CritGenius ecosystem integration

## Data Flow Patterns

### Audio Processing Pipeline

```
Microphone → Web Audio API → Audio Chunks → WebSocket → AssemblyAI →
Transcript + Speaker Labels → Character Mapping → Display + Export
```

### Speaker Profile Management

```
Voice Input → Voice Analysis → Fingerprint Generation → Profile Storage →
Character Assignment → Persistent Mapping → Cross-Session Recognition
```

## Security Patterns

1. **Audio Permission Management**: Explicit user consent with Web Audio API permissions
2. **Data Encryption**: HTTPS/WSS for secure audio streaming
3. **Privacy Compliance**: Local processing options and transparent data handling
4. **Service Authentication**: Secure AssemblyAI API key management
5. **Client Security**: Input validation and XSS protection

## Performance Patterns

1. **Latency Optimization**: <500ms end-to-end audio-to-transcript processing
2. **Buffer Management**: Efficient audio chunking and streaming
3. **Caching Strategy**: Redis for session state and speaker profiles
4. **Resource Management**: Memory optimization for continuous audio processing
5. **Load Balancing**: Horizontal scaling for concurrent sessions

## Error Handling Patterns

1. **Progressive Degradation**: Fallback processing when services unavailable
2. **Retry Logic**: Exponential backoff for service failures
3. **User Feedback**: Clear error messages and recovery guidance
4. **Monitoring Integration**: Real-time error tracking and alerting
5. **Graceful Recovery**: State preservation during service interruptions

## Validation Patterns (Aug 19, 2025)

- **Mock-first Realtime Validation**: Use module and WebSocket mocks to validate ~90% of integration
  surface without live API keys.
- **Server-side Normalization**: Normalize transcription payloads (text, confidence, words, isFinal)
  in the Session Manager before broadcasting to clients.
- **Lifecycle-driven Cleanup**: Tie connector lifecycle to room participants; last participant leave
  triggers connector close and session deletion.
- **Error Signaling Contracts**: Emit structured error codes across Socket.IO boundary (e.g.,
  ASSEMBLYAI_CONFIG_MISSING, TRANSCRIPTION_ERROR) to simplify client handling.

## Integration Patterns

### CritGenius Ecosystem APIs

```
├── /audio (Audio capture management)
├── /transcription (Real-time transcript streaming)
├── /speakers (Speaker-character mapping)
└── /integration (Ecosystem data export)
```

### Event-Driven Integration

- **Real-time Events**: Live transcript streaming for CritGenius Prompter
- **Session Exports**: Complete session data for CritGenius LLM processing
- **Formatted Output**: Structured data for CritGenius Publisher

## Scalability Considerations

1. **Horizontal Scaling**: Multiple instance support with load balancing
2. **Database Sharding**: MongoDB collections partitioned by session
3. **CDN Integration**: Static asset delivery optimization
4. **Microservices Migration Path**: Clear component boundaries for future decomposition
5. **Performance Monitoring**: Real-time scaling triggers based on usage metrics

## Deployment Patterns

1. **Containerization**: Docker for consistent deployment environments
2. **Blue-Green Deployment**: Zero-downtime production updates
3. **Infrastructure as Code**: Automated environment provisioning
4. **CI/CD Pipeline**: Automated testing, building, and deployment
5. **Monitoring Integration**: APM and logging for production visibility

## Notes

- Architecture validated through Context7 technology assessment
- System patterns derived from Product Architecture Strategy evaluation
- Design supports first-mover advantage in D&D audio processing
- Modular approach enables CritGenius ecosystem expansion
- Performance targets validated through systematic architecture analysis

## Reference Links

- **Dependencies:** ../memory-bank/projectbrief.md, ../memory-bank/productContext.md
- **Next Dependencies:** techContext.md
- **Architecture Strategy:** ../architecture-strategy-evaluation-critgenius-listener.md

### ADR-004: Comprehensive Environment Variable Management System

**Status:** Accepted (Aug 20, 2025)  
**Context:** Need robust environment configuration management across development/staging/production with validation and error handling  
**Decision:** Implement Zod-based schema validation with environment-specific templates and centralized management  
**Rationale:** TypeScript compile-time safety combined with runtime validation prevents configuration errors, improves developer experience, and enables secure deployment patterns  
**Consequences:** Centralized configuration management enables consistent validation, reduces misconfiguration risks, and provides clear error messaging at startup

### ADR-005: Client-Safe Environment Projection & Build Injection

**Status:** Accepted (Aug 24, 2025)  
**Context:** Need to expose a minimal, non-secret subset of configuration to browser code while preventing accidental leakage and enabling dynamic feature flags.  
**Decision:** Introduce explicit allow-list schema (`clientConfigSchema`) plus projection utility (`getClientRuntimeConfig`) that feeds sanitized JSON into Vite via `define(__CLIENT_ENV__)`; supply runtime accessor with non-cached `hasFeature` evaluation.  
**Rationale:** Positive control (enumerated allow-list) eliminates secret drift; build-time injection provides immutable snapshot for bundle determinism; dynamic evaluation avoids stale values in tests and future live toggling scenarios.  
**Consequences:** Requires explicit updates when adding new public keys (small maintenance cost) but materially reduces security risk and simplifies client consumption & testing.

### ADR-006: Lightweight Pre-Commit Automation Strategy (Husky + lint-staged)

**Status:** Accepted (Aug 25, 2025)  
**Context:** Need consistent, fast local quality gates (formatting + lint) without slowing contributor workflow or duplicating CI responsibilities (type-check & tests).  
**Decision:** Use Husky with a minimal `pre-commit` hook invoking `lint-staged` (ESLint auto-fix + Prettier) and a `commit-msg` hook enforcing Conventional Commit messages. Exclude type-check and test execution from hooks to keep latency low (<1s typical).  
**Rationale:** Staged-file scoping + auto-fix prevents most CI lint failures while preserving rapid iteration. Conventional Commit enforcement at source improves changelog hygiene and PR review quality.  
**Consequences:** Type errors or failing tests are caught in CI (and by developer manual runs). Future escalation (optional) can add run-once type-check or selective tests if signal-to-time ratio remains favorable.

### ADR-007: Conditional Type-Aware Pre-Commit Gating & Validation Harness

**Status:** Accepted (Aug 27, 2025)
**Context:** Need earlier surfacing of type regressions without penalizing non-TypeScript commits; desire reproducible, automatable validation of hook behavior.
**Decision:** Enhance pre-commit hook to execute monorepo `pnpm -w type-check` only when staged changes include `.ts` / `.tsx` files; add separate `precommit:validate` (full pipeline) and `precommit:simulate` (scenario harness) scripts.
**Rationale:** Conditional gating maintains sub-second latency for docs/style/markdown-only commits while providing immediate feedback on type integrity when it matters; simulation harness future-proofs behavior against silent regressions and supports potential CI enforcement.
**Consequences:** Slight additional complexity in hook script (staged file detection) and maintenance of simulation scenarios; provides stronger local quality signal and foundation for automated guardrail. Future work may extend harness with JSON output & CI integration.

### ADR-008: Development Workflow Benchmarking & Onboarding Documentation

**Status:** Accepted (Aug 28, 2025)
**Context:** Need standardized measurement of local quality gate performance and consolidated onboarding to reduce ramp time and detect regressions early.
**Decision:** Introduce `precommit:benchmark` script capturing ESLint, Prettier, and TypeScript timings (avg/min/max) plus onboarding & workflow documentation (`developer-onboarding.md`, `development-workflow.md`).
**Rationale:** Quantified baselines enable future optimization (lint caching, selective scopes); centralized docs eliminate fragmented setup knowledge and enforce consistent quality gate understanding.
**Consequences:** Additional maintenance to keep docs & metrics current; minimal runtime overhead (on-demand invocation). Future optional JSON output & CI trend analysis deferred.

### ADR-009: Vite Dev Server Optimization & Safe Environment Reload

**Status:** Accepted (Aug 28, 2025)  
**Context:** Need faster iterative feedback (HMR), improved long-term browser caching, and safe developer ergonomics for adjusting non-secret client config without manual restarts. Existing static chunk mapping limited caching granularity; env changes required server restart.  
**Decision:** Introduce manual chunk function segmenting `react`, `@mui/*`, `socket.io-client` (realtime), and remaining vendor; add dev-only `envReloadPlugin` using `fs.watchFile` for `.env*` triggering full reload; centralize Vite `cacheDir`; extend optimizeDeps; add structural test to enforce config invariants.  
**Rationale:** Coarse segmentation maximizes cache-hit ratio with minimal request inflation; explicit test coverage reduces regression risk; central cache improves cold start; plugin approach maintains privacy (no value logging) while minimizing complexity (no external deps).  
**Consequences:** Slight config complexity increase; future bundle size monitoring deferred (visualizer not yet integrated). Production unaffected (plugin limited by `apply: 'serve'`). Follow-up tasks: bundle analyzer integration, HMR latency instrumentation, JSON chunk baseline tracking.  
**Alternatives Considered:** (1) Fine-grained per-package chunk splitting (risk: request overhead) rejected for premature complexity; (2) External env reload plugin dependency rejected to minimize supply chain surface.  
**Validation:** Lint/type/tests green; new `vite.config.test.ts` asserts manual chunk classification; no secret exposure detected in define serialization.

### ADR-010: Development Proxy Architecture (Local Cross-Origin Unification)

**Status:** Accepted (Aug 29, 2025)  
**Context:** Need consistent localhost origin for client (5173) interacting with future server API + Socket.IO while avoiding CORS friction and preventing accidental exposure of secrets or third-party websockets. AssemblyAI passthrough not yet required but considered for future ergonomics.  
**Decision:** Introduce dev-only proxy configuration controlled by literal env flags (`DEV_PROXY_ENABLED=true`, `DEV_PROXY_ASSEMBLYAI_ENABLED=false`) with deterministic helper `buildDevProxy` generating Vite `server.proxy` map for `/api`, `/socket.io`, and optional AssemblyAI realtime path. Conditional spread keeps config minimal and type-safe under `exactOptionalPropertyTypes`.  
**Rationale:** Centralized pure helper enables isolated testing (no Vite spin-up), reduces config drift, and establishes explicit security boundary (no secrets, no default third-party passthrough). Literal flags eliminate risk of production enablement via unvalidated env injection.  
**Consequences:** Slight increase in environment schema surface; additional maintenance if production proxy strategy diverges (may necessitate future ADR). AssemblyAI proxy intentionally disabled until auth & rate controls defined.  
**Alternatives Considered:** (1) Direct client calls to separate localhost ports (higher CORS/config overhead) rejected for dev ergonomics; (2) Broad wildcard proxy rejected due to overexposure risk.  
**Validation:** Lint/type/tests pass; unit tests assert helper invariants (disabled state returns undefined, custom path, timeout honored). No secret leakage (only non-sensitive paths/ports).  
**Follow-Ups:** Integration test once API routes implemented; potential enabling of AssemblyAI proxy with auth middleware; documentation update if production reverse proxy (NGINX/Traefik) introduced.

### ADR-011: Coordinated Development Orchestration & Health-Gated Startup

**Status:** Accepted (Aug 29, 2025)  
**Context:** Parallel `pnpm` dev scripts produced client race errors against not-yet-initialized server endpoints; Windows-specific `pnpm` spawning inconsistencies (ENOENT) reduced reliability; strict env schema complicated direct full-server invocation in a minimal smoke test context.  
**Decision:** Add orchestration script launching server first, polling `/api/health` until <500, then launching client and probing `/`; supply optional `--monitor` restart loop; introduce mock health server for smoke tests (`ORCHESTRATION_SMOKE=true`).  
**Rationale:** Sequenced, health-gated startup eliminates transient failures, improves developer confidence, and isolates orchestration logic for testing without relaxing configuration guarantees. Mock mode reduces dependency surface for CI smoke validation.  
**Consequences:** Additional script maintenance (spawn fallback, monitoring), distinct mock vs real test paths (real-server integration deferred). Monitoring presently simple (fixed interval, no exponential backoff or crash loop metrics).  
**Alternatives Considered:** Client-side retry wrapping (adds frontend complexity); environment schema relaxation (weakens guarantees); adopting external process manager (adds dependency surface, less tailored health logic).  
**Validation:** Smoke test passes (mock mode); manual real-mode validation confirmed client availability post server readiness; no runtime package code changed.  
**Follow-Ups:** Real-server orchestration test with curated env, structured JSON logging, dynamic port/health path overrides, exponential backoff & crash loop detection, ADR update after monitoring expansion.

### ADR-012: Enhanced Health Endpoint & Intelligent Restart Backoff

**Status:** Accepted (Aug 30, 2025)  
**Context:** Initial health endpoint returned minimal static fields (binary healthy). Lacked component granularity (dependencies) and provided no prioritization signal for emerging failures. Restart logic used fixed delay causing potential thrash under persistent failure and lacked circuit breaking.
**Decision:** Expand `/api/health` to structured multi-component response (dependency states, system metrics, score heuristic, tri-state status) and implement exponential backoff + circuit breaker restart logic in development orchestration with per-service configurable parameters.
**Rationale:** Granular health surface accelerates root cause isolation and supports future automated alerting; scoring offers at-a-glance overview for dashboards. Backoff reduces restart storm risk; circuit breaker prevents infinite crash loops and preserves developer machine resources.
**Consequences:** Slightly larger health payload; consumers expecting binary status must adapt (backward compatibility retained at top-level fields). Orchestration complexity increased but encapsulated; requires documentation of restart tuning semantics.
**Alternatives Considered:** (1) Introduce external process manager (PM2/Nodemon) — rejected for limited customization. (2) Weighted moving average scoring — premature complexity vs simple subtractive penalties. (3) Real network dependency pings — deferred to avoid test brittleness.
**Validation:** Updated tests accept `healthy|degraded`; no secret leakage; score calculation deterministic. All existing suites green.
**Follow-Ups:** Event loop lag metric, memory pressure degradation triggers, optional concise mode (no details), real dependency ping (opt-in), structured log emission of restart attempts.

### ADR-013: Declarative Service Manifest Orchestration & Generic Restart Framework

**Status:** Accepted (Aug 30, 2025)
**Context:** Inline orchestration logic constrained scalability (adding services required script edits) and limited resilience (fixed sequencing, ad-hoc env injection).
**Decision:** Introduce versioned `services.yaml` manifest with global + per-service config (commands, readiness/liveness parameters, dependencies, restart policy) and generic orchestrator performing topological sorting, readiness gating, liveness monitoring, exponential backoff restart with circuit breaker, and conditional smoke overrides.
**Rationale:** Manifest externalization reduces code churn, improves auditability (YAML diff review), enables zero-code service addition, and forms a stable contract for future parallel startup & multi-probe extensions.
**Consequences:** Slight complexity increase in loader & validation; current validation is structural (manual) pending Zod migration; sequential startup latency persists until parallel branches implemented.
**Alternatives Considered:** PM2/Nodemon layering (insufficient fine-grained policy control), JSON config (less human-friendly for multi-service editing), early adoption of full schema (higher upfront friction).
**Validation:** Unit tests (loader, topology) green; smoke path unaffected; consolidated learnings captured (File 006).
**Follow-Ups:** Zod schema migration, parallel branch concurrency, structured JSON event emission, multi-probe types (http/tcp/command), dry-run planning mode, CLI service filters, extracted pure backoff module tests.

### Resilience Pattern: Structured Health Scoring & Backoff Restart (Added 2025-08-30)

**Pattern:** Provide multi-dimensional health snapshot + adaptive restart strategy to improve local reliability insight and prevent thrash.
**Components:** Health Controller → Dependency Probes (mock-first) → Scoring Heuristic → Orchestrator Monitor Loop → Backoff Calculator → Circuit Breaker.
**Scoring Heuristic:** Start 100; subtract 40 for disconnected/unreachable, 15 for degraded/backpressure; thresholds: ≥90 healthy, ≥60 degraded else unhealthy.
**Restart Algorithm:** `delay = min(baseMs * 2^attempt, maxMs)`; after `maxAttempts` open circuit until `now + circuitCooldownMs`; reset attempts on successful probe.
**Benefits:** Faster triage, reduced noisy logs, tunable resilience. Foundation for future SLA dashboards.
**Metrics (Current):** Memory (rssMB, heapUsedMB, heapTotalMB). *Deferred:* eventLoopLagMs, cpuLoad normalization.
**Risks:** Over-simplified scoring may mask nuanced degradation → mitigate with future weight refinement & additional metrics; payload size growth minimal (<1 KB typical).
**Future Extensions:** Pluggable probe registry, asynchronous parallel probe execution, persistent restart analytics, threshold-based alert hooks.

## Development Workflow Patterns

### Pre-Commit Quality Gate Pattern

| Aspect | Implementation | Rationale |
|--------|----------------|-----------|
| Scope | Staged files only | Minimize latency; avoid full-repo scans |
| Tools | ESLint (--fix) + Prettier | Auto-remediation of style + basic issues |
| Enforcement | Conventional Commit regex in commit-msg | Consistent history & semantic versioning prep |
| Exclusions | Type-check, tests | Preserve speed; handled in CI gates |
| Extensibility | Documented in `docs/pre-commit-workflow.md` | Clear path for future enhancements |

### Hook Hardening Guidelines
1. Always include shebang (`#!/usr/bin/env sh`) for cross-platform consistency.
2. Send failure messaging to stderr to ensure visibility in various Git UIs.
3. Keep hook logic declarative; delegate work to package scripts or lint-staged config.
4. Avoid logging environment variable values (privacy & secret safety).
5. Provide documented skip procedure (`--no-verify`) for rare bulk operations.

### Future Enhancements (Deferred)
- Optional run-once type-check for large refactors.
- Secret scanning (git-secrets / trufflehog-lite) prior to push.
- Selective test execution for changed packages using pnpm filtering.
 - JSON benchmark emission + historical trend charting.
 - ESLint cache warm profiling to reduce cold start cost.
 - Incremental type-check using project references (if split emerges).

### Workflow Benchmarking Pattern (New)

| Aspect | Implementation | Rationale |
|--------|----------------|-----------|
| Timing Scope | ESLint, Prettier (check), TypeScript type-check | Focus on dominant local quality gate costs |
| Measurement | Iterative loop (N runs) compute avg/min/max | Smooth out transient variance |
| Invocation | Manual (`pnpm precommit:benchmark`) | Avoid adding latency to normal commits |
| Output | Human-readable table + warning threshold (>30s cumulative) | Immediate interpretability |
| Future Extension | Optional `--json` flag & CI trend capture | Enables regression dashboards |

Guidelines:
1. Normalize formatting before collecting baselines (prevents noisy deltas).
2. Exclude intentional lint-failing fixtures via narrow ignore patterns instead of disabling rules.
3. Record baseline in consolidated learning for discoverability.
4. Re-run after dependency upgrades affecting lint or type-check performance.

## Environment Configuration Patterns

### Comprehensive Environment Variable Architecture

**Schema-Driven Configuration Management:**
```
packages/shared/src/config/
├── environment.ts          # Zod schemas with 16 categorized groups
├── environmentLoader.ts    # Runtime validation and loading utilities  
└── index.ts               # Centralized exports with type safety
```

**16 Configuration Categories:**
1. **Node Runtime**: PORT, NODE_ENV, application lifecycle variables
2. **Database**: MongoDB/Redis connection strings with connection pooling settings
3. **AssemblyAI**: API keys, real-time transcription configuration, timeout settings
4. **Security**: JWT secrets, API keys, encryption settings with length validation
5. **UI Configuration**: Theme settings, feature toggles, responsive breakpoints
6. **Logging**: Log levels, structured logging configuration, output destinations
7. **Monitoring**: APM tokens, error tracking, performance monitoring settings
8. **Caching**: Redis caching strategies, TTL configuration, cache invalidation
9. **File Operations**: Upload paths, file size limits, storage configuration
10. **Networking**: CORS settings, rate limiting, timeout configurations
11. **Messaging**: Real-time communication, WebSocket configuration
12. **Authentication**: OAuth settings, session management, token validation
13. **Privacy Compliance**: GDPR settings, data retention policies, consent management
14. **Development Tools**: Debug settings, hot reload configuration, development utilities
15. **Error Tracking**: Sentry configuration, error aggregation settings
16. **Performance**: Resource limits, optimization flags, scaling thresholds

### Environment-Specific Security Tiers

**Development (.env.development.example):**
- Relaxed security requirements for rapid development
- Debug features enabled, verbose logging
- Local service URLs and extended timeouts
- Development-friendly API key validation (shorter minimums)

**Staging (.env.staging.example):**  
- Production-like configuration with testing flexibility
- SSL/TLS requirements enabled for security testing
- Structured logging for monitoring validation
- Privacy compliance features enabled for integration testing

**Production (.env.production.example):**
- Maximum security configuration with strict validation
- Mandatory SSL/TLS with certificate management
- 32+ character minimum for JWT secrets and encryption keys
- Comprehensive security headers and compliance requirements

### Runtime Validation Architecture

**Startup Validation Flow:**
```
Application Boot → validateEnvironmentOnStartup() → 
Parse Environment → Zod Schema Validation → 
Type Generation → Error Reporting → Application Ready
```

**Validation Features:**
- Performance timing (startup validation duration tracking)
- Detailed error messages with specific variable names and expected formats
- Environment utility functions (isDevelopment, isProduction, isStaging)
- TypeScript type generation from Zod schemas for compile-time safety
- Graceful error handling with actionable developer guidance
 - Client projection safety: explicit allow-list blocks accidental secret inclusion (KEY|SECRET|TOKEN patterns)
 - Feature flag parsing: `CLIENT_FEATURE_FLAGS="a,b,c"` → normalized Set enabling O(1) flag lookups and dynamic test mutation

### Implementation Benefits

- **Developer Experience**: Clear error messages and comprehensive documentation
- **Type Safety**: Compile-time TypeScript checking combined with runtime validation  
- **Security**: Environment-specific security requirements and validation
- **Maintainability**: Centralized configuration management across monorepo
- **Deployment Safety**: Startup validation prevents misconfigured deployments
- **Client Security**: Sanitized projection ensures no secret categories reach the bundle
- **Testability**: Dynamic flag evaluation (no static cache) enables per-test environment mutation without reset hooks

### Declarative Service Manifest Orchestration Pattern (Added 2025-08-30)

**Context:** Initial coordinated dev orchestration (ADR-011) used inline hardcoded configuration for two services (server/client). Anticipated expansion (e.g., additional mock connectors, future audio processing workers) would necessitate script edits and increase regression risk.

**Decision:** Introduce root `services.yaml` manifest defining global polling/monitoring/backoff plus per-service command set (dev vs smoke), port, healthPath, startup timeouts, dependencies, environment interpolation (`${port}`), and optional smoke overrides. Refactor orchestration script to dynamically load manifest, perform dependency-aware (DFS topological) startup, and apply generic monitoring & restart logic across all services.

**Rationale:** Externalizing topology yields zero-code service addition, central governance of operational parameters, improved review clarity (manifest diffs), and foundation for future enhancements (parallel DAG branch startup, richer validation). Cycle detection strengthens robustness as service graph grows.

**Mechanics:** Loader parses YAML, performs structural validation (presence + primitive types), aggregates errors, interpolates placeholders, returns typed object (ambient d.ts). Orchestrator executes DFS ordering, sequential readiness probes, and interval-based health monitoring with restart semantics.

**Benefits:** Decoupled configuration, scalability, reduced code churn, explicit dependency modeling, aggregated validation errors, maintainable smoke strategy via per-service overrides.

**Risks & Mitigations:** Limited semantic validation (range/enum) → plan Zod manifest schema. Sequential startup latency → planned parallel independent branch startup. Coarse polling monitoring → roadmap for event probes & adaptive intervals.

**Follow-Ups:** Zod schema, JSON structured logging & metrics, CLI service filters, parallel startup, extended health probes (WS, script), crash loop detection & exponential backoff.

**Version Impact:** Version bumped to 2.8.0 to reflect new orchestration pattern integration.

### ADR-014: Dev Server Validation & Test-Centric Hot Reload Strategy

**Status:** Accepted (Aug 31, 2025)
**Context:** Need reliable, low-latency validation of dev server behavior (env-driven reloads, proxy correctness, HMR state retention) without incurring flakiness and overhead of full Vite + Socket.IO orchestration during routine CI/test runs. Prior inline plugin + global test export hack impeded isolation and increased regression surface.
**Decision:** Extract `envReloadPlugin` into standalone module (serve-only), implement unit test with minimal mock server (EventEmitter + ws.send), replace planned standalone validation script with integrated test suite (plugin reload, proxy forwarding, simulated HMR state retention), and adopt minimal HTTP proxy harness instead of full-stack socket-equipped environment for baseline forwarding coverage.
**Rationale:** Pure module extraction enables deterministic testing and simpler maintenance; test-centric approach collapses duplicated logic and ESM loader complexity; simulated react-refresh harness captures majority of regression risk at fractional cost; minimal integration test reduces flake and accelerates feedback loops.
**Consequences:** WebSocket proxy forwarding and strict real HMR verification deferred (explicit follow-up items). Simulated harness may not always preserve state in jsdom, requiring permissive assertion (documented) to avoid false negatives.
**Alternatives Considered:** (1) Retain inline plugin with global injection (fragile); (2) Maintain external validation script (duplication, drift risk); (3) Full Vite spin-up integration test (slower, flaky, higher maintenance). All rejected in favor of modular + test-centric approach.
**Validation:** Lint/type/tests green; plugin test reliably emits `full-reload`; proxy forwarding integration test passes (status, headers); no secret exposure; added `@types/react-refresh` for type completeness.
**Follow-Ups:** WebSocket upgrade forwarding test (socket.io echo), Vite-in-process strict HMR suite, negative-path proxy error handling tests, watcher disposal assertion, reload latency performance metric instrumentation, potential consolidation of test utility scaffolds.
