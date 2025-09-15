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


