import {
  advanceTimersAndFlush,
  waitForCondition,
} from '../helpers/async-helpers';

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerTestConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenSuccessThreshold?: number;
}

export interface CircuitBreakerSnapshot {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  openedAt?: number;
}

export class CircuitBreakerTestHarness {
  private state: CircuitBreakerState = 'closed';

  private failureCount = 0;

  private successCount = 0;

  private openedAt: number | null = null;

  constructor(private readonly config: CircuitBreakerTestConfig) {}

  getSnapshot(): CircuitBreakerSnapshot {
    const snapshot: CircuitBreakerSnapshot = {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };

    if (this.openedAt !== null) {
      snapshot.openedAt = this.openedAt;
    }

    return snapshot;
  }

  recordFailure(): void {
    this.failureCount += 1;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  recordSuccess(): void {
    if (this.state === 'open') {
      return;
    }

    this.successCount += 1;
    if (
      this.state === 'half-open' &&
      this.successCount >= (this.config.halfOpenSuccessThreshold ?? 1)
    ) {
      this.reset();
    }
  }

  async elapseResetTimeout(): Promise<void> {
    if (this.state !== 'open') {
      return;
    }
    await advanceTimersAndFlush(this.config.resetTimeoutMs);
    this.state = 'half-open';
    this.failureCount = 0;
    this.successCount = 0;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = null;
  }

  async expectState(state: CircuitBreakerState): Promise<void> {
    await waitForCondition(() => this.state === state, {
      timeout: this.config.resetTimeoutMs + 50,
      description: `circuit breaker to reach ${state} state`,
    });
  }
}

export const createCircuitBreakerHarness = (
  config: CircuitBreakerTestConfig
): CircuitBreakerTestHarness => new CircuitBreakerTestHarness(config);
