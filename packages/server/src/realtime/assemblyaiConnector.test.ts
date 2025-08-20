/**
 * @fileoverview Unit tests for AssemblyAIConnector without live websocket
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ws module
const wsMocks = vi.hoisted(() => {
  type ListenerFn = (...args: unknown[]) => void;
  const listeners: Record<string, ListenerFn[]> = {};
  const mockSend = vi.fn();
  const mockClose = vi.fn();
  class MockWS {
    static OPEN = 1;
    readyState = 1; // OPEN
    on(event: string, cb: ListenerFn) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }
    send(data: string) {
      mockSend(data);
    }
    close() {
      mockClose();
    }
  }
  return { listeners, mockSend, mockClose, MockWS };
});

vi.mock('ws', () => ({
  default: wsMocks.MockWS,
}));

import { AssemblyAIConnector } from './assemblyaiConnector.js';

function emit(event: string, ...args: unknown[]) {
  const cbs = wsMocks.listeners[event] || [];
  cbs.forEach(cb => cb(...args));
}

describe('AssemblyAIConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(wsMocks.listeners).forEach(k => delete wsMocks.listeners[k]);
  });

  it('sends base64 audio data as JSON', async () => {
    const onOpen = vi.fn();
    const conn = new AssemblyAIConnector(
      's-1',
      { apiKey: 'k', sampleRate: 16000 },
      { onOpen }
    );

    await conn.connect();
    emit('open');

    conn.sendAudioChunk(new Uint8Array([1, 2, 3]));

    expect(wsMocks.mockSend).toHaveBeenCalled();
    const sent = wsMocks.mockSend.mock.calls.at(-1)![0];
    const json = JSON.parse(sent);
    expect(json).toHaveProperty('audio_data');
    // quick base64 sanity
    expect(typeof json.audio_data).toBe('string');
  });

  it('emits running status on open and stopped on close', async () => {
    const onStatus = vi.fn();
    const onClose = vi.fn();
    const conn = new AssemblyAIConnector(
      's-2',
      { apiKey: 'k', sampleRate: 16000 },
      { onStatus, onClose }
    );

    await conn.connect();
    emit('open');

    expect(onStatus).toHaveBeenCalledWith({ status: 'running' });

    emit('close', 1000, 'done');
    expect(onClose).toHaveBeenCalledWith(1000, 'done');
    const last = onStatus.mock.calls.at(-1)![0];
    expect(last).toMatchObject({ status: 'stopped' });
  });

  it('parses message JSON and forwards to onTranscription', async () => {
    const onTranscription = vi.fn();
    const conn = new AssemblyAIConnector(
      's-3',
      { apiKey: 'k', sampleRate: 16000 },
      { onTranscription }
    );

    await conn.connect();
    emit('message', JSON.stringify({ text: 'hi' }));

    expect(onTranscription).toHaveBeenCalledWith({ text: 'hi' });
  });
});
