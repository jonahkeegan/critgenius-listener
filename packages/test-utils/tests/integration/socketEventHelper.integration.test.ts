import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io-client';
import {
  waitForSocketEventWithTimeout,
  TimeoutError,
} from '../../src/integration/index';

function createMockSocket(): Socket & {
  emit: (event: string, payload?: unknown) => void;
} {
  const emitter = new EventEmitter();
  return {
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
  } as unknown as Socket & { emit: (event: string, payload?: unknown) => void };
}

describe('waitForSocketEventWithTimeout', () => {
  it('resolves when the event fires before the timeout', async () => {
    const socket = createMockSocket();

    const payload = { value: 42 };
    const waiter = waitForSocketEventWithTimeout(socket, 'data');
    socket.emit('data', payload);

    await expect(waiter).resolves.toStrictEqual(payload);
  });

  it('filters events until the predicate passes', async () => {
    const socket = createMockSocket();

    const waiter = waitForSocketEventWithTimeout(socket, 'update', {
      filter: payload =>
        typeof payload === 'object' && payload !== null && 'isFinal' in payload,
    });

    socket.emit('update', { interim: true });
    const finalPayload = { isFinal: true };
    socket.emit('update', finalPayload);

    await expect(waiter).resolves.toStrictEqual(finalPayload);
  });

  it('rejects with TimeoutError when the event never fires', async () => {
    const socket = createMockSocket();
    vi.useFakeTimers();

    const waiter = waitForSocketEventWithTimeout(socket, 'never', {
      timeoutMs: 50,
    });

    const rejection = expect(waiter).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(60);
    await rejection;

    vi.useRealTimers();
  });
});
