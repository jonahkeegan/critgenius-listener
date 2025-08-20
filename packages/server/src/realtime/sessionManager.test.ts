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
    const mgr = new SessionManager(io);
    const sessionId = 's-1';

    // Ensure env is not used for this test
    const prev = process.env.ASSEMBLYAI_API_KEY;
    delete (process.env as any).ASSEMBLYAI_API_KEY;

    mgr.startTranscription(sessionId, { sampleRate: 16000 });

    // Restore env
    process.env.ASSEMBLYAI_API_KEY = prev;

    expect(roomEmit).toHaveBeenCalled();
    const first = roomEmit.mock.calls[0] as any[];
    expect(first).toBeTruthy();
    const [event, payload] = first;
    expect(event).toBe('error');
    expect(payload).toMatchObject({ code: 'ASSEMBLYAI_CONFIG_MISSING' });
  });

  it('emits error when API key invalid format on startTranscription', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io);
    const sessionId = 's-1b';

    const prev = process.env.ASSEMBLYAI_API_KEY;
    delete (process.env as any).ASSEMBLYAI_API_KEY;

    mgr.startTranscription(sessionId, { sampleRate: 16000 }, 'fake-key');

    process.env.ASSEMBLYAI_API_KEY = prev;

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
    const mgr = new SessionManager(io);
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
    const mgr = new SessionManager(io);
    const sessionId = 's-3';
    mgr.startTranscription(sessionId, { sampleRate: 16000 }, VALID_KEY);

    mgr.pushAudio(sessionId, 'base64audio');
    expect(connectorSpies[sessionId]!.sendAudioChunk).toHaveBeenCalledWith(
      'base64audio'
    );
  });

  it('normalizes transcription payloads and emits transcriptionUpdate', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io);
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
    const mgr = new SessionManager(io);
    const sessionId = 's-5';
    mgr.startTranscription(sessionId, {}, VALID_KEY);

    handlerStore[sessionId]!.onError?.(new Error('boom'));

    const call = roomEmit.mock.calls.find(c => c[0] === 'error');
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({ code: 'TRANSCRIPTION_ERROR' });
  });

  it('emits stopped on connector close and on stopTranscription()', () => {
    const { io, roomEmit } = createMockIO();
    const mgr = new SessionManager(io);
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
    const mgr = new SessionManager(io);
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
