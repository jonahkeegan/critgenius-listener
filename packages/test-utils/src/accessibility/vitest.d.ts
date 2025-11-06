import type { RunOptions } from 'axe-core';
import type { AccessibilityAuditTarget } from './helpers';

declare module 'vitest' {
  interface Assertion<T = any> {
    toPassA11yAudit(options?: RunOptions): Promise<this>;
  }

  interface AsymmetricMatchersContaining {
    toPassA11yAudit(options?: RunOptions): unknown;
  }
}

export type AccessibilityMatcherTarget = AccessibilityAuditTarget;
