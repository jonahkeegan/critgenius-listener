import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

const DEFAULT_NOW = new Date('2024-01-01T00:00:00.000Z');
const DEFAULT_RANDOM_SEED = 'critgenius-test-utils';

type TeardownCallback = () => void | Promise<void>;

export interface TestRuntimeOptions {
  /** Timezone forced for process if TZ unset */
  timezone?: string;
  /** Automatically swap to fake timers before each test */
  useFakeTimers?: boolean;
  /** Baseline system time applied when fake timers enabled */
  now?: string | number | Date;
  /** Seed applied to Math.random for deterministic behavior */
  randomSeed?: string | number | null;
  /** Restore all mocks before/after each test */
  autoRestoreMocks?: boolean;
  /** Clear all mocks after each test */
  autoClearMocks?: boolean;
  /** Reset module registry after each test */
  autoResetModules?: boolean;
  /**
   * Fail tests when unhandled rejections occur. When a callback is provided it will be invoked
   * for every unhandled rejection with the rejection reason and the current aggregate list of
   * reasons. The callback is responsible for determining whether a test should fail.
   */
  failOnUnhandledRejection?:
    | boolean
    | ((reason: unknown, rejections: readonly unknown[]) => void);
}

export interface TestRuntime {
  /** Installs the runtime hooks (idempotent). */
  install(): void;
  /** Registers a teardown callback executed after each test */
  registerTeardown(callback: TeardownCallback): void;
  /** Installs deterministic globals/polyfills */
  installGlobals(): void;
  /** Executes callback with deterministic clock semantics */
  withDeterministicClock<T>(
    callback: () => T | Promise<T>,
    options?: DeterministicClockOptions
  ): Promise<T> | T;
  /** Executes callback with deterministic random sequence */
  withDeterministicRandom<T>(
    seed: string | number,
    callback: () => T | Promise<T>
  ): Promise<T> | T;
  /** Immediately executes and clears any registered teardowns */
  drainTeardowns(): Promise<void>;
  /** Invokes the runtime's unhandled rejection handler directly */
  dispatchUnhandledRejection(reason: unknown): void;
}

export interface DeterministicClockOptions {
  now?: string | number | Date;
  advanceMs?: number;
  restore?: boolean;
}

const defaultOptions: Required<
  Pick<
    TestRuntimeOptions,
    | 'timezone'
    | 'useFakeTimers'
    | 'now'
    | 'randomSeed'
    | 'autoRestoreMocks'
    | 'autoClearMocks'
    | 'autoResetModules'
    | 'failOnUnhandledRejection'
  >
> = {
  timezone: 'UTC',
  useFakeTimers: true,
  now: DEFAULT_NOW,
  randomSeed: DEFAULT_RANDOM_SEED,
  autoRestoreMocks: true,
  autoClearMocks: true,
  autoResetModules: true,
  failOnUnhandledRejection: true,
};

let defaultRuntime: TestRuntime | null = null;

export const createTestRuntime = (
  options: TestRuntimeOptions = {}
): TestRuntime => {
  const resolved = { ...defaultOptions, ...options };
  // Tracks installation for this runtime instance only; each call to createTestRuntime gets an
  // isolated flag so parallel runtimes remain independent.
  let runtimeInstalled = false;
  const registeredTeardowns: TeardownCallback[] = [];
  let originalRandom: (() => number) | null = null;
  let unhandledRejections: unknown[] = [];

  const failSetting = resolved.failOnUnhandledRejection;
  const shouldAttachUnhandledRejectionListener =
    typeof failSetting === 'function' || failSetting !== false;
  const shouldThrowOnUnhandledRejection =
    failSetting === undefined || failSetting === true;
  const customRejectionHandler =
    typeof failSetting === 'function' ? failSetting : null;

  const onUnhandledRejection = (reason: unknown) => {
    unhandledRejections.push(reason);
    if (customRejectionHandler) {
      customRejectionHandler(reason, [...unhandledRejections]);
    }
  };

  const ensureDeterministicRandom = () => {
    if (resolved.randomSeed === null || resolved.randomSeed === undefined) {
      return;
    }
    if (!originalRandom) {
      originalRandom = Math.random;
    }
    Math.random = createSeededRandom(resolved.randomSeed);
  };

  const resetDeterministicRandom = () => {
    if (
      (resolved.randomSeed === null || resolved.randomSeed === undefined) &&
      originalRandom === null
    ) {
      return;
    }
    if (originalRandom) {
      Math.random = originalRandom;
      originalRandom = null;
    }
  };

  const runRegisteredTeardowns = async (): Promise<void> => {
    if (!registeredTeardowns.length) {
      return;
    }
    const callbacks = [...registeredTeardowns];
    registeredTeardowns.length = 0;
    for (const teardown of callbacks.reverse()) {
      await teardown();
    }
  };

  return {
    install: () => {
      if (runtimeInstalled) {
        return;
      }

      runtimeInstalled = true;
      installTestGlobals();

      beforeAll(() => {
        installTestGlobals();
        if (resolved.timezone && !process.env.TZ) {
          process.env.TZ = resolved.timezone;
        }
        if (shouldAttachUnhandledRejectionListener) {
          process.on('unhandledRejection', onUnhandledRejection);
        }
      });

      beforeEach(() => {
        installTestGlobals();

        if (resolved.autoRestoreMocks) {
          vi.restoreAllMocks();
        }
        if (resolved.autoClearMocks) {
          vi.clearAllMocks();
        }
        if (resolved.autoResetModules) {
          vi.resetModules();
        }
        if (resolved.useFakeTimers) {
          vi.useFakeTimers();
          vi.setSystemTime(resolveDate(resolved.now));
        }
        ensureDeterministicRandom();
      });

      afterEach(async () => {
        await runRegisteredTeardowns();

        if (resolved.useFakeTimers) {
          // ensures queued microtasks/timers drained so tests fail fast
          vi.runOnlyPendingTimers();
          vi.useRealTimers();
        }

        if (resolved.autoClearMocks) {
          vi.clearAllMocks();
        }
        if (resolved.autoRestoreMocks) {
          vi.restoreAllMocks();
        }
        if (resolved.autoResetModules) {
          vi.resetModules();
        }
        resetDeterministicRandom();

        if (shouldThrowOnUnhandledRejection && unhandledRejections.length) {
          const [first] = unhandledRejections;
          unhandledRejections = [];
          throw new Error(formatUnhandledRejection(first));
        }

        unhandledRejections = [];
      });

      afterAll(async () => {
        await runRegisteredTeardowns();
        resetDeterministicRandom();
        if (shouldAttachUnhandledRejectionListener) {
          process.off('unhandledRejection', onUnhandledRejection);
        }
        registeredTeardowns.length = 0;
        unhandledRejections = [];
        runtimeInstalled = false;
      });
    },
    registerTeardown: (callback: TeardownCallback) => {
      registeredTeardowns.push(callback);
    },
    installGlobals: installTestGlobals,
    withDeterministicClock: <T>(
      callback: () => Promise<T> | T,
      clockOptions?: DeterministicClockOptions
    ): Promise<T> | T => withDeterministicClock(callback, clockOptions ?? {}),
    withDeterministicRandom: <T>(
      seed: string | number,
      callback: () => Promise<T> | T
    ): Promise<T> | T => withDeterministicRandom(seed, callback),
    drainTeardowns: async () => {
      await runRegisteredTeardowns();
    },
    dispatchUnhandledRejection: (reason: unknown) => {
      if (!shouldAttachUnhandledRejectionListener) {
        return;
      }
      onUnhandledRejection(reason);
    },
  };
};

export const installTestRuntime = (
  options?: TestRuntimeOptions
): TestRuntime => {
  if (!defaultRuntime) {
    defaultRuntime = createTestRuntime(options);
    defaultRuntime.install();
    return defaultRuntime;
  }

  return defaultRuntime;
};

export const installTestGlobals = (): void => {
  const globalRef = globalThis as typeof globalThis & {
    TextEncoder?: typeof TextEncoder;
    TextDecoder?: typeof TextDecoder;
    crypto?: Crypto;
  };

  if (!globalRef.TextEncoder) {
    globalRef.TextEncoder =
      TextEncoder as unknown as typeof globalRef.TextEncoder;
  }
  if (!globalRef.TextDecoder) {
    globalRef.TextDecoder =
      TextDecoder as unknown as typeof globalRef.TextDecoder;
  }
  if (
    !globalRef.crypto ||
    typeof globalRef.crypto.getRandomValues !== 'function'
  ) {
    globalRef.crypto = webcrypto as unknown as Crypto;
  }
};

export const registerTestTeardown = (callback: TeardownCallback): void => {
  installTestRuntime().registerTeardown(callback);
};

export const withDeterministicClock = <T>(
  callback: () => Promise<T> | T,
  { now, advanceMs, restore = true }: DeterministicClockOptions
): Promise<T> | T => {
  const shouldRestore = restore && !vi.isFakeTimers();
  if (shouldRestore) {
    vi.useFakeTimers();
  }
  if (now !== undefined) {
    vi.setSystemTime(resolveDate(now));
  }
  const result = callback();
  if (advanceMs && advanceMs > 0) {
    vi.advanceTimersByTime(advanceMs);
  }
  const cleanup = () => {
    if (shouldRestore) {
      vi.useRealTimers();
    }
  };

  if (isPromiseLike(result)) {
    return Promise.resolve(result).finally(cleanup) as Promise<T>;
  }

  cleanup();
  return result;
};

export const withDeterministicRandom = <T>(
  seed: string | number,
  callback: () => Promise<T> | T
): Promise<T> | T => {
  const generator = createSeededRandom(seed);
  const previous = Math.random;
  Math.random = generator;
  const cleanup = () => {
    Math.random = previous;
  };

  const onFinally = () => cleanup();
  try {
    const value = callback();
    if (value instanceof Promise) {
      return value.finally(onFinally);
    }
    cleanup();
    return value;
  } catch (error) {
    cleanup();
    throw error;
  }
};

const formatUnhandledRejection = (reason: unknown): string => {
  if (reason instanceof Error) {
    return `Unhandled promise rejection detected: ${reason.message}`;
  }
  return `Unhandled promise rejection detected: ${String(reason)}`;
};

const resolveDate = (value: string | number | Date): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  return new Date(Date.parse(value));
};

const createSeededRandom = (seed: string | number): (() => number) => {
  let state = hashSeed(seed);
  return () => {
    // Mulberry32 algorithm
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const isPromiseLike = <T>(value: unknown): value is PromiseLike<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<T>).then === 'function'
  );
};

const hashSeed = (seed: string | number): number => {
  const input = typeof seed === 'string' ? seed : String(seed);
  let h = 1779033703;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ input.length) >>> 0;
};

export type { TeardownCallback };
