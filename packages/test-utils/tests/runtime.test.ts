import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

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

  describe('runtime isolation', () => {
    const runtimeA = createTestRuntime({
      useFakeTimers: false,
      failOnUnhandledRejection: false,
    });
    const runtimeB = createTestRuntime({
      useFakeTimers: false,
      failOnUnhandledRejection: false,
    });
    const teardownA = vi.fn();
    const teardownB = vi.fn();

    beforeAll(() => {
      runtimeA.install();
      runtimeB.install();
    });

    afterEach(() => {
      teardownA.mockReset();
      teardownB.mockReset();
    });

    it('executes teardowns without cross-contamination', async () => {
      runtimeA.registerTeardown(teardownA);
      runtimeB.registerTeardown(teardownB);

      await runtimeA.drainTeardowns();
      expect(teardownA).toHaveBeenCalledTimes(1);
      expect(teardownB).not.toHaveBeenCalled();

      await runtimeB.drainTeardowns();
      expect(teardownB).toHaveBeenCalledTimes(1);
      expect(teardownA).toHaveBeenCalledTimes(1);
    });

    it('resets teardown registry after draining', async () => {
      runtimeA.registerTeardown(teardownA);

      await runtimeA.drainTeardowns();
      expect(teardownA).toHaveBeenCalledTimes(1);

      teardownA.mockReset();

      await runtimeA.drainTeardowns();
      expect(teardownA).not.toHaveBeenCalled();
    });
  });

  describe('unhandled rejection handling', () => {
    let originalHandlers: NodeJS.UnhandledRejectionListener[] = [];

    beforeEach(() => {
      originalHandlers = process.listeners(
        'unhandledRejection'
      ) as NodeJS.UnhandledRejectionListener[];
      for (const handler of originalHandlers) {
        process.off('unhandledRejection', handler);
      }
    });

    afterEach(() => {
      const currentHandlers = process.listeners(
        'unhandledRejection'
      ) as NodeJS.UnhandledRejectionListener[];
      for (const handler of currentHandlers) {
        process.off('unhandledRejection', handler);
      }
      for (const handler of originalHandlers) {
        process.on('unhandledRejection', handler);
      }
      originalHandlers = [];
    });

    afterAll(() => {
      originalHandlers = [];
    });

    it('invokes custom handler for each rejection', () => {
      const captured: Array<{ reason: unknown; all: readonly unknown[] }> = [];
      const runtime = createTestRuntime({
        useFakeTimers: false,
        failOnUnhandledRejection: (reason, rejections) => {
          captured.push({ reason, all: rejections });
        },
      });

      runtime.install();

      const reason = new Error('runtime rejection');
      runtime.dispatchUnhandledRejection(reason);

      expect(captured).toHaveLength(1);
      expect(captured[0]?.reason).toBe(reason);
      expect(captured[0]?.all).toEqual([reason]);
    });

    it('does not attach listeners when disabled via boolean flag', () => {
      expect(process.listeners('unhandledRejection')).toHaveLength(0);

      const runtime = createTestRuntime({
        failOnUnhandledRejection: false,
        useFakeTimers: false,
      });

      runtime.install();

      expect(process.listeners('unhandledRejection')).toHaveLength(0);
    });
  });
});
