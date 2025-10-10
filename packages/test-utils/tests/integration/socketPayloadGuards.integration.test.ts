import { describe, expect, it } from 'vitest';

import {
  isProcessingUpdatePayload,
  isTranscriptionStatusPayload,
} from '../../src/integration/socket/socketPayloadGuards';

describe('socket payload guards', () => {
  describe('isProcessingUpdatePayload', () => {
    it('returns true for objects with uploadId and status strings', () => {
      expect(
        isProcessingUpdatePayload({ uploadId: 'abc', status: 'pending' })
      ).toBe(true);
    });

    it('returns false for missing properties', () => {
      expect(isProcessingUpdatePayload({ uploadId: 'abc' })).toBe(false);
      expect(isProcessingUpdatePayload({ status: 'pending' })).toBe(false);
    });

    it('returns false for non-object values', () => {
      expect(isProcessingUpdatePayload(null)).toBe(false);
      expect(isProcessingUpdatePayload(undefined)).toBe(false);
      expect(isProcessingUpdatePayload('not-an-object')).toBe(false);
    });
  });

  describe('isTranscriptionStatusPayload', () => {
    it('returns true for objects with sessionId and status strings', () => {
      expect(
        isTranscriptionStatusPayload({ sessionId: 'abc', status: 'running' })
      ).toBe(true);
    });

    it('returns false for missing properties', () => {
      expect(isTranscriptionStatusPayload({ sessionId: 'abc' })).toBe(false);
      expect(isTranscriptionStatusPayload({ status: 'running' })).toBe(false);
    });

    it('returns false for non-object values', () => {
      expect(isTranscriptionStatusPayload(null)).toBe(false);
      expect(isTranscriptionStatusPayload(undefined)).toBe(false);
      expect(isTranscriptionStatusPayload(42)).toBe(false);
    });
  });
});
