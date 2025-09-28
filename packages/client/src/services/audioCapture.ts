import {
  createMicrophoneAccessGuard,
  MICROPHONE_ACCESS_STATUS,
  type MicrophoneAccessEvaluation,
  type MicrophoneAccessGuard,
  type MicrophoneAccessGuardOptions,
  type MicrophoneAccessRequestResult,
} from './microphoneAccessGuard';

export type AudioCaptureStatus = 'idle' | 'starting' | 'capturing' | 'error';

export interface AudioCaptureError {
  code:
    | 'SECURE_CONTEXT_REQUIRED'
    | 'UNSUPPORTED'
    | 'PERMISSION_BLOCKED'
    | 'STREAM_ERROR';
  message: string;
}

export interface AudioCaptureState {
  status: AudioCaptureStatus;
  evaluation?: MicrophoneAccessEvaluation | undefined;
  latencyMs?: number | undefined;
  error?: AudioCaptureError | undefined;
}

export interface AudioCaptureEvent {
  type: 'start' | 'stop' | 'error' | 'diagnostic';
  timestamp: number;
  detail?: Record<string, unknown> | undefined;
}

export type AudioCaptureReporter = (event: AudioCaptureEvent) => void;

export interface AudioCaptureDependencies {
  guard?: MicrophoneAccessGuard;
  guardOptions?: MicrophoneAccessGuardOptions;
  audioContextFactory?: () => AudioContext;
  reporter?: AudioCaptureReporter;
  now?: () => number;
}

export interface AudioCaptureStartOptions {
  constraints?: MediaStreamConstraints;
  reuseExistingStream?: boolean;
}

export type AudioCaptureStartResult =
  | {
      success: true;
      stream: MediaStream;
      audioContext?: AudioContext | undefined;
      evaluation: MicrophoneAccessEvaluation;
      latencyMs: number;
    }
  | {
      success: false;
      evaluation: MicrophoneAccessEvaluation;
      error: AudioCaptureError;
    };

export interface AudioCaptureController {
  start(options?: AudioCaptureStartOptions): Promise<AudioCaptureStartResult>;
  stop(): Promise<void>;
  getState(): AudioCaptureState;
  getStream(): MediaStream | undefined;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  },
};

const defaultReporter: AudioCaptureReporter = event => {
  const { type, timestamp, detail } = event;
  console.info('[audio-capture]', { type, timestamp, detail });
};

const defaultNow = () => Date.now();

function defaultAudioContextFactory(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContextUnavailable');
  }
  const AudioContextCtor: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('AudioContextUnavailable');
  }
  return new AudioContextCtor();
}

function mapGuardResultToError(
  evaluation: MicrophoneAccessEvaluation,
  request: MicrophoneAccessRequestResult
): AudioCaptureError {
  if (request.status === 'blocked') {
    if (request.reason === 'insecure-context') {
      return {
        code: 'SECURE_CONTEXT_REQUIRED',
        message: 'Microphone access requires a secure (HTTPS) context.',
      };
    }
    return {
      code: 'PERMISSION_BLOCKED',
      message:
        'Microphone permission was blocked. Please enable access in browser settings.',
    };
  }
  if (request.status === 'error') {
    if (request.reason === 'unsupported') {
      return {
        code: 'UNSUPPORTED',
        message: 'Microphone access is unavailable in this browser.',
      };
    }
    return {
      code: 'STREAM_ERROR',
      message: 'Unexpected error requesting microphone access. Try again.',
    };
  }

  switch (evaluation.status) {
    case MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED:
      return {
        code: 'SECURE_CONTEXT_REQUIRED',
        message: 'Secure context required for microphone access.',
      };
    case MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED:
      return {
        code: 'PERMISSION_BLOCKED',
        message: 'Microphone permission denied by the user.',
      };
    case MICROPHONE_ACCESS_STATUS.UNAVAILABLE:
      return {
        code: 'UNSUPPORTED',
        message: 'Microphone access is unavailable in this environment.',
      };
    default:
      return {
        code: 'STREAM_ERROR',
        message: 'Failed to start microphone capture.',
      };
  }
}

function createErrorFromEvaluation(
  evaluation: MicrophoneAccessEvaluation
): AudioCaptureError {
  switch (evaluation.status) {
    case MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED:
      return {
        code: 'SECURE_CONTEXT_REQUIRED',
        message: 'Microphone access requires HTTPS in supported browsers.',
      };
    case MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED:
      return {
        code: 'PERMISSION_BLOCKED',
        message:
          'Microphone permission denied. Update browser permissions to proceed.',
      };
    case MICROPHONE_ACCESS_STATUS.UNAVAILABLE:
      return {
        code: 'UNSUPPORTED',
        message: 'Microphone access is unavailable on this device or browser.',
      };
    default:
      return {
        code: 'STREAM_ERROR',
        message: 'Unknown microphone access state.',
      };
  }
}

export function createAudioCaptureController(
  dependencies: AudioCaptureDependencies = {}
): AudioCaptureController {
  const reporter = dependencies.reporter ?? defaultReporter;
  const now = dependencies.now ?? defaultNow;
  const guardReporter = (event: Parameters<AudioCaptureReporter>[0]) => {
    reporter(event);
  };
  const guard =
    dependencies.guard ??
    createMicrophoneAccessGuard({
      ...dependencies.guardOptions,
      reporter: event => {
        guardReporter({
          type: 'diagnostic',
          timestamp: now(),
          detail: {
            phase: event.phase,
            status: event.status,
            permission: event.permission,
          },
        });
      },
    });
  const audioContextFactory =
    dependencies.audioContextFactory ?? defaultAudioContextFactory;

  let currentState: AudioCaptureState = { status: 'idle' };
  let currentStream: MediaStream | undefined;
  let currentAudioContext: AudioContext | undefined;
  let currentSourceNode: MediaStreamAudioSourceNode | undefined;

  const updateState = (partial: Partial<AudioCaptureState>) => {
    currentState = { ...currentState, ...partial };
  };

  const start: AudioCaptureController['start'] = async options => {
    const constraints = options?.constraints ?? DEFAULT_CONSTRAINTS;

    if (options?.reuseExistingStream && currentStream) {
      return {
        success: true,
        stream: currentStream,
        audioContext: currentAudioContext,
        evaluation: currentState.evaluation!,
        latencyMs: currentState.latencyMs ?? 0,
      };
    }

    updateState({ status: 'starting', error: undefined });
    const evaluation = await guard.evaluate();
    updateState({ evaluation });

    if (evaluation.status !== MICROPHONE_ACCESS_STATUS.SUPPORTED) {
      const error = createErrorFromEvaluation(evaluation);
      updateState({ status: 'error', error });
      reporter({
        type: 'error',
        timestamp: now(),
        detail: { code: error.code },
      });
      return { success: false, evaluation, error };
    }

    const requestResult = await guard.requestAccess(constraints);

    if (requestResult.status !== 'granted') {
      const error = mapGuardResultToError(evaluation, requestResult);
      updateState({ status: 'error', error });
      reporter({
        type: 'error',
        timestamp: now(),
        detail: { code: error.code },
      });
      return { success: false, evaluation, error };
    }

    currentStream?.getTracks().forEach(track => track.stop());
    currentStream = requestResult.stream;

    try {
      if (!currentAudioContext) {
        currentAudioContext = audioContextFactory();
      }
      if (currentAudioContext.state === 'suspended') {
        await currentAudioContext.resume();
      }
      currentSourceNode?.disconnect();
      currentSourceNode =
        currentAudioContext.createMediaStreamSource(currentStream);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to initialize audio context.';
      const captureError: AudioCaptureError = {
        code: 'STREAM_ERROR',
        message,
      };
      updateState({ status: 'error', error: captureError });
      reporter({
        type: 'error',
        timestamp: now(),
        detail: { code: captureError.code },
      });
      return { success: false, evaluation, error: captureError };
    }

    updateState({
      status: 'capturing',
      latencyMs: requestResult.latencyMs,
      error: undefined,
    });
    reporter({
      type: 'start',
      timestamp: now(),
      detail: { latencyMs: requestResult.latencyMs },
    });

    return {
      success: true,
      stream: currentStream,
      audioContext: currentAudioContext,
      evaluation,
      latencyMs: requestResult.latencyMs,
    };
  };

  const stop: AudioCaptureController['stop'] = async () => {
    currentStream?.getTracks().forEach(track => track.stop());
    currentStream = undefined;
    if (currentSourceNode) {
      try {
        currentSourceNode.disconnect();
      } catch (error) {
        console.warn('[audio-capture] failed to disconnect source node', error);
      }
      currentSourceNode = undefined;
    }
    if (currentAudioContext) {
      try {
        await currentAudioContext.close();
      } catch (error) {
        console.warn('[audio-capture] failed to close AudioContext', error);
      }
      currentAudioContext = undefined;
    }
    updateState({ status: 'idle', latencyMs: undefined });
    reporter({ type: 'stop', timestamp: now() });
  };

  const getState: AudioCaptureController['getState'] = () => currentState;
  const getStream: AudioCaptureController['getStream'] = () => currentStream;

  return {
    start,
    stop,
    getState,
    getStream,
  };
}
