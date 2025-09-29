# System Patterns – Runtime & Operational (Segment 003)

Last Updated: 2025-09-28 | Segment Version: 1.3.0

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
5. Privacy compliance (local processing options)
6. Secure API key management (no logging)
7. Client input validation & XSS protection

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
