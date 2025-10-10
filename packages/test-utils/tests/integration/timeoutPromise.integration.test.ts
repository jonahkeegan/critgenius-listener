import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTimeoutPromise,
  TimeoutError,
} from '../../src/integration/timeoutPromise.js';

describe('createTimeoutPromise', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when the underlying promise resolves before the timeout', async () => {
    const result = await createTimeoutPromise(Promise.resolve('ok'), {
      timeoutMs: 100,
    });

    expect(result).toBe('ok');
  });

  it('rejects with TimeoutError when the timeout elapses', async () => {
    vi.useFakeTimers();

    const pending = createTimeoutPromise(new Promise<never>(() => {}), {
      timeoutMs: 50,
    });

    const rejection = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(60);
    await rejection;
  });

  it('invokes onTimeout callback before rejecting', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();

    const pending = createTimeoutPromise(new Promise<never>(() => {}), {
      timeoutMs: 40,
      onTimeout,
    });

    const rejection = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(50);
    await rejection;

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
