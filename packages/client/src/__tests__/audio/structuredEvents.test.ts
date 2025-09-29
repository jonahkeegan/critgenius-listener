import { describe, expect, it, vi } from 'vitest';
import {
  MICROPHONE_ACCESS_STATUS,
  type MicrophoneAccessEvaluation,
  type MicrophoneAccessGuard,
  type MicrophoneAccessRequestResult,
} from '../../services/microphoneAccessGuard';
import {
  createAudioCaptureController,
  type AudioCaptureController,
} from '../../services/audioCapture';
import {
  createStructuredEventReporter,
  structuredAudioEventSchema,
  type StructuredAudioEvent,
} from '../../services/diagnostics';

const SUPPORTED_EVALUATION: MicrophoneAccessEvaluation = {
  status: MICROPHONE_ACCESS_STATUS.SUPPORTED,
  secureContext: true,
  permission: 'granted',
  canRequest: true,
  reason: undefined,
};

const BLOCKED_EVALUATION: MicrophoneAccessEvaluation = {
  status: MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED,
  secureContext: true,
  permission: 'denied',
  canRequest: false,
  reason: 'PermissionDenied',
};

const createMockStream = () =>
  ({
    getTracks: () => [
      {
        stop: vi.fn(),
      },
    ],
  }) as unknown as MediaStream;

const createAudioContextMock = () => {
  const source = {
    disconnect: vi.fn(),
  } as unknown as MediaStreamAudioSourceNode;
  return {
    audioContext: {
      state: 'running',
      resume: vi.fn(),
      close: vi.fn(),
      createMediaStreamSource: vi.fn().mockReturnValue(source),
    } as unknown as AudioContext,
  };
};

const createGuard = (
  evaluation: MicrophoneAccessEvaluation,
  request: MicrophoneAccessRequestResult
): MicrophoneAccessGuard => ({
  evaluate: vi.fn().mockResolvedValue(evaluation),
  requestAccess: vi.fn().mockResolvedValue(request),
});

const createReporter = (collector: StructuredAudioEvent[]) =>
  createStructuredEventReporter({
    transports: [event => collector.push(event)],
    timeProvider: () => 1,
  });

describe('structured audio capture events', () => {
  it('emits schema-valid events for successful capture lifecycle', async () => {
    const events: StructuredAudioEvent[] = [];
    const stream = createMockStream();
    const { audioContext } = createAudioContextMock();
    const controller = createAudioCaptureController({
      guard: createGuard(SUPPORTED_EVALUATION, {
        status: 'granted',
        stream,
        trackCount: 1,
        latencyMs: 12,
      }),
      reporter: createReporter(events),
      timeProvider: () => 10,
      audioContextFactory: () => audioContext,
    });

    const result = await controller.start();
    await controller.stop();

    expect(result.success).toBe(true);
    events.forEach(event => {
      expect(() => structuredAudioEventSchema.parse(event)).not.toThrow();
    });
    expect(events.some(event => event.event === 'audio.capture.success')).toBe(
      true
    );
    expect(events[events.length - 1]?.event).toBe('audio.capture.stop');
  });

  it('emits error event with machine-readable code when guard blocks access', async () => {
    const events: StructuredAudioEvent[] = [];
    const controller: AudioCaptureController = createAudioCaptureController({
      guard: createGuard(BLOCKED_EVALUATION, {
        status: 'blocked',
        reason: 'permission-denied',
      }),
      reporter: createReporter(events),
      timeProvider: () => 0,
    });

    const result = await controller.start();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('PERMISSION_BLOCKED');
    }
    const errorEvent = events.find(
      event => event.event === 'audio.capture.error'
    );
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.code).toBe('PERMISSION_BLOCKED');
  });
});
