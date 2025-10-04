/**
 * Shared type helpers for AssemblyAI client tests.
 */

export type Listener<TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => void;
