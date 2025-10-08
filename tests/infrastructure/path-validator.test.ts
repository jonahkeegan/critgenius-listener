import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EnvironmentDetector,
  captureStackTrace,
  createPathValidator,
  PathValidationError,
  type DiagnosticConfig,
} from '@critgenius/test-utils/diagnostics';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      LOCAL_DEV?: string;
    }
  }
}

const baseConfig: DiagnosticConfig = {
  enabled: false,
  logLevel: 'error',
  captureStackTraces: false,
};

const WINDOWS_DRIVE_PATH = 'C:/temp/example.ts';
const WINDOWS_UNC_PATH = '\\shared\\folder\\file.mjs';

function createValidator(overrides: Partial<DiagnosticConfig> = {}) {
  return createPathValidator({ ...baseConfig, ...overrides });
}

describe('PathValidator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.LOCAL_DEV;
  });

  it('accepts plain string paths without modification', () => {
    const validator = createValidator();
    const result = validator.validate('src/index.ts', 'test-case');
    expect(result.isValid).toBe(true);
    expect(result.normalizedPath).toBe('src/index.ts');
  });

  it('converts file URL objects to filesystem paths', () => {
    const validator = createValidator();
    const fileUrl = pathToFileURL(join(tmpdir(), 'file.ts'));
    const result = validator.validate(fileUrl, 'file-url');
    expect(result.isValid).toBe(true);
    expect(result.normalizedPath).toBe(fileURLToPath(fileUrl));
    expect(result.context.inputType).toBe('url');
  });

  it('converts file protocol strings to filesystem paths', () => {
    const validator = createValidator();
    const pathString = pathToFileURL(join(tmpdir(), 'file.ts')).toString();
    const result = validator.validate(pathString, 'file-protocol');
    expect(result.isValid).toBe(true);
    expect(result.normalizedPath).toBe(fileURLToPath(pathString));
  });

  it('returns invalid result for empty path strings', () => {
    const validator = createValidator();
    const result = validator.validate('   ', 'empty');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('cannot be an empty string');
  });

  it('returns invalid result for non-string inputs', () => {
    const validator = createValidator();
    const result = validator.validate(123 as unknown as string, 'invalid-type');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('string or URL');
  });

  it('marks Windows drive letter paths as valid', () => {
    const validator = createValidator();
    const result = validator.validate(WINDOWS_DRIVE_PATH, 'windows-drive');
    expect(result.isValid).toBe(true);
    expect(result.normalizedPath).toBe(WINDOWS_DRIVE_PATH);
  });

  it('marks Windows UNC paths as valid', () => {
    const validator = createValidator();
    const result = validator.validate(WINDOWS_UNC_PATH, 'windows-unc');
    expect(result.isValid).toBe(true);
    expect(result.normalizedPath).toBe(WINDOWS_UNC_PATH);
  });

  it('captures stack traces when configured and URL input is provided', () => {
    const validator = createValidator({
      enabled: true,
      captureStackTraces: true,
      logLevel: 'debug',
    });
    const fileUrl = pathToFileURL(join(tmpdir(), 'file.ts'));
    const result = validator.validate(fileUrl, 'trace-url');
    expect(result.isValid).toBe(true);
    expect(result.context.stackTrace.length).toBeGreaterThan(0);
  });

  it('respects stack frame limits when provided', () => {
    const validator = createValidator({
      enabled: true,
      captureStackTraces: true,
      stackFrameLimit: 2,
      logLevel: 'debug',
    });
    const fileUrl = pathToFileURL(join(tmpdir(), 'file.ts'));
    const result = validator.validate(fileUrl, 'trace-limit');
    expect(result.isValid).toBe(true);
    expect(result.context.stackTrace.length).toBeLessThanOrEqual(2);
  });

  it('sanitizes logged input values to avoid leaking full URLs', () => {
    const validator = createValidator();
    const fileUrl = new URL('file:///tmp/secret/values.txt#hash');
    const result = validator.validate(fileUrl, 'sanitize');
    expect(result.context.inputValue).toBe('URL(file://tmp/secret/values.txt)');
  });

  it('exposes environment metadata in the validation context', () => {
    process.env.LOCAL_DEV = 'true';
    const validator = createValidator();
    const result = validator.validate('src/index.ts', 'env-check');
    expect(['local', 'unknown', 'ci']).toContain(result.context.environment);
    expect(result.context.environmentInfo).toHaveProperty('NODE_ENV');
  });

  it('reports invalid file protocol strings', () => {
    const validator = createValidator();
    const badValue = 'file://' + 'this-is-not-valid';
    const result = validator.validate(badValue, 'invalid-file-protocol');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid file URL path input');
  });

  it('provides helper to check valid path inputs', () => {
    const validator = createValidator();
    expect(validator.isValidPath('foo')).toBe(true);
    expect(validator.isValidPath(new URL('file:///tmp/foo.ts'))).toBe(true);
    expect(validator.isValidPath(42)).toBe(false);
  });

  it('supports captureStackTrace utility with default depth', () => {
    const frames = captureStackTrace();
    expect(Array.isArray(frames)).toBe(true);
    expect(frames.length).toBeGreaterThan(0);
  });

  it('throws PathValidationError when result is consumed incorrectly', () => {
    const validator = createValidator();
    const result = validator.validate('', 'error');
    expect(result.isValid).toBe(false);
    expect(() => {
      if (!result.isValid) {
        throw new PathValidationError(
          result.errors[0] ?? 'Invalid',
          result.context
        );
      }
    }).toThrow(PathValidationError);
  });

  it('detects CI environments when CI variables are present', () => {
    process.env.CI = 'true';
    process.env.GITHUB_ACTIONS = 'true';
    expect(EnvironmentDetector.detect()).toBe('ci');
  });

  it('detects local environments when LOCAL_DEV flag present', () => {
    delete process.env.CI;
    process.env.LOCAL_DEV = 'true';
    expect(EnvironmentDetector.detect()).toBe('local');
  });
});
