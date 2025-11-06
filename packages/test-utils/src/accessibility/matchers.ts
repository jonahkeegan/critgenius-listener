import { expect } from 'vitest';
import type { RunOptions } from 'axe-core';
import * as axeMatchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe/matchers';
import 'vitest-axe/extend-expect';

import { runAxeAudit, type AccessibilityAuditTarget } from './helpers';

type VitestMatcher = (this: unknown, ...args: unknown[]) => unknown;

const baseMatchers = axeMatchers as unknown as Record<string, VitestMatcher>;

const toPassA11yAudit: VitestMatcher = async function toPassA11yAudit(
  this: unknown,
  target: unknown,
  options?: unknown
) {
  const results = await runAxeAudit(
    target as AccessibilityAuditTarget,
    options as RunOptions | undefined
  );
  const matcher = baseMatchers.toHaveNoViolations;

  if (typeof matcher !== 'function') {
    throw new Error('vitest-axe matcher toHaveNoViolations is not available');
  }

  return matcher.call(this, results);
};

let registered = false;

export const registerAccessibilityMatchers = (): void => {
  if (registered) {
    return;
  }

  expect.extend({
    ...(baseMatchers as Record<string, VitestMatcher>),
    toPassA11yAudit,
  } as Parameters<typeof expect.extend>[0]);

  registered = true;
};

export { toPassA11yAudit };
export type { AxeMatchers };
