import express, { type Application } from 'express';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { EnvironmentConfig } from '@critgenius/shared';
import { SessionManager } from '../../src/realtime/sessionManager.js';

export type ServerUnderTest = {
  app: Application;
  httpServer: HttpServer;
  io: SocketIOServer;
  sessionManager: SessionManager;
  start: () => Promise<number>;
  stop: () => Promise<void>;
};

export function createIntegrationServer(
  env: EnvironmentConfig
): ServerUnderTest {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', credentials: false },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  const sessionManager = new SessionManager(io, env);

  io.on('connection', (socket: Socket) => {
    socket.emit('connectionStatus', 'connected');

    socket.on('joinSession', ({ sessionId }: { sessionId: string }) => {
      sessionManager.join(socket, sessionId);
      socket.emit('processingUpdate', {
        uploadId: sessionId,
        status: 'pending',
        message: `Joined session ${sessionId}`,
      });
    });

    socket.on('leaveSession', ({ sessionId }: { sessionId: string }) => {
      sessionManager.leave(socket, sessionId);
      socket.emit('processingUpdate', {
        uploadId: sessionId,
        status: 'left',
        message: `Left session ${sessionId}`,
      });
    });

    socket.on('startRecording', ({ sessionId }: { sessionId: string }) => {
      socket.to(sessionId).emit('processingUpdate', {
        uploadId: sessionId,
        status: 'processing',
        message: 'Recording started',
      });
    });

    socket.on('stopRecording', ({ sessionId }: { sessionId: string }) => {
      socket.to(sessionId).emit('processingUpdate', {
        uploadId: sessionId,
        status: 'completed',
        message: 'Recording completed',
      });
    });

    socket.on(
      'startTranscription',
      (payload: {
        sessionId: string;
        audioConfig?: {
          sampleRate?: number;
          language?: string;
          diarization?: boolean;
        };
      }) => {
        sessionManager.startTranscription(
          payload.sessionId,
          payload.audioConfig ?? {}
        );
      }
    );

    socket.on('stopTranscription', ({ sessionId }: { sessionId: string }) => {
      sessionManager.stopTranscription(sessionId);
    });

    socket.on(
      'audioChunk',
      ({
        sessionId,
        chunk,
      }: {
        sessionId: string;
        chunk: ArrayBuffer | Uint8Array | string;
      }) => {
        sessionManager.pushAudio(sessionId, chunk);
      }
    );

    socket.on('disconnect', (reason: string) => {
      socket.emit('connectionStatus', `disconnected:${reason}`);
    });
  });

  return {
    app,
    httpServer,
    io,
    sessionManager,
    start: async () => {
      await new Promise<void>((resolve, reject) => {
        httpServer.listen(env.PORT, resolve);
        httpServer.on('error', reject);
      });
      const address = httpServer.address() as AddressInfo | null;
      if (!address) {
        throw new Error('Server failed to report listening address');
      }
      return address.port;
    },
    stop: async () => {
      await new Promise<void>((resolve, reject) => {
        io.close(err => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      if (httpServer.listening) {
        await new Promise<void>((resolve, reject) => {
          httpServer.close(err => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      }
    },
  };
}
