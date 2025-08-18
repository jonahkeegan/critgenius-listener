/**
 * @fileoverview Enhanced Socket.IO client service for CritGenius Listener
 * Provides typed real-time communication with advanced connection resilience
 */

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, SocketConnectionState } from '../types/socket';

// Enhanced connection resilience configuration
interface ResilienceConfig {
  maxReconnectionAttempts: number;
  initialReconnectionDelay: number;
  maxReconnectionDelay: number;
  reconnectionDelayJitter: number;
  exponentialBackoffFactor: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  networkCheckInterval: number;
  messageQueueMaxSize: number;
  messageRetryAttempts: number;
  messageRetryDelay: number;
}

// Queued message structure for offline handling
interface QueuedMessage {
  event: string;
  args: any[];
  timestamp: number;
  retryCount: number;
  id: string;
}

// Network status monitoring
interface NetworkStatus {
  isOnline: boolean;
  lastChecked: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: SocketConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null
  };
  private listeners: Map<keyof ServerToClientEvents, ((...args: any[]) => void)[]> = new Map();
  private resilienceConfig: ResilienceConfig;
  private reconnectionAttempts: number = 0;
  private reconnectionDelay: number = 0;
  private messageQueue: QueuedMessage[] = [];
  private isProcessingQueue: boolean = false;
  private networkStatus: NetworkStatus = {
    isOnline: true,
    lastChecked: Date.now(),
    connectionQuality: 'excellent'
  };
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private networkCheckTimer: NodeJS.Timeout | null = null;
  private connectionTimeoutTimer: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;

  private constructor() {
    // Initialize resilience configuration with smart defaults
    this.resilienceConfig = {
      maxReconnectionAttempts: 10,
      initialReconnectionDelay: 1000,
      maxReconnectionDelay: 30000,
      reconnectionDelayJitter: 1000,
      exponentialBackoffFactor: 2,
      connectionTimeout: 20000,
      heartbeatInterval: 25000,
      heartbeatTimeout: 5000,
      networkCheckInterval: 5000,
      messageQueueMaxSize: 100,
      messageRetryAttempts: 3,
      messageRetryDelay: 1000
    };
    
    // Start network monitoring
    this.startNetworkMonitoring();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Enhanced connection with resilience features
   */
  public connect(sessionId?: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (sessionId) {
      this.sessionId = sessionId;
    }

    console.log('Attempting to connect to Socket.IO server with enhanced resilience...');
    this.connectionState.isConnecting = true;
    this.emitStateChange();

    // Clear any existing connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
    }

    // Set connection timeout
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.connectionState.isConnecting && !this.connectionState.isConnected) {
        console.warn('Socket connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.resilienceConfig.connectionTimeout);

    // Create socket connection with enhanced configuration
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: false, // We handle reconnection manually for better control
      timeout: this.resilienceConfig.connectionTimeout,
      withCredentials: true,
      // Add query parameters for session tracking
      query: this.sessionId ? { sessionId: this.sessionId } : {}
    });

    // Set up enhanced event listeners
    this.setupEnhancedEventListeners();
  }

  /**
   * Enhanced disconnection with cleanup
   */
  public disconnect(): void {
    console.log('Disconnecting Socket.IO connection...');
    
    // Clear all timers
    this.clearAllTimers();
    
    // Process any remaining queued messages with error
    this.processQueueWithError('Connection closed');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.reconnectionAttempts = 0;
    this.emitStateChange();
  }

  /**
   * Enhanced event listener setup with resilience features
   */
  private setupEnhancedEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('📱 Socket.IO connected:', this.socket?.id);
      
      // Clear connection timeout
      if (this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer);
        this.connectionTimeoutTimer = null;
      }
      
      // Reset reconnection attempts on successful connection
      this.reconnectionAttempts = 0;
      this.reconnectionDelay = 0;
      
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.error = null;
      
      // Start heartbeat monitoring
      this.startHeartbeatMonitoring();
      
      // Process any queued messages
      this.processMessageQueue();
      
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📴 Socket.IO disconnected:', reason);
      
      // Clear heartbeat monitoring
      this.stopHeartbeatMonitoring();
      
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      
      // Handle different disconnection reasons
      if (reason === 'io server disconnect') {
        // Server actively disconnected, don't attempt to reconnect
        console.log('Server initiated disconnection, not reconnecting');
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnection
        console.log('Client initiated disconnection');
      } else {
        // Network issue, attempt to reconnect
        this.attemptReconnection();
      }
      
      this.emitStateChange();
      this.emitToInternalListeners('connectionStatus', 'disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      
      // Clear connection timeout
      if (this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer);
        this.connectionTimeoutTimer = null;
      }
      
      this.handleConnectionError(error);
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

  /**
   * Enhanced connection error handling with smart reconnection
   */
  private handleConnectionError(error: Error): void {
    console.error('Socket connection error:', error);
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.connectionState.error = error.message;
    
    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    
    this.emitStateChange();
    this.attemptReconnection();
  }

  /**
   * Smart reconnection with exponential backoff and jitter
   */
  private attemptReconnection(): void {
    if (this.reconnectionAttempts >= this.resilienceConfig.maxReconnectionAttempts) {
      console.error('Max reconnection attempts reached, giving up');
      this.connectionState.error = 'Failed to reconnect after maximum attempts';
      this.emitStateChange();
      return;
    }

    // Calculate next reconnection delay with exponential backoff and jitter
    if (this.reconnectionDelay === 0) {
      this.reconnectionDelay = this.resilienceConfig.initialReconnectionDelay;
    } else {
      this.reconnectionDelay = Math.min(
        this.reconnectionDelay * this.resilienceConfig.exponentialBackoffFactor,
        this.resilienceConfig.maxReconnectionDelay
      );
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.resilienceConfig.reconnectionDelayJitter;
    const nextDelay = this.reconnectionDelay + jitter;

    this.reconnectionAttempts++;
    console.log(`Reconnection attempt ${this.reconnectionAttempts}/${this.resilienceConfig.maxReconnectionAttempts} in ${Math.round(nextDelay)}ms`);

    // Schedule reconnection
    setTimeout(() => {
      if (this.networkStatus.isOnline) {
        console.log('Attempting to reconnect...');
        this.connect(this.sessionId || undefined);
      } else {
        console.log('Network offline, delaying reconnection');
        // Try again when network comes back online
        const networkCheck = setInterval(() => {
          if (this.networkStatus.isOnline) {
            clearInterval(networkCheck);
            this.connect(this.sessionId || undefined);
          }
        }, 1000);
      }
    }, nextDelay);
  }

  /**
   * Enhanced emit with message queuing for offline handling
   */
  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    // If connected, send immediately
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
      return;
    }

    // If not connected, queue the message
    if (this.messageQueue.length >= this.resilienceConfig.messageQueueMaxSize) {
      console.warn('Message queue full, dropping oldest message');
      this.messageQueue.shift();
    }

    const queuedMessage: QueuedMessage = {
      event: event as string,
      args,
      timestamp: Date.now(),
      retryCount: 0,
      id: Math.random().toString(36).substr(2, 9)
    };

    this.messageQueue.push(queuedMessage);
    console.log(`Message queued (${this.messageQueue.length} in queue):`, event);
  }

  /**
   * Process queued messages when connection is restored
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.socket?.connected || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing ${this.messageQueue.length} queued messages...`);

    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queueCopy) {
      try {
        if (this.socket?.connected) {
          console.log('Sending queued message:', message.event);
          this.socket.emit(message.event, ...message.args);
        } else {
          // Connection lost during processing, re-queue
          this.messageQueue.push(message);
        }
      } catch (error) {
        console.error('Error sending queued message:', error);
        message.retryCount++;
        
        if (message.retryCount < this.resilienceConfig.messageRetryAttempts) {
          // Retry with delay
          setTimeout(() => {
            this.messageQueue.push(message);
            this.processMessageQueue();
          }, this.resilienceConfig.messageRetryDelay * message.retryCount);
        } else {
          console.error('Max retries exceeded for message:', message.event);
          this.emitToInternalListeners('error', {
            code: 'MESSAGE_SEND_FAILED',
            message: `Failed to send message after ${this.resilienceConfig.messageRetryAttempts} attempts`
          });
        }
      }
    }

    this.isProcessingQueue = false;
    console.log('Message queue processing complete');
  }

  /**
   * Process queue with error when connection is permanently lost
   */
  private processQueueWithError(errorMessage: string): void {
    if (this.messageQueue.length > 0) {
      console.warn(`Processing ${this.messageQueue.length} queued messages with error`);
      this.messageQueue.forEach(message => {
        this.emitToInternalListeners('error', {
          code: 'CONNECTION_LOST',
          message: `${errorMessage}: ${message.event}`
        });
      });
      this.messageQueue = [];
    }
  }

  /**
   * Enhanced listener management
   */
  public on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener as (...args: any[]) => void);
  }

  public off<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener as (...args: any[]) => void);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Enhanced state change emission
   */
  private emitStateChange(): void {
    this.emitToInternalListeners('connectionStatus', this.connectionState.isConnected ? 'connected' : 'disconnected');
  }

  /**
   * Enhanced internal listener emission with error handling
   */
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

  /**
   * Enhanced connection state with additional resilience info
   */
  public getConnectionState(): SocketConnectionState & {
    reconnectionAttempts: number;
    isProcessingQueue: boolean;
    queuedMessages: number;
    networkStatus: NetworkStatus;
  } {
    return {
      ...this.connectionState,
      reconnectionAttempts: this.reconnectionAttempts,
      isProcessingQueue: this.isProcessingQueue,
      queuedMessages: this.messageQueue.length,
      networkStatus: this.networkStatus
    };
  }

  /**
   * Get raw socket instance
   */
  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  /**
   * Network monitoring for enhanced resilience
   */
  private startNetworkMonitoring(): void {
    // Check network status periodically
    this.networkCheckTimer = setInterval(() => {
      this.checkNetworkStatus();
    }, this.resilienceConfig.networkCheckInterval);
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      // Simple network connectivity check
      const online = navigator.onLine;
      this.networkStatus.isOnline = online;
      this.networkStatus.lastChecked = Date.now();
      
      // Check connection quality by measuring response time
      if (online) {
        const start = performance.now();
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          await fetch('/health', { 
            method: 'HEAD', 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          const responseTime = performance.now() - start;
          
          // Determine connection quality based on response time
          if (responseTime < 100) {
            this.networkStatus.connectionQuality = 'excellent';
          } else if (responseTime < 300) {
            this.networkStatus.connectionQuality = 'good';
          } else if (responseTime < 1000) {
            this.networkStatus.connectionQuality = 'fair';
          } else {
            this.networkStatus.connectionQuality = 'poor';
          }
        } catch (error) {
          this.networkStatus.connectionQuality = 'poor';
        }
      } else {
        this.networkStatus.connectionQuality = 'offline';
      }
      
    } catch (error) {
      console.warn('Network status check failed:', error);
      this.networkStatus.isOnline = false;
      this.networkStatus.connectionQuality = 'offline';
    }
  }

  /**
   * Heartbeat monitoring for connection health
   */
  private startHeartbeatMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        // Send a ping to server to check connection health
        this.socket.timeout(this.resilienceConfig.heartbeatTimeout).emit('connectionStatus', 'connected', (err: any) => {
          if (err) {
            console.warn('Heartbeat failed, connection may be unstable:', err);
            // Don't disconnect immediately, let the natural disconnect handling take over
          } else {
            console.log('Heartbeat successful');
          }
        });
      }
    }, this.resilienceConfig.heartbeatInterval);
  }

  private stopHeartbeatMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear all timers for proper cleanup
   */
  private clearAllTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  /**
   * Update resilience configuration
   */
  public updateResilienceConfig(config: Partial<ResilienceConfig>): void {
    this.resilienceConfig = { ...this.resilienceConfig, ...config };
  }

  /**
   * Join a session with automatic reconnection handling
   */
  public joinSession(sessionId: string): void {
    this.sessionId = sessionId;
    if (this.socket?.connected) {
      this.emit('joinSession', { sessionId });
    } else {
      // Will be sent when connection is restored
      this.emit('joinSession', { sessionId });
    }
  }

  /**
   * Leave a session
   */
  public leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.emit('leaveSession', { sessionId });
    }
    // Clear session ID
    if (this.sessionId === sessionId) {
      this.sessionId = null;
    }
  }
}

export default SocketService.getInstance();
