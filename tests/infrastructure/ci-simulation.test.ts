import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EnvironmentDetector,
  createPathValidator,
  type DiagnosticConfig,
  PathValidationError,
} from '@critgenius/test-utils/diagnostics';

const workspaceRoot = resolve(__dirname, '..', '..');

function createTempFilePath(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  return join(directory, 'diagnostics.log');
}

const baseConfig: DiagnosticConfig = {
  enabled: true,
  logLevel: 'debug',
  captureStackTraces: true,
};

describe('CI environment simulation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('EnvironmentDetector', () => {
    it('identifies CI environment when CI variables set to truthy values', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = '1';
      expect(EnvironmentDetector.detect()).toBe('ci');
      expect(EnvironmentDetector.isGitHubActions()).toBe(true);
    });

    it('identifies CI environment when only GITHUB_ACTIONS is set', () => {
      delete process.env.CI;
      process.env.GITHUB_ACTIONS = 'true';
      expect(EnvironmentDetector.detect()).toBe('ci');
    });

    it('reports local environment when LOCAL_DEV flag present', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      process.env.LOCAL_DEV = 'true';
      expect(EnvironmentDetector.detect()).toBe('local');
    });

    it('falls back to unknown when no signals detected', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.LOCAL_DEV;
      expect(EnvironmentDetector.detect()).toBe('unknown');
    });

    it('sanitizes environment info to hide actual values', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_WORKFLOW = 'build';
      process.env.GITHUB_RUN_ID = '12345';
      const info = EnvironmentDetector.getEnvironmentInfo();
      expect(info.CI).toBe('set');
      expect(info.GITHUB_ACTIONS).toBe('set');
      expect(info.GITHUB_RUN_ID).toBe('set');
      expect(info.NODE_ENV).toBeDefined();
    });

    it('returns false for GitHub Actions when variable unset', () => {
      delete process.env.GITHUB_ACTIONS;
      expect(EnvironmentDetector.isGitHubActions()).toBe(false);
    });
  });

  describe('PathValidator diagnostics in CI context', () => {
    it('captures CI environment metadata when validation fails', () => {
      process.env.CI = 'true';
      const validator = createPathValidator(baseConfig);
      const result = validator.validate('', 'ci-validation');
      expect(result.isValid).toBe(false);
      expect(result.context.environment).toBe('ci');
      expect(result.context.environmentInfo.CI).toBe('set');
    });

    it('writes diagnostics to output file when enabled', () => {
      process.env.CI = 'true';
      const outputFile = createTempFilePath('ci-path-validator-');
      const validator = createPathValidator({
        ...baseConfig,
        outputFile,
      });

      const consoleSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const fileUrl = pathToFileURL(join(workspaceRoot, 'package.json'));
      const result = validator.validate(fileUrl, 'log-output');

      expect(result.isValid).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      expect(existsSync(outputFile)).toBe(true);
      const contents = readFileSync(outputFile, 'utf8');
      expect(contents).toContain('Path normalized successfully');
      consoleSpy.mockRestore();
    });

    it('omits debug logs when log level set to error', () => {
      const outputFile = createTempFilePath('ci-path-validator-error-');
      const validator = createPathValidator({
        enabled: true,
        logLevel: 'error',
        captureStackTraces: false,
        outputFile,
      });

      const consoleSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const result = validator.validate('src/index.ts', 'no-debug');
      expect(result.isValid).toBe(true);
      expect(existsSync(outputFile)).toBe(false);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('captures stack traces for URL inputs in CI mode', () => {
      process.env.CI = 'true';
      const validator = createPathValidator(baseConfig);
      const url = pathToFileURL(join(workspaceRoot, 'README.md'));
      const result = validator.validate(url, 'ci-stack');
      expect(result.isValid).toBe(true);
      expect(result.context.stackTrace.length).toBeGreaterThan(0);
    });

    it('propagates original errors for malformed URLs', () => {
      const validator = createPathValidator(baseConfig);
      const badUrl = new URL('https://example.com/file.ts');
      const result = validator.validate(badUrl, 'bad-url');
      expect(result.isValid).toBe(false);
      expect(result.originalError).toBeInstanceOf(Error);
    });

    it('formats context timestamps as numbers', () => {
      const validator = createPathValidator(baseConfig);
      const result = validator.validate('src/index.ts', 'timestamp');
      expect(result.context.timestamp).toBeTypeOf('number');
    });

    it('keeps warnings array empty for successful validation', () => {
      const validator = createPathValidator(baseConfig);
      const result = validator.validate('src/index.ts', 'warnings');
      expect(result.warnings).toEqual([]);
    });

    it('supports resolving file protocol strings in CI mode', () => {
      process.env.CI = 'true';
      const validator = createPathValidator(baseConfig);
      const pathString = pathToFileURL(
        join(workspaceRoot, 'vitest.config.ts')
      ).toString();
      const result = validator.validate(pathString, 'file-protocol');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe(fileURLToPath(new URL(pathString)));
    });

    it('rejects whitespace-only inputs and includes sanitized context', () => {
      const validator = createPathValidator(baseConfig);
      const result = validator.validate('   ', 'whitespace');
      expect(result.isValid).toBe(false);
      expect(result.context.inputValue).toBe('   ');
      expect(result.errors[0]).toContain('empty string');
    });

    it('throws PathValidationError when consumer rethrows result', () => {
      const validator = createPathValidator(baseConfig);
      const result = validator.validate('', 'rethrow');
      expect(result.isValid).toBe(false);
      expect(() => {
        throw new PathValidationError(
          result.errors[0] ?? 'invalid',
          result.context
        );
      }).toThrow(PathValidationError);
    });
  });
});
