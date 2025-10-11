export class TimeoutError extends Error {
  readonly timeoutMs: number;
  readonly context: string | undefined;

  constructor(timeoutMs: number, message?: string, context?: string) {
    super(message ?? `Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.context = context;
  }
}

export type TimeoutOptions = {
  /** Total time in milliseconds before the timeout triggers. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Optional human-readable message that will be used for the {@link TimeoutError}. */
  message?: string;
  /**
   * Optional callback invoked when the timeout triggers. Use this to perform cleanup (such as
   * removing event listeners) if the underlying asynchronous operation does not complete in time.
   */
  onTimeout?: () => void;
  /** Optional contextual label added to the {@link TimeoutError}. */
  context?: string;
};

export const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Wraps a promise with a timeout, ensuring the caller receives a {@link TimeoutError} instead of
 * waiting indefinitely when the asynchronous operation does not complete in time.
 */
export function createTimeoutPromise<T>(
  promise: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      callback();
    };

    const timer = setTimeout(() => {
      settle(() => {
        options.onTimeout?.();
        reject(new TimeoutError(timeoutMs, options.message, options.context));
      });
    }, timeoutMs);

    promise
      .then(result => {
        settle(() => {
          resolve(result);
        });
      })
      .catch(error => {
        settle(() => {
          reject(error);
        });
      });
  });
}
