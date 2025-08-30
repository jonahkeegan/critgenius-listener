import { describe, it, expect, afterEach, vi } from 'vitest';
import { isWebAudioSupported } from './browserDetection';

describe('isWebAudioSupported', () => {
  const originalAudioContext = window.AudioContext;
  const originalWebkitAudioContext = (window as any).webkitAudioContext;

  afterEach(() => {
    (window as any).AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
  });

  it('should return true if AudioContext is available', () => {
    (window as any).AudioContext = vi.fn();
    (window as any).webkitAudioContext = undefined;
    expect(isWebAudioSupported()).toBe(true);
  });

  it('should return true if webkitAudioContext is available', () => {
    (window as any).AudioContext = undefined;
    (window as any).webkitAudioContext = vi.fn();
    expect(isWebAudioSupported()).toBe(true);
  });

  it('should return false if neither AudioContext nor webkitAudioContext is available', () => {
    (window as any).AudioContext = undefined;
    (window as any).webkitAudioContext = undefined;
    expect(isWebAudioSupported()).toBe(false);
  });
});
