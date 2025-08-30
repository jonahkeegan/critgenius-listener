import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePermissions, PermissionState } from './usePermissions';
import * as audioService from '../services/audioService';

// Mock the audioService
vi.mock('../services/audioService');

const mockPermissionStatus = {
  state: 'prompt' as PermissionState,
  onchange: null as (() => void) | null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockQuery = vi.fn();

describe('usePermissions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockQuery.mockResolvedValue(mockPermissionStatus);
    vi.stubGlobal('navigator', {
      permissions: {
        query: mockQuery,
      },
    });
    mockPermissionStatus.state = 'prompt';
    mockPermissionStatus.onchange = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with the state from navigator.permissions.query', async () => {
    mockPermissionStatus.state = 'granted';
    const { result } = renderHook(() => usePermissions());

    await act(async () => {
      // Wait for the useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockQuery).toHaveBeenCalledWith({ name: 'microphone' });
    expect(result.current.permissionState).toBe('granted');
  });

  it('should update permission state on change', async () => {
    const { result } = renderHook(() => usePermissions());

    await act(async () => {
      // Wait for the useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      mockPermissionStatus.state = 'denied';
      if (mockPermissionStatus.onchange) {
        mockPermissionStatus.onchange();
      }
    });

    expect(result.current.permissionState).toBe('denied');
  });

  it('should not change state if requestPermission is called and permissions API is supported', async () => {
    (audioService.requestMicrophonePermission as vi.Mock).mockResolvedValue(
      true
    );
    const { result } = renderHook(() => usePermissions());

    await act(async () => {
      await result.current.requestPermission();
    });

    // The state should not change here, it should wait for the onchange event
    expect(result.current.permissionState).toBe('prompt');
  });

  it('should handle errors during permission request and transition to "denied"', async () => {
    (audioService.requestMicrophonePermission as vi.Mock).mockRejectedValue(
      new Error('Permission error')
    );
    const { result } = renderHook(() => usePermissions());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permissionState).toBe('denied');
  });
});
