/**
 * @fileoverview Tests for SessionManager bridging Socket.IO and AssemblyAIConnector
 * Validates control flow, event propagation, error handling, and lifecycle without live API.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Server as SocketIOServer } from 'socket.io';

// Hoisted store to capture handlers passed into mocked connector instances
const handlerStore: Record<
  string,
  {
    onOpen?: () => void;
    onError?: (err: Error) => void;
    onClose?: (code: number, reason: string) => void;
    onTranscription?: (payload: any) => void;
    onStatus?: (status: { status: string; message?: string }) => void;
  }
> = {};

// Hoisted spy for sendAudioChunk/close per session
const connectorSpies: Record<
  string,
  {
    connect: ReturnType<typeof vi.fn>;
    sendAudioChunk: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  }
> = {};

// Mock the AssemblyAIConnector used by SessionManager
vi.mock('./assemblyaiConnector.js', () => {
  class AssemblyAIConnectorMock {
    sessionId: string;
    cfg: any;
    handlers: any;
    constructor(sessionId: string, cfg: any, handlers: any) {
      this.sessionId = sessionId;
      this.cfg = cfg;
      this.handlers = handlers;
      handlerStore[sessionId] = handlers;
      connectorSpies[sessionId] = {
        connect: vi.fn(),
        sendAudioChunk: vi.fn(),
        close: vi.fn(),
      };
    }
    connect() {
      connectorSpies[this.sessionId]!.connect();
    }
    sendAudioChunk(chunk: any) {
      connectorSpies[this.sessionId]!.sendAudioChunk(chunk);
    }
    close() {
      connectorSpies[this.sessionId]!.close();
    }
  }
  return { AssemblyAIConnector: AssemblyAIConnectorMock };
});

// Mock environment config for tests
const mockEnvConfig = {
  NODE_ENV: 'test' as const,
  PORT: 3100,
  CLIENT_PORT: 3101,
  HOST: 'localhost',
  ASSEMBLYAI_API_KEY: 'assemblyai-testkey-abcdefghijklmnopqrstuvwxyz123456',
  MONGODB_URI: 'mongodb://localhost:27017/test',
  MONGODB_DB_NAME: 'critgenius-listener',
  REDIS_URL: 'redis://localhost:6379',
  REDIS_PASSWORD: undefined,
  REDIS_DB: 0,
  JWT_SECRET: 'test-jwt-secret',
  CORS_ORIGINS: 'http://localhost:3101',
  JWT_EXPIRES_IN: '7d',
  CSP_ENABLED: true,
  HELMET_ENABLED: true,
  RATE_LIMIT_ENABLED: true,
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  MAX_AUDIO_FILE_SIZE: 52428800,
  MAX_AUDIO_DURATION: 3600,
  SUPPORTED_AUDIO_FORMATS: 'wav,mp3,m4a,flac,ogg',
  SESSION_TIMEOUT: 60,
  MAX_CONCURRENT_SESSIONS: 10,
  EXPORT_TEMP_DIR: './temp-exports',
  EXPORT_MAX_SIZE: 104857600,
  AUTO_CLEANUP_ENABLED: true,
  CLEANUP_INTERVAL_HOURS: 24,
  DEFAULT_RETENTION_DAYS: 30,
  GDPR_ENABLED: true,
  DATA_ANONYMIZATION_ENABLED: true,
  CONSENT_REQUIRED: true,
  LOG_LEVEL: 'info' as const,
  LOG_FORMAT: 'json' as const,
  LOG_FILE_PATH: './logs/app.log',
  WS_HEARTBEAT_INTERVAL: 30000,
  WS_MAX_CONNECTIONS: 100,
  CACHE_TTL: 300,
  CACHE_MAX_SIZE: 1000,
  HEALTH_CHECK_ENABLED: true,
  METRICS_ENABLED: true,
  SSL_ENABLED: false,
  CSP_REPORT_URI: '/api/csp-report',
  MOCK_ASSEMBLYAI: true,
  MOCK_ECOSYSTEM_SERVICES: true,
  DEBUG: 'critgenius:*',
  DEBUG_SQL: false,
  DEBUG_REDIS: false,
  HOT_RELOAD: true,
  WATCH_FILES: true,
};

import { SessionManager } from './sessionManager.js';

// Simple mock for Socket.IO server room emitter
function createMockIO() {
  const roomEmit = vi.fn();
  const to = vi.fn(() => ({ emit: roomEmit }));
  const io = { to } as unknown as SocketIOServer;
  return { io, to, roomEmit };
}

function createMockSocket(id: string) {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
  } as any;
}

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const VALID_KEY = '0123456789abcdef0123456789abcdef';

  it('emits error when API key missing on startTranscription', () => {
    const { io, roomEmit } = createMockIO();
    const testEnvConfig = { ...mockEnvConfig, ASSEMBLYAI_API_KEY: '' };
    const mgr = new SessionManager(io, testEnvConfig);
    const sessionId = 's-1';

    mgr.startTranscription(sessionId, { sampleRate: 16000 });

    expect(roomEmit).toHaveBeenCalled();
    const first = roomEmit.mock.calls[0] as any[];
    expect(first).toBeTruthy();
    const [event, payload] = first;
    expect(event).toBe('error');
    expect(payload).toMatchObject({ code: 'ASSEMBLYAI_CONFIG_MISSING' });
  });

  it('emits error when API key invalid format on startTranscription', () => {
    const { io, roomEmit } = createMockIO();
    const testEnvConfig = { ...mockEnvConfig, ASSEMBLYAI_API_KEY: '' };
    const mgr = new SessionManager(io, testEnvConfig);
    const sessionId = 's-1b';

    mgr.startTranscription(sessionId, { sampleRate: 16000 }, 'fake-key');

    expect(roomEmit).toHaveBeenCalled();
    const first = roomEmit.mock.calls[0] as any[];
    expect(first).toBeTruthy();
    const [event, payload] = first;
    expect(event).toBe('error');
    expect(payload).toMatchObject({ code: 'ASSEMBLYAI_CONFIG_INVALID' });
    // Ensure no connector was created for this session
    expect(connectorSpies[sessionId]).toBeUndefined();
  });

  it('connects a connector and emits running status on onOpen', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const sessionId = 's-2';

    mgr.startTranscription(sessionId, { sampleRate: 16000 }, VALID_KEY);

    // connector.connect should be called
    expect(connectorSpies[sessionId]!.connect).toHaveBeenCalledTimes(1);

    // Simulate onOpen from connector
    handlerStore[sessionId]!.onOpen?.();

    // Should emit transcriptionStatus running
    const lastCall = roomEmit.mock.calls.at(-1)!;
    expect(lastCall[0]).toBe('transcriptionStatus');
    expect(lastCall[1]).toMatchObject({ sessionId, status: 'running' });
  });

  it('forwards audio chunks to connector', () => {
    const { io } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const sessionId = 's-3';
    mgr.startTranscription(sessionId, { sampleRate: 16000 }, VALID_KEY);

    mgr.pushAudio(sessionId, 'base64audio');
    expect(connectorSpies[sessionId]!.sendAudioChunk).toHaveBeenCalledWith(
      'base64audio'
    );
  });

  it('normalizes transcription payloads and emits transcriptionUpdate', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const sessionId = 's-4';
    mgr.startTranscription(sessionId, {}, VALID_KEY);

    const payload = {
      message_type: 'final',
      text: 'Hello world',
      confidence: 0.92,
      words: [
        {
          start: 0,
          end: 120,
          text: 'Hello',
          confidence: 0.9,
          speaker: 'spk_0',
        },
        {
          start: 130,
          end: 300,
          text: 'world',
          confidence: 0.95,
          speaker: 'spk_0',
        },
      ],
    };
    handlerStore[sessionId]!.onTranscription?.(payload);

    const call = roomEmit.mock.calls.find(c => c[0] === 'transcriptionUpdate');
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({
      sessionId,
      text: 'Hello world',
      isFinal: true,
      confidence: 0.92,
      words: [
        {
          start: 0,
          end: 120,
          text: 'Hello',
          confidence: 0.9,
          speaker: 'spk_0',
        },
        {
          start: 130,
          end: 300,
          text: 'world',
          confidence: 0.95,
          speaker: 'spk_0',
        },
      ],
    });
  });

  it('propagates connector error via error event', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const sessionId = 's-5';
    mgr.startTranscription(sessionId, {}, VALID_KEY);

    handlerStore[sessionId]!.onError?.(new Error('boom'));

    const call = roomEmit.mock.calls.find(c => c[0] === 'error');
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({ code: 'TRANSCRIPTION_ERROR' });
  });

  it('emits stopped on connector close and on stopTranscription()', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const sessionId = 's-6';
    mgr.startTranscription(sessionId, {}, VALID_KEY);

    // Close from connector
    handlerStore[sessionId]!.onClose?.(1000, 'done');
    let call = roomEmit.mock.calls.find(c => c[0] === 'transcriptionStatus');
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({ status: 'stopped' });

    // Explicit stop
    roomEmit.mockClear();
    mgr.stopTranscription(sessionId);
    call = roomEmit.mock.calls.find(c => c[0] === 'transcriptionStatus');
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({ status: 'stopped' });
    expect(connectorSpies[sessionId]!.close).toHaveBeenCalled();
  });

  it('manages participants and cleans up session on last leave', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io, mockEnvConfig);
    const s1 = createMockSocket('a');
    const s2 = createMockSocket('b');
    const sessionId = 's-7';

    mgr.join(s1, sessionId);
    mgr.join(s2, sessionId);
    expect(s1.join).toHaveBeenCalledWith(sessionId);
    expect(s2.join).toHaveBeenCalledWith(sessionId);

    // Start and then remove one participant
    mgr.startTranscription(sessionId, {}, VALID_KEY);
    mgr.leave(s1, sessionId);
    expect(s1.leave).toHaveBeenCalledWith(sessionId);

    // Session should still be alive (second participant remains)
    roomEmit.mockClear();

    // Remove last participant triggers cleanup
    mgr.leave(s2, sessionId);
    const stopEvent = roomEmit.mock.calls.find(
      c => c[0] === 'transcriptionStatus' && c[1]?.status === 'stopped'
    );
    expect(stopEvent).toBeTruthy();
    expect(connectorSpies[sessionId]!.close).toHaveBeenCalled();
  });
});
