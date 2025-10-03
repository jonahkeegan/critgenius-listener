import { EventEmitter } from 'node:events';
import { waitForCondition } from './async-helpers';

export interface SocketMessage<T = unknown> {
  event: string;
  payload: T;
  receivedAt: Date;
}

export interface MockSocketEndpoint<
  OutboundMap extends Record<string, unknown>,
> {
  send<Event extends keyof OutboundMap>(
    event: Event,
    payload: OutboundMap[Event]
  ): void;
  on<Event extends string>(
    event: Event,
    handler: (payload: unknown) => void
  ): void;
  once<Event extends string>(
    event: Event,
    handler: (payload: unknown) => void
  ): void;
  off<Event extends string>(
    event: Event,
    handler: (payload: unknown) => void
  ): void;
  connect(): void;
  disconnect(): void;
  history: SocketMessage[];
  connected: boolean;
}

export interface MockSocketPair<
  ClientOutbound extends Record<string, unknown>,
  ServerOutbound extends Record<string, unknown>,
> {
  client: MockSocketEndpoint<ClientOutbound>;
  server: MockSocketEndpoint<ServerOutbound>;
  link(): void;
  close(): void;
}

export const createMockSocketPair = <
  ClientOutbound extends Record<string, unknown>,
  ServerOutbound extends Record<string, unknown>,
>(): MockSocketPair<ClientOutbound, ServerOutbound> => {
  const clientEmitter = new EventEmitter();
  const serverEmitter = new EventEmitter();
  let linked = false;

  const createEndpoint = <Outbound extends Record<string, unknown>>(
    emitter: EventEmitter,
    oppositeEmitter: EventEmitter
  ): MockSocketEndpoint<Outbound> => {
    const history: SocketMessage[] = [];
    let connected = false;

    return {
      send(event, payload) {
        if (!linked || !connected) {
          throw new Error('Mock socket is not connected');
        }
        history.push({ event: String(event), payload, receivedAt: new Date() });
        oppositeEmitter.emit(String(event), payload);
      },
      on(event, handler) {
        emitter.on(event, handler);
      },
      once(event, handler) {
        emitter.once(event, handler);
      },
      off(event, handler) {
        emitter.off(event, handler);
      },
      connect() {
        connected = true;
      },
      disconnect() {
        connected = false;
      },
      history,
      get connected() {
        return connected;
      },
    };
  };

  const client = createEndpoint<ClientOutbound>(clientEmitter, serverEmitter);
  const server = createEndpoint<ServerOutbound>(serverEmitter, clientEmitter);

  return {
    client,
    server,
    link() {
      linked = true;
      client.connect();
      server.connect();
    },
    close() {
      linked = false;
      client.disconnect();
      server.disconnect();
      clientEmitter.removeAllListeners();
      serverEmitter.removeAllListeners();
    },
  };
};

export const waitForSocketEvent = async (
  emitter: EventEmitter,
  event: string,
  { timeout = 1_000, interval = 10 } = {}
): Promise<unknown> => {
  let captured: unknown;
  const handler = (payload: unknown) => {
    captured = payload;
  };
  emitter.on(event, handler);
  try {
    await waitForCondition(() => captured !== undefined, {
      timeout,
      interval,
    });
    return captured;
  } finally {
    emitter.off(event, handler);
  }
};
