# System Patterns - Crit Genius Listener

**Last Updated:** 2025-09-06 **Version:** 2.13.0 **Dependencies:** projectbrief.md,
productContext.md

## Architectural Decisions

## System Patterns (Segmented)

This monolithic file has been decomposed into thematic segments for maintainability, context efficiency, and line-count governance.

### Current Segments
- Architectural Foundations: `systemPatterns-001.md`
- Development & Infrastructure: `systemPatterns-002.md`
- Runtime & Operational: `systemPatterns-003.md`
- Index & Navigation: `systemPatterns-index.md`

### Rationale
- Faster targeted loading (only needed domain)
- Clearer thematic ownership & future scalability
- Consistent with existing progress & tech context versioning systems

### Historical Reference
The final pre-segmentation snapshot is preserved in `systemPatterns-legacy-2025-09-12.md`.

### Maintenance
Do not add new content here. Update the appropriate segment and then refresh `systemPatterns-index.md`.

---
End of stub.

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

### Pattern Update (2025-09-03): Env Reload Integration Test Scaffold
**Context:** Need end-to-end verification that environment reload plugin behavior matches real browser execution (unit + simulated tests insufficient for confidence in navigation-triggered reload path).
**Implementation:** Added Playwright-driven integration test (programmatic Vite server + Chromium) asserting exactly one navigation reload within 2s after `.env` mutation; captures baseline latency; uses navigation counting to avoid direct WebSocket coupling initially.
**Benefits:** High-signal validation with minimal flake; foundation for expanding scenario matrix (extra watch paths, negative cases, debounce behavior, restart resilience). Maintains privacy (no env value logging) and keeps dependency scope localized to client workspace.
**Deferred Enhancements:** WebSocket frame shape assertion, structured log capture (non-silent logger), latency threshold alerting, server restart path test, consolidated integration utility module.
