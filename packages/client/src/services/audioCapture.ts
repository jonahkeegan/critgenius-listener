import {
  createMicrophoneAccessGuard,
  MICROPHONE_ACCESS_STATUS,
  type MicrophoneAccessEvaluation,
  type MicrophoneAccessGuard,
  type MicrophoneAccessGuardOptions,
  type MicrophoneAccessRequestResult,
} from './microphoneAccessGuard';
import {
  createStructuredEventReporter,
  type StructuredEventReporter,
} from './diagnostics';

export type AudioCaptureStatus = 'idle' | 'starting' | 'capturing' | 'error';

export type AudioCaptureErrorCode =
  | 'SECURE_CONTEXT_REQUIRED'
  | 'PERMISSION_BLOCKED'
  | 'UNSUPPORTED'
  | 'STREAM_ERROR'
  | 'AUDIO_CONTEXT_FAILED'
  | 'RETRY_EXHAUSTED';

export interface AudioCaptureState {
  status: AudioCaptureStatus;
  evaluation?: MicrophoneAccessEvaluation | undefined;
  latencyMs?: number | undefined;
  errorCode?: AudioCaptureErrorCode | undefined;
}

export interface AudioCaptureRetryConfiguration {
  maxAttempts: number;
  backoffMs: number;
}

export interface AudioCaptureFeatureFlags {
  enableDiagnostics: boolean;
  enableLatencyTracking: boolean;
}

export interface AudioCaptureConfiguration {
  guard: MicrophoneAccessGuard;
  reporter: StructuredEventReporter;
  audioContextFactory: () => AudioContext;
  defaultConstraints: MediaStreamConstraints;
  timeProvider: () => number;
  featureFlags: AudioCaptureFeatureFlags;
  retryPolicy?: AudioCaptureRetryConfiguration | undefined;
}

export interface AudioCaptureConfigurationOptions {
  guard?: MicrophoneAccessGuard;
  guardOptions?: MicrophoneAccessGuardOptions;
  audioContextFactory?: () => AudioContext;
  reporter?: StructuredEventReporter;
  defaultConstraints?: MediaStreamConstraints;
  timeProvider?: () => number;
  /** @deprecated Use timeProvider instead. */
  now?: () => number;
  enableDiagnostics?: boolean;
  enableLatencyTracking?: boolean;
  retryPolicy?: AudioCaptureRetryConfiguration;
}

/**
 * @deprecated Use AudioCaptureConfigurationOptions instead.
 */
export type AudioCaptureDependencies = AudioCaptureConfigurationOptions;

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
      latencyMs?: number;
    }
  | {
      success: false;
      evaluation: MicrophoneAccessEvaluation;
      errorCode: AudioCaptureErrorCode;
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

const defaultNow = () => Date.now();

const sanitizeConstraints = (
  constraints: MediaStreamConstraints | undefined
): Record<string, unknown> | undefined => {
  if (!constraints) {
    return undefined;
  }
  try {
    return JSON.parse(JSON.stringify(constraints)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    if (ms <= 0) {
      resolve();
      return;
    }
    setTimeout(resolve, ms);
  });

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

function createAudioCaptureGuard(
  options: AudioCaptureConfigurationOptions,
  reporter: StructuredEventReporter,
  timeProvider: () => number,
  diagnosticsEnabled: boolean
): MicrophoneAccessGuard {
  if (options.guard) {
    return options.guard;
  }

  const guardReporter = options.guardOptions?.reporter;
  const now = options.guardOptions?.now ?? timeProvider;

  const reporterWrapper: MicrophoneAccessGuardOptions['reporter'] = event => {
    guardReporter?.(event);
    if (diagnosticsEnabled) {
      reporter.emit({
        event:
          event.phase === 'evaluate'
            ? 'audio.capture.guard.evaluate'
            : 'audio.capture.guard.request',
        level: 'debug',
        code: event.phase === 'evaluate' ? 'GUARD_EVALUATE' : 'GUARD_REQUEST',
        operation: `guard.${event.phase}`,
        metadata: {
          status: event.status,
          permission: event.permission,
          errorCode: event.errorCode,
          secureContext: event.secureContext,
          reason: event.reason,
        },
      });
    }
  };

  return createMicrophoneAccessGuard({
    ...options.guardOptions,
    reporter: reporterWrapper,
    now,
  });
}

export function createAudioCaptureConfiguration(
  options: AudioCaptureConfigurationOptions = {}
): AudioCaptureConfiguration {
  const reporter = options.reporter ?? createStructuredEventReporter();
  const timeProvider = options.timeProvider ?? options.now ?? defaultNow;
  const diagnosticsEnabled = options.enableDiagnostics ?? true;
  const latencyTrackingEnabled = options.enableLatencyTracking ?? true;

  const guard = createAudioCaptureGuard(
    options,
    reporter,
    timeProvider,
    diagnosticsEnabled
  );

  const audioContextFactory =
    options.audioContextFactory ?? defaultAudioContextFactory;

  const defaultConstraints = options.defaultConstraints ?? DEFAULT_CONSTRAINTS;

  return {
    guard,
    reporter,
    audioContextFactory,
    defaultConstraints,
    timeProvider,
    featureFlags: {
      enableDiagnostics: diagnosticsEnabled,
      enableLatencyTracking: latencyTrackingEnabled,
    },
    retryPolicy: options.retryPolicy,
  };
}

function mapGuardResultToErrorCode(
  evaluation: MicrophoneAccessEvaluation,
  request: MicrophoneAccessRequestResult
): AudioCaptureErrorCode {
  if (request.status === 'blocked') {
    if (request.reason === 'insecure-context') {
      return 'SECURE_CONTEXT_REQUIRED';
    }
    return 'PERMISSION_BLOCKED';
  }
  if (request.status === 'error') {
    if (request.reason === 'unsupported') {
      return 'UNSUPPORTED';
    }
    return 'STREAM_ERROR';
  }

  switch (evaluation.status) {
    case MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED:
      return 'SECURE_CONTEXT_REQUIRED';
    case MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED:
      return 'PERMISSION_BLOCKED';
    case MICROPHONE_ACCESS_STATUS.UNAVAILABLE:
      return 'UNSUPPORTED';
    default:
      return 'STREAM_ERROR';
  }
}

function createErrorCodeFromEvaluation(
  evaluation: MicrophoneAccessEvaluation
): AudioCaptureErrorCode {
  switch (evaluation.status) {
    case MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED:
      return 'SECURE_CONTEXT_REQUIRED';
    case MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED:
      return 'PERMISSION_BLOCKED';
    case MICROPHONE_ACCESS_STATUS.UNAVAILABLE:
      return 'UNSUPPORTED';
    default:
      return 'STREAM_ERROR';
  }
}

export function createAudioCaptureController(
  configurationOptions: AudioCaptureConfigurationOptions = {}
): AudioCaptureController {
  const config = createAudioCaptureConfiguration(configurationOptions);
  const { guard, reporter, audioContextFactory, defaultConstraints } = config;
  const latencyTrackingEnabled = config.featureFlags.enableLatencyTracking;

  let currentState: AudioCaptureState = { status: 'idle' };
  let currentStream: MediaStream | undefined;
  let currentAudioContext: AudioContext | undefined;
  let currentSourceNode: MediaStreamAudioSourceNode | undefined;

  const updateState = (partial: Partial<AudioCaptureState>) => {
    currentState = { ...currentState, ...partial };
  };

  const start: AudioCaptureController['start'] = async options => {
    const constraints = options?.constraints ?? defaultConstraints;

    if (options?.reuseExistingStream && currentStream) {
      const evaluation = currentState.evaluation ?? (await guard.evaluate());
      if (!currentState.evaluation) {
        updateState({ evaluation });
      }
      const baseResult = {
        success: true as const,
        stream: currentStream,
        audioContext: currentAudioContext,
        evaluation,
      };

      if (typeof currentState.latencyMs === 'number') {
        return { ...baseResult, latencyMs: currentState.latencyMs };
      }

      return baseResult;
    }

    updateState({ status: 'starting', errorCode: undefined });
    reporter.emit({
      event: 'audio.capture.start',
      level: 'info',
      code: 'OPERATION_INIT',
      operation: 'start',
      metadata: {
        constraints: sanitizeConstraints(constraints),
      },
    });

    const evaluation = await guard.evaluate();
    updateState({ evaluation });

    if (evaluation.status !== MICROPHONE_ACCESS_STATUS.SUPPORTED) {
      const errorCode = createErrorCodeFromEvaluation(evaluation);
      updateState({ status: 'error', errorCode });
      reporter.emit({
        event: 'audio.capture.error',
        level: 'error',
        code: errorCode,
        operation: 'guard.evaluate',
        metadata: {
          evaluationStatus: evaluation.status,
        },
      });
      return { success: false, evaluation, errorCode };
    }

    const maxAttempts = Math.max(config.retryPolicy?.maxAttempts ?? 1, 1);
    const backoffMs = config.retryPolicy?.backoffMs ?? 0;
    let requestResult: MicrophoneAccessRequestResult | undefined;
    let finalAttempt = 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      finalAttempt = attempt + 1;
      if (attempt > 0) {
        reporter.emit({
          event: 'audio.capture.retry',
          level: 'warn',
          code: 'RETRY_ATTEMPT',
          operation: 'start',
          metadata: { attempt: finalAttempt },
        });
      }

      requestResult = await guard.requestAccess(constraints);
      if (requestResult.status === 'granted') {
        break;
      }

      const shouldBreak =
        requestResult.status === 'blocked' || attempt === maxAttempts - 1;
      if (shouldBreak) {
        break;
      }

      if (backoffMs > 0) {
        await delay(backoffMs);
      }
    }

    if (!requestResult) {
      throw new Error('UnexpectedRequestState');
    }

    const attemptNumber = finalAttempt;

    if (requestResult.status !== 'granted') {
      let errorCode: AudioCaptureErrorCode;
      if (requestResult.status === 'blocked') {
        errorCode = mapGuardResultToErrorCode(evaluation, requestResult);
      } else if (requestResult.reason === 'unsupported') {
        errorCode = 'UNSUPPORTED';
      } else if (maxAttempts > 1 && attemptNumber === maxAttempts) {
        errorCode = 'RETRY_EXHAUSTED';
      } else {
        errorCode = 'STREAM_ERROR';
      }

      updateState({ status: 'error', errorCode });
      reporter.emit({
        event: 'audio.capture.error',
        level: 'error',
        code: errorCode,
        operation: 'start',
        metadata: {
          attempt: attemptNumber,
          reason: requestResult.reason,
        },
      });
      return { success: false, evaluation, errorCode };
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
      const errorCode: AudioCaptureErrorCode = 'AUDIO_CONTEXT_FAILED';
      updateState({ status: 'error', errorCode });
      reporter.emit({
        event: 'audio.capture.error',
        level: 'error',
        code: errorCode,
        operation: 'start',
        metadata: {
          attempt: attemptNumber,
          reason:
            error instanceof Error ? (error.name ?? error.message) : 'unknown',
        },
      });
      return { success: false, evaluation, errorCode };
    }

    const latencyMs = requestResult.latencyMs;
    updateState({
      status: 'capturing',
      latencyMs: latencyTrackingEnabled ? latencyMs : undefined,
      errorCode: undefined,
    });
    reporter.emit({
      event: 'audio.capture.success',
      level: 'info',
      code: 'STREAM_ACTIVE',
      operation: 'start',
      metadata: {
        latencyMs,
        attempt: attemptNumber,
      },
    });

    const baseResult = {
      success: true as const,
      stream: currentStream,
      audioContext: currentAudioContext,
      evaluation,
    };

    if (typeof latencyMs === 'number') {
      return { ...baseResult, latencyMs };
    }

    return baseResult;
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
    updateState({ status: 'idle', latencyMs: undefined, errorCode: undefined });
    reporter.emit({
      event: 'audio.capture.stop',
      level: 'info',
      code: 'CAPTURE_STOPPED',
      operation: 'stop',
    });
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
