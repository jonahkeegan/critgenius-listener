import type { Socket } from 'socket.io-client';
import {
  createTimeoutPromise,
  DEFAULT_TIMEOUT_MS,
  TimeoutError,
} from '../timeoutPromise.js';

export type WaitForSocketEventOptions<T> = {
  /** Maximum time (ms) to wait for the event before rejecting. Defaults to {@link DEFAULT_SOCKET_EVENT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Optional custom error message when the timeout triggers. */
  message?: string;
  /** Optional predicate to filter event payloads. The listener remains active until the predicate returns true. */
  filter?: (payload: T) => boolean;
};

export const DEFAULT_SOCKET_EVENT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

/**
 * Waits for a specific Socket.IO event to fire, enforcing a timeout so tests cannot hang
 * indefinitely. The listener is cleaned up automatically on success, timeout, or failure.
 */
export function waitForSocketEventWithTimeout<T = unknown>(
  socket: Socket,
  eventName: string,
  options: WaitForSocketEventOptions<T> = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SOCKET_EVENT_TIMEOUT_MS;
  const timeoutMessage =
    options.message ??
    `Timeout waiting for '${eventName}' event after ${timeoutMs}ms`;

  let cleanup: (() => void) | null = null;

  const eventPromise = new Promise<T>((resolve, reject) => {
    const handleEvent = (payload: T) => {
      try {
        if (options.filter && !options.filter(payload)) {
          return;
        }
        cleanup?.();
        resolve(payload);
      } catch (error) {
        cleanup?.();
        reject(error);
      }
    };

    const handleError = (error: unknown) => {
      cleanup?.();
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    cleanup = () => {
      socket.off(eventName, handleEvent as (...args: unknown[]) => void);
      socket.off('error', handleError as (...args: unknown[]) => void);
    };

    socket.on(eventName, handleEvent as (...args: unknown[]) => void);
    socket.on('error', handleError as (...args: unknown[]) => void);
  });

  return createTimeoutPromise(eventPromise, {
    timeoutMs,
    message: timeoutMessage,
    context: `socket-event:${eventName}`,
    onTimeout: () => {
      cleanup?.();
      cleanup = null;
    },
  }).catch(error => {
    // Re-throw TimeoutError directly, otherwise wrap unknown values for clearer diagnostics.
    if (error instanceof TimeoutError) {
      throw error;
    }
    throw error instanceof Error ? error : new Error(String(error));
  });
}
