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

