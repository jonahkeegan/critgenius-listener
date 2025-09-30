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
import type { SocketConnectionState } from '../../types/socket';

const runIntegration = process.env.RUN_CLIENT_IT === 'true';
const describeMaybe = runIntegration ? describe : describe.skip;

type SocketServiceInstance =
  typeof import('../../services/socketService').default;

describeMaybe('integration:https socket resilience', () => {
  let httpsServer: https.Server;
  let ioServer: SocketIOServer;
  let port: number;
  let socketService: SocketServiceInstance;
  let originalWebSocket: typeof globalThis.WebSocket;
  let originalNodeTlsRejectUnauthorized: string | undefined;
  let originalClientSocketDisableTlsBypass: string | undefined;
  let originalGlobalAgentRejectUnauthorized: boolean | undefined;
  let originalGlobalAgentCa: typeof https.globalAgent.options.ca;
  let trustedAuthorityCertificate: Buffer;

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
    trustedAuthorityCertificate = cert;

    originalNodeTlsRejectUnauthorized =
      process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    originalClientSocketDisableTlsBypass =
      process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS;
    originalGlobalAgentRejectUnauthorized =
      https.globalAgent.options.rejectUnauthorized;
    originalGlobalAgentCa = https.globalAgent.options.ca;

    https.globalAgent.options.ca = buildCaBundle(
      originalGlobalAgentCa,
      trustedAuthorityCertificate
    );
    https.globalAgent.options.rejectUnauthorized = true;
    process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS = 'true';

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
          message: 'resilience join acknowledged',
        });
      });
    });

    await new Promise<void>(resolve => httpsServer.listen(port, resolve));

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
    socketService.connect();
  }, 20000);

  afterEach(() => {
    socketService?.disconnect();
    process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS = 'true';
    https.globalAgent.options.ca = buildCaBundle(
      originalGlobalAgentCa,
      trustedAuthorityCertificate
    );
    https.globalAgent.options.rejectUnauthorized = true;
  });

  afterAll(async () => {
    delete (globalThis as GlobalWithClientEnv).__CLIENT_ENV__;
    if (originalNodeTlsRejectUnauthorized === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED =
        originalNodeTlsRejectUnauthorized;
    }
    if (originalClientSocketDisableTlsBypass === undefined) {
      delete process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS;
    } else {
      process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS =
        originalClientSocketDisableTlsBypass;
    }
    https.globalAgent.options.ca = originalGlobalAgentCa;
    if (typeof originalGlobalAgentRejectUnauthorized === 'boolean') {
      https.globalAgent.options.rejectUnauthorized =
        originalGlobalAgentRejectUnauthorized;
    } else {
      delete (
        https.globalAgent.options as typeof https.globalAgent.options & {
          rejectUnauthorized?: boolean;
        }
      ).rejectUnauthorized;
    }
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

  it('recovers after TLS handshake failures once certificate is trusted', async () => {
    socketService.updateResilienceConfig({
      initialReconnectionDelay: 200,
      reconnectionDelayJitter: 0,
      maxReconnectionAttempts: 5,
    });

    process.env.CLIENT_SOCKET_DISABLE_TLS_BYPASS = 'true';
    https.globalAgent.options.ca = buildCaBundle(originalGlobalAgentCa);

    socketService.disconnect();
    socketService.connect();

    try {
      await waitFor(() => {
        const state = socketService.getConnectionState();
        return state.error?.code === 'TLS_HANDSHAKE_FAILED';
      }, 10000);
    } catch {
      const state = socketService.getConnectionState();
      throw new Error(
        `Expected TLS error did not surface. Last state: ${JSON.stringify(state)}`
      );
    } finally {
      https.globalAgent.options.ca = buildCaBundle(
        originalGlobalAgentCa,
        trustedAuthorityCertificate
      );
    }

    const failureState: SocketConnectionState =
      socketService.getConnectionState();
    expect(failureState.error?.code).toBe('TLS_HANDSHAKE_FAILED');
    expect(failureState.error?.retryInMs).toBe(200);
    expect(failureState.isConnected).toBe(false);

    socketService.connect();

    try {
      await waitFor(
        () => socketService.getConnectionState().isConnected,
        10000
      );
    } catch {
      const state = socketService.getConnectionState();
      throw new Error(
        `Connection did not recover. Last state: ${JSON.stringify(state)}`
      );
    }

    const recoveredState = socketService.getConnectionState();
    expect(recoveredState.isConnected).toBe(true);
    expect(recoveredState.error).toBeNull();
  }, 25000);
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

type CaValue = typeof https.globalAgent.options.ca;
type CaEntry = string | Buffer;

function normalizeCa(value: CaValue): CaEntry[] {
  if (!value) return [];
  return Array.isArray(value) ? [...value] : [value];
}

function buildCaBundle(base: CaValue, extra?: Buffer): CaValue {
  const entries = normalizeCa(base);
  if (extra) {
    const alreadyPresent = entries.some(entry =>
      Buffer.isBuffer(entry) ? entry.equals(extra) : false
    );
    if (!alreadyPresent) {
      entries.push(extra);
    }
  }
  if (entries.length === 0) {
    return undefined;
  }
  return entries.length === 1 ? entries[0] : entries;
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
