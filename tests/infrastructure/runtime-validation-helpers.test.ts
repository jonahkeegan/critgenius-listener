import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('runtime validation helpers', () => {
  let tempDir: string;
  let originalProcessExit: typeof process.exit;
  let originalConsoleError: typeof console.error;
  let exitCode: number | undefined;
  let consoleErrors: string[];

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = mkdtempSync(join(tmpdir(), 'runtime-validation-test-'));

    // Mock process.exit to capture exit codes
    exitCode = undefined;
    originalProcessExit = process.exit;
    process.exit = vi.fn((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never;

    // Mock console.error to capture error messages
    consoleErrors = [];
    originalConsoleError = console.error;
    console.error = vi.fn((...args: unknown[]) => {
      consoleErrors.push(args.join(' '));
    });
  });

  afterEach(() => {
    // Restore original functions
    process.exit = originalProcessExit;
    console.error = originalConsoleError;

    // Clean up temporary directory
    if (existsSync(tempDir)) {
      try {
        rmSync(tempDir, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 50,
        });
      } catch (error) {
        // Windows occasionally holds on to temp files; swallow cleanup errors to keep tests stable.
        console.warn('runtime validation cleanup warning:', error);
      }
    }
  });

  describe('module loading', () => {
    it('exports all expected functions', async () => {
      const helpers = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(helpers.validateConfigAtRuntime).toBeDefined();
      expect(helpers.assertRequiredEnvVars).toBeDefined();
      expect(helpers.detectConfigDrift).toBeDefined();
      expect(helpers.assertRequiredFiles).toBeDefined();
      expect(helpers.assertFilesNotExist).toBeDefined();
      expect(helpers.createValidator).toBeDefined();
    });
  });

  describe('validateConfigAtRuntime', () => {
    it('validates valid configuration successfully', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({
          apiEndpoint: 'https://api.example.com',
          timeout: 5000,
        })
      );

      const { validateConfigAtRuntime } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      const config = validateConfigAtRuntime(configPath, (cfg: any) => {
        if (!cfg.apiEndpoint) {
          return { valid: false, errors: ['Missing apiEndpoint'] };
        }
        return { valid: true };
      });

      expect(config).toEqual({
        apiEndpoint: 'https://api.example.com',
        timeout: 5000,
      });
      expect(exitCode).toBeUndefined();
    });

    it('fails when configuration file does not exist', async () => {
      const configPath = join(tempDir, 'nonexistent.json');

      const { validateConfigAtRuntime } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        validateConfigAtRuntime(configPath, () => ({ valid: true }));
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(
        consoleErrors.some(msg => msg.includes('Configuration file not found'))
      ).toBe(true);
    });

    it('fails when configuration is not valid JSON', async () => {
      const configPath = join(tempDir, 'invalid.json');
      writeFileSync(configPath, '{ invalid json }');

      const { validateConfigAtRuntime } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        validateConfigAtRuntime(configPath, () => ({ valid: true }));
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(consoleErrors.some(msg => msg.includes('Failed to parse'))).toBe(
        true
      );
    });

    it('fails when validator returns invalid result', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(configPath, JSON.stringify({ value: 'test' }));

      const { validateConfigAtRuntime } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        validateConfigAtRuntime(configPath, () => ({
          valid: false,
          errors: [
            'Missing required field: apiEndpoint',
            'Invalid timeout value',
          ],
          fix: 'Add apiEndpoint and set timeout >= 0',
        }));
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(
        consoleErrors.some(msg => msg.includes('Missing required field'))
      ).toBe(true);
      expect(consoleErrors.some(msg => msg.includes('Fix:'))).toBe(true);
    });
  });

  describe('assertRequiredEnvVars', () => {
    it('passes when all required variables are present', async () => {
      process.env.TEST_VAR_1 = 'value1';
      process.env.TEST_VAR_2 = 'value2';

      const { assertRequiredEnvVars } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      assertRequiredEnvVars(['TEST_VAR_1', 'TEST_VAR_2']);

      expect(exitCode).toBeUndefined();

      delete process.env.TEST_VAR_1;
      delete process.env.TEST_VAR_2;
    });

    it('fails when required variables are missing', async () => {
      delete process.env.MISSING_VAR_1;
      delete process.env.MISSING_VAR_2;

      const { assertRequiredEnvVars } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        assertRequiredEnvVars(['MISSING_VAR_1', 'MISSING_VAR_2']);
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(consoleErrors.some(msg => msg.includes('MISSING_VAR_1'))).toBe(
        true
      );
      expect(consoleErrors.some(msg => msg.includes('MISSING_VAR_2'))).toBe(
        true
      );
    });

    it('fails when required variables are empty strings', async () => {
      process.env.EMPTY_VAR = '';

      const { assertRequiredEnvVars } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        assertRequiredEnvVars(['EMPTY_VAR']);
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(consoleErrors.some(msg => msg.includes('EMPTY_VAR'))).toBe(true);

      delete process.env.EMPTY_VAR;
    });

    it('references custom example file in error message', async () => {
      delete process.env.CUSTOM_VAR;

      const { assertRequiredEnvVars } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        assertRequiredEnvVars(['CUSTOM_VAR'], {
          exampleFile: '.env.production.example',
        });
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(
        consoleErrors.some(msg => msg.includes('.env.production.example'))
      ).toBe(true);
    });
  });

  describe('detectConfigDrift', () => {
    it('passes when configurations are consistent', async () => {
      const config1Path = join(tempDir, 'config1.json');
      const config2Path = join(tempDir, 'config2.json');

      writeFileSync(config1Path, JSON.stringify({ target: 'ES2022' }));
      writeFileSync(config2Path, JSON.stringify({ target: 'ES2022' }));

      const { detectConfigDrift } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      detectConfigDrift(
        [
          { path: config1Path, key: 'target' },
          { path: config2Path, key: 'target' },
        ],
        (values: any[]) => ({
          hasDrift: !values.every((v: any) => v === values[0]),
          message: 'Target versions must match',
        })
      );

      expect(exitCode).toBeUndefined();
    });

    it('fails when configurations have drifted', async () => {
      const config1Path = join(tempDir, 'config1.json');
      const config2Path = join(tempDir, 'config2.json');

      writeFileSync(config1Path, JSON.stringify({ target: 'ES2022' }));
      writeFileSync(config2Path, JSON.stringify({ target: 'ES2020' }));

      const { detectConfigDrift } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        detectConfigDrift(
          [
            { path: config1Path, key: 'target' },
            { path: config2Path, key: 'target' },
          ],
          (values: any[]) => ({
            hasDrift: !values.every((v: any) => v === values[0]),
            message: 'Target versions must match',
          })
        );
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(
        consoleErrors.some(msg => msg.includes('Target versions must match'))
      ).toBe(true);
    });

    it('handles nested configuration keys', async () => {
      const config1Path = join(tempDir, 'config1.json');
      const config2Path = join(tempDir, 'config2.json');

      writeFileSync(
        config1Path,
        JSON.stringify({ compilerOptions: { target: 'ES2022' } })
      );
      writeFileSync(
        config2Path,
        JSON.stringify({ compilerOptions: { target: 'ES2022' } })
      );

      const { detectConfigDrift } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      detectConfigDrift(
        [
          { path: config1Path, key: 'compilerOptions.target' },
          { path: config2Path, key: 'compilerOptions.target' },
        ],
        (values: any[]) => ({
          hasDrift: !values.every((v: any) => v === values[0]),
        })
      );

      expect(exitCode).toBeUndefined();
    });
  });

  describe('assertRequiredFiles', () => {
    it('passes when all required files exist', async () => {
      const file1 = join(tempDir, 'file1.txt');
      const file2 = join(tempDir, 'file2.txt');

      writeFileSync(file1, 'content1');
      writeFileSync(file2, 'content2');

      const { assertRequiredFiles } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      assertRequiredFiles([file1, file2], { context: 'test files' });

      expect(exitCode).toBeUndefined();
    });

    it('fails when required files are missing', async () => {
      const file1 = join(tempDir, 'exists.txt');
      const file2 = join(tempDir, 'missing.txt');

      writeFileSync(file1, 'content');

      const { assertRequiredFiles } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        assertRequiredFiles([file1, file2], { context: 'test files' });
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(consoleErrors.some(msg => msg.includes('missing.txt'))).toBe(true);
      expect(consoleErrors.some(msg => msg.includes('test files'))).toBe(true);
    });
  });

  describe('assertFilesNotExist', () => {
    it('passes when prohibited files do not exist', async () => {
      const file1 = join(tempDir, 'should-not-exist-1.txt');
      const file2 = join(tempDir, 'should-not-exist-2.txt');

      const { assertFilesNotExist } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      assertFilesNotExist([file1, file2], {
        reason: 'These files violate project structure',
      });

      expect(exitCode).toBeUndefined();
    });

    it('fails when prohibited files exist', async () => {
      const file1 = join(tempDir, 'prohibited.txt');
      const file2 = join(tempDir, 'also-prohibited.txt');

      writeFileSync(file1, 'content');
      writeFileSync(file2, 'content');

      const { assertFilesNotExist } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(() => {
        assertFilesNotExist([file1, file2], {
          reason: 'Packages must use root-level config',
        });
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(consoleErrors.some(msg => msg.includes('prohibited.txt'))).toBe(
        true
      );
      expect(
        consoleErrors.some(msg =>
          msg.includes('Packages must use root-level config')
        )
      ).toBe(true);
    });
  });

  describe('createValidator', () => {
    it('creates validator that passes on true condition', async () => {
      const { createValidator } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      const validate = createValidator('Test Validation');
      validate(true, 'This should pass', 'No fix needed');

      expect(exitCode).toBeUndefined();
    });

    it('creates validator that fails on false condition', async () => {
      const { createValidator } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      const validate = createValidator('Build Configuration');

      expect(() => {
        validate(
          false,
          'Minification must be enabled',
          'Set config.minify = true'
        );
      }).toThrow('process.exit(1)');

      expect(exitCode).toBe(1);
      expect(
        consoleErrors.some(msg => msg.includes('Build Configuration'))
      ).toBe(true);
      expect(
        consoleErrors.some(msg => msg.includes('Minification must be enabled'))
      ).toBe(true);
      expect(
        consoleErrors.some(msg => msg.includes('Set config.minify = true'))
      ).toBe(true);
    });

    it('creates validator with custom validation name', async () => {
      const { createValidator } = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      const validate = createValidator('Custom System Check');

      expect(() => {
        validate(false, 'System check failed', 'Fix the system');
      }).toThrow('process.exit(1)');

      expect(
        consoleErrors.some(msg => msg.includes('Custom System Check'))
      ).toBe(true);
    });
  });
});
