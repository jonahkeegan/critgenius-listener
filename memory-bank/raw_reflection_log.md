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
- <bullet>

Technical Discoveries:
- <bullet>

Success Patterns:
- <bullet>

Implementation Excellence:
- <bullet>

Improvements_Identified_For_Consolidation:
- <bullet>
```

---

*Ready for new entries.*

Date: 2025-08-30
TaskRef: "2-9-3 Declarative Service Manifest Orchestration"

Learnings:
- Decoupling orchestration configuration into a manifest significantly reduced cognitive load and improved extensibility; topology shifts now require zero code edits.
- Lightweight structural validation (manual) was sufficient initially; full schema (Zod) can be deferred without blocking value delivery.
- Topological sorting with explicit cycle detection is a low-cost safeguard that hardens future scalability.
- Smoke mode encapsulated per-service (smokeCommand + smokeStartupTimeoutMs) is more maintainable than global branching logic.
- Interpolating dynamic values (e.g. ${port}) inside manifest environment blocks removes duplication and error risk.

Technical Discoveries:
- Manual YAML validation plus targeted error aggregation provides clear developer feedback while avoiding dependency bloat.
- Ambient .d.ts file beside a `.mjs` script enables typed test imports without altering build configuration.
- A single generic monitoring loop can manage N services with uniform restart semantics—no need for per-service branching.
- Cycle detection via DFS sets (temp/perm) is concise and robust for small-to-medium service graphs.
- Environment injection strategy (only set if undefined) prevents accidental override of user-specific overrides.

Success Patterns:
- Introduced feature parity refactor with zero regression by retaining probe + health semantics and adding tests early.
- Documentation (sequence diagrams) immediately after implementation accelerates onboarding and future iteration.
- Reusing existing probe function prevented divergent health logic paths.
- Incremental layering (loader -> orchestration refactor -> tests -> docs) minimized integration friction.
- Clear separation of manifest concern vs. orchestration logic improved readability.

Implementation Excellence:
- Added cycle detection and failure fast behavior—avoids silent partial startup states.
- Generic restart logic leverages manifest-driven intervals/backoff, enabling future per-service overrides.
- Interpolation handled before spawning processes, ensuring env values are correct and deterministic.
- Error messaging aggregates all manifest validation issues for one-pass fix cycles.
- Test coverage validates load, interpolation, and error pathways (missing file), giving confidence for future manifest edits.

Improvements_Identified_For_Consolidation:
- Upgrade validation to Zod for richer type + range checking and future editor tooling synergy.
- Add parallel startup for independent services to reduce total cold-start latency.
- Provide CLI flags for selective service inclusion/exclusion (e.g. focus dev on server only).
- Add JSON structured logging mode for machine-readable orchestration metrics.
- Extend health strategies (WebSocket ping, custom script) for services without simple HTTP readiness.

Date: 2025-08-30
TaskRef: "2-9-3 Enhanced Health Checks & Intelligent Restart Logic"

Learnings:
- Expanding health output with structured component states enables early anomaly detection without log diving.
- A score heuristic (0-100) gives an at-a-glance indicator while preserving granular `details`—dual-level observability is valuable.
- Mock-first dependency checks (env + format validation) decouple reliability features from external infrastructure availability in early phases.
- Memory snapshot (rss / heap) provides immediate signal for runaway leaks during dev without heavy profiler overhead.
- Tri-state health (`healthy|degraded|unhealthy`) better reflects partial impairment vs binary OK/fail responses.

Technical Discoveries:
- `exactOptionalPropertyTypes` requires constructing detail objects conditionally—spreading undefined fields triggers type friction; building objects incrementally avoids this.
- Adding circuit breaker state to an in-memory map is sufficient for dev orchestration; persistent state is unnecessary at this maturity stage.
- Score threshold tuning is straightforward when subtractive penalties are coarse-grained (major vs minor faults) rather than per-check weighting.
- Per-service restart config in `services.yaml` scales better than global-only knobs; supports future specialization (e.g., chat gateway vs transcription core).
- Health endpoint latency stayed negligible with synchronous mock checks; deferring real network pings prevents timeout stacking.

Success Patterns:
- Updated tests in lockstep with schema change prevented brittle expectations (accepting `healthy|degraded`).
- Isolated backoff calculation logic conceptually (even before extraction) making future unit tests trivial to add.
- Non-invasive enhancement: existing consumers of `/api/health` still parse prior top-level fields; additive changes are backwards compatible.
- Using simple penalties instead of dynamic weighted averages minimized over-engineering while meeting monitoring goals.
- Incrementally layering circuit breaker after implementing exponential backoff reduced cognitive load.

Implementation Excellence:
- Avoided secret exposure: only key presence/length checked—no accidental logging paths added.
- Conditional object assembly satisfied strict TS settings without resorting to `as` casts, maintaining type integrity.
- Restart logic respects circuit open window, preventing rapid thrash and CPU churn during persistent failure states.
- Manifest restart parameters use explicit names (baseMs, maxMs, maxAttempts, circuitCooldownMs)—self documenting in YAML.
- Tests relaxed expectations deliberately—documented rationale prevents future accidental re-tightening.

Improvements_Identified_For_Consolidation:
- Extract and unit test pure backoff + circuit breaker decision function for deterministic coverage (edge: maxAttempts, cooldown expiry).
- Add event loop lag measurement (interval sampling) to enrich `system.eventLoopLagMs` metric.
- Provide verbose=false query param to suppress `details` for ultra-lightweight probes (CI / uptime pingers).
- Integrate real dependency pings behind opt-in env flags to preserve fast responses locally.
- Emit structured log line for each restart attempt including attempt, backoff, reason, circuit state.
- Document health schema in architecture & ops guides; include versioning plan for future fields.
- Add degrade triggers for memory thresholds (e.g., >70% heap used) to preempt OOM issues.

