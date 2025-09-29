/*
 * Microphone access guard centralizes secure-context and capability checks before invoking
 * navigator.mediaDevices.getUserMedia. The guard returns typed outcomes that can be consumed by
 * UI layers or the audio capture module without leaking raw permission details.
 */

export const MICROPHONE_ACCESS_STATUS = {
  SUPPORTED: 'SUPPORTED',
  SECURE_CONTEXT_REQUIRED: 'SECURE_CONTEXT_REQUIRED',
  PERMISSION_BLOCKED: 'PERMISSION_BLOCKED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type MicrophoneAccessStatus =
  (typeof MICROPHONE_ACCESS_STATUS)[keyof typeof MICROPHONE_ACCESS_STATUS];

export type MicrophonePermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unavailable';

export interface MicrophoneAccessEvaluation {
  status: MicrophoneAccessStatus;
  secureContext: boolean;
  permission: MicrophonePermissionState;
  canRequest: boolean;
  reason?: string | undefined;
}

export type MicrophoneAccessRequestResult =
  | {
      status: 'granted';
      stream: MediaStream;
      trackCount: number;
      constraints?: MediaStreamConstraints;
      latencyMs: number;
    }
  | {
      status: 'blocked';
      reason: 'permission-denied' | 'insecure-context';
    }
  | {
      status: 'error';
      reason: 'unsupported' | 'unknown';
      message?: string | undefined;
    };

export interface MicrophoneAccessDiagnosticEvent {
  phase: 'evaluate' | 'request';
  status: MicrophoneAccessStatus;
  secureContext: boolean;
  permission: MicrophonePermissionState;
  timestamp: number;
  reason?: string | undefined;
  errorCode?:
    | 'permission-denied'
    | 'unsupported'
    | 'secure-context'
    | 'unknown'
    | undefined;
}

export type MicrophoneAccessGuardReporter = (
  event: MicrophoneAccessDiagnosticEvent
) => void;

export interface MicrophoneAccessGuardOptions {
  /** Injected window reference to support testing environments without a real DOM. */
  windowRef?: Window & typeof globalThis;
  /** Optional diagnostic reporter; defaults to console.info with sanitized payload. */
  reporter?: MicrophoneAccessGuardReporter;
  /** Optional custom timestamp provider for deterministic testing. */
  now?: () => number;
}

export interface MicrophoneAccessGuard {
  evaluate(): Promise<MicrophoneAccessEvaluation>;
  requestAccess(
    constraints?: MediaStreamConstraints
  ): Promise<MicrophoneAccessRequestResult>;
}

export const MAX_ERROR_MESSAGE_LENGTH = 120;

const defaultReporter: MicrophoneAccessGuardReporter = event => {
  const { phase, status, secureContext, permission, errorCode, reason } = event;
  console.info('[microphone-guard]', {
    phase,
    status,
    secureContext,
    permission,
    errorCode,
    reason,
  });
};

function resolveWindow(ref?: Window & typeof globalThis) {
  if (ref) return ref;
  if (typeof window !== 'undefined') {
    return window;
  }
  return undefined;
}

function normalizePermissionState(
  state: PermissionState | undefined
): MicrophonePermissionState {
  if (state === 'granted' || state === 'denied' || state === 'prompt') {
    return state;
  }
  return 'unavailable';
}

async function queryMicrophonePermission(
  navigatorRef: Navigator | undefined
): Promise<MicrophonePermissionState> {
  const permissions = navigatorRef?.permissions;
  if (!permissions?.query) {
    return 'unavailable';
  }
  try {
    const status = (await permissions.query({
      // Safari currently types PermissionName without microphone; cast to retain compatibility.
      name: 'microphone' as PermissionName,
    })) as PermissionStatus | undefined;
    return normalizePermissionState(status?.state);
  } catch {
    return 'unavailable';
  }
}

function buildEvaluationResult(
  status: MicrophoneAccessStatus,
  secureContext: boolean,
  permission: MicrophonePermissionState,
  canRequest: boolean,
  reason?: string | undefined
): MicrophoneAccessEvaluation {
  return { status, secureContext, permission, canRequest, reason };
}

function sanitizeErrorMessage(input: unknown): string | undefined {
  if (!input) return undefined;
  if (input instanceof Error) {
    return input.name === input.message ? input.name : input.name || 'Error';
  }
  if (typeof input === 'string') {
    // Limit to alphanumeric + basic punctuation to prevent leaking sensitive detail.
    return (
      input
        .replace(/[^A-Za-z0-9 _.-]/g, '')
        .slice(0, MAX_ERROR_MESSAGE_LENGTH) || undefined
    );
  }
  return undefined;
}

export function createMicrophoneAccessGuard(
  options: MicrophoneAccessGuardOptions = {}
): MicrophoneAccessGuard {
  const reporter = options.reporter ?? defaultReporter;
  const now = options.now ?? (() => Date.now());

  const getWindow = () => resolveWindow(options.windowRef);

  const evaluate = async (): Promise<MicrophoneAccessEvaluation> => {
    const windowRef = getWindow();
    const secureContext = Boolean(windowRef?.isSecureContext);
    const navigatorRef = windowRef?.navigator;
    const permission = await queryMicrophonePermission(navigatorRef);

    let status: MicrophoneAccessStatus = MICROPHONE_ACCESS_STATUS.UNAVAILABLE;
    let reason: string | undefined;
    let canRequest = false;

    if (!windowRef || !navigatorRef) {
      status = MICROPHONE_ACCESS_STATUS.UNAVAILABLE;
      reason = 'NavigatorUnavailable';
    } else if (!secureContext) {
      status = MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED;
      reason = 'InsecureContext';
    } else if (!navigatorRef.mediaDevices?.getUserMedia) {
      status = MICROPHONE_ACCESS_STATUS.UNAVAILABLE;
      reason = 'MediaDevicesMissing';
    } else if (permission === 'denied') {
      status = MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED;
      reason = 'PermissionDenied';
    } else {
      status = MICROPHONE_ACCESS_STATUS.SUPPORTED;
      canRequest = true;
    }

    const evaluation = buildEvaluationResult(
      status,
      secureContext,
      permission,
      canRequest,
      reason
    );

    reporter({
      phase: 'evaluate',
      status,
      secureContext,
      permission,
      reason,
      timestamp: now(),
    });

    return evaluation;
  };

  const requestAccess = async (
    constraints: MediaStreamConstraints = {
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    }
  ): Promise<MicrophoneAccessRequestResult> => {
    const start = now();
    const evaluation = await evaluate();
    const { status, secureContext, permission } = evaluation;

    if (status === MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED) {
      reporter({
        phase: 'request',
        status,
        secureContext,
        permission,
        errorCode: 'secure-context',
        timestamp: now(),
        reason: evaluation.reason,
      });
      return { status: 'blocked', reason: 'insecure-context' };
    }

    if (status === MICROPHONE_ACCESS_STATUS.UNAVAILABLE) {
      reporter({
        phase: 'request',
        status,
        secureContext,
        permission,
        errorCode: 'unsupported',
        timestamp: now(),
        reason: evaluation.reason,
      });
      return {
        status: 'error',
        reason: 'unsupported',
        message: evaluation.reason,
      };
    }

    if (status === MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED) {
      reporter({
        phase: 'request',
        status,
        secureContext,
        permission,
        errorCode: 'permission-denied',
        timestamp: now(),
        reason: 'PermissionDenied',
      });
      return { status: 'blocked', reason: 'permission-denied' };
    }

    try {
      const windowRef = getWindow();
      const mediaDevices = windowRef?.navigator?.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        reporter({
          phase: 'request',
          status: MICROPHONE_ACCESS_STATUS.UNAVAILABLE,
          secureContext,
          permission,
          errorCode: 'unsupported',
          timestamp: now(),
          reason: 'MediaDevicesMissing',
        });
        return {
          status: 'error',
          reason: 'unsupported',
          message: 'MediaDevicesMissing',
        };
      }

      const stream = await mediaDevices.getUserMedia(constraints);
      const latencyMs = Math.max(0, now() - start);
      const trackCount = stream.getTracks().length;

      reporter({
        phase: 'request',
        status: MICROPHONE_ACCESS_STATUS.SUPPORTED,
        secureContext,
        permission,
        timestamp: now(),
      });

      return {
        status: 'granted',
        stream,
        constraints,
        trackCount,
        latencyMs,
      };
    } catch (error) {
      const sanitized = sanitizeErrorMessage(error);
      const errorCode =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError')
          ? 'permission-denied'
          : 'unknown';

      reporter({
        phase: 'request',
        status: MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED,
        secureContext,
        permission,
        errorCode,
        timestamp: now(),
        reason: sanitized,
      });

      if (errorCode === 'permission-denied') {
        return { status: 'blocked', reason: 'permission-denied' };
      }

      return { status: 'error', reason: 'unknown', message: sanitized };
    }
  };

  return { evaluate, requestAccess };
}
