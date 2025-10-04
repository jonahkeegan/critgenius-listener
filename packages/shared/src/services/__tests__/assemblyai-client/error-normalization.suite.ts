/**
 * AssemblyAI error normalization tests.
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

import {
  AssemblyAIClient,
  AssemblyAIClientError,
  AssemblyAIAuthError,
  AssemblyAIRateLimitError,
  AssemblyAIConnectionError,
} from '../../assemblyai-client.js';
import { mockTranscriberConnect, mockTranscriberOn } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { waitForPromiseWithTimers } from './shared/helpers.js';

export const registerErrorNormalizationTests = (): void => {
  describe('Error Normalization', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should normalize unknown errors', async () => {
      mockTranscriberConnect.mockRejectedValue('String error');
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback('String error'), 10);
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIClientError);
    }, 10000);

    it('should detect authentication errors from messages', async () => {
      mockTranscriberConnect.mockRejectedValue(
        new Error('401 unauthorized access')
      );
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('401 unauthorized access')), 10);
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIAuthError);
    }, 10000);

    it('should detect rate limit errors from messages', async () => {
      mockTranscriberConnect.mockImplementation(() =>
        Promise.reject(new Error('429 too many requests'))
      );

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIRateLimitError);
    }, 5000);

    it('should detect connection errors from messages', async () => {
      mockTranscriberConnect.mockRejectedValue(
        new Error('network connection failed')
      );
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(
            () => callback(new Error('network connection failed')),
            10
          );
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIConnectionError);
    }, 10000);
  });
};
