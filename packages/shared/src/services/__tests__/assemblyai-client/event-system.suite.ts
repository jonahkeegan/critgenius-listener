/**
 * AssemblyAI event system tests.
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

import { AssemblyAIClient, ConnectionState } from '../../assemblyai-client.js';
import { mockTranscriberOn } from './shared/mocks.js';
import { createValidConfig } from './shared/fixtures.js';
import { connectClient } from './shared/helpers.js';

export const registerEventSystemTests = (): void => {
  describe('Event System', () => {
    const validConfig = createValidConfig();
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should add and remove event listeners', () => {
      const mockListener = vi.fn();

      client.on('connection-state', mockListener);
      client.off('connection-state', mockListener);

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should emit transcript events', async () => {
      const transcripts: any[] = [];
      client.on('transcript', transcript => {
        transcripts.push(transcript);
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-transcript' }), 10);
        } else if (event === 'transcript') {
          setTimeout(
            () =>
              callback({
                message_type: 'PartialTranscript',
                text: 'Hello world',
                confidence: 0.95,
              }),
            20
          );
        }
      });

      await connectClient(client);

      expect(transcripts.length).toBeGreaterThan(0);
    });

    it('should emit session events', async () => {
      const sessions: string[] = [];
      client.on('session-begins', sessionId => {
        sessions.push(sessionId);
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-events' }), 10);
        }
      });

      await connectClient(client);

      expect(sessions).toContain('test-session-events');
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      client.on('connection-state', faultyListener);

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-faulty-listener' }), 10);
        }
      });

      await connectClient(client);
      expect(faultyListener).toHaveBeenCalled();
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });
  });
};
