# System Patterns – Development & Infrastructure (Segment 002)

Last Updated: 2025-09-28 | Segment Version: 1.2.0

Parent Index: `systemPatterns-index.md` | Upstream ADR Context: Segments 001 & 002 combined form
full decision set.

## Architectural Decisions (ADR-008 → ADR-014)

### ADR-008: Development Workflow Benchmarking & Onboarding Documentation

Status: Accepted (Aug 28, 2025)  
Context: Standardize quality gate performance & onboarding.  
Decision: Benchmark script + centralized docs (`developer-onboarding.md`,
`development-workflow.md`).  
Rationale: Quantified baselines enable optimization; reduces ramp time.  
Consequences: Maintenance overhead of metrics/doc alignment.

### ADR-009: Vite Dev Server Optimization & Safe Environment Reload

Status: Accepted (Aug 28, 2025)  
Decision: Manual chunk segmentation; dev-only `envReloadPlugin`; optimized deps + cache
centralization.  
Rationale: Faster HMR + stable caching; privacy-preserving reload triggers.  
Consequences: Slight config complexity; follow-up instrumentation deferred. Update 2025-09-06: Added
explicit options + path canonicalization & dedup.

### ADR-010: Development Proxy Architecture (Local Cross-Origin Unification)

Status: Accepted (Aug 29, 2025)  
Decision: Dev-only proxy via pure `buildDevProxy` helper (API, Socket.IO, optional AssemblyAI path
disabled by default).  
Rationale: Avoid CORS friction; explicit security boundary.  
Consequences: Additional env schema surface; AssemblyAI passthrough gated.

### ADR-011: Coordinated Development Orchestration & Health-Gated Startup

Status: Accepted (Aug 29, 2025)  
Decision: Orchestrated startup (server health gate) + optional monitor loop & smoke mode.  
Rationale: Eliminates race errors; improves local reliability.  
Consequences: Script maintenance; monitoring complexity grows with services.

### ADR-012: Enhanced Health Endpoint & Intelligent Restart Backoff

Status: Accepted (Aug 30, 2025)  
Decision: Structured multi-component health + exponential backoff & circuit breaker in
orchestration.  
Rationale: Faster triage; prevents restart thrash.  
Consequences: Larger payload & orchestration complexity.

### ADR-013: Declarative Service Manifest Orchestration & Generic Restart Framework

Status: Accepted (Aug 30, 2025)  
Decision: `services.yaml` manifest + generic orchestrator (topology, liveness, restart/backoff).  
Rationale: Zero-code service addition; auditability; resilience scalability.  
Consequences: Loader validation complexity pending Zod migration.

### ADR-014: Dev Server Validation & Test-Centric Hot Reload Strategy

Status: Accepted (Aug 31, 2025)  
Decision: Extract `envReloadPlugin`, unit & integration test harness (simulated HMR, proxy
forwarding).  
Rationale: Deterministic, low-flake validation replacing ad-hoc scripts.  
Consequences: WebSocket proxy & strict HMR retention deferred. Pattern Update (2025-09-03):
Playwright integration test (navigation-count reload validation).

## Development Workflow Patterns

### Pre-Commit Quality Gate Pattern

| Aspect        | Implementation            | Rationale            |
| ------------- | ------------------------- | -------------------- |
| Scope         | Staged files only         | Minimize latency     |
| Tools         | ESLint (--fix) + Prettier | Auto remediation     |
| Enforcement   | Conventional Commit regex | History consistency  |
| Exclusions    | Type-check, tests         | Preserve speed       |
| Extensibility | Documented workflow guide | Clear evolution path |

### Hook Hardening Guidelines

1. Shebang for cross-platform consistency
2. Failure messaging to stderr
3. Delegate heavy work to scripts
4. Never log env values
5. Document skip procedure (`--no-verify`)

### Future Enhancements (Deferred)

- Optional run-once type-check
- Secret scanning pre-push
- Selective test execution via pnpm filters
- JSON benchmark emission & trending
- ESLint cache warm profiling
- Incremental TS project references (future split)

### Workflow Benchmarking Pattern

| Aspect       | Implementation               | Rationale             |
| ------------ | ---------------------------- | --------------------- |
| Timing Scope | ESLint, Prettier, TypeScript | Dominant cost centers |
| Measurement  | N-run avg/min/max            | Smooth variance       |
| Invocation   | Manual script                | Avoid routine latency |
| Output       | Human table + threshold      | Fast interpretation   |
| Future       | Optional JSON                | Trend dashboards      |

Guidelines:

1. Normalize formatting before baseline capture
2. Use narrow ignore patterns over rule disabling
3. Record baseline in consolidated learnings
4. Re-run after impactful dependency upgrades

## Environment Configuration Patterns

### Comprehensive Environment Variable Architecture

Schema-driven design with Zod categories (16 groups: Node Runtime, Database, AssemblyAI, Security,
UI Configuration, Logging, Monitoring, Caching, File Operations, Networking, Messaging,
Authentication, Privacy Compliance, Development Tools, Error Tracking, Performance).

### Environment-Specific Security Tiers

- Development: relaxed, verbose logging
- Staging: production-like with structured logging
- Production: strict validation, TLS, strong secret length requirements

### Runtime Validation Architecture

Flow: Boot → `validateEnvironmentOnStartup()` → Parse → Zod Validate → Types → Ready Features:
timing metrics, detailed errors (variable + format only), env utility guards, allow-list client
projection, dynamic feature flag parsing (Set), no secret echoing.

### Implementation Benefits

- Developer Experience (actionable errors)
- Type Safety (compile + runtime)
- Security (tiered enforcement)
- Maintainability (centralized schemas)
- Deployment Safety (fail-fast misconfig)
- Client Safety (sanitized projection)
- Testability (no static env cache)

### Env Template Drift Guard & Deterministic Loader Precedence (Task 2.10.3)

Pattern: Schema-driven generation of canonical `.env.example` + minimal per-environment override
templates with drift detection, combined with a deterministic, non-mutative layered dotenv loading
strategy.

Context: Manual edits to `.env.example` risked divergence from evolving Zod schemas and
proxy-managed variables; prior loader implicitly mutated `process.env`, obscuring test boundaries
and precedence ordering.

Decision:

1. Introduce generator scripts (`generate-env-template.mjs`, `generate-env-overrides.mjs`) sourcing
   a single schema + proxy registry to emit categorized templates (managed section clearly
   delimited).
2. Provide `--check` mode to enable fast drift detection locally (pre-commit) and in CI without
   rewriting files.
3. Define explicit precedence: base `.env` → `.env.{NODE_ENV}` → existing `process.env` → validated
   merged snapshot (no in-place mutation) passed into schema.
4. Apply development flag coercion (interpret literal "true" for specific legacy dev-only toggles)
   to reduce friction while maintaining strict production typing.
5. Add conditional pre-commit hook block running drift checks only when relevant
   schema/scripts/template paths are staged (performance preservation).

Benefits:

- Single Source of Truth: Eliminates silent schema/template drift.
- Determinism & Testability: Pure load pipeline simplifies unit tests and debugging.
- Developer Ergonomics: Reduced boilerplate / confusion around boolean dev flags.
- Privacy: No raw secret logging; managed proxy section insertion deterministic & sanitized.
- Fast Failure: Drift or precedence issues surface before runtime or PR review.

Risks & Mitigations:

- Risk: Generator omission in CI → Mitigation: planned CI `generate:env:check` stage.
- Risk: Over-coercion masking misconfig → Mitigation: limited to explicit allowlist of dev-only
  flags.
- Risk: Future category reordering noise in diffs → Mitigation: stable category ordering + reserved
  comment delimiters.

Follow-Ups:

- Add integration test asserting override layering correctness.
- Provide JSON emission mode for tooling introspection.
- Draft ADR formalizing precedence rationale and managed section provenance.

Change Traceability: Reflected in progress log (2025-09-25 entry), task report, and raw reflection
log; index updated.

## Declarative Service Manifest Orchestration Pattern (Recap)

Context: Scaling beyond inline dual-service orchestration. Decision: Versioned `services.yaml` +
loader + orchestrator (DFS ordering, restart/backoff, smoke mode overrides). Benefits: Auditability,
zero-code service addition, explicit dependency modeling, resilience tuning. Risks & Mitigations:
Limited semantic validation → planned Zod schema. Sequential startup latency → planned parallel DAG
branches. Follow-Ups: Schema migration, structured logging, CLI filters, parallel startup, extended
probes.

## Dev Server Validation & Reload Testing (Extended)

Components: `envReloadPlugin`, unit test (mock server), integration test (Playwright navigation
reload), simulated HMR harness, proxy forwarding test. Follow-Ups: WebSocket upgrade forwarding,
strict HMR state retention, latency instrumentation, watcher disposal assertion, negative-path proxy
tests.

## Secure Microphone Access Validation Pattern (Task 2.10.4)

**Context:** Web Audio API access requires a secure context (HTTPS/localhost), explicit permission
management, and privacy-preserving diagnostics. Prior client code lacked microphone capability
checks, leading to inconsistent behavior across browsers and no regression coverage for secure
contexts.

**Decision:**

1. Introduce `createMicrophoneAccessGuard()` to centralize capability detection, secure-context
   enforcement, and permission state inspection (returns typed statuses: supported,
   secure-context-required, permission-blocked, unavailable).
2. Build `createAudioCaptureController()` to orchestrate the guard, manage MediaStream lifecycles,
   and lazily provision an `AudioContext` while keeping the stream disconnected from speakers to
   avoid feedback.
3. Establish Vitest unit coverage for guard and capture logic plus a Playwright HTTPS harness that
   boots the Vite dev server with a self-signed certificate and validates microphone access across
   Chromium, Firefox, and WebKit.
4. Record a browser compatibility matrix and operational guidance in
   `docs/microphone-access-validation.md` for discoverability.

**Rationale:** Central guard avoids duplicative `getUserMedia` logic, surfaces deterministic
diagnostics for UI retries, and supports privacy rules (no raw permission payload logging). The
Playwright suite ensures secure-context regressions are caught early while staying offline via fake
microphone devices.

**Consequences:** Added dependencies on Playwright execution during full validation, requirement to
maintain self-signed certificate fixtures, and mild startup cost for HTTPS Vite server within tests.
Edge-specific automation deferred (Chromium coverage deemed sufficient short-term).

**Follow-Ups:** Extend diagnostics to structured logging sink, add latency/performance metrics to
Playwright harness, and wire guard/controller into client UI flows.

## Change Log

- 2025-09-25: Added Env Template Drift Guard & Deterministic Loader Precedence pattern (Task
  2.10.3); version bump 1.1.0
- 2025-09-12: Extracted development & infrastructure content from legacy monolith into Segment 002.

---

End of Segment 002.
