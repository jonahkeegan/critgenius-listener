/**
 * AssemblyAI statistics and health monitoring tests.
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

import { AssemblyAIClient, ConnectionState } from '../../assemblyai-client.js';
import { mockTranscriberConnect, mockTranscriberOn } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { connectClient, waitForPromiseWithTimers } from './shared/helpers.js';

export const registerStatisticsTests = (): void => {
  describe('Statistics and Health Monitoring', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should track connection statistics', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'stats-test' }), 10);
        }
      });

      const initialStats = client.getStats();
      expect(initialStats.connectionAttempts).toBe(0);
      expect(initialStats.successfulConnections).toBe(0);

      await connectClient(client);

      const connectedStats = client.getStats();
      expect(connectedStats.connectionAttempts).toBe(1);
      expect(connectedStats.successfulConnections).toBe(1);
      expect(connectedStats.uptime).toBeGreaterThan(0);
    });

    it('should track retry statistics', async () => {
      const retryClient = new AssemblyAIClient(
        createValidConfig({
          maxRetries: 2,
          retryDelay: 10,
          maxRetryDelay: 50,
        })
      );

      let attemptCount = 0;
      mockTranscriberConnect.mockImplementation(() => {
        attemptCount += 1;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Retry test'));
        }
        return Promise.resolve();
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open' && attemptCount >= 3) {
          callback({ sessionId: 'retry-stats' });
        }
      });

      await connectClient(retryClient);

      const stats = retryClient.getStats();
      expect(stats.retryAttempts).toBeGreaterThan(0);
      await retryClient.disconnect();
    }, 5000);

    it('should provide health check information', async () => {
      const healthCheck = await client.healthCheck();

      expect(healthCheck).toHaveProperty('healthy');
      expect(healthCheck).toHaveProperty('details');
      expect(healthCheck.details).toHaveProperty('connectionState');
      expect(healthCheck.details).toHaveProperty('stats');
      expect(healthCheck.details).toHaveProperty('config');
    });

    it('should report unhealthy when disconnected with errors', async () => {
      mockTranscriberConnect.mockRejectedValue(new Error('Health check error'));
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Health check error')), 10);
        }
      });

      const failedConnect = waitForPromiseWithTimers(client.connect());
      await expect(failedConnect).rejects.toThrow();

      const healthCheck = await client.healthCheck();
      expect(healthCheck.healthy).toBe(false);
    }, 10000);

    it('should track state history', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'state-history' }), 10);
        }
      });

      await connectClient(client);
      await client.disconnect();

      const stats = client.getStats();
      expect(stats.stateHistory.length).toBeGreaterThan(0);
      expect(stats.stateHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ state: ConnectionState.CONNECTING }),
          expect.objectContaining({ state: ConnectionState.CONNECTED }),
          expect.objectContaining({ state: ConnectionState.DISCONNECTED }),
        ])
      );
    });
  });
};
