/**
 * Unit tests for AssemblyAI Logger Implementation
 * Tests structured logging and monitoring integration for AssemblyAI operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock file system modules
vi.mock('fs/promises', () => ({
  appendFile: vi.fn(),
}));

import {
  AssemblyAILogger,
  LogLevel,
  LogEntry,
  MetricsCollector,
  AlertingService,
  ConsoleLogOutput,
  FileLogOutput,
  MemoryMetricsCollector,
  createAssemblyAILogger,
} from './assemblyai-logger.js';
import { AssemblyAIClientError, ClientStats } from './assemblyai-client.js';

describe('AssemblyAI Logger Implementation', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Logger Initialization', () => {
    it('should initialize with default console output', () => {
      const logger = new AssemblyAILogger();
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });

    it('should initialize with custom metrics collector', () => {
      const mockMetrics: MetricsCollector = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };

      const logger = new AssemblyAILogger(mockMetrics);
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });

    it('should initialize with alerting service', () => {
      const mockAlerting: AlertingService = {
        sendAlert: vi.fn(),
        sendPerformanceAlert: vi.fn(),
        sendErrorAlert: vi.fn(),
      };

      const logger = new AssemblyAILogger(undefined, mockAlerting);
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });
  });

  describe('Connection Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log connection events', () => {
      logger.logConnection('connecting', 'session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /AssemblyAI-Connection.*connecting.*Connection connecting/
        )
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.connection.events',
        1,
        expect.objectContaining({ event: 'connecting', success: 'true' })
      );
    });

    it('should log connection errors', () => {
      const error = new AssemblyAIClientError(
        'Connection failed',
        'CONN_ERROR'
      );
      logger.logConnection('error', 'session-123', error);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection error')
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.connection.events',
        1,
        expect.objectContaining({ event: 'error', success: 'false' })
      );
    });

    it('should log connection duration', () => {
      logger.logConnection('connected', 'session-123', undefined, 1500);

      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.connection.duration',
        1500,
        expect.objectContaining({ event: 'connected' })
      );
    });

    it('should send error alerts for non-retryable errors', async () => {
      const mockAlerting: AlertingService = {
        sendAlert: vi.fn(),
        sendPerformanceAlert: vi.fn(),
        sendErrorAlert: vi.fn().mockResolvedValue(undefined),
      };

      const alertLogger = new AssemblyAILogger(mockMetrics, mockAlerting);
      const error = new AssemblyAIClientError(
        'Auth failed',
        'AUTH_ERROR',
        401,
        false
      );

      alertLogger.logConnection('error', 'session-123', error);

      // Wait for async alert
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAlerting.sendErrorAlert).toHaveBeenCalledWith(error, {
        event: 'error',
        sessionId: 'session-123',
      });
    });
  });

  describe('Transcription Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log transcription events', () => {
      logger.logTranscription('transcript_received', 'session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/AssemblyAI-Transcription.*transcript_received/)
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.transcription.events',
        1,
        expect.objectContaining({ event: 'transcript_received' })
      );
    });

    it('should log transcript confidence metrics', () => {
      const transcriptData = {
        text: 'Hello world',
        confidence: 0.95,
        words: 2,
      };
      logger.logTranscription(
        'transcript_received',
        'session-123',
        transcriptData
      );

      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.transcription.confidence',
        0.95,
        expect.any(Object)
      );
    });

    it('should log performance metrics', () => {
      const performance = { latency: 150, throughput: 1000 };
      logger.logTranscription(
        'transcript_received',
        'session-123',
        undefined,
        performance
      );

      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.transcription.latency',
        150,
        expect.any(Object)
      );
      expect(mockMetrics.gauge).toHaveBeenCalledWith(
        'assemblyai.transcription.throughput',
        1000,
        expect.any(Object)
      );
    });

    it('should send alerts for high latency', async () => {
      const mockAlerting: AlertingService = {
        sendAlert: vi.fn(),
        sendPerformanceAlert: vi.fn().mockResolvedValue(undefined),
        sendErrorAlert: vi.fn(),
      };

      const alertLogger = new AssemblyAILogger(mockMetrics, mockAlerting);
      const performance = { latency: 750 }; // Above 500ms threshold

      alertLogger.logTranscription(
        'transcript_received',
        'session-123',
        undefined,
        performance
      );

      // Wait for async alert
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAlerting.sendPerformanceAlert).toHaveBeenCalledWith(
        'transcription_latency',
        750,
        500,
        { event: 'transcript_received', sessionId: 'session-123' }
      );
    });
  });

  describe('Retry Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log retry attempts', () => {
      const error = new AssemblyAIClientError('Connection timeout');
      logger.logRetry(2, 3, 2000, error);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 2/3 in 2000ms')
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.retry.attempts',
        1,
        expect.objectContaining({ attempt: '2' })
      );
      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.retry.delay',
        2000,
        expect.any(Object)
      );
    });

    it('should log retry attempts without error', () => {
      logger.logRetry(1, 3, 1000);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/3 in 1000ms')
      );
    });
  });

  describe('Rate Limiting Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log rate limiting events', () => {
      logger.logRateLimit(30000, 'session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limited, retry after 30000ms')
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.ratelimit.events',
        1,
        expect.any(Object)
      );
      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.ratelimit.delay',
        30000,
        expect.any(Object)
      );
    });
  });

  describe('Performance Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log performance statistics', () => {
      const stats: ClientStats = {
        connectionAttempts: 5,
        successfulConnections: 4,
        retryAttempts: 2,
        transcriptsReceived: 100,
        audioChunksSent: 500,
        averageLatency: 150,
        uptime: 30000,
        stateHistory: [],
      };

      logger.logPerformance(stats, 'session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance statistics updated')
      );

      // Verify all performance metrics are recorded
      expect(mockMetrics.gauge).toHaveBeenCalledWith(
        'assemblyai.performance.connectionAttempts',
        5,
        expect.any(Object)
      );
      expect(mockMetrics.gauge).toHaveBeenCalledWith(
        'assemblyai.performance.successfulConnections',
        4,
        expect.any(Object)
      );
      expect(mockMetrics.gauge).toHaveBeenCalledWith(
        'assemblyai.performance.successRate',
        0.8, // 4/5
        expect.any(Object)
      );
    });
  });

  describe('Configuration Logging', () => {
    let logger: AssemblyAILogger;
    let mockMetrics: MetricsCollector;

    beforeEach(() => {
      mockMetrics = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };
      logger = new AssemblyAILogger(mockMetrics);
    });

    it('should log configuration updates', () => {
      const changes = { maxRetries: 5, debug: true };
      logger.logConfigUpdate(changes);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration updated')
      );
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'assemblyai.config.updates',
        1,
        expect.any(Object)
      );
    });

    it('should redact sensitive configuration data', () => {
      const changes = { apiKey: 'secret-key-123', maxRetries: 5 };
      logger.logConfigUpdate(changes);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('***REDACTED***')
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('secret-key-123')
      );
    });
  });

  describe('ConsoleLogOutput', () => {
    it('should format log entries correctly', async () => {
      const output = new ConsoleLogOutput(false); // No colors
      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        component: 'TestComponent',
        event: 'test_event',
        message: 'Test message',
      };

      await output.write(entry);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '2023-01-01T00:00:00.000Z INFO [TestComponent] test_event: Test message'
      );
    });

    it('should include data in formatted output', async () => {
      const output = new ConsoleLogOutput(false);
      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: LogLevel.WARN,
        component: 'TestComponent',
        event: 'test_event',
        message: 'Test message',
        data: { key: 'value', count: 42 },
      };

      await output.write(entry);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value","count":42}')
      );
    });
  });

  describe('MemoryMetricsCollector', () => {
    let collector: MemoryMetricsCollector;

    beforeEach(() => {
      collector = new MemoryMetricsCollector();
    });

    it('should collect counter metrics', () => {
      collector.increment('test_counter', 1);
      collector.increment('test_counter', 3);

      const metrics = collector.getMetrics();
      expect(metrics).toHaveProperty('counters');
      expect((metrics as any).counters.test_counter).toBe(4);
    });

    it('should collect gauge metrics', () => {
      collector.gauge('test_gauge', 10);
      collector.gauge('test_gauge', 15);

      const metrics = collector.getMetrics();
      expect(metrics).toHaveProperty('gauges');
      expect((metrics as any).gauges.test_gauge).toBe(15);
    });

    it('should collect histogram metrics', () => {
      collector.histogram('test_histogram', 100);
      collector.histogram('test_histogram', 200);
      collector.histogram('test_histogram', 150);

      const metrics = collector.getMetrics();
      expect(metrics).toHaveProperty('histograms');

      const histogramData = (metrics as any).histograms.test_histogram;
      expect(histogramData.count).toBe(3);
      expect(histogramData.sum).toBe(450);
      expect(histogramData.avg).toBe(150);
      expect(histogramData.min).toBe(100);
      expect(histogramData.max).toBe(200);
    });

    it('should handle tags in metric names', () => {
      collector.increment('requests', 1, {
        endpoint: '/api/v1',
        method: 'GET',
      });
      collector.increment('requests', 2, {
        endpoint: '/api/v2',
        method: 'POST',
      });

      const metrics = collector.getMetrics();
      const counters = (metrics as any).counters;

      expect(counters['requests{endpoint=/api/v1,method=GET}']).toBe(1);
      expect(counters['requests{endpoint=/api/v2,method=POST}']).toBe(2);
    });
  });

  describe('Factory Function', () => {
    it('should create logger with default configuration', () => {
      const logger = createAssemblyAILogger();
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });

    it('should create logger with file logging enabled', () => {
      const config = {
        fileLogging: { enabled: true, filePath: '/tmp/test.log' },
      };

      const logger = createAssemblyAILogger(config);
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });

    it('should create logger with custom metrics collector', () => {
      const mockMetrics: MetricsCollector = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };

      const config = {
        metricsCollector: mockMetrics,
        defaultTags: { environment: 'test' },
      };

      const logger = createAssemblyAILogger(config);
      expect(logger).toBeInstanceOf(AssemblyAILogger);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow logging', async () => {
      const mockMetrics: MetricsCollector = {
        increment: vi.fn(),
        gauge: vi.fn(),
        histogram: vi.fn(),
        distribution: vi.fn(),
      };

      const logger = new AssemblyAILogger(mockMetrics);

      // Simulate a complete connection and transcription workflow
      logger.logConnection('connecting', 'session-abc');
      logger.logConnection('connected', 'session-abc', undefined, 1200);
      logger.logTranscription('session_begins', 'session-abc');
      logger.logTranscription(
        'transcript_received',
        'session-abc',
        { text: 'Hello world', confidence: 0.95 },
        { latency: 120 }
      );
      logger.logConnection('disconnected', 'session-abc');

      // Verify metrics were collected
      expect(mockMetrics.increment).toHaveBeenCalledTimes(5); // 3 connection + 2 transcription events
      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.connection.duration',
        1200,
        expect.any(Object)
      );
      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'assemblyai.transcription.confidence',
        0.95,
        expect.any(Object)
      );
    });

    it('should handle error scenarios gracefully', () => {
      const logger = new AssemblyAILogger();

      // Should not throw errors for edge cases
      expect(() => {
        logger.logConnection('error', 'session-123', undefined);
        logger.logTranscription('transcript_received', undefined);
        logger.logRetry(1, 3, 0);
        logger.logRateLimit(0);
      }).not.toThrow();
    });
  });
});
