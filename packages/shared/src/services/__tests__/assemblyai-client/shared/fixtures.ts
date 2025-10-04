/**
 * Shared fixtures for AssemblyAI client tests.
 */

import {
  AssemblyAIConfig,
  DEFAULT_ASSEMBLYAI_CONFIG,
} from '../../../../config/assemblyai.js';

export const DEFAULT_VALID_API_KEY =
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';

export const createValidConfig = (
  overrides: Partial<AssemblyAIConfig> = {}
): AssemblyAIConfig => ({
  ...DEFAULT_ASSEMBLYAI_CONFIG,
  apiKey: DEFAULT_VALID_API_KEY,
  ...overrides,
});
