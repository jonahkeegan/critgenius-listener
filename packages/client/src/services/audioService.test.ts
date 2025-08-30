import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestMicrophonePermission } from './audioService';

const mockGetUserMedia = vi.fn();

describe('requestMicrophonePermission', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return true when permission is granted', async () => {
    const stopMock = vi.fn();
    const mockTracks = [{ stop: stopMock }];
    const mockStream = { getTracks: () => mockTracks };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const result = await requestMicrophonePermission();
    expect(result).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(stopMock).toHaveBeenCalled();
  });

  it('should return false when permission is denied by the user', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    const result = await requestMicrophonePermission();
    expect(result).toBe(false);
  });

  it('should return false when getUserMedia is not supported', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: undefined,
    });

    const result = await requestMicrophonePermission();
    expect(result).toBe(false);
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });
});
