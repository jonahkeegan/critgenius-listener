import { describe, expect, it, vi } from 'vitest';

import {
  createTestRuntime,
  registerTestTeardown,
  withDeterministicClock,
} from '../src/runtime';

describe('test runtime', () => {
  it('uses fake timers by default', () => {
    expect(vi.isFakeTimers()).toBe(true);
  });

  it('supports deterministic clock execution', async () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    let executed = false;

    await withDeterministicClock(
      async () => {
        executed = true;
        expect(Date.now()).toBe(start.getTime());
      },
      { now: start }
    );

    expect(executed).toBe(true);
  });

  it('provides seeded random helper', async () => {
    const runtime = createTestRuntime({
      randomSeed: 'seed-test',
      useFakeTimers: false,
    });
    const resultsA: number[] = [];
    const resultsB: number[] = [];

    await runtime.withDeterministicRandom('seed-test', () => {
      resultsA.push(Math.random(), Math.random(), Math.random());
    });

    await runtime.withDeterministicRandom('seed-test', () => {
      resultsB.push(Math.random(), Math.random(), Math.random());
    });

    expect(resultsA).toEqual(resultsB);
  });

  it('runs registered teardowns after each test', () => {
    const spy = vi.fn();
    registerTestTeardown(spy);
    expect(spy).not.toHaveBeenCalled();
  });
});
