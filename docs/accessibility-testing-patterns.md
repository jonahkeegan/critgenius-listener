# Accessibility Testing Patterns

**Version:** 0.1.0 **Last Updated:** 2025-11-05 **Status:** Draft Guidance

This guide explains how CritGenius Listener runs runtime accessibility validations with
`vitest-axe`, the shared `@critgenius/test-utils/accessibility` module, and the new
`toPassA11yAudit` matcher. Pair this document with `docs/audio-ui-accessibility-policy.md` for
policy context and `docs/comprehensive-testing-guide.md` §7.6 for testing strategy alignment.

---

## 1. Quick Start Checklist

1. Install workspace dependencies (root):
   ```bash
   pnpm install
   pnpm add -Dw vitest-axe axe-core
   ```
2. Import the accessibility harness in your package test setup:

   ```ts
   import { installTestRuntime } from '@critgenius/test-utils/runtime';
   import { registerMatchers } from '@critgenius/test-utils/matchers';
   import {
     configureAxe,
     registerAccessibilityMatchers,
   } from '@critgenius/test-utils/accessibility';

   const runtime = installTestRuntime();
   runtime.installGlobals();
   registerMatchers();
   registerAccessibilityMatchers();
   configureAxe();
   ```

3. Run the infrastructure guard to confirm configuration drift has not occurred:
   ```bash
   pnpm test:infrastructure -- --run tests/infrastructure/vitest-axe-integration.test.ts
   ```

When these steps pass, your package can rely on the shared matcher without reconfiguring axe
manually.

---

## 2. Shared Accessibility Toolkit

The `@critgenius/test-utils/accessibility` entry point provides a narrow, test-focused surface
around `axe-core` with CritGenius defaults:

| API                                         | Purpose                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `configureAxe(options?)`                    | Applies the WCAG 2.1 AA baseline, optional overrides, and resets when requested.                   |
| `registerAccessibilityMatchers()`           | Extends Vitest with `toPassA11yAudit` and the base `vitest-axe` matchers exactly once per process. |
| `runAxeAudit(target, overrides?)`           | Executes an axe audit against a DOM node/document with optional per-test run options.              |
| `createA11yTestContext(target, overrides?)` | Returns a helper with a bound `audit()` convenience method for repeated probes.                    |
| `getAxeConfiguration()`                     | Snapshots the active axe config for assertions.                                                    |
| `isAxeRuleEnforced(ruleId)`                 | Returns whether the shared default enables a rule (after policy overrides).                        |

All configuration defaults flow from `wcag-rules.ts`, which encodes the audio policy exception
(`media-has-caption` disabled) and ensures WCAG 2.1 AA tags are always evaluated.

---

## 3. Writing Component-Level Audits

### 3.1 Rendering React Components (Material UI Example)

```tsx
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { appTheme } from '../theme';

describe('PrimaryButton', () => {
  it('passes accessibility audit with icon variant', async () => {
    render(
      <ThemeProvider theme={appTheme}>
        <Button aria-label='Roll initiative' startIcon={<Icon />}>
          Attack
        </Button>
      </ThemeProvider>
    );

    await expect(screen.getByRole('button', { name: 'Roll initiative' })).toPassA11yAudit();
  });
});
```

**Tips**

- Always render components inside the same providers the runtime uses (theme, localization, etc.).
- Prefer querying by accessible role/name before running the audit to ensure the element is
  discoverable.
- Combine `waitFor` or fake timers with streaming components when markup changes asynchronously.

### 3.2 Snapshot-Free Pattern

`vitest-axe` returns structured violation data. Favor targeted assertions when validating overrides:

```ts
const results = await runAxeAudit(container, {
  rules: { 'color-contrast': { enabled: false } },
});

expect(results.violations).toEqual(
  expect.arrayContaining([expect.objectContaining({ id: 'color-contrast' })])
);
```

This style keeps audits deterministic while still documenting why a temporary override exists.

---

## 4. Infrastructure Validation

`tests/infrastructure/vitest-axe-integration.test.ts` guards the following:

- `vitest-axe` / `axe-core` are declared workspace dev dependencies.
- Default configuration enforces WCAG 2.1 AA tags and audio policy exceptions.
- `toPassA11yAudit` matcher works with complex component trees (Material UI example).
- Per-test overrides flow through `runAxeAudit` without mutating the shared baseline.

Expect to update this test when:

- Adding or removing WCAG rule overrides.
- Changing matcher registration semantics.
- Upgrading Material UI and verifying the new version still renders in SSR/JS DOM contexts.

---

## 5. Troubleshooting

| Symptom                                                        | Resolution                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot find module '@critgenius/test-utils/accessibility'`    | Run `pnpm --filter @critgenius/test-utils build` after adding new exports to regenerate type declarations.                                          |
| `toPassA11yAudit is not a function`                            | Ensure `registerAccessibilityMatchers()` runs in the relevant test setup before any expectations execute.                                           |
| Axe reports `media-has-caption` violations in audio-only tests | Pass `runOptions: { rules: { 'media-has-caption': { enabled: false } } }` to `runAxeAudit` and document the rationale referencing the audio policy. |
| Tests fail with `ReferenceError: window is not defined`        | Wrap bare DOM audit targets in `createA11yTestContext` or bind a JSDOM window using the helper shown in the infrastructure test.                    |

---

## 6. Reference Commands

| Goal                                 | Command                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Run all infrastructure guards        | `pnpm test:infrastructure`                                                              |
| Run only the vitest-axe guard        | `pnpm test:infrastructure -- --run tests/infrastructure/vitest-axe-integration.test.ts` |
| Regenerate accessibility dist output | `pnpm --filter @critgenius/test-utils build`                                            |

For broader testing strategy context, continue in `docs/comprehensive-testing-guide.md` (new Section
7.6) and onboarding appendix updates.
