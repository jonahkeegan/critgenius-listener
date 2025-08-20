/**
 * AssemblyAI Client Implementation
 * Provides comprehensive client with error handling, retry logic, and connection resilience
 * for the CritGenius Listener real-time transcription system.
 */

import {
  AssemblyAI,
  RealtimeTranscriber,
  RealtimeTranscript,
} from 'assemblyai';
import {
  AssemblyAIConfig,
  loadAssemblyAIConfig,
  AssemblyAIConfigError,
  getConfigSummary,
} from '../config/assemblyai.js';

/**
 * Error types for AssemblyAI operations
 */
export class AssemblyAIClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AssemblyAIClientError';
  }
}

export class AssemblyAIConnectionError extends AssemblyAIClientError {
  constructor(message: string, code?: string) {
    super(message, code, undefined, true);
    this.name = 'AssemblyAIConnectionError';
  }
}

export class AssemblyAIRateLimitError extends AssemblyAIClientError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', 429, true);
    this.name = 'AssemblyAIRateLimitError';
  }
}

export class AssemblyAIAuthError extends AssemblyAIClientError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401, false);
    this.name = 'AssemblyAIAuthError';
  }
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Jitter factor to randomize retry timing */
  jitterFactor: number;
}

/**
 * Connection state tracking
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Event types emitted by the client
 */
export interface ClientEvents {
  'connection-state': (state: ConnectionState) => void;
  transcript: (transcript: RealtimeTranscript) => void;
  error: (error: AssemblyAIClientError) => void;
  'session-begins': (sessionId: string) => void;
  'session-terminated': () => void;
  'retry-attempt': (attempt: number, delay: number) => void;
  'rate-limit': (retryAfter: number) => void;
}

/**
 * Statistics tracking for monitoring
 */
export interface ClientStats {
  /** Total number of connection attempts */
  connectionAttempts: number;
  /** Number of successful connections */
  successfulConnections: number;
  /** Total number of retry attempts */
  retryAttempts: number;
  /** Number of transcripts received */
  transcriptsReceived: number;
  /** Total audio chunks sent */
  audioChunksSent: number;
  /** Average latency in milliseconds */
  averageLatency: number;
  /** Connection uptime in milliseconds */
  uptime: number;
  /** Last error encountered */
  lastError?: AssemblyAIClientError;
  /** Connection state history */
  stateHistory: Array<{ state: ConnectionState; timestamp: number }>;
}

/**
 * AssemblyAI Client with comprehensive error handling and retry logic
 */
export class AssemblyAIClient {
  private config: AssemblyAIConfig;
  private client: AssemblyAI;
  private transcriber: RealtimeTranscriber | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private retryConfig: RetryConfig;
  private stats: ClientStats;
  private eventListeners: Map<
    keyof ClientEvents,
    Set<ClientEvents[keyof ClientEvents]>
  > = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionStartTime: number = 0;
  private audioQueue: Buffer[] = [];
  private isProcessingQueue = false;

  constructor(config?: Partial<AssemblyAIConfig>) {
    try {
      this.config = config
        ? { ...loadAssemblyAIConfig(), ...config }
        : loadAssemblyAIConfig();
    } catch (error) {
      throw new AssemblyAIConfigError(
        `Failed to initialize AssemblyAI client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    this.client = new AssemblyAI({
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
    });

    this.retryConfig = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelay,
      maxDelay: this.config.maxRetryDelay,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
    };

    this.stats = {
      connectionAttempts: 0,
      successfulConnections: 0,
      retryAttempts: 0,
      transcriptsReceived: 0,
      audioChunksSent: 0,
      averageLatency: 0,
      uptime: 0,
      stateHistory: [],
    };

    this.initializeEventListeners();
    this.logConfigSummary();
  }

  /**
   * Initialize event listeners map
   */
  private initializeEventListeners(): void {
    const eventTypes: (keyof ClientEvents)[] = [
      'connection-state',
      'transcript',
      'error',
      'session-begins',
      'session-terminated',
      'retry-attempt',
      'rate-limit',
    ];

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, new Set());
    });
  }

  /**
   * Log configuration summary for debugging
   */
  private logConfigSummary(): void {
    if (this.config.debug) {
      console.log('[AssemblyAI Client] Configuration loaded (details omitted)');
    }
  }

  /**
   * Add event listener
   */
  public on<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<K extends keyof ClientEvents>(
    event: K,
    ...args: Parameters<ClientEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as (...a: Parameters<ClientEvents[K]>) => void)(...args);
        } catch (error: unknown) {
          console.error(
            `[AssemblyAI Client] Error in ${String(event)} listener:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      });
    }
  }

  /**
   * Update connection state and emit event
   */
  private updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      const previousState = this.connectionState;
      this.connectionState = newState;

      this.stats.stateHistory.push({
        state: newState,
        timestamp: Date.now(),
      });

      // Keep only last 100 state changes
      if (this.stats.stateHistory.length > 100) {
        this.stats.stateHistory = this.stats.stateHistory.slice(-100);
      }

      if (this.config.debug) {
        console.log(
          `[AssemblyAI Client] State transition: ${previousState} -> ${newState}`
        );
      }

      this.emit('connection-state', newState);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay =
      this.retryConfig.initialDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    const clampedDelay = Math.min(baseDelay, this.retryConfig.maxDelay);
    const jitter = clampedDelay * this.retryConfig.jitterFactor * Math.random();
    return Math.floor(clampedDelay + jitter);
  }

  /**
   * Connect to AssemblyAI real-time transcription service with retry logic
   */
  public async connect(): Promise<void> {
    if (
      this.connectionState === ConnectionState.CONNECTED ||
      this.connectionState === ConnectionState.CONNECTING
    ) {
      return;
    }

    this.updateConnectionState(ConnectionState.CONNECTING);
    this.stats.connectionAttempts++;
    this.connectionStartTime = Date.now();

    let lastError: AssemblyAIClientError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.updateConnectionState(ConnectionState.RECONNECTING);
          const delay = this.calculateRetryDelay(attempt - 1);

          this.stats.retryAttempts++;
          this.emit('retry-attempt', attempt, delay);

          if (this.config.debug) {
            console.log(
              `[AssemblyAI Client] Retry attempt ${attempt}/${this.retryConfig.maxRetries} in ${delay}ms`
            );
          }

          await this.sleep(delay);
        }

        await this.establishConnection();
        this.stats.successfulConnections++;
        this.updateConnectionState(ConnectionState.CONNECTED);

        if (this.config.debug) {
          console.log(
            '[AssemblyAI Client] Successfully connected to real-time transcription service'
          );
        }

        return;
      } catch (error) {
        lastError = this.normalizeError(error);

        if (this.config.debug) {
          console.error(
            `[AssemblyAI Client] Connection attempt ${attempt + 1} failed:`,
            lastError.message
          );
        }

        // Handle rate limiting — policy: wait, then surface to caller (no auto-retry)
        // Rationale:
        // 1) Respect server-provided backoff to avoid immediate hammering.
        // 2) Keep client behavior deterministic; let the caller orchestrate when to retry.
        // 3) Communicate the cooling-off window via 'rate-limit' event so upstream can schedule.
        if (lastError instanceof AssemblyAIRateLimitError) {
          const retryAfter =
            lastError.retryAfter || this.calculateRetryDelay(attempt);
          this.emit('rate-limit', retryAfter);

          // Optionally log for debugging
          if (this.config.debug) {
            console.warn(
              `[AssemblyAI Client] Rate limited. Respecting backoff for ${retryAfter}ms before failing`
            );
          }

          // Wait for the advised backoff window before surfacing the error
          await this.sleep(retryAfter);

          // Update error state and surface
          this.updateConnectionState(ConnectionState.ERROR);
          this.stats.lastError = lastError;
          this.emit('error', lastError);
          throw lastError;
        }

        // Don't retry on non-retryable errors
        if (!lastError.retryable) {
          break;
        }
        // For retryable errors, the backoff before next attempt is handled at the top of the loop
      }
    }

    this.updateConnectionState(ConnectionState.ERROR);
    if (lastError) {
      this.stats.lastError = lastError;
    }

    const errorToThrow =
      lastError ||
      new AssemblyAIClientError('Connection failed after all retry attempts');
    this.emit('error', errorToThrow);
    throw errorToThrow;
  }

  /**
   * Establish connection to AssemblyAI service
   */
  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new AssemblyAIConnectionError(
            `Connection timeout after ${this.config.connectionTimeout}ms`,
            'CONNECTION_TIMEOUT'
          )
        );
      }, this.config.connectionTimeout);

      try {
        this.transcriber = this.client.realtime.transcriber({
          ...this.config.transcriptionConfig,
          sampleRate: this.config.audioConfig.sampleRate,
          wordBoost: this.config.transcriptionConfig.customVocabulary,
        });

        // Start the connection first so external mocks that depend on call order work
        const maybePromise = this.transcriber.connect();
        if (
          maybePromise &&
          typeof (maybePromise as Promise<unknown>).catch === 'function'
        ) {
          (maybePromise as Promise<unknown>).catch(err => {
            clearTimeout(timeout);
            const clientError = this.normalizeError(err);
            reject(clientError);
          });
        }

        // Register listeners after initiating connection
        this.transcriber.on('open', ({ sessionId }) => {
          clearTimeout(timeout);
          this.emit('session-begins', sessionId);
          resolve();
        });

        this.transcriber.on('transcript', transcript => {
          this.stats.transcriptsReceived++;
          this.emit('transcript', transcript);
        });

        this.transcriber.on('error', error => {
          clearTimeout(timeout);
          const clientError = this.normalizeError(error);
          reject(clientError);
        });

        this.transcriber.on('close', () => {
          clearTimeout(timeout);
          this.emit('session-terminated');
          this.updateConnectionState(ConnectionState.DISCONNECTED);
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(this.normalizeError(error));
      }
    });
  }

  /**
   * Send audio data for transcription
   */
  public async sendAudio(audioData: Buffer): Promise<void> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      if (
        this.config.performance.enableBatching &&
        this.audioQueue.length < this.config.performance.maxQueueSize
      ) {
        this.audioQueue.push(audioData);
        this.processAudioQueue();
        return;
      } else {
        throw new AssemblyAIClientError(
          'Client not connected. Call connect() first.'
        );
      }
    }

    if (!this.transcriber) {
      throw new AssemblyAIClientError('Transcriber not initialized');
    }

    try {
      // Convert Buffer to ArrayBuffer for AssemblyAI SDK compatibility
      const arrayBuffer = audioData.buffer.slice(
        audioData.byteOffset,
        audioData.byteOffset + audioData.byteLength
      );
      this.transcriber.sendAudio(arrayBuffer);
      this.stats.audioChunksSent++;
    } catch (error) {
      const clientError = this.normalizeError(error);
      this.emit('error', clientError);
      throw clientError;
    }
  }

  /**
   * Process queued audio data when connection is restored
   */
  private async processAudioQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (
        this.audioQueue.length > 0 &&
        this.connectionState === ConnectionState.CONNECTED
      ) {
        const audioData = this.audioQueue.shift();
        if (audioData && this.transcriber) {
          // Convert Buffer to ArrayBuffer for AssemblyAI SDK compatibility
          const arrayBuffer = audioData.buffer.slice(
            audioData.byteOffset,
            audioData.byteOffset + audioData.byteLength
          );
          this.transcriber.sendAudio(arrayBuffer);
          this.stats.audioChunksSent++;

          // Small delay to prevent overwhelming the service
          await this.sleep(10);
        }
      }
    } catch (error) {
      const clientError = this.normalizeError(error);
      this.emit('error', clientError);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Disconnect from the service
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.transcriber) {
      try {
        await this.transcriber.close();
      } catch (error) {
        if (this.config.debug) {
          console.warn('[AssemblyAI Client] Error during disconnect:', error);
        }
      }
      this.transcriber = null;
    }

    this.audioQueue = [];
    this.updateConnectionState(ConnectionState.DISCONNECTED);

    // Update uptime statistics
    if (this.connectionStartTime > 0) {
      this.stats.uptime += Date.now() - this.connectionStartTime;
      this.connectionStartTime = 0;
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get client statistics
   */
  public getStats(): ClientStats {
    const currentStats = { ...this.stats };

    // Calculate current uptime if connected
    if (
      this.connectionState === ConnectionState.CONNECTED &&
      this.connectionStartTime > 0
    ) {
      currentStats.uptime += Date.now() - this.connectionStartTime;
    }

    return currentStats;
  }

  /**
   * Get current configuration
   */
  public getConfig(): AssemblyAIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AssemblyAIConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update retry configuration
    this.retryConfig = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelay,
      maxDelay: this.config.maxRetryDelay,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
    };

    if (this.config.debug) {
      console.log(
        '[AssemblyAI Client] Configuration updated (details omitted)'
      );
    }
  }

  /**
   * Normalize errors to consistent format
   */
  private normalizeError(error: unknown): AssemblyAIClientError {
    if (error instanceof AssemblyAIClientError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error types based on message content
      // Check rate limit first as it's more specific
      if (
        error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests')
      ) {
        return new AssemblyAIRateLimitError(error.message);
      }

      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        return new AssemblyAIAuthError(
          `Authentication failed: ${error.message}`
        );
      }

      if (
        error.message.includes('network') ||
        error.message.includes('connection')
      ) {
        return new AssemblyAIConnectionError(error.message);
      }

      return new AssemblyAIClientError(
        error.message,
        'UNKNOWN_ERROR',
        undefined,
        true
      );
    }

    return new AssemblyAIClientError(
      'Unknown error occurred',
      'UNKNOWN_ERROR',
      undefined,
      true
    );
  }

  /**
   * Utility function for sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, unknown>;
  }> {
    const stats = this.getStats();
    const healthy =
      this.connectionState === ConnectionState.CONNECTED && !stats.lastError;

    return {
      healthy,
      details: {
        connectionState: this.connectionState,
        stats: stats,
        config: getConfigSummary(this.config),
      },
    };
  }
}

/**
 * Factory function to create configured AssemblyAI client
 */
export function createAssemblyAIClient(
  config?: Partial<AssemblyAIConfig>
): AssemblyAIClient {
  return new AssemblyAIClient(config);
}
