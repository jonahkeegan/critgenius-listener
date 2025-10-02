/**
 * Detect whether the current process is executing under the Playwright runner.
 *
 * Playwright exports a couple of environment flags when scheduling tests. We
 * check multiple markers so the detection stays resilient across CLI versions
 * and reporter configurations while remaining easy to stub during Vitest runs.
 */
export function isPlaywrightRuntime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }

  const env = process.env ?? {};

  return (
    env.PLAYWRIGHT_TEST === '1' ||
    env.PLAYWRIGHT_TEST === 'true' ||
    typeof env.PW_TEST_SOURCE !== 'undefined' ||
    typeof env.PLAYWRIGHT_JSON_OUTPUT_NAME !== 'undefined'
  );
}
