/**
 * @fileoverview Socket.IO client service for CritGenius Listener
 * Provides typed real-time communication between client and server
 */

import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketConnectionState,
} from '../types/socket';
import { clientEnv } from '../config/environment';

type QueueItem<
  K extends keyof ClientToServerEvents = keyof ClientToServerEvents,
> = {
  event: K;
  args: Parameters<ClientToServerEvents[K]>;
};

// Discriminated union of all possible queued items for safe replay
type AnyQueueItem = {
  [K in keyof ClientToServerEvents]: QueueItem<K>;
}[keyof ClientToServerEvents];

interface ResilienceConfig {
  maxReconnectionAttempts: number;
  initialReconnectionDelay: number; // ms
  reconnectionDelayJitter: number; // ms
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private connectionState: SocketConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
  };
  private extendedState: { networkStatus: { isOnline: boolean } } = {
    networkStatus: { isOnline: true },
  };
  private listeners: {
    [K in keyof ServerToClientEvents]: Array<
      NonNullable<ServerToClientEvents[K]>
    >;
  } = {
    connectionStatus: [],
    processingUpdate: [],
    transcriptionUpdate: [],
    transcriptionStatus: [],
    error: [],
  };
  private messageQueue: AnyQueueItem[] = [];
  private resilienceConfig: ResilienceConfig = {
    maxReconnectionAttempts: 5,
    initialReconnectionDelay: 1000,
    reconnectionDelayJitter: 0,
  };
  private reconnectionAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private getListeners<K extends keyof ServerToClientEvents>(
    event: K
  ): Array<NonNullable<ServerToClientEvents[K]>> {
    return this.listeners[event] as Array<NonNullable<ServerToClientEvents[K]>>;
  }

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): void {
    if (this.socket?.connected) return;
    this.connectionState.isConnecting = true;
    this.emitStateChange();
    const url = clientEnv.CLIENT_SOCKET_URL || 'http://localhost:3001';
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: false,
      timeout: 20000,
      withCredentials: true,
    });
    this.setupEventListeners();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.emitStateChange();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.error = null;
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'connected');
      this.reconnectionAttempts = 0;
      this.flushQueue();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });
    this.socket.on('disconnect', () => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'disconnected');
      void this.checkNetworkStatus();
      this.scheduleReconnect();
    });
    this.socket.on('connect_error', error => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.connectionState.error = error.message;
      this.emitStateChange();
    });

    // Forward server events to local listeners
    this.socket.on('connectionStatus', status => {
      this.emitToInternalListeners('connectionStatus', status);
    });
    this.socket.on('processingUpdate', data => {
      this.emitToInternalListeners('processingUpdate', data);
    });
    this.socket.on('transcriptionUpdate', data => {
      this.emitToInternalListeners('transcriptionUpdate', data);
    });
    this.socket.on('error', error => {
      this.emitToInternalListeners('error', error);
    });
  }

  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
      return;
    }
    this.messageQueue.push({ event, args } as AnyQueueItem);
  }

  public on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: NonNullable<ServerToClientEvents[K]>
  ): void {
    const arr = this.getListeners(event);
    arr.push(listener);
  }

  public off<K extends keyof ServerToClientEvents>(
    event: K,
    listener: NonNullable<ServerToClientEvents[K]>
  ): void {
    const listeners = this.getListeners(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emitStateChange(): void {
    this.emitToInternalListeners(
      'connectionStatus',
      this.connectionState.isConnected ? 'connected' : 'disconnected'
    );
  }
  private emitToInternalListeners<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: ServerToClientEvents[K] extends (...a: infer P) => unknown
      ? P
      : never
  ): void {
    const listeners = this.getListeners(event);
    if (listeners && listeners.length) {
      listeners.forEach(listener => {
        try {
          (
            listener as (
              ...a: Parameters<NonNullable<ServerToClientEvents[K]>>
            ) => void
          )(
            ...(args as unknown as Parameters<
              NonNullable<ServerToClientEvents[K]>
            >)
          );
        } catch (error) {
          console.error(
            `Error in listener for event ${String(event)}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      });
    }
  }

  public getConnectionState(): SocketConnectionState {
    return {
      ...this.connectionState,
      ...(this.extendedState as unknown as Record<string, unknown>),
    } as SocketConnectionState;
  }
  public getSocket(): Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null {
    return this.socket;
  }
  public joinSession(sessionId: string): void {
    this.emit('joinSession', { sessionId } as Parameters<
      ClientToServerEvents['joinSession']
    >[0]);
  }
  public updateResilienceConfig(cfg: Partial<ResilienceConfig>): void {
    this.resilienceConfig = { ...this.resilienceConfig, ...cfg };
  }
  /* istanbul ignore next */ private async checkNetworkStatus(): Promise<void> {
    const online =
      typeof navigator !== 'undefined'
        ? Boolean((navigator as unknown as { onLine?: boolean }).onLine)
        : true;
    this.extendedState.networkStatus.isOnline = online;
    this.emitStateChange();
    if (!online) return;
    if (typeof fetch === 'function') {
      try {
        await fetch('/ping', { method: 'HEAD' });
        this.extendedState.networkStatus.isOnline = true;
      } catch {
        this.extendedState.networkStatus.isOnline = false;
      }
      this.emitStateChange();
    }
  }
  private flushQueue(): void {
    if (!this.socket?.connected || this.messageQueue.length === 0) return;
    const pending = [...this.messageQueue] as AnyQueueItem[];
    this.messageQueue.length = 0;
    pending.forEach(item => this.emitQueued(item));
  }
  private emitQueued<K extends keyof ClientToServerEvents>(
    item: QueueItem<K>
  ): void {
    if (!this.socket) return;
    this.socket.emit(item.event, ...item.args);
  }
  private scheduleReconnect(): void {
    if (
      this.reconnectionAttempts >= this.resilienceConfig.maxReconnectionAttempts
    )
      return;
    const base = this.resilienceConfig.initialReconnectionDelay;
    const jitter = this.resilienceConfig.reconnectionDelayJitter;
    const delay = base + (jitter ? Math.floor(Math.random() * jitter) : 0);
    this.reconnectionAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export default SocketService.getInstance();
