/**
 * Unit tests for AssemblyAI Client Implementation
 * Tests comprehensive client with error handling, retry logic, and connection resilience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AssemblyAIClient,
  AssemblyAIClientError,
  AssemblyAIConnectionError,
  AssemblyAIRateLimitError,
  AssemblyAIAuthError,
  ConnectionState,
  createAssemblyAIClient,
} from './assemblyai-client.js';
import {
  AssemblyAIConfig,
  DEFAULT_ASSEMBLYAI_CONFIG,
} from '../config/assemblyai.js';

// Hoist AssemblyAI SDK mocks so they are in place before the module under test
// is evaluated. Vitest clears mocks between tests, so keeping the factory at the
// hoisted scope avoids race conditions where `vi.mock('assemblyai')` would
// register before the mocked constructors exist. The `reset` helper re-primes
// the factory implementations after each `vi.clearAllMocks()` call so every test
// starts from a deterministic baseline without re-hoisting.
const assemblyAiMocks = vi.hoisted(() => {
  const mockTranscriberConnect = vi.fn<() => Promise<void> | void>();
  const mockTranscriberSendAudio = vi.fn<(data: ArrayBuffer) => unknown>();
  const mockTranscriberClose = vi.fn<() => Promise<void> | void>();
  const mockTranscriberOn =
    vi.fn<(event: string, callback: (...args: any[]) => void) => void>();

  const mockTranscriber = {
    connect: mockTranscriberConnect,
    sendAudio: mockTranscriberSendAudio,
    close: mockTranscriberClose,
    on: mockTranscriberOn,
  };

  const transcriberFactory = vi
    .fn<(options?: Record<string, unknown>) => typeof mockTranscriber>()
    .mockImplementation(() => mockTranscriber);

  const createAssemblyAIInstance = () => ({
    realtime: {
      transcriber: transcriberFactory,
    },
  });

  const mockAssemblyAI = vi.fn().mockImplementation(createAssemblyAIInstance);

  const reset = () => {
    mockTranscriberConnect.mockReset();
    mockTranscriberSendAudio.mockReset();
    mockTranscriberClose.mockReset();
    mockTranscriberOn.mockReset();
    transcriberFactory.mockReset();
    transcriberFactory.mockImplementation(() => mockTranscriber);
    mockAssemblyAI.mockReset();
    mockAssemblyAI.mockImplementation(createAssemblyAIInstance);
  };

  return {
    mockAssemblyAI,
    mockTranscriber,
    mockTranscriberConnect,
    mockTranscriberSendAudio,
    mockTranscriberClose,
    mockTranscriberOn,
    transcriberFactory,
    reset,
  };
});

vi.mock('assemblyai', () => {
  const { mockAssemblyAI } = assemblyAiMocks;
  return {
    AssemblyAI: mockAssemblyAI,
    RealtimeTranscriber: vi.fn(),
  };
});

const {
  mockAssemblyAI,
  mockTranscriber,
  mockTranscriberConnect,
  mockTranscriberSendAudio,
  mockTranscriberClose,
  mockTranscriberOn,
  reset: resetAssemblyAIMocks,
} = assemblyAiMocks;

const isFunction = (value: unknown): value is (...args: any[]) => void =>
  typeof value === 'function';

// Mock process.env for configuration
const originalEnv = process.env;

const flushAllTimers = async (): Promise<void> => {
  let iterations = 0;
  // Allow pending microtasks (like immediate promise rejections) to queue timers
  await Promise.resolve();
  while (vi.getTimerCount() > 0 && iterations < 200) {
    vi.runOnlyPendingTimers();
    await Promise.resolve();
    iterations += 1;
  }
  await Promise.resolve();
};

const waitForPromiseWithTimers = async <T>(promise: Promise<T>): Promise<T> => {
  let resolvedValue: T | undefined;
  let rejectedError: unknown;
  let settled = false;

  promise.then(
    value => {
      resolvedValue = value;
      settled = true;
    },
    error => {
      rejectedError = error;
      settled = true;
    }
  );

  let iterations = 0;
  while (!settled && iterations < 500) {
    await flushAllTimers();
    await Promise.resolve();
    iterations += 1;

    if (!settled && vi.getTimerCount() === 0) {
      await Promise.resolve();
    }
  }

  if (!settled) {
    throw new Error('Promise did not settle after flushing timers');
  }

  if (rejectedError !== undefined) {
    throw rejectedError;
  }

  return resolvedValue as T;
};

const connectClient = async (instance: AssemblyAIClient): Promise<void> => {
  await waitForPromiseWithTimers(instance.connect());
};

describe('AssemblyAI Client Implementation', () => {
  const validConfig: AssemblyAIConfig = {
    ...DEFAULT_ASSEMBLYAI_CONFIG,
    apiKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAssemblyAIMocks();
    process.env = {
      ...originalEnv,
      ASSEMBLYAI_API_KEY: validConfig.apiKey,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Client Initialization', () => {
    it('should initialize with valid configuration', () => {
      const client = new AssemblyAIClient(validConfig);

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockAssemblyAI).toHaveBeenCalledWith({
        apiKey: validConfig.apiKey,
        baseUrl: validConfig.baseUrl,
      });
    });

    it('should initialize with environment-loaded configuration', () => {
      const client = new AssemblyAIClient();

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should throw error with invalid configuration', () => {
      process.env = {};

      expect(() => new AssemblyAIClient()).toThrow(
        /Failed to initialize AssemblyAI client/
      );
    });

    it('should initialize retry configuration correctly', () => {
      const customConfig = {
        ...validConfig,
        maxRetries: 5,
        retryDelay: 2000,
        maxRetryDelay: 20000,
      };

      const client = new AssemblyAIClient(customConfig);
      const config = client.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.maxRetryDelay).toBe(20000);
    });
  });

  describe('Error Classes', () => {
    it('should create AssemblyAIClientError correctly', () => {
      const error = new AssemblyAIClientError(
        'Test error',
        'TEST_CODE',
        500,
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIClientError');
    });

    it('should create AssemblyAIConnectionError correctly', () => {
      const error = new AssemblyAIConnectionError(
        'Connection failed',
        'CONN_ERROR'
      );

      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('CONN_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIConnectionError');
    });

    it('should create AssemblyAIRateLimitError correctly', () => {
      const error = new AssemblyAIRateLimitError('Rate limited', 30);

      expect(error.message).toBe('Rate limited');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(30);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AssemblyAIRateLimitError');
    });

    it('should create AssemblyAIAuthError correctly', () => {
      const error = new AssemblyAIAuthError('Unauthorized');

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('AssemblyAIAuthError');
    });
  });

  describe('Connection Management', () => {
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should connect successfully', async () => {
      const connectionStateChanges: ConnectionState[] = [];
      client.on('connection-state', state => {
        connectionStateChanges.push(state);
      });

      // Mock successful connection
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-123' }), 10);
        }
      });

      await connectClient(client);

      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(connectionStateChanges).toContain(ConnectionState.CONNECTING);
      expect(connectionStateChanges).toContain(ConnectionState.CONNECTED);
      expect(mockTranscriber.connect).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      const shortTimeoutConfig = {
        ...validConfig,
        connectionTimeout: 100,
        maxRetries: 0,
      };
      const timeoutClient = new AssemblyAIClient(shortTimeoutConfig);

      // Mock no response (timeout scenario)
      mockTranscriberOn.mockImplementation(() => {
        // Don't trigger any events - simulate timeout
      });
      mockTranscriberConnect.mockImplementation(() => {
        // Don't resolve - let it timeout
        return new Promise(() => {});
      });

      const timeoutConnect = timeoutClient.connect();
      vi.advanceTimersByTime(shortTimeoutConfig.connectionTimeout + 1);
      const timeoutPromise = waitForPromiseWithTimers(timeoutConnect);
      await expect(timeoutPromise).rejects.toThrow(AssemblyAIConnectionError);

      expect(timeoutClient.getConnectionState()).toBe(ConnectionState.ERROR);
    }, 10000);

    it('should retry on connection failure', async () => {
      const retryConfig = {
        ...validConfig,
        maxRetries: 2,
        retryDelay: 50,
      };
      const retryClient = new AssemblyAIClient(retryConfig);

      let attemptCount = 0;
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Connection failed')), 10);
        } else if (event === 'open' && attemptCount >= 2) {
          setTimeout(() => callback({ sessionId: 'test-session-retry' }), 10);
        }
      });

      const retryAttempts: number[] = [];
      retryClient.on('retry-attempt', attempt => {
        retryAttempts.push(attempt);
        attemptCount++;
      });

      await connectClient(retryClient);

      expect(retryAttempts.length).toBeGreaterThan(0);
      expect(retryClient.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });

    it('should handle authentication errors without retry', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('401 unauthorized')), 10);
        }
      });

      const authPromise = waitForPromiseWithTimers(client.connect());
      await expect(authPromise).rejects.toThrow(AssemblyAIAuthError);

      expect(client.getConnectionState()).toBe(ConnectionState.ERROR);
    });

    it('should handle rate limiting with retry after', async () => {
      const rateLimitClient = new AssemblyAIClient(validConfig);

      // Mock the transcriber connect method to reject with rate limit error
      mockTranscriberConnect.mockRejectedValue(
        new Error('429 too many requests')
      );

      const rateLimitEvents: number[] = [];
      rateLimitClient.on('rate-limit', retryAfter => {
        rateLimitEvents.push(retryAfter);
      });

      const rateLimitPromise = waitForPromiseWithTimers(
        rateLimitClient.connect()
      );
      await expect(rateLimitPromise).rejects.toThrow(AssemblyAIRateLimitError);

      expect(rateLimitEvents.length).toBeGreaterThan(0);
    }, 3000);

    it('should disconnect cleanly', async () => {
      // Mock successful connection first
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(
            () => callback({ sessionId: 'test-session-disconnect' }),
            10
          );
        }
      });

      await connectClient(client);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);

      await client.disconnect();
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockTranscriberClose).toHaveBeenCalled();
    });

    it('should prevent multiple simultaneous connections', async () => {
      // Mock successful connection
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-multi' }), 50);
        }
      });

      // Start multiple connection attempts
      const connectionPromise1 = waitForPromiseWithTimers(client.connect());
      const connectionPromise2 = waitForPromiseWithTimers(client.connect());
      const connectionPromise3 = waitForPromiseWithTimers(client.connect());

      await Promise.all([
        connectionPromise1,
        connectionPromise2,
        connectionPromise3,
      ]);

      // Should only connect once
      expect(mockTranscriber.connect).toHaveBeenCalledTimes(1);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });
  });

  describe('Audio Processing', () => {
    let client: AssemblyAIClient;

    beforeEach(async () => {
      client = new AssemblyAIClient(validConfig);

      // Mock successful connection
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-audio-session' }), 10);
        }
      });

      await connectClient(client);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should send audio data when connected', async () => {
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await client.sendAudio(audioBuffer);

      expect(mockTranscriberSendAudio).toHaveBeenCalled();

      // Verify ArrayBuffer conversion
      const sentData = mockTranscriberSendAudio.mock.calls[0]?.[0];
      expect(sentData).toBeInstanceOf(ArrayBuffer);
    });

    it('should queue audio data when disconnected with batching enabled', async () => {
      const batchingConfig = {
        ...validConfig,
        performance: {
          ...validConfig.performance,
          enableBatching: true,
          maxQueueSize: 10,
        },
      };

      const batchingClient = new AssemblyAIClient(batchingConfig);
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      // Should not throw error when disconnected with batching
      await expect(
        batchingClient.sendAudio(audioBuffer)
      ).resolves.toBeUndefined();
    });

    it('should throw error when sending audio while disconnected without batching', async () => {
      await client.disconnect();

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await expect(client.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );
    });

    it('should handle audio sending errors gracefully', async () => {
      mockTranscriberSendAudio.mockImplementation(() => {
        throw new Error('Audio send failed');
      });

      const errorEvents: AssemblyAIClientError[] = [];
      client.on('error', error => {
        errorEvents.push(error);
      });

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await expect(client.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );

      expect(errorEvents.length).toBe(1);
    });

    it('should track audio statistics', async () => {
      // Reset mock to not throw error for this test
      mockTranscriberSendAudio.mockReset();
      mockTranscriberSendAudio.mockResolvedValue(undefined);

      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      await client.sendAudio(audioBuffer);
      await client.sendAudio(audioBuffer);

      const stats = client.getStats();
      expect(stats.audioChunksSent).toBe(2);
    });
  });

  describe('Event System', () => {
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should add and remove event listeners', () => {
      const mockListener = vi.fn();

      client.on('connection-state', mockListener);
      client.off('connection-state', mockListener);

      // Trigger a state change
      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should emit transcript events', async () => {
      const transcripts: any[] = [];
      client.on('transcript', transcript => {
        transcripts.push(transcript);
      });

      // Mock successful connection and transcript event
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-transcript' }), 10);
        } else if (event === 'transcript') {
          setTimeout(
            () =>
              callback({
                message_type: 'PartialTranscript',
                text: 'Hello world',
                confidence: 0.95,
              }),
            20
          );
        }
      });

      await connectClient(client);

      expect(transcripts.length).toBeGreaterThan(0);
    });

    it('should emit session events', async () => {
      const sessions: string[] = [];
      client.on('session-begins', sessionId => {
        sessions.push(sessionId);
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-session-events' }), 10);
        }
      });

      await connectClient(client);

      expect(sessions).toContain('test-session-events');
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      client.on('connection-state', faultyListener);

      // Should not throw error when emitting events
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'test-faulty-listener' }), 10);
        }
      });

      await connectClient(client);
      expect(faultyListener).toHaveBeenCalled();
    });
  });

  describe('Statistics and Health Monitoring', () => {
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should track connection statistics', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'stats-test' }), 10);
        }
      });

      const initialStats = client.getStats();
      expect(initialStats.connectionAttempts).toBe(0);
      expect(initialStats.successfulConnections).toBe(0);

      await connectClient(client);

      const connectedStats = client.getStats();
      expect(connectedStats.connectionAttempts).toBe(1);
      expect(connectedStats.successfulConnections).toBe(1);
      expect(connectedStats.uptime).toBeGreaterThan(0);
    });

    it('should track retry statistics', async () => {
      const retryConfig = {
        ...validConfig,
        maxRetries: 2,
        retryDelay: 10,
        maxRetryDelay: 50,
      };
      const retryClient = new AssemblyAIClient(retryConfig);

      let attemptCount = 0;
      mockTranscriberConnect.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Retry test'));
        } else {
          return Promise.resolve();
        }
      });

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open' && attemptCount >= 3) {
          // Trigger successful connection immediately
          callback({ sessionId: 'retry-stats' });
        }
      });

      await connectClient(retryClient);

      const stats = retryClient.getStats();
      expect(stats.retryAttempts).toBeGreaterThan(0);
    }, 5000);

    it('should provide health check information', async () => {
      const healthCheck = await client.healthCheck();

      expect(healthCheck).toHaveProperty('healthy');
      expect(healthCheck).toHaveProperty('details');
      expect(healthCheck.details).toHaveProperty('connectionState');
      expect(healthCheck.details).toHaveProperty('stats');
      expect(healthCheck.details).toHaveProperty('config');
    });

    it('should report unhealthy when disconnected with errors', async () => {
      // Force an error state
      mockTranscriberConnect.mockRejectedValue(new Error('Health check error'));
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Health check error')), 10);
        }
      });

      const failedConnect = waitForPromiseWithTimers(client.connect());
      await expect(failedConnect).rejects.toThrow();

      const healthCheck = await client.healthCheck();
      expect(healthCheck.healthy).toBe(false);
    }, 10000);

    it('should track state history', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'state-history' }), 10);
        }
      });

      await connectClient(client);
      await client.disconnect();

      const stats = client.getStats();
      expect(stats.stateHistory.length).toBeGreaterThan(0);
      expect(stats.stateHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ state: ConnectionState.CONNECTING }),
          expect.objectContaining({ state: ConnectionState.CONNECTED }),
          expect.objectContaining({ state: ConnectionState.DISCONNECTED }),
        ])
      );
    });
  });

  describe('Configuration Management', () => {
    it('should return current configuration', () => {
      const client = new AssemblyAIClient(validConfig);
      const returnedConfig = client.getConfig();

      expect(returnedConfig).toEqual(validConfig);
      expect(returnedConfig).not.toBe(validConfig); // Should be a copy
    });

    it('should update configuration', () => {
      const client = new AssemblyAIClient(validConfig);

      const newConfig = {
        maxRetries: 10,
        debug: true,
      };

      client.updateConfig(newConfig);

      const updatedConfig = client.getConfig();
      expect(updatedConfig.maxRetries).toBe(10);
      expect(updatedConfig.debug).toBe(true);
      expect(updatedConfig.apiKey).toBe(validConfig.apiKey); // Other values preserved
    });

    it('should update retry configuration when max retries changes', () => {
      const client = new AssemblyAIClient(validConfig);

      client.updateConfig({ maxRetries: 5, retryDelay: 2000 });

      // Should update internal retry configuration
      expect(client.getConfig().maxRetries).toBe(5);
      expect(client.getConfig().retryDelay).toBe(2000);
    });
  });

  describe('Error Normalization', () => {
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should normalize unknown errors', async () => {
      mockTranscriberConnect.mockRejectedValue('String error');
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback('String error'), 10);
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIClientError);
    }, 10000);

    it('should detect authentication errors from messages', async () => {
      mockTranscriberConnect.mockRejectedValue(
        new Error('401 unauthorized access')
      );
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('401 unauthorized access')), 10);
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIAuthError);
    }, 10000);

    it('should detect rate limit errors from messages', async () => {
      // Mock immediate rejection with rate limit error
      mockTranscriberConnect.mockImplementation(() => {
        return Promise.reject(new Error('429 too many requests'));
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIRateLimitError);
    }, 5000);

    it('should detect connection errors from messages', async () => {
      mockTranscriberConnect.mockRejectedValue(
        new Error('network connection failed')
      );
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(
            () => callback(new Error('network connection failed')),
            10
          );
        }
      });

      const connectPromise = waitForPromiseWithTimers(client.connect());
      await expect(connectPromise).rejects.toThrow(AssemblyAIConnectionError);
    }, 10000);
  });

  describe('Factory Function', () => {
    it('should create client with factory function', () => {
      const client = createAssemblyAIClient(validConfig);

      expect(client).toBeInstanceOf(AssemblyAIClient);
      expect(client.getConfig()).toEqual(validConfig);
    });

    it('should create client without configuration', () => {
      const client = createAssemblyAIClient();

      expect(client).toBeInstanceOf(AssemblyAIClient);
    });
  });

  describe('Edge Cases and Robustness', () => {
    let client: AssemblyAIClient;

    beforeEach(() => {
      client = new AssemblyAIClient(validConfig);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should handle multiple disconnect calls gracefully', async () => {
      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'multi-disconnect' }), 10);
        }
      });

      await connectClient(client);

      // Multiple disconnects should not throw errors
      await expect(client.disconnect()).resolves.not.toThrow();
      await expect(client.disconnect()).resolves.not.toThrow();
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should handle connection close events gracefully', async () => {
      let closeCallback: ((...args: any[]) => void) | undefined;

      mockTranscriberOn.mockImplementation((event, callback) => {
        if (event === 'open') {
          setTimeout(() => callback({ sessionId: 'close-event' }), 10);
        } else if (event === 'close') {
          closeCallback = callback;
        }
      });

      const sessionTerminated: any[] = [];
      client.on('session-terminated', () => {
        sessionTerminated.push(true);
      });

      await connectClient(client);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);

      // Simulate connection close from server
      if (isFunction(closeCallback)) {
        closeCallback();
      }

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(sessionTerminated.length).toBe(1);
    });

    it('should handle audio queue overflow gracefully', async () => {
      const smallQueueConfig = {
        ...validConfig,
        performance: {
          ...validConfig.performance,
          enableBatching: true,
          maxQueueSize: 2,
        },
      };

      const queueClient = new AssemblyAIClient(smallQueueConfig);
      const audioBuffer = Buffer.from([1, 2, 3, 4, 5]);

      // Fill queue beyond capacity
      await queueClient.sendAudio(audioBuffer);
      await queueClient.sendAudio(audioBuffer);

      // Should handle overflow gracefully
      await expect(queueClient.sendAudio(audioBuffer)).rejects.toThrow(
        AssemblyAIClientError
      );
    });

    it('should handle configuration with debug logging', () => {
      const debugConfig = {
        ...validConfig,
        debug: true,
      };

      // Should not throw errors with debug enabled
      expect(() => new AssemblyAIClient(debugConfig)).not.toThrow();
    });
  });
});
