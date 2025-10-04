/**
 * Shared helper utilities for AssemblyAI client tests.
 */

import { vi } from 'vitest';
import type { AssemblyAIClient } from '../../../assemblyai-client.js';

export const isFunction = (value: unknown): value is (...args: any[]) => void =>
  typeof value === 'function';

export const flushAllTimers = async (): Promise<void> => {
  let iterations = 0;
  await Promise.resolve();
  while (vi.getTimerCount() > 0 && iterations < 200) {
    vi.runOnlyPendingTimers();
    await Promise.resolve();
    iterations += 1;
  }
  await Promise.resolve();
};

export const waitForPromiseWithTimers = async <T>(
  promise: Promise<T>
): Promise<T> => {
  let resolvedValue: T | undefined;
  let rejectedError: unknown;
  let settled = false;

  promise.then(
    value => {
      resolvedValue = value;
      settled = true;
    },
    error => {
      rejectedError = error;
      settled = true;
    }
  );

  let iterations = 0;
  while (!settled && iterations < 500) {
    await flushAllTimers();
    await Promise.resolve();
    iterations += 1;

    if (!settled && vi.getTimerCount() === 0) {
      await Promise.resolve();
    }
  }

  if (!settled) {
    throw new Error('Promise did not settle after flushing timers');
  }

  if (rejectedError !== undefined) {
    throw rejectedError;
  }

  return resolvedValue as T;
};

export const connectClient = async (
  instance: AssemblyAIClient
): Promise<void> => {
  await waitForPromiseWithTimers(instance.connect());
};
