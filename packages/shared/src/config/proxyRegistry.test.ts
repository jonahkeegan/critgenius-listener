import { describe, it, expect } from 'vitest';
import {
  getProxyRegistry,
  PROXY_ROUTES,
  PROXY_ENV_KEYS,
  resolveTargetFromEnv,
} from './proxyRegistry';

describe('proxyRegistry', () => {
  it('exposes routes and env keys', () => {
    const reg = getProxyRegistry();
    expect(reg.routes).toBe(PROXY_ROUTES);
    expect(reg.env).toBe(PROXY_ENV_KEYS);
    expect(Array.isArray(reg.routes)).toBe(true);
    // Ensure required routes exist
    const ids = reg.routes.map(r => r.id);
    expect(ids).toContain('api');
    expect(ids).toContain('ws');
    expect(ids).toContain('assemblyai');
    // Ensure env key basics
    expect(reg.env.enabled).toBe('DEV_PROXY_ENABLED');
    expect(reg.env.httpPort).toBe('DEV_PROXY_TARGET_PORT');
    expect(reg.env.httpsPort).toBe('DEV_PROXY_TARGET_HTTPS_PORT');
  });

  it('resolves target protocol/port from env', () => {
    const env: Record<string, string> = {
      DEV_PROXY_HTTPS_ENABLED: 'false',
      DEV_PROXY_TARGET_PORT: '3100',
    };
    const a = resolveTargetFromEnv(env);
    expect(a.protocol).toBe('http');
    expect(a.port).toBe(3100);

    env.DEV_PROXY_HTTPS_ENABLED = 'true';
    env.DEV_PROXY_TARGET_HTTPS_PORT = '3101';
    const b = resolveTargetFromEnv(env);
    expect(b.protocol).toBe('https');
    expect(b.port).toBe(3101);
  });
});
