import * as fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPathValidator } from '@critgenius/test-utils/diagnostics';
import { __pathDiagnostics } from '../../vitest.shared.config';

const { sanitizeOutputFile } = __pathDiagnostics;

describe('Path Diagnostics Reserved Name Handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes reserved filenames to undefined', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    expect(sanitizeOutputFile('nul')).toBeUndefined();
    expect(sanitizeOutputFile('NUL')).toBeUndefined();
    expect(sanitizeOutputFile('coverage/nul')).toBeUndefined();

    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it('preserves valid diagnostic output paths', () => {
    const sanitized = sanitizeOutputFile('diagnostics/paths.log');
    expect(sanitized).toBeDefined();
    expect(String(sanitized)).toMatch(/diagnostics[\\/]+paths\.log$/i);
  });

  it('skips file writes when reserved name detected', () => {
    const tempDir = fs.mkdtempSync(join(tmpdir(), 'path-diag-nul-'));
    const reservedPath = join(tempDir, 'nul');
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    try {
      const validator = createPathValidator({
        enabled: true,
        logLevel: 'debug',
        captureStackTraces: false,
        outputFile: reservedPath,
      });

      const result = validator.validate(
        './package.json',
        'reserved-output-test'
      );
      expect(result.isValid).toBe(true);

      expect(fs.existsSync(reservedPath)).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const [warningMessage] = warnSpy.mock.calls[0] ?? [''];
      expect(String(warningMessage)).toMatch(/reserved device name/i);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('writes buffered diagnostics when path is valid', () => {
    const baseDir = fs.mkdtempSync(join(tmpdir(), 'path-diag-'));
    const outputFile = join(baseDir, 'diagnostics.log');

    try {
      const validator = createPathValidator({
        enabled: true,
        logLevel: 'debug',
        captureStackTraces: false,
        outputFile,
      });

      const result = validator.validate('./package.json', 'valid-output-test');
      expect(result.isValid).toBe(true);

      expect(fs.existsSync(outputFile)).toBe(true);
      const contents = fs.readFileSync(outputFile, 'utf8');
      expect(contents).toContain('Path normalized successfully');
    } finally {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  });
});
