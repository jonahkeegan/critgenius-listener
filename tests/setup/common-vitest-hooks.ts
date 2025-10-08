export {};

async function importWithFallback<T>(
  primary: string,
  fallback: string
): Promise<T> {
  try {
    return (await import(primary)) as T;
  } catch (error) {
    if (process.env.DEBUG?.includes('vitest')) {
      console.warn(
        `Falling back to local module for ${primary}: ${(error as Error).message}`
      );
    }
    return (await import(fallback)) as T;
  }
}

const runtimeModule = await importWithFallback<
  typeof import('@critgenius/test-utils/runtime')
>(
  '@critgenius/test-utils/runtime',
  '../../packages/test-utils/src/runtime/index.ts'
);

const matcherModule = await importWithFallback<
  typeof import('@critgenius/test-utils/matchers')
>(
  '@critgenius/test-utils/matchers',
  '../../packages/test-utils/src/matchers/index.ts'
);

const useFakeTimersEnv = process.env.CRITGENIUS_TEST_USE_FAKE_TIMERS;
const runtime = runtimeModule.installTestRuntime({
  useFakeTimers:
    useFakeTimersEnv === undefined ? true : useFakeTimersEnv !== 'false',
});
runtime.installGlobals();
matcherModule.registerMatchers();
