/**
 * AssemblyAI error class construction tests.
 */

import { describe, it, expect } from 'vitest';

import {
  AssemblyAIClientError,
  AssemblyAIConnectionError,
  AssemblyAIRateLimitError,
  AssemblyAIAuthError,
} from '../../assemblyai-client.js';

export const registerErrorClassTests = (): void => {
  describe('Error Classes', () => {
    it('should create AssemblyAIClientError correctly', () => {
      const error = new AssemblyAIClientError(
        'Test error',
        'TEST_CODE',
        500,
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIClientError');
    });

    it('should create AssemblyAIConnectionError correctly', () => {
      const error = new AssemblyAIConnectionError(
        'Connection failed',
        'CONN_ERROR'
      );

      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('CONN_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIConnectionError');
    });

    it('should create AssemblyAIRateLimitError correctly', () => {
      const error = new AssemblyAIRateLimitError('Rate limited', 30);

      expect(error.message).toBe('Rate limited');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(30);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIRateLimitError');
    });

    it('should create AssemblyAIAuthError correctly', () => {
      const error = new AssemblyAIAuthError('Unauthorized');

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('AssemblyAIAuthError');
    });
  });
};
