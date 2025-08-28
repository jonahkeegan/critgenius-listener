/**
 * AssemblyAI Structured Logging and Monitoring Service
 * Provides comprehensive logging, metrics collection, and monitoring integration
 * for the CritGenius Listener AssemblyAI operations.
 */

import { AssemblyAIConfig } from '../config/assemblyai.js';
import { AssemblyAIClientError, ClientStats } from './assemblyai-client.js';

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  event: string;
  message: string;
  data?: Record<string, unknown>;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    retryable?: boolean;
  };
  performance?: {
    latency?: number;
    throughput?: number;
    queueSize?: number;
    memoryUsage?: number;
  };
  context?: {
    environment: string;
    version: string;
    nodeVersion: string;
    platform: string;
  };
}

/**
 * Metrics collection interface
 */
export interface MetricsCollector {
  /** Increment a counter metric */
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  /** Set a gauge metric value */
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  /** Record a histogram/timing metric */
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  /** Record a distribution metric */
  distribution(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void;
}

/**
 * Alerting interface for critical events
 */
export interface AlertingService {
  /** Send critical alert */
  sendAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    data?: Record<string, unknown>
  ): Promise<void>;
  /** Send performance alert */
  sendPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    data?: Record<string, unknown>
  ): Promise<void>;
  /** Send error alert with context */
  sendErrorAlert(
    error: AssemblyAIClientError,
    context?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * Log output interface for different destinations
 */
export interface LogOutput {
  /** Write log entry to destination */
  write(entry: LogEntry): Promise<void>;
  /** Flush any buffered logs */
  flush(): Promise<void>;
  /** Close the output connection */
  close(): Promise<void>;
}

/**
 * Console log output implementation
 */
export class ConsoleLogOutput implements LogOutput {
  private colorize: boolean;

  constructor(colorize: boolean = true) {
    this.colorize = colorize;
  }

  async write(entry: LogEntry): Promise<void> {
    const formatted = this.formatEntry(entry);
    console.log(formatted);
  }

  async flush(): Promise<void> {
    // Console doesn't require flushing
  }

  async close(): Promise<void> {
    // Console doesn't require closing
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = this.colorize
      ? this.colorizeLevel(entry.level)
      : entry.level.toUpperCase();
    const component = `[${entry.component}]`;
    const event = entry.event;
    const message = entry.message;

    let formatted = `${timestamp} ${level} ${component} ${event}: ${message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += ` | ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      formatted += ` | Error: ${entry.error.name}: ${entry.error.message}`;
    }

    if (entry.performance) {
      const perfData = Object.entries(entry.performance)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      formatted += ` | Performance: ${perfData}`;
    }

    return formatted;
  }

  private colorizeLevel(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    return `${colors[level]}${level.toUpperCase()}${reset}`;
  }
}

/**
 * JSON file log output implementation
 */
export class FileLogOutput implements LogOutput {
  private buffer: LogEntry[] = [];
  private filePath: string;
  private maxBufferSize: number;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    filePath: string,
    maxBufferSize: number = 100,
    autoFlushInterval: number = 5000
  ) {
    this.filePath = filePath;
    this.maxBufferSize = maxBufferSize;

    if (autoFlushInterval > 0) {
      this.flushInterval = setInterval(() => {
        this.flush().catch(console.error);
      }, autoFlushInterval);
    }
  }

  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const fs = await import('fs/promises');
      const content =
        entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.filePath, content);
    } catch (error) {
      console.error('Failed to write logs to file:', error);
      // Put entries back in buffer for retry
      this.buffer.unshift(...entries);
    }
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

/**
 * Simple in-memory metrics collector
 */
export class MemoryMetricsCollector implements MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(
    name: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  distribution(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    // Same as histogram for this simple implementation
    this.histogram(name, value, tags);
  }

  getMetrics(): Record<string, unknown> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      ),
    };
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return `${name}{${tagString}}`;
  }
}

/**
 * AssemblyAI Logger with comprehensive monitoring capabilities
 */
export class AssemblyAILogger {
  private outputs: LogOutput[] = [];
  private metricsCollector: MetricsCollector;
  private alertingService: AlertingService | undefined;
  private contextData: LogEntry['context'];
  private defaultTags: Record<string, string> = {};

  constructor(
    metricsCollector?: MetricsCollector,
    alertingService?: AlertingService
  ) {
    this.metricsCollector = metricsCollector || new MemoryMetricsCollector();
    this.alertingService = alertingService;
    this.contextData = {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.0',
      nodeVersion: process.version,
      platform: process.platform,
    };

    // Add console output by default
    this.addOutput(new ConsoleLogOutput());
  }

  /**
   * Add log output destination
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }

  /**
   * Set default tags for all metrics
   */
  setDefaultTags(tags: Record<string, string>): void {
    this.defaultTags = { ...this.defaultTags, ...tags };
  }

  /**
   * Log connection events
   */
  logConnection(
    event: 'connecting' | 'connected' | 'disconnected' | 'error',
    sessionId?: string,
    error?: AssemblyAIClientError,
    duration?: number
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.INFO;
    const data: Record<string, unknown> = { event };

    if (sessionId) data.sessionId = sessionId;
    if (duration) data.duration = duration;

    const logData: Partial<LogEntry> = { data };
    if (sessionId) logData.sessionId = sessionId;
    if (error) {
      const serializedError = this.serializeError(error);
      logData.error = serializedError;
    }
    if (duration) logData.duration = duration;

    this.log(
      level,
      'AssemblyAI-Connection',
      event,
      `Connection ${event}`,
      logData
    );

    // Record metrics
    this.metricsCollector.increment('assemblyai.connection.events', 1, {
      ...this.defaultTags,
      event,
      success: error ? 'false' : 'true',
    });

    if (duration) {
      this.metricsCollector.histogram(
        'assemblyai.connection.duration',
        duration,
        {
          ...this.defaultTags,
          event,
        }
      );
    }

    // Send alerts for critical connection issues
    if (error && !error.retryable && this.alertingService) {
      this.alertingService
        .sendErrorAlert(error, { event, sessionId })
        .catch(console.error);
    }
  }

  /**
   * Log transcription events
   */
  logTranscription(
    event:
      | 'transcript_received'
      | 'audio_sent'
      | 'session_begins'
      | 'session_terminated',
    sessionId?: string,
    transcriptData?: { text?: string; confidence?: number; words?: number },
    performance?: { latency?: number; throughput?: number }
  ): void {
    const data: Record<string, unknown> = { event };

    if (sessionId) data.sessionId = sessionId;
    if (transcriptData) data.transcript = transcriptData;

    this.log(
      LogLevel.INFO,
      'AssemblyAI-Transcription',
      event,
      `Transcription ${event}`,
      {
        data,
        ...(sessionId && { sessionId }),
        ...(performance && { performance }),
      }
    );

    // Record metrics
    this.metricsCollector.increment('assemblyai.transcription.events', 1, {
      ...this.defaultTags,
      event,
    });

    if (transcriptData?.confidence) {
      this.metricsCollector.histogram(
        'assemblyai.transcription.confidence',
        transcriptData.confidence,
        {
          ...this.defaultTags,
        }
      );
    }

    if (performance?.latency) {
      this.metricsCollector.histogram(
        'assemblyai.transcription.latency',
        performance.latency,
        {
          ...this.defaultTags,
        }
      );

      // Alert on high latency
      if (performance.latency > 500 && this.alertingService) {
        this.alertingService
          .sendPerformanceAlert(
            'transcription_latency',
            performance.latency,
            500,
            { event, sessionId }
          )
          .catch(console.error);
      }
    }

    if (performance?.throughput) {
      this.metricsCollector.gauge(
        'assemblyai.transcription.throughput',
        performance.throughput,
        {
          ...this.defaultTags,
        }
      );
    }
  }

  /**
   * Log retry attempts
   */
  logRetry(
    attempt: number,
    maxAttempts: number,
    delay: number,
    error?: AssemblyAIClientError
  ): void {
    const data = {
      attempt,
      maxAttempts,
      delay,
      error: error?.message,
    };

    const logData: Partial<LogEntry> = { data };
    if (error) logData.error = this.serializeError(error);

    this.log(
      LogLevel.WARN,
      'AssemblyAI-Retry',
      'retry_attempt',
      `Retry attempt ${attempt}/${maxAttempts} in ${delay}ms`,
      logData
    );

    this.metricsCollector.increment('assemblyai.retry.attempts', 1, {
      ...this.defaultTags,
      attempt: String(attempt),
    });

    this.metricsCollector.histogram('assemblyai.retry.delay', delay, {
      ...this.defaultTags,
    });
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(retryAfter: number, sessionId?: string): void {
    const data: Record<string, unknown> = { retryAfter };
    if (sessionId) data.sessionId = sessionId;

    const logData: Partial<LogEntry> = { data };
    if (sessionId) logData.sessionId = sessionId;

    this.log(
      LogLevel.WARN,
      'AssemblyAI-RateLimit',
      'rate_limited',
      `Rate limited, retry after ${retryAfter}ms`,
      logData
    );

    this.metricsCollector.increment(
      'assemblyai.ratelimit.events',
      1,
      this.defaultTags
    );
    this.metricsCollector.histogram(
      'assemblyai.ratelimit.delay',
      retryAfter,
      this.defaultTags
    );
  }

  /**
   * Log performance metrics
   */
  logPerformance(stats: ClientStats, sessionId?: string): void {
    const performance = {
      connectionAttempts: stats.connectionAttempts,
      successfulConnections: stats.successfulConnections,
      retryAttempts: stats.retryAttempts,
      transcriptsReceived: stats.transcriptsReceived,
      audioChunksSent: stats.audioChunksSent,
      averageLatency: stats.averageLatency,
      uptime: stats.uptime,
      successRate:
        stats.connectionAttempts > 0
          ? stats.successfulConnections / stats.connectionAttempts
          : 0,
    };

    const logData: Partial<LogEntry> = { data: performance };
    if (sessionId) logData.sessionId = sessionId;

    this.log(
      LogLevel.INFO,
      'AssemblyAI-Performance',
      'stats_update',
      'Performance statistics updated',
      logData
    );

    // Record all performance metrics
    Object.entries(performance).forEach(([key, value]) => {
      if (typeof value === 'number') {
        this.metricsCollector.gauge(
          `assemblyai.performance.${key}`,
          value,
          this.defaultTags
        );
      }
    });
  }

  /**
   * Log configuration changes
   */
  logConfigUpdate(changes: Partial<AssemblyAIConfig>): void {
    const sanitizedChanges = { ...changes };
    if (sanitizedChanges.apiKey) {
      sanitizedChanges.apiKey = '***REDACTED***';
    }

    this.log(
      LogLevel.INFO,
      'AssemblyAI-Config',
      'config_updated',
      'Configuration updated',
      {
        data: { changes: sanitizedChanges },
      }
    );

    this.metricsCollector.increment(
      'assemblyai.config.updates',
      1,
      this.defaultTags
    );
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel,
    component: string,
    event: string,
    message: string,
    additionalData?: Partial<LogEntry>
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      event,
      message,
      ...(this.contextData && { context: this.contextData }),
      ...additionalData,
    };

    // Write to all outputs
    const writePromises = this.outputs.map(output =>
      output
        .write(entry)
        .catch(error => console.error(`Failed to write to log output:`, error))
    );

    await Promise.all(writePromises);
  }

  /**
   * Serialize error for logging
   */
  private serializeError(
    error: AssemblyAIClientError
  ): NonNullable<LogEntry['error']> {
    const serialized: NonNullable<LogEntry['error']> = {
      name: error.name,
      message: error.message,
      retryable: error.retryable,
    };

    if (error.stack) serialized.stack = error.stack;
    if (error.code) serialized.code = error.code;

    return serialized;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, unknown> {
    if (this.metricsCollector instanceof MemoryMetricsCollector) {
      return this.metricsCollector.getMetrics();
    }
    return {};
  }

  /**
   * Flush all log outputs
   */
  async flush(): Promise<void> {
    const flushPromises = this.outputs.map(output =>
      output
        .flush()
        .catch(error => console.error('Failed to flush log output:', error))
    );
    await Promise.all(flushPromises);
  }

  /**
   * Close all log outputs
   */
  async close(): Promise<void> {
    const closePromises = this.outputs.map(output =>
      output
        .close()
        .catch(error => console.error('Failed to close log output:', error))
    );
    await Promise.all(closePromises);
  }
}

/**
 * Factory function to create configured logger
 */
export function createAssemblyAILogger(config?: {
  metricsCollector?: MetricsCollector;
  alertingService?: AlertingService;
  fileLogging?: { enabled: boolean; filePath: string };
  defaultTags?: Record<string, string>;
}): AssemblyAILogger {
  const logger = new AssemblyAILogger(
    config?.metricsCollector,
    config?.alertingService
  );

  if (config?.fileLogging?.enabled && config.fileLogging.filePath) {
    logger.addOutput(new FileLogOutput(config.fileLogging.filePath));
  }

  if (config?.defaultTags) {
    logger.setDefaultTags(config.defaultTags);
  }

  return logger;
}
