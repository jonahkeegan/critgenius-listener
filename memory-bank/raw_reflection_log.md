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

Date: 2025-08-29
TaskRef: "Task 2.9.2: Development Proxy Configuration (Vite → API / Socket.IO / AssemblyAI)"

Learnings:
- Isolating proxy logic behind a pure helper (`buildDevProxy`) enables deterministic unit testing without invoking full Vite/esbuild pipeline (reduces infra test flakiness).
- Prefixing all development-only vars with `DEV_PROXY_` creates an immediate visual + grep filter to prevent accidental production coupling.
- Enforcing literal defaults (`z.literal(true)`) in the development schema for always-on conveniences (proxy enable flags) clarifies intent and avoids unnecessary env churn.
- Skipping secret header injection for AssemblyAI during early exploration is a deliberate DX vs. security trade: lowers immediate complexity while signaling future secure mediation.
- Fallback logic in tests (graceful `.env.example` absence) guards against environment-dependent filesystem issues on CI or partial checkout scenarios.

Technical Discoveries:
- Vite `server.proxy` accepts conditional spread patterns cleanly under `exactOptionalPropertyTypes` so long as the property is omitted (not undefined) when disabled.
- WebSocket proxy stability requires explicit `ws: true` and (in local dev) `secure: false`; omitting either can produce silent upgrade failures behind corporate proxies.
- AssemblyAI path rewriting is safest when using a unique prefix path (e.g., `/proxy/assemblyai`) to avoid collisions with future internal API routes.
- Timeouts (`timeout` in proxy options) offer a simple guardrail against hanging external calls without introducing extra abort logic.

Success Patterns:
- Added documentation (`docs/development-proxy.md`) contemporaneously with implementation—prevents drift and shortens onboarding cycle.
- Test suite targets the pure function (not the build config) shrinking execution time and surface area for flakey environment invariants.
- Environment schema ↑ test alignment (env var presence + defaults) continues the pattern of schema-as-source-of-truth.
- Security review table in completion report creates an auditable artifact for future ADR formalization (candidate ADR-010).

Implementation Excellence:
- Zero production impact (proxy only constructed in dev branch paths) preserving deployment confidence.
- No new runtime dependencies; leveraged existing TypeScript + Vite types for integration.
- Structured sequence diagram in completion report clarifies request flow—useful for future debugging & knowledge transfer.
- Chose minimal variable surface (5 keys) to reduce cognitive overhead while covering 90% of customization needs.

Improvements_Identified_For_Consolidation:
- Implement secure server-side AssemblyAI signing/forward endpoint to eliminate any temptation to expose API key via client path.
- Add optional debug logging hook with redaction safeguards for timing & error classification (latency observability).
- Consider automatic backend port probe (fallback to disabled proxy with informative warning) to reduce misconfiguration friction.
- Introduce ADR-010 to formally capture dev proxy architecture, security boundaries, and future enhancement roadmap.
- Add coverage for WebSocket upgrade pass-through (integration test using mocked Socket.IO client behind proxy) in a future infra task.

Date: 2025-08-28
TaskRef: "Task 2.9.1: Vite Dev Server Enhancement (HMR + Build Optimization)"

Learnings:
- Incremental enhancement of existing config (surgical modifications) yields low-risk performance + DX wins without refactor churn.
- Coarse-grained manual chunk buckets (react / mui / realtime / vendor) strike a balance between cache efficiency and avoiding request proliferation.
- Explicitly surfacing environment-derived client config through a single serialized define key simplifies future audit for secret exposure.
- Separation of qualitative expectation setting (not yet benchmarked) from delivered changes keeps scope disciplined and avoids premature optimization claims.

Technical Discoveries:
- `fs.watchFile` polling proves more reliable than native watch on some Windows setups for `.env` changes; acceptable overhead given small file size.
- Vite `manualChunks` function form offers simpler future extensibility (e.g., icon sub-chunk) versus static object mapping.
- Placing `cacheDir` inside shared workspace node_modules reduces duplicate caches across packages and shortens cold start.
- Guarding `import.meta.vitest` prevents accidental environment branching during production builds when tests import config.

Success Patterns:
- Added test (`vite.config.test.ts`) immediately with config changes, converting infrastructure config into a unit-tested asset.
- Maintained privacy-first stance (no logging of values) while enabling dynamic env reload capability.
- Kept enhancements orthogonal (HMR polish, chunking, env reload, caching) to simplify debugging if regressions appeared.
- Documentation via completion report ensures transparent rationale for each config knob.

Implementation Excellence:
- Avoided new runtime dependencies; leveraged core Node + existing plugins only.
- Manual chunking function written declaratively, easy to expand while keeping deterministic naming.
- Dev-only plugin isolated with `apply: 'serve'` minimizing production risk surface.
- Alias moved to `path.resolve` for cross-platform correctness without introducing brittle relative assumptions.

Improvements_Identified_For_Consolidation:
- Add bundle size analyzer & record baseline to quantify future reductions.
- Implement HMR timing overlay to gather empirical <200ms update target metrics.
- Extend env reload plugin to debounce rapid successive writes and log a single summarized reload notice.
- Add integration test ensuring `.env` change triggers full reload & updated client config consumption.
- Consider chunk size threshold monitoring (bundler analyzer CI gate) to detect drift early.
