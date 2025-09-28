import { describe, expect, it, vi } from 'vitest';
import {
  MICROPHONE_ACCESS_STATUS,
  type MicrophoneAccessEvaluation,
  type MicrophoneAccessGuard,
  type MicrophoneAccessRequestResult,
} from '../../services/microphoneAccessGuard';
import {
  createAudioCaptureController,
  type AudioCaptureStartResult,
} from '../../services/audioCapture';

const SUPPORTED_EVALUATION: MicrophoneAccessEvaluation = {
  status: MICROPHONE_ACCESS_STATUS.SUPPORTED,
  secureContext: true,
  permission: 'granted',
  canRequest: true,
  reason: undefined,
};

function createMockStream(trackCount = 1) {
  const tracks = Array.from({ length: trackCount }, () => ({
    stop: vi.fn(),
  })) as unknown as MediaStreamTrack[];
  return {
    getTracks: () => tracks,
  } as unknown as MediaStream;
}

function createGuardMock(
  evaluation: MicrophoneAccessEvaluation,
  requestResult: MicrophoneAccessRequestResult
): MicrophoneAccessGuard {
  return {
    evaluate: vi.fn().mockResolvedValue(evaluation),
    requestAccess: vi.fn().mockResolvedValue(requestResult),
  } satisfies MicrophoneAccessGuard;
}

function createAudioContextMock() {
  const disconnect = vi.fn();
  const source = {
    disconnect,
  } as unknown as MediaStreamAudioSourceNode;
  const audioContext = {
    state: 'running',
    resume: vi.fn(),
    close: vi.fn(),
    createMediaStreamSource: vi.fn().mockReturnValue(source),
  } as unknown as AudioContext;
  return { audioContext, disconnect, source };
}

describe('audioCaptureController.start', () => {
  it('returns granted stream and initializes audio context', async () => {
    const stream = createMockStream();
    const requestResult: MicrophoneAccessRequestResult = {
      status: 'granted',
      stream,
      trackCount: 1,
      latencyMs: 42,
    };
    const guard = createGuardMock(SUPPORTED_EVALUATION, requestResult);
    const { audioContext } = createAudioContextMock();
    const controller = createAudioCaptureController({
      guard,
      audioContextFactory: () => audioContext,
      now: () => 1000,
      reporter: vi.fn(),
    });

    const result = (await controller.start()) as AudioCaptureStartResult;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.stream).toBe(stream);
      expect(result.latencyMs).toBe(42);
      expect(result.audioContext).toBe(audioContext);
      expect(result.evaluation.status).toBe(MICROPHONE_ACCESS_STATUS.SUPPORTED);
    }
    expect(guard.evaluate).toHaveBeenCalledTimes(1);
    expect(guard.requestAccess).toHaveBeenCalledTimes(1);
  });

  it('surfaces errors when guard blocks permission', async () => {
    const evaluation: MicrophoneAccessEvaluation = {
      status: MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED,
      secureContext: true,
      permission: 'denied',
      canRequest: false,
      reason: 'PermissionDenied',
    };
    const guard = createGuardMock(evaluation, {
      status: 'blocked',
      reason: 'permission-denied',
    });
    const controller = createAudioCaptureController({ guard, now: () => 1000 });

    const result = await controller.start();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PERMISSION_BLOCKED');
    }
  });

  it('reuses existing stream when requested', async () => {
    const stream = createMockStream();
    const guard = createGuardMock(SUPPORTED_EVALUATION, {
      status: 'granted',
      stream,
      trackCount: 1,
      latencyMs: 10,
    });
    const { audioContext } = createAudioContextMock();
    const controller = createAudioCaptureController({
      guard,
      audioContextFactory: () => audioContext,
      now: () => 0,
    });

    const first = await controller.start();
    expect(first.success).toBe(true);

    const reuse = await controller.start({ reuseExistingStream: true });
    expect(reuse.success).toBe(true);
    if (reuse.success) {
      expect(reuse.stream).toBe(stream);
    }
  });
});

describe('audioCaptureController.stop', () => {
  it('stops tracks and closes audio context on stop', async () => {
    const stream = createMockStream();
    const requestResult: MicrophoneAccessRequestResult = {
      status: 'granted',
      stream,
      trackCount: 1,
      latencyMs: 5,
    };
    const guard = createGuardMock(SUPPORTED_EVALUATION, requestResult);
    const { audioContext, disconnect } = createAudioContextMock();
    const controller = createAudioCaptureController({
      guard,
      audioContextFactory: () => audioContext,
      now: () => 5,
    });

    const startResult = await controller.start();
    expect(startResult.success).toBe(true);

    await controller.stop();

    stream.getTracks().forEach(track => {
      expect((track as any).stop).toHaveBeenCalled();
    });
    expect(audioContext.close).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    expect(controller.getState().status).toBe('idle');
  });
});

describe('audioCaptureController performance', () => {
  it('reports latency under 500ms for immediate streams', async () => {
    const stream = createMockStream();
    const requestResult: MicrophoneAccessRequestResult = {
      status: 'granted',
      stream,
      trackCount: 1,
      latencyMs: 32,
    };
    const guard = createGuardMock(SUPPORTED_EVALUATION, requestResult);
    const { audioContext } = createAudioContextMock();
    const controller = createAudioCaptureController({
      guard,
      audioContextFactory: () => audioContext,
      now: () => 0,
    });

    const result = await controller.start();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.latencyMs).toBeLessThan(500);
    }
  });
});
