import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import * as environmentLoader from './environmentLoader';
import { EnvironmentLoadError } from './environmentLoader';

type MutableEnv = NodeJS.ProcessEnv & Record<string, string | undefined>;

const originalEnv = { ...process.env } as MutableEnv;

beforeEach(() => {
  process.env = { ...originalEnv } as MutableEnv;
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...originalEnv } as MutableEnv;
});

describe('environment loader helper utilities', () => {
  it('reports environment flags based on NODE_ENV', () => {
    process.env.NODE_ENV = 'development';
    expect(environmentLoader.isDevelopment()).toBe(true);
    expect(environmentLoader.isProduction()).toBe(false);

    process.env.NODE_ENV = 'production';
    expect(environmentLoader.isProduction()).toBe(true);
    expect(environmentLoader.isStaging()).toBe(false);

    process.env.NODE_ENV = 'staging';
    expect(environmentLoader.isStaging()).toBe(true);
    expect(environmentLoader.isTest()).toBe(false);

    process.env.NODE_ENV = 'test';
    expect(environmentLoader.isTest()).toBe(true);
    expect(environmentLoader.isDevelopment()).toBe(false);
  });

  it('reads, requires, and reports environment variables', () => {
    process.env.NODE_ENV = 'development';
    process.env.API_KEY = 'secret';

    expect(environmentLoader.getCurrentEnvironment()).toBe('development');
    expect(environmentLoader.hasEnvironmentVariable('API_KEY')).toBe(true);
    expect(environmentLoader.getEnvironmentVariable('API_KEY')).toBe('secret');
    expect(environmentLoader.requireEnvironmentVariable('API_KEY')).toBe(
      'secret'
    );
    expect(
      environmentLoader.getEnvironmentVariable('UNKNOWN', 'fallback')
    ).toBe('fallback');

    delete process.env.API_KEY;
    const call = () => environmentLoader.requireEnvironmentVariable('API_KEY');
    expect(call).toThrow(EnvironmentLoadError);
  });

  it('returns validation result metadata for failed configuration', () => {
    const result = environmentLoader.validateEnvironmentVariables({
      NODE_ENV: 'development',
      HOST: 'localhost',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('Environment validation failed');
    }
  });

  it('logs success details when validation passes on startup', () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3100';
    process.env.HOST = 'localhost';
    process.env.ASSEMBLYAI_API_KEY = 'test-key-1234567890';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/critgenius-test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'unit-test-secret';
    process.env.LOG_LEVEL = 'warn';

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const config = environmentLoader.validateEnvironmentOnStartup();

    expect(config.NODE_ENV).toBe('test');
    expect(config.LOG_LEVEL).toBe('warn');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment validation successful')
    );

    logSpy.mockRestore();
  });
});
