import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MICROPHONE_ACCESS_STATUS,
  createMicrophoneAccessGuard,
  type MicrophoneAccessGuard,
} from '../../services/microphoneAccessGuard';

const now = () => 1727548800000; // fixed timestamp for deterministic diagnostics

interface MockPermissions {
  query: ReturnType<typeof vi.fn>;
}

interface MockNavigator {
  mediaDevices?: {
    getUserMedia: ReturnType<typeof vi.fn>;
  };
  permissions?: MockPermissions;
}

interface MockWindow {
  isSecureContext: boolean;
  navigator?: MockNavigator;
}

function createMockStream(trackCount = 1): MediaStream {
  const tracks = Array.from({ length: trackCount }, () => ({
    stop: vi.fn(),
  })) as unknown as MediaStreamTrack[];
  return {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  } as unknown as MediaStream;
}

function buildPermissionStatus(state: PermissionState): PermissionStatus {
  return {
    state,
    name: 'microphone',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as PermissionStatus;
}

function createGuard(windowRef: MockWindow): MicrophoneAccessGuard {
  const reporter = vi.fn();
  return createMicrophoneAccessGuard({
    windowRef: windowRef as unknown as Window & typeof globalThis,
    reporter,
    now,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('microphoneAccessGuard.evaluate', () => {
  it('returns UNAVAILABLE when navigator is missing', async () => {
    const guard = createMicrophoneAccessGuard({
      windowRef: {
        isSecureContext: true,
        navigator: undefined,
      } as unknown as Window & typeof globalThis,
      now,
      reporter: vi.fn(),
    });

    const result = await guard.evaluate();

    expect(result.status).toBe(MICROPHONE_ACCESS_STATUS.UNAVAILABLE);
    expect(result.canRequest).toBe(false);
  });

  it('flags insecure contexts explicitly', async () => {
    const guard = createGuard({
      isSecureContext: false,
      navigator: {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
      },
    });

    const result = await guard.evaluate();

    expect(result.status).toBe(
      MICROPHONE_ACCESS_STATUS.SECURE_CONTEXT_REQUIRED
    );
    expect(result.secureContext).toBe(false);
  });

  it('detects permission denied state', async () => {
    const guard = createGuard({
      isSecureContext: true,
      navigator: {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
        permissions: {
          query: vi.fn().mockResolvedValue(buildPermissionStatus('denied')),
        },
      },
    });

    const result = await guard.evaluate();

    expect(result.status).toBe(MICROPHONE_ACCESS_STATUS.PERMISSION_BLOCKED);
    expect(result.permission).toBe('denied');
  });

  it('returns SUPPORTED when secure context and permissions available', async () => {
    const guard = createGuard({
      isSecureContext: true,
      navigator: {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
        permissions: {
          query: vi.fn().mockResolvedValue(buildPermissionStatus('prompt')),
        },
      },
    });

    const result = await guard.evaluate();

    expect(result.status).toBe(MICROPHONE_ACCESS_STATUS.SUPPORTED);
    expect(result.canRequest).toBe(true);
  });
});

describe('microphoneAccessGuard.requestAccess', () => {
  it('blocks when secure context is required', async () => {
    const guard = createGuard({
      isSecureContext: false,
      navigator: {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
      },
    });

    const result = await guard.requestAccess();

    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.reason).toBe('insecure-context');
    }
  });

  it('returns granted stream when permissions are available', async () => {
    const stream = createMockStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const guard = createGuard({
      isSecureContext: true,
      navigator: {
        mediaDevices: { getUserMedia },
        permissions: {
          query: vi.fn().mockResolvedValue(buildPermissionStatus('granted')),
        },
      },
    });

    const result = await guard.requestAccess();

    expect(getUserMedia).toHaveBeenCalled();
    expect(result.status).toBe('granted');
    if (result.status === 'granted') {
      expect(result.trackCount).toBe(1);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('maps NotAllowedError to permission blocked', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );
    const guard = createGuard({
      isSecureContext: true,
      navigator: {
        mediaDevices: { getUserMedia },
        permissions: {
          query: vi.fn().mockResolvedValue(buildPermissionStatus('prompt')),
        },
      },
    });

    const result = await guard.requestAccess();

    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.reason).toBe('permission-denied');
    }
  });

  it('returns unsupported when mediaDevices is unavailable', async () => {
    const guard = createGuard({
      isSecureContext: true,
      navigator: {
        permissions: {
          query: vi.fn().mockResolvedValue(buildPermissionStatus('granted')),
        },
      },
    });

    const result = await guard.requestAccess();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.reason).toBe('unsupported');
    }
  });
});
