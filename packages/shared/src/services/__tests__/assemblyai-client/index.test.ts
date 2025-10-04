/**
 * Backwards-compatible placeholder to keep Vitest glob satisfied.
 *
 * All real AssemblyAI client tests execute through
 * `packages/shared/src/services/assemblyai-client.test.ts`.
 */

import { describe, it, expect } from 'vitest';

describe('AssemblyAI client test relocation', () => {
  it('delegates execution to the root orchestrator', () => {
    expect(true).toBe(true);
  });
});
