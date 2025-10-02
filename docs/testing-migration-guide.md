# Testing Migration Guide

This guide outlines the steps for moving existing specs into the standardised Vitest structure
introduced in Task 3.1.1.

## 1. Prepare the Workspace

1. Ensure dependencies are installed (`pnpm install`).
2. Run the validator in dry mode to understand current violations:
   ```bash
   pnpm validate:testing
   ```
3. Optional: run with `--fix` to remove obsolete `*.spec.ts` files and create missing directories
   before migrating code.

## 2. Relocate Integration Tests

1. Move files suffixed with `.integration.test.ts` into the package's `tests/integration/`
   directory.
2. Update import paths to reference source modules via `../../src/...` so that tests no longer rely
   on brittle relative traversals.
3. If fixtures are required, place them under `tests/fixtures/` to keep directories clean.

## 3. Convert Mislabelled Specs

1. Files using the `*.spec.ts` suffix should either become unit tests (`*.test.ts`) or integration
   tests (`*.integration.test.ts`), depending on behaviour.
2. Rename the file and update any import paths accordingly.
3. Remove redundant placeholder files; the validator will flag any remaining `*.spec`. Running
   `pnpm validate:testing --fix` will delete them.

## 4. Share Common Setup

1. Import `tests/setup/common-vitest-hooks.ts` from each package's `src/test-setup.ts` via the
   shared Vitest config (no manual import needed).
2. Keep package-specific setup logic (mocks, environment variables) inside the package
   `test-setup.ts` while relying on the shared hooks for mock resets and timer cleanup.

## 5. Verify the Migration

1. Execute the validator to confirm structure:
   ```bash
   pnpm validate:testing
   ```
2. Run package-specific test suites to ensure behaviour remains intact:
   ```bash
   pnpm --filter @critgenius/client test
   pnpm --filter @critgenius/server test
   pnpm --filter @critgenius/shared test
   ```
3. Finish with the workspace-level validation pipeline:
   ```bash
   pnpm -w lint && pnpm -w type-check && pnpm -w test
   ```

## 6. Update Documentation

1. Document any package-specific learnings directly in the codebase (e.g. README updates or inline
   comments).
2. If new fixtures or helpers were introduced, annotate their purpose in `docs/testing-standards.md`
   to maintain clarity for future contributors.

Following these steps ensures existing tests adopt the shared Vitest configuration without
regressions.
