import { join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { __pathDiagnostics } from '../../vitest.shared.config';
import { PathValidationError } from '@critgenius/test-utils/diagnostics';

const { ensurePathString, normalizePathInput } = __pathDiagnostics;

const workspaceRoot = resolve(__dirname, '..', '..');

describe('ensurePathString', () => {
  it('returns plain relative strings unchanged', () => {
    expect(ensurePathString('src/index.ts', 'relative')).toBe('src/index.ts');
  });

  it('returns absolute POSIX paths unchanged', () => {
    const absolute = resolve(workspaceRoot, 'packages/shared/src/index.ts');
    expect(ensurePathString(absolute, 'absolute')).toBe(absolute);
  });

  it('supports Windows drive letter paths', () => {
    const drivePath = 'C:' + sep + 'projects' + sep + 'demo.ts';
    expect(ensurePathString(drivePath, 'windows-drive')).toBe(drivePath);
  });

  it('supports Windows UNC paths', () => {
    const uncPath = '\\server\\share\\file.ts';
    expect(ensurePathString(uncPath, 'windows-unc')).toBe(uncPath);
  });

  it('converts file URL objects to file system paths', () => {
    const fileUrl = pathToFileURL(join(workspaceRoot, 'package.json'));
    expect(ensurePathString(fileUrl, 'url-object')).toBe(
      fileURLToPath(fileUrl)
    );
  });

  it('converts file protocol strings to file system paths', () => {
    const fileUrlString = pathToFileURL(
      join(workspaceRoot, 'README.md')
    ).toString();
    expect(ensurePathString(fileUrlString, 'file-protocol')).toBe(
      fileURLToPath(new URL(fileUrlString))
    );
  });

  it('rejects nullish inputs', () => {
    expect(() =>
      ensurePathString(null as unknown as string, 'null-input')
    ).toThrow(PathValidationError);
  });

  it('rejects numeric inputs', () => {
    expect(() =>
      ensurePathString(42 as unknown as string, 'number-input')
    ).toThrow(PathValidationError);
  });

  it('rejects empty strings', () => {
    expect(() => ensurePathString('   ', 'empty-string')).toThrow(
      PathValidationError
    );
  });

  it('captures context in thrown errors', () => {
    try {
      ensurePathString('   ', 'captured-context');
    } catch (error) {
      expect(error).toBeInstanceOf(PathValidationError);
      const validationError = error as PathValidationError;
      expect(validationError.context.operation).toBe('captured-context');
      expect(typeof validationError.context.timestamp).toBe('number');
    }
  });
});

describe('normalizePathInput', () => {
  afterEach(() => {
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
  });

  it('resolves relative paths using a base directory string', () => {
    const base = resolve(workspaceRoot, 'packages');
    const result = normalizePathInput('server/src/index.ts', base);
    expect(result).toBe(resolve(base, 'server/src/index.ts'));
  });

  it('resolves relative paths using a base directory URL', () => {
    const baseUrl = pathToFileURL(resolve(workspaceRoot, 'packages/client'));
    const result = normalizePathInput('src/main.tsx', baseUrl);
    expect(result).toBe(resolve(fileURLToPath(baseUrl), 'src/main.tsx'));
  });

  it('returns normalized absolute paths without resolving against base', () => {
    const absolute = resolve(workspaceRoot, 'packages/shared/tsconfig.json');
    const base = resolve(workspaceRoot, 'packages/shared');
    const result = normalizePathInput(absolute, base);
    expect(result).toBe(absolute);
  });

  it('handles file protocol strings with a base directory', () => {
    const base = resolve(workspaceRoot, 'packages/test-utils');
    const absoluteTarget = resolve(base, 'src/index.ts');
    const pathString = pathToFileURL(absoluteTarget).toString();
    const result = normalizePathInput(pathString, base);
    expect(result).toBe(fileURLToPath(new URL(pathString)));
  });

  it('converts URL inputs then resolves relative to base', () => {
    const base = resolve(workspaceRoot, 'packages/shared');
    const baseFileUrl = pathToFileURL(base);
    const baseHref = baseFileUrl.href.endsWith('/')
      ? baseFileUrl.href
      : `${baseFileUrl.href}/`;
    const url = new URL('./src/index.ts', baseHref);
    const result = normalizePathInput(url, base);
    expect(result).toBe(resolve(base, 'src/index.ts'));
  });

  it('supports top-level relative paths without base directory', () => {
    const result = normalizePathInput('./vitest.config.ts');
    expect(result).toBe('./vitest.config.ts');
  });

  it('supports parent directory traversal', () => {
    const base = resolve(workspaceRoot, 'packages/client');
    const result = normalizePathInput('../shared/package.json', base);
    expect(result).toBe(resolve(base, '../shared/package.json'));
  });

  it('handles nested relative paths with trailing slashes', () => {
    const base = resolve(workspaceRoot, 'packages');
    const result = normalizePathInput('client/', base);
    expect(result).toBe(resolve(base, 'client'));
  });

  it('throws when base directory is invalid', () => {
    expect(() =>
      normalizePathInput('file.ts', 123 as unknown as string)
    ).toThrow(PathValidationError);
  });

  it('throws when relative input is empty', () => {
    expect(() => normalizePathInput('   ', workspaceRoot)).toThrow(
      PathValidationError
    );
  });

  it('throws when URL input uses unsupported protocol', () => {
    const badUrl = new URL('https://example.com/file.ts');
    expect(() => normalizePathInput(badUrl, workspaceRoot)).toThrow(
      PathValidationError
    );
  });

  it('records CI environment metadata when validation fails under CI flags', () => {
    process.env.CI = 'true';
    process.env.GITHUB_ACTIONS = 'true';

    try {
      ensurePathString('', 'ci-context');
      expect.fail('Expected ensurePathString to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(PathValidationError);
      const validationError = error as PathValidationError;
      expect(validationError.context.environment).toBe('ci');
      expect(validationError.context.environmentInfo.CI).toBe('set');
      expect(validationError.context.environmentInfo.GITHUB_ACTIONS).toBe(
        'set'
      );
    }
  });

  it('normalizes paths containing spaces', () => {
    const base = resolve(workspaceRoot, 'packages');
    const result = normalizePathInput(
      'client/src/components/My Component.tsx',
      base
    );
    expect(result).toBe(
      resolve(base, 'client/src/components/My Component.tsx')
    );
  });

  it('normalizes paths containing unicode characters', () => {
    const base = resolve(workspaceRoot, 'packages');
    const fileName = 'client/src/components/Διαδρομή.tsx';
    const result = normalizePathInput(fileName, base);
    expect(result).toBe(resolve(base, fileName));
  });

  it('resolves base directory when provided as file URL string', () => {
    const base = pathToFileURL(
      resolve(workspaceRoot, 'packages/client')
    ).toString();
    const result = normalizePathInput('src/app.tsx', base);
    expect(result).toBe(resolve(fileURLToPath(new URL(base)), 'src/app.tsx'));
  });
});
