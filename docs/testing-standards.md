# Testing Standards

The CritGenius Listener test suite is now governed by a shared Vitest configuration factory and a
consistent project layout. This document captures the expectations for naming, structure, and
configuration.

## File Placement & Naming

- **Unit tests** live next to the code they exercise and end with `.test.ts` or `.test.tsx` (for
  React components). Co-located unit tests may use the `__tests__` directory convention when
  multiple specs target the same module.
- **Integration tests** belong in `tests/integration/` within their package and must be suffixed
  with `.integration.test.ts`.
- **End-to-end (browser) tests** belong in `tests/e2e/` and end with `.e2e.test.ts`.
- **Fixtures** and **helpers** live under `tests/fixtures/` and `tests/helpers/` respectively.
  Non-test utilities should _not_ carry the `.test` suffix.
- Deprecated patterns such as `*.spec.ts` and `*.spec.test.ts` are disallowed. The validation script
  (see below) will remove or fail on these patterns.

## Vitest Configuration

All packages now consume the shared factory defined in `vitest.shared.config.ts` via
`createVitestConfig(...)`. The factory provides:

- Unified test globs:
  - `src/**/*.{test,spec}.{ts,tsx}`
  - `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
  - `tests/**/*.{test,spec}.{ts,tsx}`
  - `tests/**/*.integration.test.{ts,tsx}`
  - `tests/**/*.e2e.test.{ts,tsx}`
- Shared exclusion list for build artefacts and fixtures.
- Mandatory coverage thresholds of **90%** across statements, branches, functions, and lines.
- Coverage exclusion defaults that remove setup scripts, generated types and fixtures.
- Deterministic setup order: the root `tests/setup/common-vitest-hooks.ts` runs before any
  package-specific setup file.
- Path alias synchronisation: the factory resolves `compilerOptions.paths` from the relevant
  `tsconfig.json`, keeping Vitest resolution aligned with TypeScript.

Each package config now follows the pattern:

```ts
import { defineConfig } from 'vitest/config';
import { assertUsesSharedConfig, createVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot,
      environment: 'node' | 'jsdom',
      setupFiles: ['../../tests/setup/common-vitest-hooks.ts', './src/test-setup.ts'],
      coverageOverrides: { exclude: [...] },
    })
  )
);
```

Configs must invoke `assertUsesSharedConfig` to ensure the shared factory is not bypassed.

## Validation

Run the validator to confirm naming and structural invariants:

```bash
pnpm validate:testing
```

Flags:

- `--fix` removes disallowed files (e.g. legacy `*.spec.ts`) and creates missing directories.
- `--no-strict` downgrades violations to warnings (exit code `0`).

The validator powers the new Vitest invariant test at
`tests/infrastructure/test-naming-standards.test.ts` and is exercised in the CI suite.

## Shared Hooks

The shared setup file `tests/setup/common-vitest-hooks.ts` standardises Vitest hooks:

- Restores and clears mocks before every test.
- Resets modules and timers after each test.
- Forces the runtime timezone to UTC to avoid time-sensitive drift.

Individual packages append their own setup logic via `src/test-setup.ts`.

## Migration Notes

- Existing integration suites were moved from `src/__tests__/integration` to `tests/integration` to
  align with the new structure.
- The HTTPS Socket tests retain their functionality but now import from the source tree using
  `../../src/...` paths rather than relative traversals.
- The Playwright microphone access test lives under `tests/e2e/` and carries the suffix
  `.e2e.test.ts` to distinguish it from Vitest suites.
- Legacy `.spec.ts` shims were removed; run `pnpm validate:testing --fix` to clean stale branches in
  downstream clones.

Adhering to these conventions keeps linting, coverage, and documentation accurate across the
monorepo.
