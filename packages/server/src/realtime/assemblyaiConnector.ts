/**
 * AssemblyAI real-time transcription connector with basic resilience.
 */

import WebSocket from 'ws';

export type AssemblyAIEventHandlers = {
  onOpen?: () => void;
  onError?: (err: Error) => void;
  onClose?: (code: number, reason: string) => void;
  onTranscription?: (payload: unknown) => void;
  onStatus?: (status: { status: string; message?: string }) => void;
};

export interface AssemblyAIConfig {
  apiKey: string;
  sampleRate: number;
  language?: string;
  diarization?: boolean;
}

export class AssemblyAIConnector {
  private ws: WebSocket | null = null;
  private url = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=';
  constructor(
    private sessionId: string,
    private cfg: AssemblyAIConfig,
    private handlers: AssemblyAIEventHandlers = {}
  ) {}

  async connect(): Promise<void> {
    const { sampleRate } = this.cfg;
    const fullUrl = `${this.url}${sampleRate}`;

    this.ws = new WebSocket(fullUrl, {
      headers: {
        Authorization: this.cfg.apiKey,
      },
    });

    this.ws.on('open', () => {
      // Trace WS open for this session (avoid spam in tests)
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[AssemblyAIConnector] WebSocket opened for sessionId: ${this.sessionId}`
        );
      }
      this.handlers.onOpen?.();
      if (this.cfg.diarization) {
        // Best-effort enable diarization
        this.sendJSON({ config: { diarization: true } });
      }
      this.handlers.onStatus?.({ status: 'running' });
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = typeof data === 'string' ? data : data.toString('utf8');
        const json: unknown = JSON.parse(msg);
        this.handlers.onTranscription?.(json);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        this.handlers.onError?.(err);
      }
    });

    this.ws.on('error', (err: Error) => {
      this.handlers.onError?.(err);
    });

    this.ws.on('close', (code, reasonBuf) => {
      const reason = reasonBuf?.toString() || '';
      this.handlers.onClose?.(code, reason);
      this.handlers.onStatus?.({ status: 'stopped', message: reason });
    });
  }

  sendAudioChunk(chunk: ArrayBuffer | Uint8Array | string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    // AssemblyAI expects base64-encoded PCM in JSON { audio_data: <base64> }
    if (typeof chunk === 'string') {
      this.sendJSON({ audio_data: chunk });
      return;
    }
    const buffer = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
    const base64 = Buffer.from(buffer).toString('base64');
    this.sendJSON({ audio_data: base64 });
  }

  private sendJSON(obj: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}
