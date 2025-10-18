# System Patterns – Quality Gates & Coverage Governance (Segment 004)

Last Updated: 2025-10-17 | Segment Version: 1.2.0

Parent Index: `systemPatterns-index.md`

## Coverage Governance Patterns

### Tiered Coverage Enforcement Pattern (Task 3.2.1)

- **Pattern:** Enforce differentiated coverage thresholds per package tier while ensuring parity
  across configuration, automation, and reporting surfaces.
- **Implementation:** `vitest.config.ts` in workspace and all packages now embed explicit thresholds
  (Shared ≥75 %, Client/Server ≥50 %, Workspace & Test-Utils ≥30 %). Infrastructure suites
  (`tests/infrastructure/coverage-validation.test.ts`, new `coverage-thresholds.test.ts`, and the
  refreshed config consistency test) load bundled configs via `bundleConfigFile`, assert threshold
  maps, and compare them against the thematic summary constants.
- **Benefits:** Guarantees coverage expectations stay synchronized across configs, scripts, and
  reports; prevents drift when packages evolve; exposes failing tiers with actionable messaging
  before merges.
- **Validation:** `pnpm vitest run tests/infrastructure/coverage-validation.test.ts`,
  `pnpm vitest run tests/infrastructure/coverage-thresholds.test.ts`, and
  `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`.

### Coverage Orchestration & Thematic Reporting Pattern

- **Pattern:** Centralize coverage execution and reporting to surface per-theme metrics for CI
  dashboards and maintainers.
- **Implementation:** `scripts/coverage/run-coverage.mjs` orchestrates coverage runs for workspace,
  client, server, shared, and test-utils themes; root `test:coverage:*` scripts map to the
  orchestrator. Each run emits HTML artifacts plus a consolidated `coverage/thematic-summary.json`
  consumed by validation tests and CI status checks.
- **Benefits:** Creates consistent coverage dashboards, enables CI to highlight tier breaches, and
  improves discoverability of package-specific gaps for remediation planning.
- **Validation:** `pnpm test:coverage:summary`, `pnpm test:coverage:workspace`, and the
  infrastructure tests above exercising summary alignment.

### CI Coverage Reporting & Codecov Integration Pattern (Task 3.2.3)

- **Pattern:** Embed the thematic coverage sweep directly into GitHub Actions while publishing
  artifacts and Codecov metrics guarded by infrastructure tests.
- **Implementation:** `.github/workflows/ci.yml` now runs `pnpm test:coverage:thematic` within the
  `build-and-validate` job after lint/type-check/test, uploads HTML and JSON coverage artifacts, and
  executes `codecov/codecov-action@v5` with a repository token sourced from encrypted secrets.
  Workflow configuration ensures coverage reporting occurs on every branch while keeping failure
  propagation intact.
- **Safeguards:** `tests/infrastructure/ci-coverage-integration.test.ts` enforces workflow step
  ordering, artifact retention settings, Codecov action version, and token wiring, and
  `tests/infrastructure/windows-reserved-names.test.ts` blocks prototype pollution when composing
  reserved filename sets for artifact helpers.
- **Benefits:** Guarantees CI emits complete coverage telemetry, streamlines artifact retrieval for
  contributors, and provides automated protection against misconfigured Codecov integration.
- **Validation:** `pnpm vitest run tests/infrastructure/ci-coverage-integration.test.ts`,
  `pnpm vitest run tests/infrastructure/windows-reserved-names.test.ts`, manual workflow inspection
  for Codecov flag alignment.

### CI-Only Coverage Enforcement Strategy

- **Pattern:** Maintain fast developer commits by limiting coverage enforcement to CI while
  surfacing authoritative results via required status checks.
- **Implementation:** Pre-commit hooks remain lint/format focused; coverage runs execute in CI using
  the thematic orchestration. Memory Bank documentation and task completion reports capture the
  decision rationale, ensuring contributors reference the CI job for coverage results.
- **Benefits:** Preserves developer velocity, avoids redundant local coverage runs, and still
  prevents merges that violate tier expectations through CI gating.
- **Validation:** Confirmed via successful CI-equivalent command suite (`pnpm -w test`, coverage
  orchestration scripts) and documentation updates referenced in `docs/coverage-system-guide.md` &
  `docs/comprehensive-testing-guide.md`.

## Lint & Runtime Stability Patterns

### ESLint Warm-up & Slow-Runner Stabilization Pattern

- **Pattern:** Mitigate platform-specific ESLint test flake by priming caches and adjusting timeouts
  without reducing coverage.
- **Implementation:** `tests/eslint/eslint-config.test.ts` executes a warm-up lint run before the
  timed assertion and increases the timeout to 60 s for slow Windows runners while retaining strict
  failure handling. Warm-up results are cached so subsequent lint invocations complete within the
  expected window.
- **Benefits:** Removes sporadic Windows CI failures, keeps lint regression guardrails intact, and
  documents the trade-off for future tuning.
- **Validation:** `pnpm vitest run tests/eslint/eslint-config.test.ts` (via bundled command
  `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts tests/eslint/eslint-config.test.ts`).

### ESLint Flat Config Single-Source Pattern

- **Pattern:** Maintain a single authoritative ESLint flat config with automated validation so
  linting rules, plugin coverage, and CI gating stay aligned across the monorepo.
- **Implementation:** Removed the legacy `eslint.config.cjs`, added an ownership banner to
  `eslint.config.js`, narrowed ignore patterns to generated output folders (`dist/`, `build/`), and
  registered Node.js globals (`process`, `setTimeout`, `console`, etc.) to prevent false positives
  when linting workspace scripts. Introduced `tests/infrastructure/eslint-audit-validation.test.ts`
  to assert plugin presence, package lint scripts, JSX a11y rule posture, server overrides, and
  `lint-ci.mjs` zero-warning enforcement.
- **Benefits:** Eliminates config drift, keeps automation scripts and ESM utilities under lint
  coverage, and documents accessibility rule decisions (e.g., `jsx-a11y/media-has-caption` disabled
  for audio-first UI) backed by the new `docs/audio-ui-accessibility-policy.md`.
- **Validation:** `pnpm vitest run tests/infrastructure/eslint-audit-validation.test.ts`,
  `pnpm run lint:ci`.

### Vitest Timeout Governance & Dialog Resilience Pattern

- **Pattern:** Set conservative global timeouts and rebuild UI tests to ensure predictable
  completion without runaway waits.
- **Implementation:** Global Vitest defaults now cap test/hook/teardown timeouts at 10 s/15 s/10 s
  inside `vitest.shared.config.ts`. Client dialog/layout suites mock observers and rely on
  deterministic `waitFor` calls, raising client coverage to 55.49 % statements while maintaining
  reliable execution under the tighter limits.
- **Benefits:** Prevents 5-minute runaway waits, surfaces genuine regressions quickly, and boosts
  client coverage without sacrificing stability.
- **Validation:** `pnpm --filter @critgenius/client test -- --coverage`, `pnpm -w test`.

## Change Log (Segment 004)

- 2025-10-17: Added ESLint flat config single-source pattern; version bump to 1.2.0.
- 2025-10-16: Added CI coverage reporting & Codecov integration pattern; version bump to 1.1.0.
- 2025-10-12: Segment created with tiered coverage enforcement, coverage orchestration, ESLint
  warm-up, and Vitest timeout governance patterns.
