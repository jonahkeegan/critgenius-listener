/**
 * Transcription Session Manager
 * Manages Socket.IO rooms and AssemblyAI real-time sessions per sessionId.
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import { AssemblyAIConnector } from './assemblyaiConnector.js';

type SessionState = {
  sessionId: string;
  participants: Set<string>;
  connector: AssemblyAIConnector | null;
  options: {
    sampleRate: number;
    diarization?: boolean;
    language?: string;
  };
};

type AssemblyAIWord = {
  start: number;
  end: number;
  text: string;
  confidence?: number;
  speaker?: string;
};

export class SessionManager {
  private sessions = new Map<string, SessionState>();
  constructor(private io: SocketIOServer) {}

  getOrCreateSession(sessionId: string): SessionState {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const state: SessionState = {
      sessionId,
      participants: new Set<string>(),
      connector: null,
      options: { sampleRate: 16000 },
    };
    this.sessions.set(sessionId, state);
    return state;
  }

  join(socket: Socket, sessionId: string) {
    const state = this.getOrCreateSession(sessionId);
    state.participants.add(socket.id);
    socket.join(sessionId);
  }

  leave(socket: Socket, sessionId: string) {
    const state = this.getOrCreateSession(sessionId);
    state.participants.delete(socket.id);
    socket.leave(sessionId);
    if (state.participants.size === 0) {
      this.stopTranscription(sessionId);
      this.sessions.delete(sessionId);
    }
  }

  startTranscription(
    sessionId: string,
    opts: Partial<SessionState['options']>,
    apiKey?: string
  ) {
    const state = this.getOrCreateSession(sessionId);
    // Build options without undefined (for exactOptionalPropertyTypes)
    const next: SessionState['options'] = {
      sampleRate: state.options.sampleRate,
    };
    if (typeof opts.sampleRate === 'number') next.sampleRate = opts.sampleRate;
    if (typeof opts.diarization === 'boolean')
      next.diarization = opts.diarization;
    if (typeof opts.language === 'string') next.language = opts.language;
    state.options = next;
    if (state.connector) return; // already running

    // Prefer env var for security; trim to avoid whitespace-only values
    const resolvedKey = (apiKey ?? process.env.ASSEMBLYAI_API_KEY ?? '').trim();
    if (!resolvedKey) {
      this.io.to(sessionId).emit('error', {
        code: 'ASSEMBLYAI_CONFIG_MISSING',
        message: 'AssemblyAI API key not configured',
      });
      return;
    }

    // Basic format validation to fail fast on obviously invalid keys
    const looksValid =
      resolvedKey.length >= 32 && !/\s/.test(resolvedKey);
    if (!looksValid) {
      this.io.to(sessionId).emit('error', {
        code: 'ASSEMBLYAI_CONFIG_INVALID',
        message:
          'AssemblyAI API key appears invalid. Please check your configuration.',
      });
      return;
    }
    const connector = new AssemblyAIConnector(
      sessionId,
      (() => {
        const cfg: {
          apiKey: string;
          sampleRate: number;
          language?: string;
          diarization?: boolean;
        } = {
          apiKey: resolvedKey,
          sampleRate: state.options.sampleRate,
        };
        if (typeof state.options.language === 'string')
          cfg.language = state.options.language;
        if (typeof state.options.diarization === 'boolean')
          cfg.diarization = state.options.diarization;
        return cfg;
      })(),
      {
        onOpen: () =>
          this.io
            .to(sessionId)
            .emit('transcriptionStatus', { sessionId, status: 'running' }),
        onStatus: s =>
          this.io.to(sessionId).emit('transcriptionStatus', {
            sessionId,
            status: s.status as
              | 'starting'
              | 'running'
              | 'stopped'
              | 'error'
              | 'resumed',
            message: s.message,
          }),
        onError: err =>
          this.io.to(sessionId).emit('error', {
            code: 'TRANSCRIPTION_ERROR',
            message: String(err?.message || err),
          }),
        onTranscription: (payload: unknown) => {
          const isRecord = (v: unknown): v is Record<string, unknown> =>
            typeof v === 'object' && v !== null;
          const isWord = (w: unknown): w is AssemblyAIWord =>
            isRecord(w) &&
            typeof w.start === 'number' &&
            typeof w.end === 'number' &&
            typeof w.text === 'string';
          const isAAIPayload = (
            p: unknown
          ): p is {
            message_type?: 'partial' | 'final';
            text?: string;
            transcript?: string;
            confidence?: number;
            words?: AssemblyAIWord[];
          } =>
            isRecord(p) &&
            (typeof p.text === 'string' ||
              typeof p.transcript === 'string' ||
              p.message_type === 'final' ||
              p.message_type === 'partial');

          // Normalize common fields
          if (isAAIPayload(payload)) {
            const isFinal = payload.message_type === 'final';
            const text = payload.text ?? payload.transcript ?? '';
            const confidence = payload.confidence;
            const words = Array.isArray(payload.words)
              ? payload.words.filter(isWord).map(w => ({
                  start: w.start,
                  end: w.end,
                  text: w.text,
                  confidence: w.confidence,
                  speaker: w.speaker,
                }))
              : undefined;
            this.io.to(sessionId).emit('transcriptionUpdate', {
              sessionId,
              text,
              timestamp: new Date().toISOString(),
              isFinal,
              confidence,
              words,
            });
          }
        },
        onClose: () =>
          this.io
            .to(sessionId)
            .emit('transcriptionStatus', { sessionId, status: 'stopped' }),
      }
    );
    state.connector = connector;
    connector.connect();
  }

  stopTranscription(sessionId: string) {
    const state = this.sessions.get(sessionId);
    if (!state) return;
    state.connector?.close();
    state.connector = null;
    this.io
      .to(sessionId)
      .emit('transcriptionStatus', { sessionId, status: 'stopped' });
  }

  pushAudio(sessionId: string, chunk: ArrayBuffer | Uint8Array | string) {
    const state = this.sessions.get(sessionId);
    if (!state || !state.connector) return;
    state.connector.sendAudioChunk(chunk);
  }
}
