import { EventEmitter } from 'node:events';

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

export type AssemblyAITestEvent =
  | { type: 'transcription'; payload: unknown }
  | { type: 'status'; payload: { status: string; message?: string } }
  | { type: 'error'; payload: Error }
  | { type: 'close'; payload?: { code?: number; reason?: string } };

export type AssemblyAITestScenario = {
  name: string;
  Connector: new (
    sessionId: string,
    config: AssemblyAIConfig,
    handlers: AssemblyAIEventHandlers
  ) => MockAssemblyAIConnector;
  emit: (sessionId: string, event: AssemblyAITestEvent) => void;
  getAudioChunks: (sessionId: string) => readonly unknown[];
  reset: () => void;
};

class MockAssemblyAIConnector {
  private readonly eventBus: EventEmitter;
  private readonly handlers: AssemblyAIEventHandlers;
  private readonly sessionId: string;
  private readonly audioChunks: unknown[];
  private connected = false;

  constructor(
    sessionId: string,
    _config: AssemblyAIConfig,
    handlers: AssemblyAIEventHandlers,
    bus: EventEmitter,
    chunkStore: Map<string, unknown[]>
  ) {
    this.sessionId = sessionId;
    this.eventBus = bus;
    this.handlers = handlers;
    const target = chunkStore.get(sessionId) ?? [];
    chunkStore.set(sessionId, target);
    this.audioChunks = target;
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.eventBus.emit('connector:open', this.sessionId);
    this.handlers.onOpen?.();
    this.handlers.onStatus?.({ status: 'running' });
  }

  sendAudioChunk(chunk: ArrayBuffer | Uint8Array | string) {
    if (!this.connected) {
      return;
    }
    this.audioChunks.push(chunk);
    this.eventBus.emit('connector:audio', this.sessionId, chunk);
  }

  close() {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    this.handlers.onClose?.(1000, 'mock-close');
    this.handlers.onStatus?.({ status: 'stopped', message: 'mock-close' });
    this.eventBus.emit('connector:close', this.sessionId);
  }
}

export function createMockAssemblyAIScenario(
  name = 'mock-assemblyai'
): AssemblyAITestScenario {
  const bus = new EventEmitter();
  const chunkStore = new Map<string, unknown[]>();
  const connectorHandlers = new Map<string, AssemblyAIEventHandlers>();

  bus.on('connector:open', (sessionId: string) => {
    const handlers = connectorHandlers.get(sessionId);
    if (handlers?.onStatus) {
      handlers.onStatus({ status: 'running' });
    }
  });

  class ScenarioConnector extends MockAssemblyAIConnector {
    constructor(
      sessionId: string,
      config: AssemblyAIConfig,
      handlers: AssemblyAIEventHandlers
    ) {
      super(sessionId, config, handlers, bus, chunkStore);
      connectorHandlers.set(sessionId, handlers);
    }
  }

  return {
    name,
    Connector: ScenarioConnector,
    emit: (sessionId: string, event: AssemblyAITestEvent) => {
      const handlers = connectorHandlers.get(sessionId);
      if (!handlers) {
        return;
      }

      switch (event.type) {
        case 'transcription':
          handlers.onTranscription?.(event.payload);
          break;
        case 'status':
          handlers.onStatus?.(event.payload);
          break;
        case 'error':
          handlers.onError?.(event.payload);
          break;
        case 'close':
          handlers.onClose?.(
            event.payload?.code ?? 1000,
            event.payload?.reason ?? 'closed-by-test'
          );
          break;
        default:
          break;
      }
    },
    getAudioChunks: sessionId => {
      const chunks = chunkStore.get(sessionId) ?? [];
      return Object.freeze([...chunks]);
    },
    reset: () => {
      connectorHandlers.clear();
      chunkStore.clear();
      bus.removeAllListeners();
    },
  };
}

export { MockAssemblyAIConnector };
