/**
 * AssemblyAI connection management tests.
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

import {
  AssemblyAIClient,
  AssemblyAIConnectionError,
  AssemblyAIRateLimitError,
  AssemblyAIAuthError,
  ConnectionState,
} from '../../assemblyai-client.js';
import {
  mockTranscriber,
  mockTranscriberConnect,
  mockTranscriberOn,
} from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { connectClient, waitForPromiseWithTimers } from './shared/helpers.js';

export const registerConnectionManagementTests = (): void => {
  describe('Connection Management', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should connect successfully', async () => {
      const connectionStateChanges: ConnectionState[] = [];
      client.on('connection-state', state => {
        connectionStateChanges.push(state);
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-123' }), 10);
        }
      });

      await connectClient(client);

      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(connectionStateChanges).toContain(ConnectionState.CONNECTING);
      expect(connectionStateChanges).toContain(ConnectionState.CONNECTED);
      expect(mockTranscriber.connect).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      const shortTimeoutConfig = createValidConfig({
        connectionTimeout: 100,
        maxRetries: 0,
      });
      const timeoutClient = new AssemblyAIClient(shortTimeoutConfig);

      mockTranscriberOn.mockImplementation(() => {
        // intentionally blank to simulate timeout with no events
      });
      mockTranscriberConnect.mockImplementation(
        () => new Promise(() => undefined)
      );

      const timeoutConnect = timeoutClient.connect();
      vi.advanceTimersByTime(shortTimeoutConfig.connectionTimeout + 1);
      const timeoutPromise = waitForPromiseWithTimers(timeoutConnect);
      await expect(timeoutPromise).rejects.toThrow(AssemblyAIConnectionError);

      expect(timeoutClient.getConnectionState()).toBe(ConnectionState.ERROR);
      await timeoutClient.disconnect();
    }, 10000);

    it('should retry on connection failure', async () => {
      const retryConfig = createValidConfig({
        maxRetries: 2,
        retryDelay: 50,
      });
      const retryClient = new AssemblyAIClient(retryConfig);

      let attemptCount = 0;
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Connection failed')), 10);
        } else if (event === 'open' && attemptCount >= 2) {
          setTimeout(() => callback({ sessionId: 'test-session-retry' }), 10);
        }
      });

      const retryAttempts: number[] = [];
      retryClient.on('retry-attempt', attempt => {
        retryAttempts.push(attempt);
        attemptCount++;
      });

      await connectClient(retryClient);

      expect(retryAttempts.length).toBeGreaterThan(0);
      expect(retryClient.getConnectionState()).toBe(ConnectionState.CONNECTED);
      await retryClient.disconnect();
    });

    it('should handle authentication errors without retry', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('401 unauthorized')), 10);
        }
      });

      const authPromise = waitForPromiseWithTimers(client.connect());
      await expect(authPromise).rejects.toThrow(AssemblyAIAuthError);

      expect(client.getConnectionState()).toBe(ConnectionState.ERROR);
    });

    it('should handle rate limiting with retry after', async () => {
      const rateLimitClient = new AssemblyAIClient(validConfig);

      mockTranscriberConnect.mockRejectedValue(
        new Error('429 too many requests')
      );

      const rateLimitEvents: number[] = [];
      rateLimitClient.on('rate-limit', retryAfter => {
        rateLimitEvents.push(retryAfter);
      });

      const rateLimitPromise = waitForPromiseWithTimers(
        rateLimitClient.connect()
      );
      await expect(rateLimitPromise).rejects.toThrow(AssemblyAIRateLimitError);

      expect(rateLimitEvents.length).toBeGreaterThan(0);
      await rateLimitClient.disconnect();
    }, 3000);

    it('should disconnect cleanly', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(
            () => callback({ sessionId: 'test-session-disconnect' }),
            10
          );
        }
      });

      await connectClient(client);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);

      await client.disconnect();
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should prevent multiple simultaneous connections', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-multi' }), 50);
        }
      });

      const connectionPromise1 = waitForPromiseWithTimers(client.connect());
      const connectionPromise2 = waitForPromiseWithTimers(client.connect());
      const connectionPromise3 = waitForPromiseWithTimers(client.connect());

      await Promise.all([
        connectionPromise1,
        connectionPromise2,
        connectionPromise3,
      ]);

      expect(mockTranscriber.connect).toHaveBeenCalledTimes(1);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });
  });
};
