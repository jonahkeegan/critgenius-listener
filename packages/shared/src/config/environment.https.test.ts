import { describe, it, expect } from 'vitest';
import { developmentEnvironmentSchema } from './environment.js';

describe('Environment HTTPS Variables (development)', () => {
  it('provides defaults when not set', () => {
    const parsed = developmentEnvironmentSchema.parse({
      NODE_ENV: 'development',
      ASSEMBLYAI_API_KEY: 'key',
      MONGODB_URI: 'mongodb://localhost:27017/db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'dev-jwt',
      HOT_RELOAD: true,
      WATCH_FILES: true,
      DEV_PROXY_ENABLED: true,
      DEV_PROXY_ASSEMBLYAI_ENABLED: true,
    });
    expect(parsed.HTTPS_ENABLED).toBe(false);
    expect(parsed.HTTPS_PORT).toBe(5174);
    // Dev-proxy https defaults
    expect(parsed.DEV_PROXY_HTTPS_ENABLED).toBe(false);
    expect(parsed.DEV_PROXY_TARGET_HTTPS_PORT).toBe(3101);
    expect(parsed.DEV_PROXY_REJECT_UNAUTHORIZED).toBe(false);
    expect(parsed.DEV_PROXY_ALLOWED_HOSTS).toBe('localhost,127.0.0.1');
  });

  it('accepts enabled config with cert paths', () => {
    const parsed = developmentEnvironmentSchema.parse({
      NODE_ENV: 'development',
      ASSEMBLYAI_API_KEY: 'key',
      MONGODB_URI: 'mongodb://localhost:27017/db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'dev-jwt',
      HOT_RELOAD: true,
      WATCH_FILES: true,
      DEV_PROXY_ENABLED: true,
      DEV_PROXY_ASSEMBLYAI_ENABLED: true,
      HTTPS_ENABLED: 'true',
      HTTPS_CERT_PATH: './certificates/dev/dev-cert.pem',
      HTTPS_KEY_PATH: './certificates/dev/dev-key.pem',
      HTTPS_PORT: '8443',
    });
    expect(parsed.HTTPS_ENABLED).toBe(true);
    expect(parsed.HTTPS_PORT).toBe(8443);
    expect(parsed.HTTPS_CERT_PATH).toBe('./certificates/dev/dev-cert.pem');
  });
});
