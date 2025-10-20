# ESLint & Type Checking Script Suite

This document summarizes the enhanced linting and type-check workflows introduced in task 2-8-2.

## Overview

A unified script layer now supports:

- Consistent linting across all workspace packages.
- Accessibility (WCAG-oriented) validation via `eslint-plugin-jsx-a11y`.
- Combined type + lint validation for fast local gating.
- CI-friendly reporting (JUnit XML) without leaking sensitive data.

## Root Scripts

| Script                    | Purpose                                                  | Notes                                                           |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `pnpm lint`               | Run each package's `lint` script recursively.            | Zero warnings allowed (package scripts use `--max-warnings 0`). |
| `pnpm lint:fix`           | Auto-fix supported issues recursively.                   | Run before commit if large refactors.                           |
| `pnpm lint:all`           | Lint all source under `packages/` with full flat config. | Ignores config/build/test infra noise.                          |
| `pnpm lint:client`        | Lint only client package.                                | Fast UI iteration loop.                                         |
| `pnpm lint:server`        | Lint only server package.                                | Includes performance-oriented overrides.                        |
| `pnpm lint:shared`        | Lint only shared package.                                | Keeps core types pristine.                                      |
| `pnpm lint:accessibility` | Focused A11y pass over React TSX files.                  | Uses jsx-a11y rules; treat as a targeted audit.                 |
| `pnpm lint:staged`        | Runs `lint-staged` (pre-commit helper).                  | Mirrors Husky hook; useful for dry runs.                        |
| `pnpm type-check`         | Runs TypeScript in each package.                         | Pure type validation, no lint.                                  |
| `pnpm type-check:lint`    | Sequential `type-check` then `lint`.                     | Local pre-push safety net.                                      |
| `pnpm lint:ci`            | Programmatic lint run + JUnit XML output.                | Produces `reports/eslint-junit.xml`.                            |

## Client-Specific Additions

| Script                                           | Purpose                                          |
| ------------------------------------------------ | ------------------------------------------------ |
| `pnpm --filter @critgenius/client run lint:a11y` | Enforce all jsx-a11y rules as errors over `src`. |

## Accessibility Rules

Enabled via `eslint-plugin-jsx-a11y` recommended config plus tightened rules:

- Enforced: `alt-text`, `no-autofocus`, and component-level `interactive-supports-focus` plus
  `click-events-have-key-events`.
- Disabled intentionally: `anchor-is-valid`, `media-has-caption`, `no-redundant-roles` (documented
  in `docs/audio-ui-accessibility-policy.md`).

## Performance-Oriented Linting

A lightweight override for server code introduces guidance (e.g. discouraging `await` in loops)
while intentionally leaving `console` unrestricted until structured logging layer finalization.
Re-enable `no-console` (with allowlist) once logging abstraction is stable.

## CI Integration

Use in GitHub Actions (excerpt):

```yaml
- name: Lint & Type Check
  run: pnpm install --frozen-lockfile && pnpm type-check:lint

- name: ESLint (JUnit Report)
  run: pnpm lint:ci || true

- name: Upload ESLint Report
  uses: actions/upload-artifact@v4
  with:
    name: eslint-report
    path: reports/eslint-junit.xml
```

`pnpm lint:ci` exits non-zero if any errors or warnings remain. Add `|| true` only when you want the
pipeline to continue but still collect the artifact.

## Fast Local Workflows

| Goal                   | Suggested Command                                            |
| ---------------------- | ------------------------------------------------------------ |
| Edit server logic      | `pnpm lint:server` + `pnpm --filter @critgenius/server test` |
| UI accessibility sweep | `pnpm lint:accessibility` then fix flagged issues            |
| Pre-push full gate     | `pnpm type-check:lint && pnpm test`                          |
| Focus on shared types  | `pnpm lint:shared && pnpm --filter @critgenius/shared test`  |

## Infrastructure Validation

- `tests/infrastructure/eslint-audit-validation.test.ts` programmatically lints curated fixtures to
  confirm rule coverage, override behavior, and severity gates.
- Fixtures live in `tests/eslint/__fixtures__/` and cover TypeScript safety, React/hooks
  regressions, accessibility strictness, server-specific overrides, relaxed test files, and a
  passing baseline.
- Run `pnpm --filter @critgenius/listener test tests/infrastructure/eslint-audit-validation.test.ts`
  for a focused drift check; CI executes the same suite via `pnpm run test:infrastructure`.

## Troubleshooting

| Symptom                                                | Likely Cause                                   | Resolution                                                    |
| ------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| Unexpected parsing error about `parserOptions.project` | Non-source file picked up                      | Use `lint:all` (already scoped) or add ignore to flat config. |
| No JUnit file after `lint:ci`                          | Formatter resolution changed / script modified | Verify `scripts/lint-ci.mjs` intact & dependency installed.   |
| Accessibility script finds nothing                     | Only TS files, no `.tsx`                       | Ensure components use `.tsx` extension for JSX.               |

## Extending Rules

1. Edit `eslint.config.js` (flat array config).
2. Keep Prettier config last.
3. For new env-sensitive rules, prefer narrow `files` globs to avoid perf hit.
4. Run `pnpm lint:all` and `pnpm lint:ci` to verify no regressions.

## Guiding Principles

- Zero warnings policy keeps signal high.
- Accessibility is a first-class quality gate.
- Performance linting remains advisory until profiling data drives stricter enforcement.
- Configuration changes must not expose secrets or raw environment values.

---

Maintain this doc when adding scripts or altering lint severity so the developer experience stays
predictable.
