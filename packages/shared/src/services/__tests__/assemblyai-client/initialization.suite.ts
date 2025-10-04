/**
 * AssemblyAI client initialization test suite.
 */

import { describe, it, expect } from 'vitest';

import { AssemblyAIClient, ConnectionState } from '../../assemblyai-client.js';
import { mockAssemblyAI } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';

export const registerInitializationTests = (): void => {
  describe('Client Initialization', () => {
    const validConfig = createValidConfig();

    it('should initialize with valid configuration', () => {
      const client = new AssemblyAIClient(validConfig);

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockAssemblyAI).toHaveBeenCalledWith({
        apiKey: validConfig.apiKey,
        baseUrl: validConfig.baseUrl,
      });
    });

    it('should initialize with environment-loaded configuration', () => {
      const client = new AssemblyAIClient();

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should throw error with invalid configuration', () => {
      process.env = {};

      expect(() => new AssemblyAIClient()).toThrow(
        /Failed to initialize AssemblyAI client/
      );
    });

    it('should initialize retry configuration correctly', () => {
      const customConfig = createValidConfig({
        maxRetries: 5,
        retryDelay: 2000,
        maxRetryDelay: 20000,
      });

      const client = new AssemblyAIClient(customConfig);
      const config = client.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.maxRetryDelay).toBe(20000);
    });
  });
};
