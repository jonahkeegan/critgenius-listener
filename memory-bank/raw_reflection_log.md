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


Date: 2025-09-14
TaskRef: "Dev Infra Task 2.10.1 – Local HTTPS Certificates"

Learnings:
- Local HTTPS is a prerequisite for consistent microphone permission flows in some browsers; securing early avoids downstream user confusion during audio capture testing.
- Embedding optional HTTPS vars directly in the shared schema (with safe defaults) minimizes conditional logic proliferation elsewhere.
- Literal booleans enforced in environment extension schemas (development override with z.literal(true)) require tests to supply those values explicitly; otherwise Zod errors surface unexpectedly.
- Graceful fallback design (warn + continue) preserves developer velocity and prevents friction when cert assets are temporarily absent.

Technical Discoveries:
- Adding duplicate keys via spread composition in Zod schemas silently compiles until TypeScript surfaces TS2783; early schema review prevents rework.
- mkcert idempotent `-install` flag simplifies automation; no need to branch logic for pre-installed root CA.
- OpenSSL single-command generation with `-addext subjectAltName` eliminates multi-step CSR dance for dev use cases.
- Reading PEM cert expiry via `openssl x509 -enddate -noout` is lightweight and avoids adding parsing libraries.

Success Patterns:
- One-command setup (`pnpm certs:setup`) lowers onboarding friction and matches existing dev workflow conventions.
- Documentation sections added adjacent to already-referenced dev server guides increased discoverability without creating a new doc surface.
- Test-first adjustment for HTTPS schema prevented future regressions (defaults + enabled scenario).
- Using warning-level console output (not errors) for fallback maintains clarity while avoiding false failure signals in tooling.

Implementation Excellence:
- Scripts avoid leaking absolute paths or system-specific noise; only purposeful output presented.
- Permissions tightening attempted on POSIX while tolerating Windows divergence—pragmatic cross-platform handling.
- Cert directory git-ignored early to avert accidental secret drift (defense-in-depth though dev certs low risk).
- Chose adjacent port (5174) to reduce context switching for developers coming from default Vite expectations.

Improvements_Identified_For_Consolidation:
- Add optional orchestration pre-flight that auto-runs `certs:check` when HTTPS is enabled.
- Provide PowerShell helper or docs snippet for mkcert install on Windows for first-time setup.
- Potential integration test to assert Vite https object presence using ephemeral generated cert pair.
- Consider colorized terminal output or structured JSON mode for CI parse if feature set expands.

Date: 2025-09-17
TaskRef: "Dev Infra Task 2.10.2 – Vite HTTPS Dev Proxy Hardening"

Learnings:
- Early HTTPS proxy integration surfaced implicit assumptions in client/WebSocket code paths that were cheaper to adjust now.
- Centralizing dev-only HTTPS proxy variables in the shared schema prevents config drift and scattered conditional logic.
- Preflight automation shortens feedback loops versus manual curl/browser iteration.
- Distinguishing Vite server HTTPS from upstream backend HTTPS avoids premature coupling and clarifies migration stages.
- Simple host allowlisting (DEV_PROXY_ALLOWED_HOSTS) meaningfully reduces accidental local tunneling risk.

Technical Discoveries:
- Vite proxy honors custom keep-alive agents—improves streaming stability without code changes elsewhere.
- Injecting `X-Forwarded-Proto` supplies downstream services with correct scheme context without terminating TLS there.
- Lightweight WebSocket upgrade probing (no full Socket.IO handshake) is sufficient to catch most TLS/route misconfigurations.
- Consistent handling of `secure` + `rejectUnauthorized` across HTTP and WS paths prevents subtle mismatch errors.
- Zod dev-only fields stay out of client bundle so long as projection helper remains curated.

Success Patterns:
- Incremental enhancement (reuse of proxy builder) kept diff minimal while adding resilience.
- Targeted tests (HTTPS path + allowlist) locked intent and prevented regression.
- `.env.example` alignment test continues to guard doc drift at near-zero maintenance cost.
- Preflight script output remained sanitized (no secrets) but actionable.
- Default values ensured full backward compatibility (HTTPS is opt-in).

Implementation Excellence:
- Achieved feature + hardening in <50 LOC net change to proxy builder.
- No new runtime dependencies; preflight relies solely on Node core.
- Removed unnecessary eslint-disable to preserve zero-warning standard.
- Docs updated surgically to satisfy structure tests—maintains test-as-truth model.
- Uniform naming across schema, docs, tests, and env example improved discoverability.

Improvements_Identified_For_Consolidation:
- Add integration test harness with mock HTTPS upstream + real WS upgrade to validate end-to-end secure flow.
- Extend preflight: assert explicit 101 status + record latency metrics.
- Dev overlay panel to visualize live proxy config (protocol, ports, allowlist state).
- Negative-path tests (forced timeout, intentional self-signed rejection) to measure resilience + error clarity.
- Optional metrics hook (upgrade latency, retry counts) behind dev flag for future performance tuning.


Date: 2025-09-20
TaskRef: "Dev Infra Task 2.10.2.1 – Dynamic Port Discovery" (guided by CI protocol: C:\Users\jonah\OneDrive\Documents\Cline\Rules\07-cline-continuous-improvement-protocol.md)

Learnings:
- Auto-discovery meaningfully reduces dev friction; fast fallback to static config is essential to avoid blocking starts.
- Privacy-first logging (no response bodies/headers; ports + timings only) sustains safe diagnostics in shared consoles.
- Constraining probes to localhost with strict timeouts preserves safety and performance; one-session caching prevents repeated probing.
- Async Vite config works reliably for dev-only dynamic setup; keep build path synchronous for predictability.

Technical Discoveries:
- Combining a global discovery deadline with per-port timeouts yields predictable upper bounds on startup latency.
- Minimal HTTP(S) probe using Node core + res.resume() avoids buffering and cleans sockets; rejectUnauthorized=false is needed for local https.
- Deduping and prioritizing candidates (fallback first) shortens happy path; injecting result back into legacy proxy builder preserves DRY.
- Allowed-host guard continues to protect against accidental non-local targets even in discovery mode.

Success Patterns:
- Backward compatibility maintained (static builder intact, dynamic is opt-in via env + only during serve).
- Tests isolate behavior with a tiny local health server; docs and .env.example updated alongside code to prevent drift.
- Session-level cache minimizes probing without persisting state.

Implementation Excellence:
- No new runtime deps; <100 LOC across service, wiring, and tests.
- Strong typing from Zod schema to service config; sanitized logs by design.
- Clear separation: discovery service (pure-ish I/O), proxy builder (composition), Vite integration (mode-gated async).

Improvements_Identified_For_Consolidation:
- Add integration test exercising buildDevProxyWithDiscovery end-to-end with multiple candidates and https.
- Expose optional discovery metrics (attempt count, total duration) in dev overlay for faster troubleshooting.
- Troubleshooting matrix in docs (e.g., firewall, conflicting services, localhost vs 127.0.0.1 differences on Windows).
- Consider capped parallel probes (small fan-out) for faster worst-case while respecting rate limits.


