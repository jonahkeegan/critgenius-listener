import { appendFileSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRequire } from 'node:module';

import {
  EnvironmentDetector,
  type ExecutionEnvironment,
} from './environment-detector.js';

const require = createRequire(import.meta.url);
const { isWindowsReservedName, getReservedNameError } =
  require('../../../../scripts/utils/windows-reserved-names.cjs') as {
    isWindowsReservedName: (filename: string) => boolean;
    getReservedNameError: (filename: string) => string | null;
  };

export type PathInput = string | URL;
export type ValidatedPathInput = string;

export interface DiagnosticConfig {
  enabled: boolean;
  logLevel: LogLevel;
  captureStackTraces: boolean;
  outputFile?: string;
  stackFrameLimit?: number;
}

export interface PathNormalizationContext {
  operation: string;
  inputType: string;
  inputValue: string;
  stackTrace: string[];
  timestamp: number;
  environment: ExecutionEnvironment;
  environmentInfo: Readonly<Record<string, string>>;
}

export interface PathValidationResult {
  isValid: boolean;
  normalizedPath: string;
  errors: string[];
  warnings: string[];
  context: PathNormalizationContext;
  originalError?: Error;
}

export class PathValidationError extends TypeError {
  readonly context: PathNormalizationContext;
  readonly originalError?: Error;

  constructor(
    message: string,
    context: PathNormalizationContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'PathValidationError';
    this.context = context;
    if (originalError) {
      this.originalError = originalError;
    }
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const FILE_PROTOCOL_PREFIX = 'file:';
const DEFAULT_STACK_FRAME_LIMIT = 12;

function isUrlInstance(value: unknown): value is URL {
  if (value instanceof URL) {
    return true;
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const tag = Object.prototype.toString.call(value);
  if (tag === '[object URL]') {
    return true;
  }

  const candidate = value as { href?: unknown; protocol?: unknown };
  return (
    typeof candidate.href === 'string' && typeof candidate.protocol === 'string'
  );
}

function toFileUrl(value: URL | { href?: unknown; protocol?: unknown }): URL {
  if (value instanceof URL) {
    return value;
  }

  if ('href' in value && typeof value.href === 'string') {
    return new URL(value.href);
  }

  return new URL(String(value));
}

function formatUrlForLogging(url: URL): string {
  const protocol = url.protocol || 'unknown:';
  const host = url.hostname || '';
  const sanitizedPath = url.pathname.startsWith('/')
    ? url.pathname.slice(1)
    : url.pathname;

  const hostSegment = host ? `${host}` : '';
  const separator = hostSegment && sanitizedPath ? '/' : '';
  return `URL(${protocol}//${hostSegment}${separator}${sanitizedPath})`;
}

function selectConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case 'debug':
      return console.debug.bind(console);
    case 'info':
      return console.info.bind(console);
    case 'warn':
      return console.warn.bind(console);
    case 'error':
      return console.error.bind(console);
    default:
      return console.log.bind(console);
  }
}

class DiagnosticLogger {
  private readonly buffer: string[] = [];

  constructor(private readonly config: DiagnosticConfig) {}

  log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.config.enabled || !this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, context);
    this.buffer.push(formatted);
    const consoleMethod = selectConsoleMethod(level);
    consoleMethod(formatted);
  }

  flush(): void {
    if (
      !this.config.enabled ||
      !this.config.outputFile ||
      this.buffer.length === 0
    ) {
      return;
    }

    const filePath = this.config.outputFile;
    if (!this.isOutputFileValid(filePath)) {
      this.buffer.length = 0;
      return;
    }

    mkdirSync(dirname(filePath), { recursive: true });
    appendFileSync(filePath, `${this.buffer.join('\n')}\n`, {
      encoding: 'utf8',
    });
    this.buffer.length = 0;
  }

  private isOutputFileValid(filePath: string): boolean {
    if (!filePath) {
      return false;
    }

    if (!isWindowsReservedName(filePath)) {
      return true;
    }

    const warning =
      getReservedNameError(filePath) ??
      `"${basename(filePath)}" cannot be used as a diagnostic output filename on Windows`;

    const consoleWarn = selectConsoleMethod('warn');
    consoleWarn(
      `[PathDiagnostics] Skipping diagnostic flush because the configured output file is invalid. ${warning}`
    );

    return false;
  }

  private shouldLog(level: LogLevel): boolean {
    const configuredLevel = this.config.logLevel ?? 'error';
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const parts = [
      `[${new Date().toISOString()}]`,
      level.toUpperCase(),
      message,
    ];

    if (context) {
      parts.push(JSON.stringify(context));
    }

    return parts.join(' ');
  }
}

export function captureStackTrace(
  depth: number = DEFAULT_STACK_FRAME_LIMIT
): string[] {
  const error = new Error('PathValidatorTrace');
  const stack = error.stack?.split('\n').slice(1) ?? [];
  return stack.slice(0, depth).map(frame => frame.trim());
}

export class PathValidator {
  private readonly logger: DiagnosticLogger;

  constructor(private readonly config: DiagnosticConfig) {
    this.logger = new DiagnosticLogger(config);
  }

  validate(input: PathInput, operation: string): PathValidationResult {
    const context = this.captureContext(operation, input);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const normalizedPath = this.normalizeInput(input, context);
      this.logger.log('debug', 'Path normalized successfully', {
        operation,
        normalizedPath,
        inputType: context.inputType,
      });

      return {
        isValid: true,
        normalizedPath,
        errors,
        warnings,
        context,
      };
    } catch (unknownError) {
      const error = this.toValidationError(unknownError, context);
      errors.push(error.message);
      this.logger.log('error', 'Path normalization failed', {
        operation,
        inputType: context.inputType,
        inputValue: context.inputValue,
        errors,
      });

      return {
        isValid: false,
        normalizedPath: '',
        errors,
        warnings,
        context: error.context,
        originalError: error.originalError ?? error,
      };
    } finally {
      this.logger.flush();
    }
  }

  isValidPath(input: unknown): input is PathInput {
    return typeof input === 'string' || isUrlInstance(input);
  }

  captureContext(operation: string, input: unknown): PathNormalizationContext {
    return {
      operation,
      inputType: this.detectInputType(input),
      inputValue: this.sanitizeForLogging(input),
      stackTrace: [],
      timestamp: Date.now(),
      environment: EnvironmentDetector.detect(),
      environmentInfo: EnvironmentDetector.getEnvironmentInfo(),
    };
  }

  private normalizeInput(
    input: PathInput,
    context: PathNormalizationContext
  ): string {
    if (isUrlInstance(input)) {
      if (this.config.captureStackTraces) {
        context.stackTrace = captureStackTrace(this.config.stackFrameLimit);
      }

      const fileUrl = toFileUrl(input);
      this.assertFileUrl(fileUrl, context);
      return fileURLToPath(fileUrl.toString());
    }

    if (typeof input !== 'string') {
      throw new PathValidationError(
        `Path input must be a string or URL. Received type: ${typeof input}`,
        context
      );
    }

    const trimmedInput = input.trim();

    if (trimmedInput === '') {
      throw new PathValidationError(
        'Path input cannot be an empty string',
        context
      );
    }

    if (trimmedInput.startsWith(FILE_PROTOCOL_PREFIX)) {
      try {
        const url = new URL(trimmedInput);
        this.assertFileUrl(url, context);
        if (this.config.captureStackTraces && context.stackTrace.length === 0) {
          context.stackTrace = captureStackTrace(this.config.stackFrameLimit);
        }
        return fileURLToPath(url.toString());
      } catch (error) {
        throw new PathValidationError(
          `Invalid file URL path input: ${input}`,
          context,
          error instanceof Error ? error : undefined
        );
      }
    }

    return trimmedInput;
  }

  private detectInputType(input: unknown): string {
    if (isUrlInstance(input)) {
      return 'url';
    }

    return typeof input;
  }

  private sanitizeForLogging(input: unknown): string {
    if (isUrlInstance(input)) {
      const url = toFileUrl(input);
      return formatUrlForLogging(url);
    }

    if (typeof input === 'string') {
      if (input.length <= 200) {
        return input;
      }
      return `${input.slice(0, 197)}...`;
    }

    if (input === null) {
      return 'null';
    }

    if (input === undefined) {
      return 'undefined';
    }

    return JSON.stringify(input);
  }

  private toValidationError(
    unknownError: unknown,
    context: PathNormalizationContext
  ): PathValidationError {
    if (unknownError instanceof PathValidationError) {
      return unknownError;
    }

    const message =
      unknownError instanceof Error
        ? unknownError.message
        : String(unknownError);
    return new PathValidationError(
      message,
      context,
      unknownError instanceof Error ? unknownError : undefined
    );
  }

  private assertFileUrl(url: URL, context: PathNormalizationContext): void {
    if (url.protocol !== FILE_PROTOCOL_PREFIX) {
      throw new PathValidationError(
        `Only file URLs are supported for path validation. Received protocol: ${url.protocol || 'unknown'}`,
        context
      );
    }

    if (url.pathname === '' || url.pathname === '/') {
      throw new PathValidationError(
        `Invalid file URL path input: ${url.toString()}`,
        context
      );
    }
  }
}

export function createPathValidator(config: DiagnosticConfig): PathValidator {
  return new PathValidator(config);
}
