/**
 * @fileoverview Socket.IO client service for CritGenius Listener
 * Provides typed real-time communication between client and server
 */

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, SocketConnectionState } from '../types/socket';

class SocketService {
  private static instance: SocketService;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: SocketConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null
  };
  private listeners: Map<keyof ServerToClientEvents, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Attempting to connect to Socket.IO server...');
    this.connectionState.isConnecting = true;
    this.emitStateChange();

    // Create socket connection with proper configuration
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true
    });

    // Set up event listeners
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
      console.log('📱 Socket.IO connected:', this.socket?.id);
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.error = null;
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📴 Socket.IO disconnected:', reason);
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.connectionState.error = error.message;
      this.emitStateChange();
    });

    // Forward server events to local listeners
    this.socket.on('connectionStatus', (status) => {
      this.emitToInternalListeners('connectionStatus', status);
    });

    this.socket.on('processingUpdate', (data) => {
      this.emitToInternalListeners('processingUpdate', data);
    });

    this.socket.on('transcriptionUpdate', (data) => {
      this.emitToInternalListeners('transcriptionUpdate', data);
    });

    this.socket.on('error', (error) => {
      this.emitToInternalListeners('error', error);
    });
  }

  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected:', event);
    }
  }

  public on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener as Function);
  }

  public off<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener as Function);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitStateChange(): void {
    this.emitToInternalListeners('connectionStatus', this.connectionState.isConnected ? 'connected' : 'disconnected');
  }

  private emitToInternalListeners<K extends keyof ServerToClientEvents>(event: K, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in listener for event ${String(event)}:`, error);
        }
      });
    }
  }

  public getConnectionState(): SocketConnectionState {
    return { ...this.connectionState };
  }

  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

export default SocketService.getInstance();
