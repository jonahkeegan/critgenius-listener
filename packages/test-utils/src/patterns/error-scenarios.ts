export interface ErrorScenario {
  name: string;
  error: Error;
  metadata?: Record<string, unknown>;
}

export class ErrorScenarioBuilder {
  private readonly scenarios: ErrorScenario[] = [];

  addScenario(
    name: string,
    error: Error,
    metadata?: Record<string, unknown>
  ): this {
    const scenario: ErrorScenario = { name, error };
    if (metadata) {
      scenario.metadata = metadata;
    }
    this.scenarios.push(scenario);
    return this;
  }

  networkFailure({
    code = 'ECONNRESET',
    host = 'localhost',
  }: { code?: string; host?: string } = {}): this {
    const error = Object.assign(new Error(`Network failure for ${host}`), {
      name: 'NetworkError',
      code,
    });
    return this.addScenario('network-failure', error, { host, code });
  }

  timeout({
    timeoutMs,
    operation,
  }: {
    timeoutMs: number;
    operation: string;
  }): this {
    const error = new Error(
      `${operation} exceeded timeout of ${timeoutMs.toLocaleString()}ms`
    );
    error.name = 'TimeoutError';
    return this.addScenario('timeout', error, { timeoutMs, operation });
  }

  rateLimit({
    retryAfterSeconds = 30,
    limit = 60,
  }: {
    retryAfterSeconds?: number;
    limit?: number;
  } = {}): this {
    const error = Object.assign(new Error('Too many requests'), {
      name: 'RateLimitError',
      retryAfter: retryAfterSeconds,
    });
    return this.addScenario('rate-limit', error, {
      retryAfterSeconds,
      limit,
    });
  }

  build(): ErrorScenario[] {
    return [...this.scenarios];
  }
}

export const createErrorScenarioBuilder = (): ErrorScenarioBuilder =>
  new ErrorScenarioBuilder();

export const simulateError = <T>(
  scenario: ErrorScenario,
  handler: (error: ErrorScenario) => T
): T => handler(scenario);
