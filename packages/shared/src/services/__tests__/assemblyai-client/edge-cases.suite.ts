/**
 * AssemblyAI edge case and robustness tests.
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

import {
  AssemblyAIClient,
  AssemblyAIClientError,
  ConnectionState,
} from '../../assemblyai-client.js';
import { mockTranscriberOn } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { connectClient, isFunction } from './shared/helpers.js';

export const registerEdgeCaseTests = (): void => {
  describe('Edge Cases and Robustness', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should handle multiple disconnect calls gracefully', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'multi-disconnect' }), 10);
        }
      });

      await connectClient(client);

      await expect(client.disconnect()).resolves.not.toThrow();
      await expect(client.disconnect()).resolves.not.toThrow();
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should handle connection close events gracefully', async () => {
      let closeCallback: ((...args: any[]) => void) | undefined;

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'close-event' }), 10);
        } else if (event === 'close') {
          closeCallback = callback;
        }
      });

      const sessionTerminated: boolean[] = [];
      client.on('session-terminated', () => {
        sessionTerminated.push(true);
      });

      await connectClient(client);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);

      if (isFunction(closeCallback)) {
        closeCallback();
      }

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(sessionTerminated.length).toBe(1);
    });

    it('should handle audio queue overflow gracefully', async () => {
      const queueClient = new AssemblyAIClient(
        createValidConfig({
          performance: {
            ...validConfig.performance,
            enableBatching: true,
            maxQueueSize: 2,
          },
        })
      );
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await queueClient.sendAudio(audioBuffer);
      await queueClient.sendAudio(audioBuffer);

      await expect(queueClient.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );

      await queueClient.disconnect();
    });

    it('should handle configuration with debug logging', () => {
      const debugConfig = createValidConfig({ debug: true });

      expect(() => new AssemblyAIClient(debugConfig)).not.toThrow();
    });
  });
};
