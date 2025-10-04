import { EventEmitter } from 'node:events';
import { vi } from 'vitest';

export type EventPayloadMap = Record<string, (...args: never[]) => unknown>;

export interface MockSocket<EventMap extends EventPayloadMap> {
  on<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event]
  ): this;
  once<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event]
  ): this;
  off<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event]
  ): this;
  emit<Event extends keyof EventMap>(
    event: Event,
    ...args: Parameters<EventMap[Event]>
  ): boolean;
  removeAllListeners(): void;
  events: Array<{
    event: keyof EventMap;
    payload: unknown[];
  }>;
  emitter: EventEmitter;
}

export const createMockSocket = <
  EventMap extends EventPayloadMap,
>(): MockSocket<EventMap> => {
  const emitter = new EventEmitter();
  const events: Array<{ event: keyof EventMap; payload: unknown[] }> = [];

  return {
    on(event, handler) {
      emitter.on(
        event as string | symbol,
        handler as unknown as (...args: unknown[]) => void
      );
      return this;
    },
    once(event, handler) {
      emitter.once(
        event as string | symbol,
        handler as unknown as (...args: unknown[]) => void
      );
      return this;
    },
    off(event, handler) {
      emitter.off(
        event as string | symbol,
        handler as unknown as (...args: unknown[]) => void
      );
      return this;
    },
    emit(event, ...args) {
      events.push({ event, payload: args });
      return emitter.emit(event as string | symbol, ...args);
    },
    removeAllListeners() {
      emitter.removeAllListeners();
      events.length = 0;
    },
    events,
    emitter,
  };
};

export const createMockLogger = () => {
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const debug = vi.fn();

  return {
    child: vi.fn(() => createMockLogger()),
    info,
    warn,
    error,
    debug,
    calls: {
      info,
      warn,
      error,
      debug,
    },
  } as const;
};

export const createMockFetch = <TResponse>(
  response: TResponse,
  options: { status?: number; delayMs?: number } = {}
) => {
  const { status = 200, delayMs = 0 } = options;

  return vi.fn(async () => {
    if (delayMs > 0) {
      await new Promise(resolve => {
        setTimeout(resolve, delayMs);
      });
    }

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => response,
      text: async () => JSON.stringify(response),
    } as Response;
  });
};

export const createMockPromise = <T>(value: T): Promise<T> =>
  new Promise(resolve => {
    resolve(value);
  });

export const createFailingMockPromise = <T = never>(error: Error): Promise<T> =>
  new Promise((_, reject) => {
    reject(error);
  });
