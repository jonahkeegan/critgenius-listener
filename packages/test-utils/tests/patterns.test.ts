import { describe, expect, it } from 'vitest';

import {
  createCircuitBreakerHarness,
  createErrorScenarioBuilder,
  simulateRetry,
} from '../src/patterns';

import { advanceTimersAndFlush } from '../src/helpers';

describe('patterns', () => {
  it('simulates circuit breaker lifecycle', async () => {
    const harness = createCircuitBreakerHarness({
      failureThreshold: 2,
      resetTimeoutMs: 100,
      halfOpenSuccessThreshold: 1,
    });

    harness.recordFailure();
    expect(harness.getSnapshot().state).toBe('closed');
    harness.recordFailure();
    await harness.expectState('open');

    await harness.elapseResetTimeout();
    await harness.expectState('half-open');

    harness.recordSuccess();
    await harness.expectState('closed');
  });

  it('simulates retry policy', async () => {
    let attempts = 0;
    const result = await simulateRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('failure');
        }
        return 'success';
      },
      { maxAttempts: 5, delayMs: 25 }
    );

    expect(result.value).toBe('success');
    expect(result.attempts).toBe(3);
    expect(result.errors).toHaveLength(2);
    expect(attempts).toBe(3);
  });

  it('builds error scenarios', () => {
    const scenarios = createErrorScenarioBuilder()
      .networkFailure({ host: 'api.example.com' })
      .timeout({ timeoutMs: 5000, operation: 'upload' })
      .rateLimit({ retryAfterSeconds: 60 })
      .build();

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0]?.metadata?.host).toBe('api.example.com');
  });

  it('advances timers when simulating retry delays', async () => {
    let attempts = 0;
    const result = simulateRetry(
      async () => {
        attempts += 1;
        throw new Error('always fails');
      },
      { maxAttempts: 2, delayMs: 50 }
    );
    await advanceTimersAndFlush(100);
    const resolved = await result;
    expect(resolved.attempts).toBe(2);
    expect(attempts).toBe(2);
  });
});
