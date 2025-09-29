import { describe, expect, it } from 'vitest';
import {
  getActionableSteps,
  getLocalizedMessage,
} from '../../components/audio/ErrorMessageMapper';
import type { AudioCaptureErrorCode } from '../../services/audioCapture';

describe('Audio capture error message mapper', () => {
  const codes: AudioCaptureErrorCode[] = [
    'SECURE_CONTEXT_REQUIRED',
    'PERMISSION_BLOCKED',
    'UNSUPPORTED',
    'STREAM_ERROR',
    'AUDIO_CONTEXT_FAILED',
    'RETRY_EXHAUSTED',
  ];

  it('returns localized messages for known error codes', () => {
    codes.forEach(code => {
      const message = getLocalizedMessage(code, 'en-US');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  it('falls back gracefully for unknown locales', () => {
    const fallback = getLocalizedMessage('STREAM_ERROR', 'xx-YY');
    expect(fallback).toContain('microphone');
  });

  it('provides actionable steps for each error code', () => {
    codes.forEach(code => {
      const steps = getActionableSteps(code);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      steps.forEach(step => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(0);
      });
    });
  });
});
