import { vi } from 'vitest';
import { advanceTimersAndFlush } from '../helpers/async-helpers';

export interface RetryPolicyOptions {
  maxAttempts: number;
  delayMs?: number;
}

export interface RetrySimulationResult<T = unknown> {
  attempts: number;
  value?: T;
  errors: unknown[];
}

export type RetryableOperation<T> = () => Promise<T> | T;

export const simulateRetry = async <T>(
  operation: RetryableOperation<T>,
  { maxAttempts, delayMs = 0 }: RetryPolicyOptions
): Promise<RetrySimulationResult<T>> => {
  if (maxAttempts <= 0) {
    throw new Error('maxAttempts must be greater than zero');
  }

  const errors: unknown[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const value = await operation();
      return { attempts: attempt, value, errors };
    } catch (error) {
      errors.push(error);
      if (attempt === maxAttempts) {
        break;
      }
      if (delayMs > 0) {
        await advanceTimersAndFlush(delayMs);
      }
    }
  }

  return { attempts: maxAttempts, errors };
};

export const createRetryMock = <T>(
  succeedOnAttempt: number,
  value: T
): RetryableOperation<T> => {
  const mock = vi.fn(async () => {
    if (mock.mock.calls.length + 1 < succeedOnAttempt) {
      throw new Error(`Failure attempt ${mock.mock.calls.length + 1}`);
    }
    return value;
  });

  return mock;
};
