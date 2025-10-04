import { describe, expect, it, vi } from 'vitest';

import {
  advanceTimersAndFlush,
  createDeferred,
  delay,
  retryAssertion,
  waitForCondition,
} from '../../../src/helpers';

describe('async helpers', () => {
  it('waits for condition to become true', async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 25);

    await waitForCondition(() => flag, { timeout: 100, interval: 5 });
    expect(flag).toBe(true);
  });

  it('retries assertion until it passes', async () => {
    let attempts = 0;

    await retryAssertion(
      async () => {
        attempts += 1;
        expect(attempts).toBeGreaterThanOrEqual(3);
      },
      { attempts: 3, interval: 0 }
    );

    expect(attempts).toBe(3);
  });

  it('creates deferred promises', async () => {
    const deferred = createDeferred<number>();
    const resultPromise = deferred.promise.then(value => value * 2);
    deferred.resolve(21);

    await expect(resultPromise).resolves.toBe(42);
    expect(deferred.settled).toBe(true);
  });

  it('advances timers and flushes microtasks', async () => {
    const spy = vi.fn();
    setTimeout(spy, 50);
    await advanceTimersAndFlush(50);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('delay resolves after time passes', async () => {
    const spy = vi.fn();
    delay(10).then(spy);
    await advanceTimersAndFlush(10);
    expect(spy).toHaveBeenCalled();
  });
});
