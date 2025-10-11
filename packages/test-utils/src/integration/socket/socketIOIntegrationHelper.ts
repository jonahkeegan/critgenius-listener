import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { Server as SocketIOServer, type ServerOptions } from 'socket.io';
import {
  io as createClient,
  type ManagerOptions,
  type Socket as ClientSocket,
} from 'socket.io-client';

export type SocketIntegrationOptions = {
  server?: Partial<ServerOptions>;
  client?: Partial<ManagerOptions>;
  /** When false the client will not auto-connect; caller must call `context.client.connect()` manually. */
  autoConnect?: boolean;
};

export type SocketIntegrationContext = {
  io: SocketIOServer;
  httpServer: HttpServer;
  client: ClientSocket;
  port: number;
  cleanup: () => Promise<void>;
  waitForClientEvent: <T = unknown>(
    event: string,
    timeoutMs?: number
  ) => Promise<T>;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const IGNORABLE_SERVER_CODES = new Set(['ERR_SERVER_NOT_RUNNING']);

function isIgnorableServerError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code } = error as Partial<NodeJS.ErrnoException>;
  return typeof code === 'string' && IGNORABLE_SERVER_CODES.has(code);
}

function logCleanupError(stage: 'socket.io' | 'http', error: unknown): void {
  console.error(
    `[socketIOIntegrationHelper] Unexpected ${stage} shutdown error during integration test cleanup`,
    error
  );
}

async function waitForSocketEvent<T = unknown>(
  socket: {
    once: (event: string, listener: (payload: T) => void) => void;
    off: (event: string, listener: (payload: T) => void) => void;
  },
  event: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(
        new Error(
          `Timed out waiting for socket event '${event}' after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    const handler = (payload: T) => {
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };

    socket.once(event, handler);
  });
}

export async function createSocketIntegrationContext(
  options: SocketIntegrationOptions = {}
): Promise<SocketIntegrationContext> {
  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    transports: ['websocket'],
    cors: { origin: '*', credentials: false },
    ...options.server,
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(0, resolve);
    httpServer.on('error', reject);
  });

  const address = httpServer.address() as AddressInfo | null;
  if (!address) {
    await once(io, 'error');
    throw new Error(
      'Failed to obtain listening address for Socket.IO integration test server'
    );
  }

  const port = address.port;
  const client = createClient(`http://127.0.0.1:${port}`, {
    autoConnect: options.autoConnect ?? true,
    transports: ['websocket'],
    reconnection: false,
    ...options.client,
  });

  if (options.autoConnect ?? true) {
    await new Promise<void>((resolve, reject) => {
      client.once('connect', () => resolve());
      client.once('connect_error', (error: Error) => reject(error));
    });
  }

  return {
    io,
    httpServer,
    client,
    port,
    waitForClientEvent: (event, timeoutMs) =>
      waitForSocketEvent(client, event, timeoutMs),
    cleanup: async () => {
      if (client.connected) {
        client.removeAllListeners();
        client.disconnect();
      }

      io.removeAllListeners();

      await new Promise<void>((resolve, reject) => {
        io.close(error => {
          if (error && !isIgnorableServerError(error)) {
            logCleanupError('socket.io', error);
            reject(error);
            return;
          }
          resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        httpServer.close(error => {
          if (error && !isIgnorableServerError(error)) {
            logCleanupError('http', error);
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
