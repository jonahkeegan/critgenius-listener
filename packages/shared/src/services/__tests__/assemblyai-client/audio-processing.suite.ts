/**
 * AssemblyAI audio processing tests.
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

import {
  AssemblyAIClient,
  AssemblyAIClientError,
} from '../../assemblyai-client.js';
import { mockTranscriberOn, mockTranscriberSendAudio } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { connectClient } from './shared/helpers.js';

export const registerAudioProcessingTests = (): void => {
  describe('Audio Processing', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(async () => {
      client = new AssemblyAIClient(validConfig);

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-audio-session' }), 10);
        }
      });

      await connectClient(client);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should send audio data when connected', async () => {
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await client.sendAudio(audioBuffer);

      expect(mockTranscriberSendAudio).toHaveBeenCalled();
      const sentData = mockTranscriberSendAudio.mock.calls[0]?.[0];
      expect(sentData).toBeInstanceOf(ArrayBuffer);
    });

    it('should queue audio data when disconnected with batching enabled', async () => {
      const batchingClient = new AssemblyAIClient(
        createValidConfig({
          performance: {
            ...validConfig.performance,
            enableBatching: true,
            maxQueueSize: 10,
          },
        })
      );
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await expect(
        batchingClient.sendAudio(audioBuffer)
      ).resolves.toBeUndefined();

      await batchingClient.disconnect();
    });

    it('should throw error when sending audio while disconnected without batching', async () => {
      await client.disconnect();

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await expect(client.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );
    });

    it('should handle audio sending errors gracefully', async () => {
      mockTranscriberSendAudio.mockImplementation(() => {
        throw new Error('Audio send failed');
      });

      const errorEvents: AssemblyAIClientError[] = [];
      client.on('error', error => {
        errorEvents.push(error);
      });

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await expect(client.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );

      expect(errorEvents.length).toBe(1);
    });

    it('should track audio statistics', async () => {
      mockTranscriberSendAudio.mockReset();
      mockTranscriberSendAudio.mockResolvedValue(undefined);

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await client.sendAudio(audioBuffer);
      await client.sendAudio(audioBuffer);

      const stats = client.getStats();
      expect(stats.audioChunksSent).toBe(2);
    });
  });
};
