/**
 * AssemblyAI configuration management tests.
 */

import { describe, it, expect } from 'vitest';

import { AssemblyAIClient } from '../../assemblyai-client.js';
import { createValidConfig } from './shared/fixtures.js';

export const registerConfigurationTests = (): void => {
  describe('Configuration Management', () => {
    const validConfig = createValidConfig();

    it('should return current configuration', () => {
      const client = new AssemblyAIClient(validConfig);
      const returnedConfig = client.getConfig();

      expect(returnedConfig).toEqual(validConfig);
      expect(returnedConfig).not.toBe(validConfig);
    });

    it('should update configuration', () => {
      const client = new AssemblyAIClient(validConfig);

      const newConfig = {
        maxRetries: 10,
        debug: true,
      };

      client.updateConfig(newConfig);

      const updatedConfig = client.getConfig();
      expect(updatedConfig.maxRetries).toBe(10);
      expect(updatedConfig.debug).toBe(true);
      expect(updatedConfig.apiKey).toBe(validConfig.apiKey);
    });

    it('should update retry configuration when max retries changes', () => {
      const client = new AssemblyAIClient(validConfig);

      client.updateConfig({ maxRetries: 5, retryDelay: 2000 });

      expect(client.getConfig().maxRetries).toBe(5);
      expect(client.getConfig().retryDelay).toBe(2000);
    });
  });
};
