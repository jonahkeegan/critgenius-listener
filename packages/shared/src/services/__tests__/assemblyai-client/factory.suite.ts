/**
 * AssemblyAI factory function tests.
 */

import { describe, it, expect } from 'vitest';

import {
  AssemblyAIClient,
  createAssemblyAIClient,
} from '../../assemblyai-client.js';
import { createValidConfig } from './shared/fixtures.js';

export const registerFactoryTests = (): void => {
  describe('Factory Function', () => {
    const validConfig = createValidConfig();

    it('should create client with factory function', () => {
      const client = createAssemblyAIClient(validConfig);

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConfig()).toEqual(validConfig);
    });

    it('should create client without configuration', () => {
      const client = createAssemblyAIClient();

      expect(client).toBeInstanceOf(AssemblyAIClient);
    });
  });
};
