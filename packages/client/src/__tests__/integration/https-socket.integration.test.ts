// @vitest-environment node

import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import https from 'node:https';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server as SocketIOServer } from 'socket.io';
import type { ClientRuntimeConfig } from '../../config/environment';
import type { ServerToClientEvents } from '../../types/socket';

const runIntegration = process.env.RUN_CLIENT_IT === 'true';
const describeMaybe = runIntegration ? describe : describe.skip;

type SocketServiceInstance =
  typeof import('../../services/socketService').default;

describeMaybe('integration:https socket handshake', () => {
  let httpsServer: https.Server;
  let ioServer: SocketIOServer;
  let port: number;
  let socketService: SocketServiceInstance;
  let originalWebSocket: typeof globalThis.WebSocket;
  const teardownListeners: Array<() => void> = [];

  beforeAll(async () => {
    port = await allocatePort();

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const fixtureDir = path.resolve(
      currentDir,
      '../../..',
      'tests/fixtures/devcert'
    );
    const key = fs.readFileSync(path.join(fixtureDir, 'localhost-key.pem'));
    const cert = fs.readFileSync(path.join(fixtureDir, 'localhost.pem'));

    httpsServer = https.createServer({ key, cert });
    ioServer = new SocketIOServer(httpsServer, {
      cors: {
        origin: '*',
        credentials: true,
      },
    });

    ioServer.on('connection', socket => {
      socket.on('joinSession', ({ sessionId }) => {
        socket.emit('processingUpdate', {
          uploadId: sessionId,
          status: 'pending',
          message: 'secure join acknowledged',
        });
      });
    });

    await new Promise<void>(resolve => httpsServer.listen(port, resolve));

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const clientConfig: ClientRuntimeConfig = {
      NODE_ENV: 'test',
      CLIENT_API_BASE_URL: `https://localhost:${port}`,
      CLIENT_SOCKET_URL: `https://localhost:${port}`,
      CLIENT_FEATURE_FLAGS: '',
      featureFlags: [],
    };

    (globalThis as GlobalWithClientEnv).__CLIENT_ENV__ = clientConfig;

    originalWebSocket = globalThis.WebSocket;
    delete (
      globalThis as typeof globalThis & {
        WebSocket?: typeof WebSocket;
      }
    ).WebSocket;

    vi.resetModules();
    ({ default: socketService } = await import('../../services/socketService'));
  }, 20000);

  afterEach(() => {
    while (teardownListeners.length) {
      const remove = teardownListeners.pop();
      if (remove) remove();
    }
    socketService?.disconnect();
  });

  afterAll(async () => {
    delete (globalThis as GlobalWithClientEnv).__CLIENT_ENV__;
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (originalWebSocket) {
      (
        globalThis as typeof globalThis & {
          WebSocket?: typeof WebSocket;
        }
      ).WebSocket = originalWebSocket;
    }

    if (ioServer.httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        ioServer.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    if (httpsServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpsServer.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  it('establishes secure connection and exchanges events', async () => {
    const updates: Array<
      Parameters<NonNullable<ServerToClientEvents['processingUpdate']>>[0]
    > = [];
    const statusChanges: Array<'connected' | 'disconnected'> = [];

    const statusListener: ServerToClientEvents['connectionStatus'] = status => {
      statusChanges.push(status);
    };
    const updateListener: NonNullable<
      ServerToClientEvents['processingUpdate']
    > = payload => {
      updates.push(payload);
    };

    socketService.on('connectionStatus', statusListener);
    socketService.on('processingUpdate', updateListener);

    teardownListeners.push(() =>
      socketService.off('connectionStatus', statusListener)
    );
    teardownListeners.push(() =>
      socketService.off('processingUpdate', updateListener)
    );

    socketService.connect();
    try {
      await waitFor(
        () => socketService.getConnectionState().isConnected,
        10000
      );
    } catch {
      const state = socketService.getConnectionState();
      const socket = socketService.getSocket();
      const targetUri = socket ? ((socket as any).io?.uri ?? null) : null;
      throw new Error(
        `Connection not established. Last state: ${JSON.stringify(
          state
        )}, targetUri: ${targetUri}`
      );
    }

    const connectionState = socketService.getConnectionState();
    expect(connectionState.isConnected).toBe(true);
    expect(connectionState.error).toBeNull();

    const socket = socketService.getSocket();
    expect(socket).not.toBeNull();
    expect(socket?.io.opts.secure).toBe(true);

    socketService.joinSession('secure-session');

    await waitFor(() => updates.length > 0, 5000);

    expect(updates[0]).toMatchObject({
      uploadId: 'secure-session',
      status: 'pending',
    });

    expect(statusChanges).toContain('connected');
  }, 20000);
});

async function allocatePort(): Promise<number> {
  return await new Promise<number>(resolve => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(
  predicate: () => boolean,
  timeout = 5000,
  interval = 25
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timed out waiting for condition');
}
