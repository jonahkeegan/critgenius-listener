/**
 * Shared lifecycle registration for AssemblyAI client tests.
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { resetAssemblyAIMocks } from './mocks.js';
import { DEFAULT_VALID_API_KEY } from './fixtures.js';

const originalEnv = process.env;

export const useAssemblyAiClientTestLifecycle = (): void => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAssemblyAIMocks();
    process.env = {
      ...originalEnv,
      ASSEMBLYAI_API_KEY: DEFAULT_VALID_API_KEY,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

export const getOriginalEnv = () => originalEnv;
