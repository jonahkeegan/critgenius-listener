/**
 * @fileoverview Socket.IO client service for CritGenius Listener
 * Provides typed real-time communication between client and server
 */

import { io, Socket } from 'socket.io-client';
import type { ManagerOptions, SocketOptions } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketConnectionState,
  SocketConnectionError,
  SocketResilienceErrorCode,
} from '../types/socket';
import { clientEnv } from '../config/environment';

type NodeHttpsModule = typeof import('node:https');

const nodeHttpsModulePromise: Promise<NodeHttpsModule> | null =
  typeof window === 'undefined'
    ? import(/* @vite-ignore */ 'node:https')
    : null;

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
  private pendingReconnectDelay: number | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private getListeners<K extends keyof ServerToClientEvents>(
    event: K
  ): Array<NonNullable<ServerToClientEvents[K]>> {
    return this.listeners[event] as Array<NonNullable<ServerToClientEvents[K]>>;
  }

  public connect(): void {
    if (this.socket?.connected) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingReconnectDelay = null;
    this.connectionState.isConnecting = true;
    this.emitStateChange();
    const url = clientEnv.CLIENT_SOCKET_URL || 'http://localhost:3001';
    const isHttps = url.startsWith('https://');
    const isNodeRuntime =
      typeof process !== 'undefined' &&
      typeof process.versions === 'object' &&
      typeof process.versions.node === 'string';
    const transports: ManagerOptions['transports'] =
      isNodeRuntime && isHttps ? ['websocket'] : ['websocket', 'polling'];
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
      transports,
      upgrade: true,
      rememberUpgrade: true,
      reconnection: false,
      timeout: 20000,
      withCredentials: true,
      ...(isHttps ? { secure: true } : {}),
    };
    if (isNodeRuntime && isHttps) {
      const initializeWithAgent = (httpsModule: NodeHttpsModule): void => {
        if (httpsModule.globalAgent.options.rejectUnauthorized !== true) {
          httpsModule.globalAgent.options.rejectUnauthorized = true;
        }
        this.establishSocketConnection(url, socketOptions);
      };

      if (nodeHttpsModulePromise) {
        nodeHttpsModulePromise
          .then(module => initializeWithAgent(module))
          .catch(error => {
            console.error('Failed to load HTTPS module for Socket.IO:', error);
            this.establishSocketConnection(url, socketOptions);
          });
        return;
      }
    }

    this.establishSocketConnection(url, socketOptions);
  }

  private establishSocketConnection(
    url: string,
    options: Partial<ManagerOptions & SocketOptions>
  ): void {
    this.socket = io(url, options);
    this.setupEventListeners();
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingReconnectDelay = null;
    this.reconnectionAttempts = 0;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.connectionState.error = null;
    this.emitStateChange();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.error = null;
      this.pendingReconnectDelay = null;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.reconnectionAttempts = 0;
      this.emitStateChange();
      this.flushQueue();
    });
    this.socket.on('disconnect', () => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.emitStateChange();
      void this.checkNetworkStatus();
      const delay = this.scheduleReconnect();
      if (delay === null) {
        this.connectionState.isConnecting = false;
        this.emitStateChange();
      }
    });
    this.socket.on('connect_error', error => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      const preferredDelay = this.computeReconnectDelay();
      const retryDelay = this.scheduleReconnect(preferredDelay);
      this.connectionState.error = this.mapConnectionError(
        error,
        retryDelay ?? undefined
      );
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
  private computeReconnectDelay(): number {
    const base = Math.max(this.resilienceConfig.initialReconnectionDelay, 0);
    const jitter = Math.max(this.resilienceConfig.reconnectionDelayJitter, 0);
    if (!jitter) {
      return base;
    }
    return base + Math.floor(Math.random() * jitter);
  }

  private mapConnectionError(
    error: unknown,
    retryInMs?: number | null
  ): SocketConnectionError {
    const fallback = 'Unknown socket connection error';
    const baseMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : fallback;
    const description =
      error && typeof error === 'object' && 'description' in error
        ? (error as { description?: unknown }).description
        : undefined;
    const descriptionMessage =
      typeof description === 'string'
        ? description
        : description &&
            typeof description === 'object' &&
            'message' in description &&
            typeof (description as { message?: unknown }).message === 'string'
          ? String((description as { message?: unknown }).message)
          : undefined;
    const message = descriptionMessage
      ? `${baseMessage}: ${descriptionMessage}`
      : baseMessage;
    const normalized = message.toLowerCase();
    let code: SocketResilienceErrorCode = 'UNKNOWN_ERROR';
    if (
      normalized.includes('self signed certificate') ||
      normalized.includes('unable to verify') ||
      normalized.includes('certificate') ||
      normalized.includes('tls')
    ) {
      code = 'TLS_HANDSHAKE_FAILED';
    } else if (normalized.includes('timeout')) {
      code = 'CONNECTION_TIMEOUT';
    } else if (
      normalized.includes('econnrefused') ||
      normalized.includes('connection refused')
    ) {
      code = 'CONNECTION_REFUSED';
    } else if (!this.extendedState.networkStatus.isOnline) {
      code = 'NETWORK_OFFLINE';
    }

    const retryDelay =
      typeof retryInMs === 'number' && retryInMs >= 0 ? retryInMs : undefined;

    return {
      code,
      message,
      timestamp: Date.now(),
      ...(retryDelay !== undefined ? { retryInMs: retryDelay } : {}),
    };
  }

  private scheduleReconnect(preferredDelay?: number): number | null {
    if (this.connectionState.isConnected) {
      return null;
    }

    if (this.reconnectTimer) {
      return this.pendingReconnectDelay;
    }

    if (
      this.reconnectionAttempts >= this.resilienceConfig.maxReconnectionAttempts
    ) {
      return null;
    }

    const delay =
      typeof preferredDelay === 'number' && preferredDelay >= 0
        ? preferredDelay
        : this.computeReconnectDelay();

    this.reconnectionAttempts += 1;
    this.pendingReconnectDelay = delay;
    this.connectionState.isConnecting = true;
    this.emitStateChange();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.pendingReconnectDelay = null;

      if (!this.socket) {
        this.connect();
        return;
      }

      try {
        this.socket.connect();
      } catch {
        this.connectionState.isConnecting = false;
        this.scheduleReconnect();
      }
    }, delay);

    return delay;
  }
}

export default SocketService.getInstance();
