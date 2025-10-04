import { expect, vi } from 'vitest';

export interface WaitForConditionOptions {
  /** Maximum amount of time to wait for condition (ms). */
  timeout?: number;
  /** Polling interval (ms). */
  interval?: number;
  /** Whether to throw when condition not met before timeout. */
  throwOnTimeout?: boolean;
  /** Description appended to timeout errors. */
  description?: string;
}

export interface RetryAssertionOptions extends WaitForConditionOptions {
  /** Number of attempts (overrides timeout when provided). */
  attempts?: number;
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  settled: boolean;
}

const DEFAULT_TIMEOUT = 1_000;
const DEFAULT_INTERVAL = 10;

export const waitForCondition = async (
  predicate: () => boolean | Promise<boolean>,
  {
    timeout = DEFAULT_TIMEOUT,
    interval = DEFAULT_INTERVAL,
    throwOnTimeout = true,
    description,
  }: WaitForConditionOptions = {}
): Promise<boolean> => {
  const end = Date.now() + timeout;

  while (Date.now() <= end) {
    const result = await predicate();
    if (result) {
      return true;
    }

    await waitInterval(interval);
  }

  if (throwOnTimeout) {
    const message = description
      ? `Timed out waiting for condition: ${description}`
      : 'Timed out waiting for condition to become truthy';
    throw new Error(message);
  }

  return false;
};

export const retryAssertion = async (
  assertion: () => void | Promise<void>,
  {
    timeout = DEFAULT_TIMEOUT,
    interval = DEFAULT_INTERVAL,
    attempts,
    description,
  }: RetryAssertionOptions = {}
): Promise<void> => {
  const deadline = attempts ? Number.POSITIVE_INFINITY : Date.now() + timeout;
  let remaining = attempts ?? Number.POSITIVE_INFINITY;
  let lastError: unknown;

  while (Date.now() <= deadline && remaining > 0) {
    remaining -= 1;
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
    }

    await waitInterval(interval);
  }

  const message = description
    ? `Assertion did not pass before timeout: ${description}`
    : 'Assertion did not pass before timeout';
  throw new Error(
    lastError instanceof Error ? `${message}\n${lastError.message}` : message
  );
};

export const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
};

export const waitForNextTick = async (): Promise<void> => {
  await new Promise<void>(resolve => {
    queueMicrotask(resolve);
  });
};

export const advanceTimersAndFlush = async (ms: number): Promise<void> => {
  if (!vi.isFakeTimers()) {
    throw new Error(
      'advanceTimersAndFlush requires fake timers. Call vi.useFakeTimers() first.'
    );
  }
  vi.advanceTimersByTime(ms);
  await flushPromises();
  await waitForNextTick();
};

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const waitInterval = async (ms: number): Promise<void> => {
  if (!vi.isFakeTimers()) {
    await delay(ms);
    return;
  }

  vi.advanceTimersByTime(ms);
};

export const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  let settled = false;

  const promise = new Promise<T>((res, rej) => {
    resolve = value => {
      settled = true;
      res(value);
    };
    reject = reason => {
      settled = true;
      rej(reason);
    };
  });

  return {
    promise,
    resolve,
    reject,
    get settled() {
      return settled;
    },
  };
};

export const expectToReject = async (
  promise: Promise<unknown>,
  message?: string
): Promise<void> => {
  await expect(promise).rejects.toThrowError(message);
};

export const useRealTimersSafely = <T>(callback: () => T): T => {
  const usingFakeTimers = vi.isFakeTimers();
  if (usingFakeTimers) {
    vi.useRealTimers();
  }
  try {
    return callback();
  } finally {
    if (usingFakeTimers) {
      vi.useFakeTimers();
    }
  }
};
