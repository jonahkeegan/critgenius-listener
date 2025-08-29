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
