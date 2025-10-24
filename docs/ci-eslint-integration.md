# CI ESLint Integration Validation

This guide summarizes the drift checks enforced by
`tests/infrastructure/ci-eslint-integration.test.ts`.

## What the Test Guarantees

- CI runs `pnpm run lint:ci` in the `build-and-validate` job with no error masking.
- The lint step executes after the shared and test-utils build steps so compiled tooling is ready.
- The lint command blocks on **any** ESLint warning or error (`process.exit(1)` guard).
- `package.json` keeps the `lint:ci` script wired to `scripts/lint-ci.mjs`.
- Accessibility linting (jsx-a11y) stays active for React component globs.

## When to Run It

- After touching `.github/workflows/ci.yml`.
- When modifying `scripts/lint-ci.mjs` or lint-related package scripts.
- While changing `eslint.config.js` accessibility coverage.

## Local Execution

```bash
pnpm vitest run --config vitest.infrastructure.config.ts \
  tests/infrastructure/ci-eslint-integration.test.ts
```

## Troubleshooting Checklist

1. **Lint step missing?** Ensure `build-and-validate` keeps a step with `run: pnpm run lint:ci`.
2. **Lint not failing CI?** Verify the script still counts both `errorCount` and `warningCount` and
   calls `process.exit(1)`.
3. **Error suppression spotted?** Remove any `continue-on-error`, `|| true`, `|| echo`, or `set +e`
   in the lint step.
4. **Accessibility plugin disabled?** Confirm `eslint.config.js` retains the `jsx-a11y` plugin for
   JSX/TSX targets.
5. **Wrong script wiring?** Restore `"lint:ci": "node scripts/lint-ci.mjs"` in `package.json`.

## Related References

- `.github/workflows/ci.yml`
- `scripts/lint-ci.mjs`
- `eslint.config.js`
- `tests/infrastructure/ci-eslint-integration.test.ts`
